import "server-only";
import { and, asc, desc, eq, gte, isNull, lte, min, sql } from "drizzle-orm";
import { fixedCostPerDay, monthlyFixedTotal } from "@/domain/fixedCosts";
import { type PurchaseRecord, priceSummary } from "@/domain/prices";
import type {
  CategoryTotal,
  ItemTotal,
  MaterialRise,
  ReportDay,
  ReportInput,
} from "@/domain/report";
import { fromMilli } from "@/domain/materials";
import { formatMonthName } from "@/lib/calendar";
import { type BusinessDate, type Lang, businessDate, daysInMonth, shiftDate } from "@/lib/dates";
import { type MonthTotals, byMonth } from "@/domain/analysis";
import type { EntryType, ExpenseCategory, PaidFrom, PaymentMode } from "@/domain/entry";
import { shiftMonth } from "@/lib/calendar";
import { type Range, datesBetween } from "@/lib/ranges";
import { getDb } from "@/server/db/client";
import {
  dayItemCounts,
  days,
  entries,
  fixedCosts,
  items,
  materials,
  purchases,
  suppliers,
} from "@/server/db/schema";

const inRange = (column: typeof days.businessDate, from: string, to: string) =>
  and(gte(column, from), lte(column, to));

/** Every date of the range with its figures; dates with nothing recorded still carry fixed cost. */
export async function reportDays(shopId: string, from: string, to: string): Promise<ReportDay[]> {
  const db = getDb();
  const [rows, costs] = await Promise.all([
    db
      .select()
      .from(days)
      .where(and(eq(days.shopId, shopId), inRange(days.businessDate, from, to))),
    db
      .select({ monthlyAmount: fixedCosts.monthlyAmount })
      .from(fixedCosts)
      .where(eq(fixedCosts.shopId, shopId)),
  ]);
  const byDate = new Map(rows.map((row) => [row.businessDate, row]));
  const monthly = monthlyFixedTotal(costs);

  return datesBetween(from, to).map((date) => {
    const row = byDate.get(date);
    if (!row) {
      return {
        date,
        status: "none" as const,
        sales: 0,
        cashSales: 0,
        upiSales: 0,
        expenses: 0,
        fixedCost: fixedCostPerDay(monthly, daysInMonth(date)),
        cashOut: 0,
      };
    }
    return {
      date,
      status: row.status,
      sales: row.salesTotal,
      cashSales: row.cashSales,
      upiSales: row.upiSales,
      expenses: row.expenseTotal,
      fixedCost: row.fixedCost,
      cashOut: row.cashOutTotal,
    };
  });
}

async function categoryTotals(shopId: string, from: string, to: string): Promise<CategoryTotal[]> {
  const rows = await getDb()
    .select({ category: entries.category, amount: sql<string>`sum(${entries.amount})` })
    .from(entries)
    .where(
      and(
        eq(entries.shopId, shopId),
        eq(entries.type, "expense"),
        isNull(entries.deletedAt),
        gte(entries.businessDate, from),
        lte(entries.businessDate, to),
      ),
    )
    .groupBy(entries.category);
  return rows.flatMap((r) =>
    r.category ? [{ category: r.category, amount: Number(r.amount) }] : [],
  );
}

async function itemTotals(shopId: string, from: string, to: string): Promise<ItemTotal[]> {
  const rows = await getDb()
    .select({
      name: items.name,
      plates: sql<string>`sum(${dayItemCounts.quantity})`,
      margin: sql<string>`sum(${dayItemCounts.quantity} * (${dayItemCounts.priceAtTime} - ${dayItemCounts.costAtTime}))`,
    })
    .from(dayItemCounts)
    .innerJoin(items, eq(items.id, dayItemCounts.itemId))
    .where(
      and(
        eq(dayItemCounts.shopId, shopId),
        gte(dayItemCounts.businessDate, from),
        lte(dayItemCounts.businessDate, to),
      ),
    )
    .groupBy(items.id, items.name);
  return rows.map((r) => ({ name: r.name, plates: Number(r.plates), margin: Number(r.margin) }));
}

async function salesTotal(shopId: string, from: string, to: string): Promise<number> {
  const [row] = await getDb()
    .select({ sales: sql<string>`coalesce(sum(${days.salesTotal}), 0)` })
    .from(days)
    .where(and(eq(days.shopId, shopId), inRange(days.businessDate, from, to)));
  return Number(row?.sales ?? 0);
}

