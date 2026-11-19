import { type BusinessDate, shiftDate } from "@/lib/dates";

/** "You usually buy Oil every 4 days. It has been 5." */
export type RestockHint = { material: string; everyDays: number; daysSince: number };

/** How far back purchases are looked at. */
export const RESTOCK_LOOKBACK_DAYS = 60;
/** Purchases needed (on different days) before a pattern is trusted. */
const MIN_PURCHASE_DAYS = 3;
const MAX_HINTS = 3;

function daysBetween(from: BusinessDate, to: BusinessDate): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Materials that are due again: bought on at least 3 days in the last 60, and the
 * gap since the last purchase is longer than the usual gap (the median). A material
 * not bought for over three usual gaps is taken as no longer bought, so it stops.
 */
export function restockHints(
  purchases: ReadonlyArray<{ material: string; date: BusinessDate }>,
  today: BusinessDate,
): RestockHint[] {
  const since = shiftDate(today, -RESTOCK_LOOKBACK_DAYS);
  const byMaterial = new Map<string, { name: string; dates: Set<BusinessDate> }>();
  for (const p of purchases) {
    if (p.date < since || p.date > today) continue;
    const key = p.material.trim().toLowerCase();
    const group = byMaterial.get(key) ?? { name: p.material.trim(), dates: new Set() };
    group.dates.add(p.date);
    byMaterial.set(key, group);
  }

  const hints: Array<RestockHint & { overdue: number }> = [];
  for (const { name, dates } of byMaterial.values()) {
    if (dates.size < MIN_PURCHASE_DAYS) continue;
    const sorted = [...dates].sort();
    const gaps = sorted.slice(1).map((date, i) => daysBetween(sorted[i], date));
    const everyDays = Math.max(1, Math.round(median(gaps)));
    const daysSince = daysBetween(sorted[sorted.length - 1], today);
    if (daysSince > everyDays && daysSince <= everyDays * 3) {
      hints.push({ material: name, everyDays, daysSince, overdue: daysSince / everyDays });
    }
  }
  return hints
    .sort((a, b) => b.overdue - a.overdue)
    .slice(0, MAX_HINTS)
    .map(({ material, everyDays, daysSince }) => ({ material, everyDays, daysSince }));
}
