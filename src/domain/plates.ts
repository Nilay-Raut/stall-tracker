import type { Paise } from "@/lib/money";

/** One item's plate count for a day, with the price and cost saved that day (rule 11). */
export type PlateCount = { name: string; quantity: number; price: Paise; cost: Paise };

export type PlateInsight = {
  /** The item that earned the most margin today. */
  best: { name: string; earned: Paise; quantity: number };
  /** An item with a better margin per plate than the best earner, if any. */
  better: { name: string; extraPerPlate: Paise; quantity: number } | null;
};

const marginOf = (c: PlateCount) => c.price - c.cost;

/**
 * "Veg steam momos earned the most: ₹1,224 from 34 plates.
 *  Cheese momos earn ₹12 more per plate. Only 12 sold today."
 */
export function plateInsight(counts: ReadonlyArray<PlateCount>): PlateInsight | null {
  const sold = counts.filter((c) => c.quantity > 0);
  if (sold.length === 0) return null;

  const best = sold.reduce((a, b) => (marginOf(b) * b.quantity > marginOf(a) * a.quantity ? b : a));
  const richest = sold.reduce((a, b) => (marginOf(b) > marginOf(a) ? b : a));

  return {
    best: { name: best.name, earned: marginOf(best) * best.quantity, quantity: best.quantity },
    better:
      richest !== best && marginOf(richest) > marginOf(best)
        ? {
            name: richest.name,
            extraPerPlate: marginOf(richest) - marginOf(best),
            quantity: richest.quantity,
          }
        : null,
  };
}

/** Margin earned from all counted plates (used by reports). */
export function plateMarginTotal(counts: ReadonlyArray<PlateCount>): Paise {
  return counts.reduce((sum, c) => sum + marginOf(c) * c.quantity, 0);
}