/** Purchases of one material (or all), newest first, with the supplier's name. */
async function purchaseRecords(
  shopId: string,
  options: { materialId?: string; since?: BusinessDate; limit?: number },
): Promise<Array<PurchaseRecord & { materialId: string; material: string }>> {
  const rows = await getDb()
    .select({
      materialId: purchases.materialId,
      material: materials.name,
      date: entries.businessDate,
      rate: purchases.rate,
      quantityMilli: purchases.quantityMilli,
      amount: entries.amount,
      supplier: suppliers.name,
      unit: purchases.unit,
    })
    .from(purchases)
    .innerJoin(entries, eq(entries.id, purchases.entryId))
    .innerJoin(materials, eq(materials.id, purchases.materialId))
    .leftJoin(suppliers, eq(suppliers.id, purchases.supplierId))
    .where(
      and(
        eq(purchases.shopId, shopId),
        isNull(entries.deletedAt),
        options.materialId ? eq(purchases.materialId, options.materialId) : undefined,
        options.since ? gte(entries.businessDate, options.since) : undefined,
      ),
    )
    .orderBy(desc(entries.businessDate), desc(entries.occurredAt))
    .limit(options.limit ?? 1000);
  return rows.map(({ quantityMilli, ...r }) => ({ ...r, quantity: fromMilli(quantityMilli) }));
}

/** The material whose rate rose the most (by %) from one month with purchases to the next. */
async function biggestMaterialRise(
  shopId: string,
  today: BusinessDate,
  lang: Lang,
): Promise<MaterialRise | null> {
  const records = await purchaseRecords(shopId, { since: shiftDate(today, -120) });
  const byMaterial = Map.groupBy(records, (r) => r.material);
  let best: (MaterialRise & { percent: number }) | null = null;
  for (const [name, list] of byMaterial) {
    const months = priceSummary(list)?.months ?? [];
    const [before, after] = months.slice(-2);
    if (!before || !after || after.rate <= before.rate) continue;
    const percent = (after.rate - before.rate) / before.rate;
    if (!best || percent > best.percent) {
      best = {
        name,
        unit: list[0].unit,
        from: before.rate,
        to: after.rate,
        since: formatMonthName(before.month, lang),
        percent,
      };
    }
  }
  return (
    best && { name: best.name, unit: best.unit, from: best.from, to: best.to, since: best.since }
  );
}

/** Everything the Reports screen needs for one range. */
export async function getReportInput(
  shopId: string,
  range: Range,
  today: BusinessDate,
  lang: Lang = "en",
): Promise<ReportInput> {
  const [reportDaysList, categories, itemList, previousSales, previousCategories, rise] =
    await Promise.all([
      reportDays(shopId, range.from, range.to),
      categoryTotals(shopId, range.from, range.to),
      itemTotals(shopId, range.from, range.to),
      salesTotal(shopId, range.previousFrom, range.previousTo),
      categoryTotals(shopId, range.previousFrom, range.previousTo),
      biggestMaterialRise(shopId, today, lang),
    ]);
  return {
    kind: range.kind,
    days: reportDaysList,
    categories,
    items: itemList,
    previous: previousSales > 0 ? { sales: previousSales, categories: previousCategories } : null,
    materialRise: rise,
  };
}

// ---------- Phase 11: comparison, month by month, spending details, export ----------

/**
 * The days to compare the range with, or null when the shop has no recorded day in
 * them (a comparison with only fixed costs would mislead).
 */
export async function compareDays(shopId: string, range: Range): Promise<ReportDay[] | null> {
  const list = await reportDays(shopId, range.compareFrom, range.compareTo);
  return list.some((d) => d.status !== "none") ? list : null;
}

/** The first day the shop has figures for (or the day it was set up). */
async function shopStart(shopId: string, createdAt: Date): Promise<BusinessDate> {
  const [row] = await getDb()
    .select({ first: min(days.businessDate) })
    .from(days)
    .where(eq(days.shopId, shopId));
  const created = businessDate(createdAt);
  return row?.first && row.first < created ? row.first : created;
}

