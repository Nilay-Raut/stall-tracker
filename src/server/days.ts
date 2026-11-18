import "server-only";
import { plateCountsFromBills } from "@/domain/bill";
import { takesSaleEntries } from "@/domain/entry";
import { and, asc, desc, eq, gte, isNotNull, lt, lte } from "drizzle-orm";
import type { CloseInput } from "@/domain/dayClose";
import { type DayTotals, computeDayTotals } from "@/domain/dayTotals";
import type { PlateCount } from "@/domain/plates";
import type { Month } from "@/lib/calendar";
import { type BusinessDate, daysInMonth, shiftDate } from "@/lib/dates";
import { getDb } from "@/server/db/client";
import { isConnected, listConnections } from "@/server/payments/connections";
import { paymentsAvailable } from "@/server/payments/secretBox";
import { type DayRow, type Shop, days } from "@/server/db/schema";
import { closeInputsOf, fixedCostForDate, getDayEntries, recomputeDay } from "@/server/entries";
import { getDayCounts, listItems, replaceDayCounts } from "@/server/items";

async function dayRow(shopId: string, date: BusinessDate): Promise<DayRow | null> {
  const [row] = await getDb()
    .select()
    .from(days)
    .where(and(eq(days.shopId, shopId), eq(days.businessDate, date)));
  return row ?? null;
}

/**
 * Rule 15: a day opens with the cash counted at the last close (looking back up
 * to a month, so closed shop days in between do not matter); otherwise with the
 * opening cash from Setup.
 */
async function carriedOverCash(shop: Shop, date: BusinessDate): Promise<number> {
  const [previous] = await getDb()
    .select({ countedCash: days.countedCash })
    .from(days)
    .where(
      and(
        eq(days.shopId, shop.id),
        isNotNull(days.closedAt),
        lt(days.businessDate, date),
        gte(days.businessDate, shiftDate(date, -31)),
      ),
    )
    .orderBy(desc(days.businessDate))
    .limit(1);
  return previous?.countedCash ?? shop.defaultOpeningCash;
}

export type CloseContext = {
  date: BusinessDate;
  /** Totals from the entries recorded during the day. */
  entered: DayTotals;
  /** Number of cash and UPI sale entries (the checks only make sense if there are some). */
  cashSaleCount: number;
  upiSaleCount: number;
  openingCash: number;
  /** The figures from an earlier close of this day, when editing it. */
  previousClose: CloseInput | null;
  /** Items to count plates for (empty in "Totals only" mode or with no items). */
  plateItems: Array<{ id: string; name: string; price: number; cost: number }>;
  /** Plates counted at an earlier close of this day, by item id. */
  previousCounts: Record<string, number>;
  /** Plates of each saved item on the day's bills, to fill in the counter (v2 Phase 3). */
  billCounts: Record<string, number>;
  /** A payment app adds UPI sales by itself: the UPI total starts from them (Phase 12). */
  paymentsConnected: boolean;
};

/** Everything the close form needs for one day. */
export async function getCloseContext(shop: Shop, date: BusinessDate): Promise<CloseContext> {
  const countsPlates = takesSaleEntries(shop.salesMode);
  const [entries, fixedCost, row, items, counts, connections] = await Promise.all([
    getDayEntries(shop.id, date),
    fixedCostForDate(getDb(), shop.id, date),
    dayRow(shop.id, date),
    countsPlates ? listItems(shop.id) : [],
    countsPlates ? getDayCounts(shop.id, date) : [],
    paymentsAvailable() ? listConnections(shop.id) : [],
  ]);
  const previousClose = closeInputsOf(row);
  const sales = entries.filter((e) => e.type === "sale");

  return {
    date,
    entered: computeDayTotals(entries, row?.fixedCost ?? fixedCost),
    cashSaleCount: sales.filter((e) => e.paymentMode === "cash").length,
    upiSaleCount: sales.filter((e) => e.paymentMode === "upi").length,
    openingCash: previousClose?.openingCash ?? (await carriedOverCash(shop, date)),
    previousClose,
    plateItems: items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      cost: item.cost,
    })),
    previousCounts: Object.fromEntries(counts.map((c) => [c.itemId, c.quantity])),
    billCounts: plateCountsFromBills(entries),
    paymentsConnected: connections.some(isConnected),
  };
}

