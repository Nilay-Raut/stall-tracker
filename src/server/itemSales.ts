import "server-only";
import { and, asc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { lineNameKey } from "@/domain/bill";
import type { BillRecord, ItemDay, SaleHour } from "@/domain/salesInsights";
import { type BusinessDate, businessDate } from "@/lib/dates";
import { getDb } from "@/server/db/client";
import { dayItemCounts, entries, items, saleLines } from "@/server/db/schema";

// Item and bill figures for Reports (docs/PLAN-v2.md, Phase 4).

const liveSales = (shopId: string, from: BusinessDate, to: BusinessDate) =>
  and(
    eq(entries.shopId, shopId),
    eq(entries.type, "sale"),
    isNull(entries.deletedAt),
    gte(entries.businessDate, from),
    lte(entries.businessDate, to),
  );

/**
 * Items sold per day. Rule 19: from bill lines; a day without any bill falls
 * back to its plate counts, so nothing is counted twice.
 */
export async function itemDays(
  shopId: string,
  from: BusinessDate,
  to: BusinessDate,
): Promise<ItemDay[]> {
  const db = getDb();
  const [billed, counted] = await Promise.all([
    db
      .select({
        date: entries.businessDate,
        key: saleLines.nameKey,
        name: sql<string>`max(${saleLines.name})`,
        quantity: sql<number>`sum(${saleLines.quantity})::int`,
        revenue: sql<number>`sum(${saleLines.unitPrice} * ${saleLines.quantity})::int`,
        costedRevenue: sql<number>`coalesce(sum(${saleLines.unitPrice} * ${saleLines.quantity}) filter (where ${saleLines.costAtTime} is not null), 0)::int`,
        cost: sql<number>`coalesce(sum(${saleLines.costAtTime} * ${saleLines.quantity}), 0)::int`,
      })
      .from(saleLines)
      .innerJoin(entries, eq(entries.id, saleLines.entryId))
      .where(liveSales(shopId, from, to))
      .groupBy(entries.businessDate, saleLines.nameKey),
    db
      .select({
        date: dayItemCounts.businessDate,
        name: items.name,
        quantity: dayItemCounts.quantity,
        price: dayItemCounts.priceAtTime,
        cost: dayItemCounts.costAtTime,
      })
      .from(dayItemCounts)
      .innerJoin(items, eq(items.id, dayItemCounts.itemId))
      .where(
        and(
          eq(dayItemCounts.shopId, shopId),
          gte(dayItemCounts.businessDate, from),
          lte(dayItemCounts.businessDate, to),
        ),
      ),
  ]);

  const billedDates = new Set(billed.map((r) => r.date));
  const fromCounts: ItemDay[] = counted
    .filter((c) => !billedDates.has(c.date))
    .map((c) => ({
      date: c.date,
      key: lineNameKey(c.name),
      name: c.name,
      quantity: c.quantity,
      revenue: c.quantity * c.price,
      costedRevenue: c.quantity * c.price,
      cost: c.quantity * c.cost,
    }));
  return [...billed, ...fromCounts];
}

/** Every bill (sale with lines) in the period, with its items. */
export async function billRecords(
  shopId: string,
  from: BusinessDate,
  to: BusinessDate,
): Promise<BillRecord[]> {
  const rows = await getDb()
    .select({
      id: entries.id,
      date: entries.businessDate,
      amount: entries.amount,
      key: saleLines.nameKey,
      name: saleLines.name,
      quantity: saleLines.quantity,
    })
    .from(saleLines)
    .innerJoin(entries, eq(entries.id, saleLines.entryId))
    .where(liveSales(shopId, from, to))
    .orderBy(asc(entries.id), asc(saleLines.lineNo));
  const bills = new Map<string, BillRecord>();
  for (const row of rows) {
    const bill = bills.get(row.id) ?? { date: row.date, amount: row.amount, items: [] };
    bill.items.push({ key: row.key, name: row.name, quantity: row.quantity });
    bills.set(row.id, bill);
  }
  return [...bills.values()];
}

/** Sales per day and hour (India time), billed or not. */
export async function saleHours(
  shopId: string,
  from: BusinessDate,
  to: BusinessDate,
): Promise<SaleHour[]> {
  const hour = sql<number>`extract(hour from ${entries.occurredAt} at time zone 'Asia/Kolkata')::int`;
  return getDb()
    .select({
      date: entries.businessDate,
      hour,
      amount: sql<number>`sum(${entries.amount})::int`,
    })
    .from(entries)
    .where(liveSales(shopId, from, to))
    .groupBy(entries.businessDate, hour);
}

/** The shop's current items, as report keys, with the day each was added. */
export async function itemCatalog(shopId: string) {
  const rows = await getDb()
    .select({ name: items.name, createdAt: items.createdAt })
    .from(items)
    .where(and(eq(items.shopId, shopId), eq(items.active, true)));
  return rows.map((r) => ({
    key: lineNameKey(r.name),
    name: r.name,
    since: businessDate(r.createdAt),
  }));
}

/** The last day each item sold within the look-back (bills and plate counts). */
export async function lastSold(
  shopId: string,
  since: BusinessDate,
  today: BusinessDate,
): Promise<Map<string, BusinessDate>> {
  const rows = await itemDays(shopId, since, today);
  const out = new Map<string, BusinessDate>();
  for (const row of rows) {
    if (row.quantity > 0 && (out.get(row.key) ?? "") < row.date) out.set(row.key, row.date);
  }
  return out;
}

export type BillLineExport = {
  date: BusinessDate;
  occurredAt: Date;
  billId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  paymentMode: "cash" | "upi" | null;
};

/** Every bill line in the period, for the bills CSV. Oldest first. */
export async function billLinesForExport(
  shopId: string,
  from: BusinessDate,
  to: BusinessDate,
): Promise<BillLineExport[]> {
  return getDb()
    .select({
      date: entries.businessDate,
      occurredAt: entries.occurredAt,
      billId: entries.id,
      name: saleLines.name,
      quantity: saleLines.quantity,
      unitPrice: saleLines.unitPrice,
      paymentMode: entries.paymentMode,
    })
    .from(saleLines)
    .innerJoin(entries, eq(entries.id, saleLines.entryId))
    .where(liveSales(shopId, from, to))
    .orderBy(asc(entries.businessDate), asc(entries.occurredAt), asc(saleLines.lineNo));
}
