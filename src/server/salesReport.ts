import "server-only";
import {
  billSummary,
  boughtTogether,
  itemStats,
  marginMix,
  peakHours,
  slowMovers,
  whatToDo,
} from "@/domain/salesInsights";
import type { Translate } from "@/i18n/translate";
import { type BusinessDate, shiftDate } from "@/lib/dates";
import { formatRupees } from "@/lib/money";
import { type Range, datesBetween } from "@/lib/ranges";
import { billRecords, itemCatalog, itemDays, lastSold, saleHours } from "@/server/itemSales";

/** "What to do" looks at the last four weeks, whatever period is on screen. */
const ACTION_DAYS = 28;
/** How far back "not sold in N days" looks. */
const SLOW_LOOKBACK = 60;

/** Everything the item and bill sections of Reports need (docs/PLAN-v2.md, Phase 4). */
export async function salesReport(shopId: string, range: Range, today: BusinessDate, t: Translate) {
  const recentFrom = shiftDate(today, -(ACTION_DAYS - 1));
  const half = shiftDate(today, -(ACTION_DAYS / 2 - 1));
  const [
    rows,
    before,
    bills,
    billsBefore,
    hours,
    recentRows,
    recentBills,
    recentHours,
    catalog,
    last,
  ] = await Promise.all([
    itemDays(shopId, range.from, range.to),
    itemDays(shopId, range.compareFrom, range.compareTo),
    billRecords(shopId, range.from, range.to),
    billRecords(shopId, range.compareFrom, range.compareTo),
    saleHours(shopId, range.from, range.to),
    itemDays(shopId, recentFrom, today),
    billRecords(shopId, recentFrom, today),
    saleHours(shopId, recentFrom, today),
    itemCatalog(shopId),
    lastSold(shopId, shiftDate(today, -SLOW_LOOKBACK), today),
  ]);

  const dates = datesBetween(range.from, range.to);
  const stats = itemStats(rows, dates, before);
  const slow = slowMovers(catalog, last, today);
  const recentDates = datesBetween(recentFrom, today);

  return {
    dates,
    stats,
    bills: billSummary(bills),
    billsBefore: billsBefore.length > 0 ? billSummary(billsBefore) : null,
    pairs: boughtTogether(bills),
    peak: peakHours(hours),
    mix: marginMix(stats),
    slow,
    actions: whatToDo(
      {
        dates: recentDates,
        rows: recentRows,
        openDates: [...new Set(recentHours.filter((h) => h.amount > 0).map((h) => h.date))],
        recentBills: recentBills.filter((b) => b.date >= half),
        earlierBills: recentBills.filter((b) => b.date < half),
        hours: recentHours,
        slow,
      },
      formatRupees,
      t,
    ),
  };
}

export type SalesReport = Awaited<ReturnType<typeof salesReport>>;