/** Up to the last 12 months (this one so far), from when the shop started. Oldest first. */
export async function monthTrend(
  shop: { id: string; createdAt: Date },
  today: BusinessDate,
): Promise<MonthTotals[]> {
  const twelveBack = `${shiftMonth(today.slice(0, 7), -11)}-01`;
  const start = await shopStart(shop.id, shop.createdAt);
  return byMonth(await reportDays(shop.id, start > twelveBack ? start : twelveBack, today));
}

export type SpendEntry = {
  id: string;
  date: BusinessDate;
  amount: number;
  paidFrom: PaidFrom | null;
  /** What an "Other" expense was for, if typed. */
  note: string | null;
  material: string | null;
  supplier: string | null;
  quantity: number | null;
  unit: string | null;
};

/** The expenses of one category in the range, newest first (at most 500). */
export async function spendEntries(
  shopId: string,
  category: ExpenseCategory,
  from: BusinessDate,
  to: BusinessDate,
): Promise<SpendEntry[]> {
  const rows = await getDb()
    .select({
      id: entries.id,
      date: entries.businessDate,
      amount: entries.amount,
      paidFrom: entries.paidFrom,
      note: entries.note,
      material: materials.name,
      supplier: suppliers.name,
      quantityMilli: purchases.quantityMilli,
      unit: purchases.unit,
    })
    .from(entries)
    .leftJoin(purchases, eq(purchases.entryId, entries.id))
    .leftJoin(materials, eq(materials.id, purchases.materialId))
    .leftJoin(suppliers, eq(suppliers.id, purchases.supplierId))
    .where(
      and(
        eq(entries.shopId, shopId),
        eq(entries.type, "expense"),
        eq(entries.category, category),
        isNull(entries.deletedAt),
        gte(entries.businessDate, from),
        lte(entries.businessDate, to),
      ),
    )
    .orderBy(desc(entries.businessDate), desc(entries.occurredAt))
    .limit(500);
  return rows.map(({ quantityMilli, ...r }) => ({
    ...r,
    quantity: quantityMilli === null ? null : fromMilli(quantityMilli),
  }));
}

export type ExportEntry = SpendEntry & {
  time: Date;
  type: EntryType;
  paymentMode: PaymentMode | null;
  category: ExpenseCategory | null;
};

/** Every entry of the range for the CSV download, oldest first (at most 20,000). */
export async function exportEntries(
  shopId: string,
  from: BusinessDate,
  to: BusinessDate,
): Promise<ExportEntry[]> {
  const rows = await getDb()
    .select({
      id: entries.id,
      date: entries.businessDate,
      time: entries.occurredAt,
      type: entries.type,
      amount: entries.amount,
      paymentMode: entries.paymentMode,
      category: entries.category,
      paidFrom: entries.paidFrom,
      note: entries.note,
      material: materials.name,
      supplier: suppliers.name,
      quantityMilli: purchases.quantityMilli,
      unit: purchases.unit,
    })
    .from(entries)
    .leftJoin(purchases, eq(purchases.entryId, entries.id))
    .leftJoin(materials, eq(materials.id, purchases.materialId))
    .leftJoin(suppliers, eq(suppliers.id, purchases.supplierId))
    .where(
      and(
        eq(entries.shopId, shopId),
        isNull(entries.deletedAt),
        gte(entries.businessDate, from),
        lte(entries.businessDate, to),
      ),
    )
    .orderBy(asc(entries.businessDate), asc(entries.occurredAt))
    .limit(20_000);
  return rows.map(({ quantityMilli, ...r }) => ({
    ...r,
    quantity: quantityMilli === null ? null : fromMilli(quantityMilli),
  }));
}

// ---------- Supplier prices ----------

export async function listMaterials(shopId: string) {
  return getDb()
    .select({ id: materials.id, name: materials.name })
    .from(materials)
    .where(eq(materials.shopId, shopId))
    .orderBy(materials.name);
}

/** Purchases of one of the shop's materials, newest first (at most 200). */
export async function materialPurchases(shopId: string, materialId: string) {
  return purchaseRecords(shopId, { materialId, limit: 200 });
}

/** The latest monthly rise of any material, for the notice on the Items screen. */
export async function latestMaterialRise(shopId: string, today: BusinessDate, lang: Lang = "en") {
  return biggestMaterialRise(shopId, today, lang);
}
