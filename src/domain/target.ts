import type { Paise } from "@/lib/money";

/** The month so far, as needed for the target. All money in paise. */
export type TargetInput = {
  /** Monthly profit target. */
  target: Paise;
  daysInMonth: number;
  /** Days already counted (their figures are below). */
  daysGone: number;
  sales: Paise;
  expenses: Paise;
  /** Fixed cost of the days gone (every day counts, closed days too). */
  fixedCost: Paise;
  /** Days with sales (closed-shop days left out), for the average. */
  openDays: number;
  /** Fixed cost of one day this month. */
  fixedPerDay: Paise;
};

export type TargetPlan = {
  /** Profit so far: sales − expenses − fixed. */
  earned: Paise;
  /** Share of the target earned, 0–100 (can pass 100). */
  percent: number;
  /** How far behind an even pace (negative = ahead), rounded to ₹100. */
  behind: Paise;
  reached: boolean;
  remainingDays: number;
  /**
   * Rule 9: sales needed each remaining day, rounded up to ₹10.
   * Null when it cannot be worked out (no sales yet, no days left, target reached).
   */
  salesPerDay: Paise | null;
  /** Average sales per open day so far. */
  averageSales: Paise | null;
  /** How much more than the average is needed each day, in sales and in profit. */
  extraSales: Paise | null;
  extraProfit: Paise | null;
  /** (sales − expenses) ÷ sales this month. */
  marginRatio: number | null;
};

const roundUpTo = (paise: number, rupees: number) =>
  Math.ceil(paise / (rupees * 100)) * rupees * 100;
const roundTo = (paise: number, rupees: number) =>
  Math.round(paise / (rupees * 100)) * rupees * 100;

export function targetPlan(input: TargetInput): TargetPlan {
  const earned = input.sales - input.expenses - input.fixedCost;
  const remainingDays = Math.max(input.daysInMonth - input.daysGone, 0);
  const marginRatio = input.sales > 0 ? (input.sales - input.expenses) / input.sales : null;
  const remainingProfit = input.target - earned;
  const reached = remainingProfit <= 0;

  const salesPerDay =
    !reached && remainingDays > 0 && marginRatio !== null && marginRatio > 0
      ? roundUpTo((remainingProfit / remainingDays + input.fixedPerDay) / marginRatio, 10)
      : null;

  const averageSales = input.openDays > 0 ? roundTo(input.sales / input.openDays, 1) : null;
  const extraSales =
    salesPerDay !== null && averageSales !== null && salesPerDay > averageSales
      ? salesPerDay - averageSales
      : null;

  const onPace = (input.target * input.daysGone) / input.daysInMonth;
  return {
    earned,
    percent: input.target > 0 ? (earned / input.target) * 100 : 0,
    behind: roundTo(onPace - earned, 100),
    reached,
    remainingDays,
    salesPerDay,
    averageSales,
    extraSales,
    extraProfit:
      extraSales !== null && marginRatio !== null ? roundTo(extraSales * marginRatio, 1) : null,
    marginRatio,
  };
}
