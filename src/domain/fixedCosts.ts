import type { Paise } from "@/lib/money";

/** Sum of the monthly fixed costs (rent, monthly salary, electricity ...). */
export function monthlyFixedTotal(costs: ReadonlyArray<{ monthlyAmount: Paise }>): Paise {
  return costs.reduce((sum, cost) => sum + cost.monthlyAmount, 0);
}

/**
 * Fixed cost charged to each day: the month's total spread evenly over every day
 * of that month, open or closed. Rule 5 in the plan: ₹22,500 in a 30-day month = ₹750.
 */
export function fixedCostPerDay(monthlyTotal: Paise, daysInMonth: number): Paise {
  return Math.round(monthlyTotal / daysInMonth);
}
