import type { Paise } from "@/lib/money";

/** What the owner knows about an item besides its price. */
export type MarginBasis = "cost" | "margin" | "percent";

export type Margin = {
  /** Cost to make one plate. */
  cost: Paise;
  /** Price − cost: what one plate leaves to cover fixed costs and profit. */
  margin: Paise;
  /** Margin as a share of the price, 0–100 (can be negative: a loss). */
  percent: number;
};

/**
 * Rule 10: given the price and any one of cost, margin in ₹ or margin in %,
 * works out the other two. `value` is paise for "cost" and "margin", and a
 * percentage for "percent".
 */
export function workOutMargin(price: Paise, basis: MarginBasis, value: number): Margin {
  const cost =
    basis === "cost"
      ? value
      : basis === "margin"
        ? price - value
        : Math.round(price * (1 - value / 100));
  const margin = price - cost;
  return { cost, margin, percent: price > 0 ? (margin / price) * 100 : 0 };
}
