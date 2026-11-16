import type { Month } from "@/lib/calendar";
import type { BusinessDate } from "@/lib/dates";
import type { Paise } from "@/lib/money";

/** One purchase of a material. */
export type PurchaseRecord = {
  date: BusinessDate;
  /** Price per unit (rule 12). */
  rate: Paise;
  quantity: number;
  amount: Paise;
  supplier: string | null;
  unit: string;
};

export type PriceSummary = {
  latestRate: Paise;
  unit: string;
  /** Up to the last 3 months with purchases, oldest first: the month's latest rate. */
  months: Array<{ month: Month; rate: Paise; change: Paise | null }>;
  /** About how much is bought in a month (over those months). */
  monthlyQuantity: number;
  /** What the latest rise costs in a month, if the rate went up. */
  riseCost: { perUnit: Paise; monthly: Paise } | null;
  /** Each supplier's latest rate, cheapest first. */
  suppliers: Array<{ name: string; rate: Paise; lastDate: BusinessDate; cheapest: boolean }>;
  /** Saving from buying only from the cheapest supplier, if the last purchase was elsewhere. */
  switchSaving: { supplier: string; perUnit: Paise; monthly: Paise } | null;
};

/** "About" amounts are rounded to whole rupees: "about ₹113 a month", never "₹112.5". */
const aboutRupees = (paise: number) => Math.round(paise / 100) * 100;

/**
 * Supplier prices for one material (wireframe screen 10).
 * `records` must be newest first.
 */
export function priceSummary(records: ReadonlyArray<PurchaseRecord>): PriceSummary | null {
  if (records.length === 0) return null;
  const latest = records[0];

  // Each month's latest rate (records are newest first, so the first one seen).
  const byMonth = new Map<Month, PurchaseRecord[]>();
  for (const r of records) {
    const month = r.date.slice(0, 7);
    byMonth.set(month, [...(byMonth.get(month) ?? []), r]);
  }
  const recentMonths = [...byMonth.keys()].slice(0, 3).reverse();
  const months = recentMonths.map((month, i) => {
    const rate = byMonth.get(month)![0].rate;
    const before = i > 0 ? byMonth.get(recentMonths[i - 1])![0].rate : null;
    return { month, rate, change: before === null ? null : rate - before };
  });

  const bought = recentMonths.flatMap((m) => byMonth.get(m)!);
  const monthlyQuantity =
    Math.round((bought.reduce((sum, r) => sum + r.quantity, 0) / recentMonths.length) * 10) / 10;

  const last = months.at(-1)!;
  const riseCost =
    last.change !== null && last.change > 0
      ? { perUnit: last.change, monthly: aboutRupees(last.change * monthlyQuantity) }
      : null;

  const supplierRates = new Map<string, { rate: Paise; lastDate: BusinessDate }>();
  for (const r of records) {
    if (r.supplier && !supplierRates.has(r.supplier)) {
      supplierRates.set(r.supplier, { rate: r.rate, lastDate: r.date });
    }
  }
  const cheapestRate = Math.min(...[...supplierRates.values()].map((s) => s.rate));
  const suppliers = [...supplierRates.entries()]
    .map(([name, s]) => ({
      name,
      ...s,
      cheapest: supplierRates.size > 1 && s.rate === cheapestRate,
    }))
    .sort((a, b) => a.rate - b.rate);

  const cheapest = suppliers.find((s) => s.cheapest);
  const switchSaving =
    cheapest && latest.supplier && latest.supplier !== cheapest.name && latest.rate > cheapest.rate
      ? {
          supplier: cheapest.name,
          perUnit: latest.rate - cheapest.rate,
          monthly: aboutRupees((latest.rate - cheapest.rate) * monthlyQuantity),
        }
      : null;

  return {
    latestRate: latest.rate,
    unit: latest.unit,
    months,
    monthlyQuantity,
    riseCost,
    suppliers,
    switchSaving,
  };
}
