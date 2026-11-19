import "server-only";
import { and, asc, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import { type CloseInput, computeClose } from "@/domain/dayClose";
import { computeDayTotals } from "@/domain/dayTotals";
import type { Entry, Purchase, SaleLine } from "@/domain/entry";
import type { SyncResult } from "@/domain/sync";
import { fixedCostPerDay, monthlyFixedTotal } from "@/domain/fixedCosts";
import { type BusinessDate, businessDate, daysInMonth } from "@/lib/dates";
import { type Db, type Tx, getDb } from "@/server/db/client";
import { type DayRow, type EntryRow, days, entries, fixedCosts } from "@/server/db/schema";
import { deletePurchase, purchasesFor, savePurchase } from "@/server/purchases";
import { takeOverAutoSale } from "@/server/payments/receive";
import { deleteLines, linesFor, saveLines } from "@/server/saleLines";

export function toEntry(
  row: EntryRow,
  purchase: Purchase | null = null,
  lines: SaleLine[] | null = null,
): Entry {
  return {
    id: row.id,
    businessDate: row.businessDate,
    type: row.type,
    amount: row.amount,
    paymentMode: row.paymentMode,
    category: row.category,
    paidFrom: row.paidFrom,
    purchase,
    note: row.note,
    lines,
    paidVia: row.paidVia,
    occurredAt: row.occurredAt.toISOString(),
    updatedAt: row.clientUpdatedAt.toISOString(),
    deleted: row.deletedAt !== null,
  };
}

/**
 * A shop's entries for one day, oldest first. Deleted ones are left out unless
 * `withDeleted` is set: phones need those to learn about deletions made elsewhere.
 */
export async function getDayEntries(
  shopId: string,
  date: BusinessDate,
  { withDeleted = false } = {},
): Promise<Entry[]> {
  const rows = await getDb()
    .select()
    .from(entries)
    .where(
      and(
        eq(entries.shopId, shopId),
        eq(entries.businessDate, date),
        withDeleted ? undefined : isNull(entries.deletedAt),
      ),
    )
    .orderBy(asc(entries.occurredAt));
  const [bought, billed] = await Promise.all([
    purchasesFor(rows.filter((r) => r.type === "expense").map((r) => r.id)),
    linesFor(rows.filter((r) => r.type === "sale").map((r) => r.id)),
  ]);
  return rows.map((row) => toEntry(row, bought.get(row.id) ?? null, billed.get(row.id) ?? null));
}

/** Fixed cost charged to each day of the month that `date` is in. */
export async function fixedCostForDate(db: Db | Tx, shopId: string, date: BusinessDate) {
  const costs = await db
    .select({ monthlyAmount: fixedCosts.monthlyAmount })
    .from(fixedCosts)
    .where(eq(fixedCosts.shopId, shopId));
  return fixedCostPerDay(monthlyFixedTotal(costs), daysInMonth(date));
}

/**
 * Rebuilds one day's totals row from its entries. Runs inside the same
 * transaction as the change, so the totals can never drift from the entries.
 * Days in past months keep the fixed cost they had, so changing the rent
 * today does not rewrite last month's profit.
 */
export async function recomputeDay(tx: Tx, shopId: string, date: BusinessDate): Promise<void> {
  const rows = await tx
    .select()
    .from(entries)
    .where(
      and(eq(entries.shopId, shopId), eq(entries.businessDate, date), isNull(entries.deletedAt)),
    );

  const [existing] = await tx
    .select()
    .from(days)
    .where(and(eq(days.shopId, shopId), eq(days.businessDate, date)));

  const isPastMonth = date.slice(0, 7) < businessDate().slice(0, 7);
  const fixedCost =
    existing && isPastMonth ? existing.fixedCost : await fixedCostForDate(tx, shopId, date);

  const entered = computeDayTotals(
    rows.map((row) => toEntry(row)),
    fixedCost,
  );

  // Rule 4: once the day is closed, the closing count decides the day's sales.
  const close = closeInputsOf(existing);
  let final = {
    sales: entered.sales,
    cash: entered.cashSales,
    upi: entered.upiSales,
    profit: entered.profit,
  };
  if (close) {
    const closed = computeClose(entered, close);
    final = {
      sales: closed.sales,
      cash: closed.cashSales,
      upi: close.upiTotal,
      profit: closed.profit,
    };
  }

  const values = {
    salesTotal: final.sales,
    cashSales: final.cash,
    upiSales: final.upi,
    profit: final.profit,
    enteredCashSales: entered.cashSales,
    enteredUpiSales: entered.upiSales,
    expenseTotal: entered.expenses,
    drawerExpenses: entered.drawerExpenses,
    cashOutTotal: entered.cashOut,
    fixedCost: entered.fixedCost,
    entryCount: entered.entryCount,
    // A day marked "shop closed" that gets entries was open after all.
    ...(existing?.status === "off" && entered.entryCount > 0 ? { status: "open" as const } : {}),
  };

  await tx
    .insert(days)
    .values({ shopId, businessDate: date, ...values })
    .onConflictDoUpdate({ target: [days.shopId, days.businessDate], set: values });
}

/** The closing figures of a day row, or null if the day is not closed. */
export function closeInputsOf(day: DayRow | undefined | null): CloseInput | null {
  if (!day?.closedAt || day.openingCash === null || day.countedCash === null) return null;
  if (day.upiTotal === null) return null;
  return {
    openingCash: day.openingCash,
    countedCash: day.countedCash,
    upiTotal: day.upiTotal,
    waste: day.wasteAmount,
  };
}

/** Recomputes every day row of a month, e.g. after the fixed costs change. */
export async function recomputeMonth(tx: Tx, shopId: string, month: string): Promise<void> {
  const rows = await tx
    .select({ businessDate: days.businessDate })
    .from(days)
    .where(
      and(
        eq(days.shopId, shopId),
        gte(days.businessDate, `${month}-01`),
        lte(days.businessDate, `${month}-${daysInMonth(`${month}-01`)}`),
      ),
    );
  for (const row of rows) {
    await recomputeDay(tx, shopId, row.businessDate);
  }
}

/**
 * Applies entry changes sent from a phone, all in one transaction.
 * Safe to retry: the same change sent twice gives the same result.
 * The latest change (by phone time) wins.
 */
export async function applyEntryChanges(
  shopId: string,
  changes: ReadonlyArray<Entry>,
): Promise<SyncResult[]> {
  if (changes.length === 0) return [];

  // If the same entry appears twice, only its newest change matters.
  const latest = new Map<string, Entry>();
  for (const change of changes) {
    const seen = latest.get(change.id);
    if (!seen || seen.updatedAt < change.updatedAt) latest.set(change.id, change);
  }

  return getDb().transaction(async (tx) => {
    const existingRows = await tx
      .select()
      .from(entries)
      .where(inArray(entries.id, [...latest.keys()]));
    const existing = new Map(existingRows.map((row) => [row.id, row]));

    const results: SyncResult[] = [];
    const touchedDates = new Set<BusinessDate>();

    for (const change of latest.values()) {
      const current = existing.get(change.id);

      // An id that belongs to another shop: never touch it.
      if (current && current.shopId !== shopId) {
        results.push({ id: change.id, status: "rejected", reason: "conflict" });
        continue;
      }
      const incomingTime = new Date(change.updatedAt);
      if (current && current.clientUpdatedAt >= incomingTime) {
        results.push({ id: change.id, status: "stale" });
        continue;
      }

      const values = {
        shopId,
        businessDate: change.businessDate,
        type: change.type,
        amount: change.amount,
        paymentMode: change.paymentMode,
        category: change.category,
        paidFrom: change.paidFrom,
        note: change.type === "expense" ? (change.note ?? null) : null,
        occurredAt: new Date(change.occurredAt),
        clientUpdatedAt: incomingTime,
        deletedAt: change.deleted ? (current?.deletedAt ?? new Date()) : null,
      };
      await tx
        .insert(entries)
        .values({ id: change.id, ...values })
        .onConflictDoUpdate({ target: entries.id, set: values });

      if (change.type === "expense" && change.purchase && !change.deleted) {
        await savePurchase(tx, shopId, change.id, change.purchase, change.amount);
      } else {
        await deletePurchase(tx, change.id);
      }
      // A new UPI sale typed after the payment already made its own sale: count it once.
      if (!current && change.type === "sale" && change.paymentMode === "upi" && !change.deleted) {
        const taken = await takeOverAutoSale(tx, shopId, {
          id: change.id,
          amount: change.amount,
          occurredAt: new Date(change.occurredAt),
        });
        if (taken) {
          await tx
            .update(entries)
            .set({ paidVia: taken.provider })
            .where(eq(entries.id, change.id));
          touchedDates.add(taken.removedFrom);
        }
      }
      // A deleted sale keeps its lines out of item reports.
      if (change.type === "sale" && change.lines && !change.deleted) {
        await saveLines(tx, shopId, change.id, change.lines);
      } else {
        await deleteLines(tx, change.id);
      }

      touchedDates.add(change.businessDate);
      if (current && current.businessDate !== change.businessDate) {
        touchedDates.add(current.businessDate); // the entry moved to another day
      }
      results.push({ id: change.id, status: "saved" });
    }

    for (const date of touchedDates) {
      await recomputeDay(tx, shopId, date);
    }
    return results;
  });
}