/**
 * Saves the closing figures and plate counts and recomputes the day, all in one
 * transaction. `plateCounts` null means "not counted": earlier counts are cleared.
 */
export async function saveClose(
  shopId: string,
  date: BusinessDate,
  input: CloseInput,
  plateCounts: ReadonlyArray<{ itemId: string; quantity: number }> | null,
) {
  const closing = {
    status: "closed" as const,
    openingCash: input.openingCash,
    countedCash: input.countedCash,
    upiTotal: input.upiTotal,
    wasteAmount: input.waste,
    closedAt: new Date(),
  };
  await getDb().transaction(async (tx) => {
    await tx
      .insert(days)
      .values({ shopId, businessDate: date, ...closing })
      .onConflictDoUpdate({ target: [days.shopId, days.businessDate], set: closing });
    await replaceDayCounts(tx, shopId, date, plateCounts ?? []);
    await recomputeDay(tx, shopId, date);
  });
}

export type DaySummary = {
  day: DayRow;
  close: CloseInput;
  /** Plates counted at closing (empty if not counted). */
  plates: PlateCount[];
  /** Same weekday a week earlier, if the shop was open and sold something. */
  lastWeek: { date: BusinessDate; sales: number } | null;
};

/** A closed day and what to compare it with. Null if the day is not closed. */
export async function getDaySummary(
  shopId: string,
  date: BusinessDate,
): Promise<DaySummary | null> {
  const [day, weekBefore, plates] = await Promise.all([
    dayRow(shopId, date),
    dayRow(shopId, shiftDate(date, -7)),
    getDayCounts(shopId, date),
  ]);
  const close = closeInputsOf(day);
  if (!day || !close) return null;

  const lastWeek =
    weekBefore && weekBefore.status !== "off" && weekBefore.salesTotal > 0
      ? { date: weekBefore.businessDate, sales: weekBefore.salesTotal }
      : null;
  return { day, close, plates, lastWeek };
}

/** Profit of a day if it is closed, else null (for the Today screen). */
export async function closedProfit(shopId: string, date: BusinessDate): Promise<number | null> {
  const row = await dayRow(shopId, date);
  return row && closeInputsOf(row) ? row.profit : null;
}

/** What the Calendar shows for one day. Days without a row are blank. */
export type CalendarDay = {
  date: BusinessDate;
  status: "open" | "closed" | "off";
  entryCount: number;
  sales: number;
  expenses: number;
  profit: number;
};

/** All day rows of a month, for the Calendar. */
export async function getMonthDays(shopId: string, month: Month): Promise<CalendarDay[]> {
  const rows = await getDb()
    .select()
    .from(days)
    .where(
      and(
        eq(days.shopId, shopId),
        gte(days.businessDate, `${month}-01`),
        lte(days.businessDate, `${month}-${daysInMonth(`${month}-01`)}`),
      ),
    )
    .orderBy(asc(days.businessDate));

  return rows.map((row) => ({
    date: row.businessDate,
    // "closed" in the database means the day was closed (counted), shown as entered.
    status: row.status,
    entryCount: row.entryCount,
    sales: row.salesTotal,
    expenses: row.expenseTotal,
    profit: row.profit,
  }));
}

export type MarkOffResult = "ok" | "has-entries" | "already-closed";

/**
 * Marks a day "shop closed" (left out of averages), or undoes it.
 * A day with entries, or one already counted at closing, cannot be marked off.
 */
export async function setShopClosed(
  shopId: string,
  date: BusinessDate,
  off: boolean,
): Promise<MarkOffResult> {
  const row = await dayRow(shopId, date);
  if (!off) {
    if (row?.status === "off") {
      await getDb()
        .update(days)
        .set({ status: "open" })
        .where(and(eq(days.shopId, shopId), eq(days.businessDate, date)));
    }
    return "ok";
  }
  if (row?.closedAt) return "already-closed";
  if (row && row.entryCount > 0) return "has-entries";

  await getDb().transaction(async (tx) => {
    await tx
      .insert(days)
      .values({ shopId, businessDate: date, status: "off" })
      .onConflictDoUpdate({ target: [days.shopId, days.businessDate], set: { status: "off" } });
    await recomputeDay(tx, shopId, date); // fills in the fixed cost for the day
  });
  return "ok";
}
