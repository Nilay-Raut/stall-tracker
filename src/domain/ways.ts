import { type Translate, english } from "@/i18n/translate";
import type { Paise } from "@/lib/money";

/** An item with its current price and cost, and how many plates it sells on an average day. */
export type ItemStat = { name: string; price: Paise; cost: Paise; platesPerDay: number };

export type Way = { head: string; body: string; gain: Paise };

const MOVE_PLATES = 10;
const PRICE_STEP = 5_00; // ₹5

/**
 * "Ways to get there" on the Target screen: three simple levers built from the
 * items' margins and plate counts, each with the extra profit a day it brings.
 * `gap` is the extra profit needed each day (null when on track).
 */
export function waysToReach(
  items: ReadonlyArray<ItemStat>,
  gap: Paise | null,
  format: (paise: Paise) => string,
  t: Translate = english,
): Way[] {
  const sold = items.filter((i) => i.platesPerDay > 0 && i.price > i.cost);
  if (sold.length === 0) return [];
  const margin = (i: ItemStat) => i.price - i.cost;
  const ways: Way[] = [];

  // 1. Sell more of the item that earns the most per plate.
  const richest = sold.reduce((a, b) => (margin(b) > margin(a) ? b : a));
  const needed = gap && gap > 0 ? Math.ceil(gap / margin(richest)) : MOVE_PLATES;
  ways.push({
    head: t("Sell {n} more {item}", { n: needed, item: richest.name.toLowerCase() }),
    body:
      gap && gap > 0
        ? t("{amount} profit a plate. This alone covers the gap.", {
            amount: format(margin(richest)),
          })
        : t("{amount} profit a plate, your best margin.", { amount: format(margin(richest)) }),
    gain: needed * margin(richest),
  });

  // 2. Move plates from the best seller to the richest item (if they differ).
  const bestSeller = sold.reduce((a, b) => (b.platesPerDay > a.platesPerDay ? b : a));
  const difference = margin(richest) - margin(bestSeller);
  if (bestSeller !== richest && difference > 0) {
    const moved = Math.min(MOVE_PLATES, Math.round(bestSeller.platesPerDay));
    ways.push({
      head: t("Move {n} plates from {from} to {to}", {
        n: moved,
        from: bestSeller.name.toLowerCase(),
        to: richest.name.toLowerCase(),
      }),
      body: t("{item} earns {amount} more a plate than {other}.", {
        item: richest.name,
        amount: format(difference),
        other: bestSeller.name.toLowerCase(),
      }),
      gain: moved * difference,
    });
  }

  // 3. A small price rise on the item that sells the most plates.
  const plates = Math.round(bestSeller.platesPerDay);
  ways.push({
    head: t("Raise {item} by {amount}", {
      item: bestSeller.name.toLowerCase(),
      amount: format(PRICE_STEP),
    }),
    body: t("At {n} plates a day, if sales stay the same.", { n: plates }),
    gain: plates * PRICE_STEP,
  });

  return ways;
}
