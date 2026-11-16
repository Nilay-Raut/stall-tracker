import type { Month } from "@/lib/calendar";
import type { Paise } from "@/lib/money";
import type { ExpenseCategory } from "./entry";
import type { ReportDay } from "./report";

// Phase 11: the deeper report views. Pure maths, no database or React.

/**
 * Whole-number shares of 100 that always add up to exactly 100 (largest remainder):
 * plain rounding of 33.3 + 33.3 + 33.3 would give 99.
 */
export function sharesOf100(amounts: number[]): number[] {
  const total = amounts.reduce((a, b) => a + b, 0);
  if (total <= 0) return amounts.map(() => 0);
  const exact = amounts.map((a) => (a / total) * 100);
  const shares = exact.map(Math.floor);
  let left = 100 - shares.reduce((a, b) => a + b, 0);
  const byRemainder = exact
    .map((value, i) => ({ i, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);
  for (const { i } of byRemainder) {
    if (left <= 0) break;
    shares[i]++;
    left--;
  }
  return shares;
}

export type SplitPart = {
  key: ExpenseCategory | "fixed" | "profit";
  amount: Paise;
  per100: number;
};

/**
 * Where every ₹100 went. With a profit, sales are split into each spending category,
 * fixed costs and the profit. With a loss, the costs are split instead (sales could
 * not cover them) and `loss` says by how much.
 */
export function moneySplit(
  sales: Paise,
  spend: Array<{ category: ExpenseCategory; amount: Paise }>,
  fixedCost: Paise,
): { basis: "sales" | "costs"; parts: SplitPart[]; loss: Paise } {
  const costs: Array<Omit<SplitPart, "per100">> = [
    ...spend.filter((s) => s.amount > 0).map((s) => ({ key: s.category, amount: s.amount })),
    ...(fixedCost > 0 ? [{ key: "fixed" as const, amount: fixedCost }] : []),
  ];
  const costTotal = costs.reduce((a, c) => a + c.amount, 0);
  const profit = sales - costTotal;
  const parts =
    profit >= 0 && sales > 0 ? [...costs, { key: "profit" as const, amount: profit }] : costs;
  const shares = sharesOf100(parts.map((p) => p.amount));
  return {
    basis: profit >= 0 && sales > 0 ? "sales" : "costs",
    parts: parts.map((p, i) => ({ ...p, per100: shares[i] })).filter((p) => p.amount > 0),
    loss: Math.max(-profit, 0),
  };
}

export type Totals = { sales: Paise; expenses: Paise; fixedCost: Paise; profit: Paise };

export function totalsOf(days: ReportDay[]): Totals {
  const sales = days.reduce((a, d) => a + d.sales, 0);
  const expenses = days.reduce((a, d) => a + d.expenses, 0);
  const fixedCost = days.reduce((a, d) => a + d.fixedCost, 0);
  return { sales, expenses, fixedCost, profit: sales - expenses - fixedCost };
}

export type Change = { now: Paise; before: Paise; change: Paise; percent: number | null };

/** Each total now against before. Percent is null when there was nothing before. */
export function compareTotals(now: Totals, before: Totals): Record<keyof Totals, Change> {
  const one = (key: keyof Totals): Change => {
    const change = now[key] - before[key];
    return {
      now: now[key],
      before: before[key],
      change,
      percent: before[key] !== 0 ? Math.round((change / Math.abs(before[key])) * 100) : null,
    };
  };
  return {
    sales: one("sales"),
    expenses: one("expenses"),
    fixedCost: one("fixedCost"),
    profit: one("profit"),
  };
}

export type MonthTotals = Totals & { month: Month; cashOut: Paise; days: number };

/** Groups days into calendar months, oldest first. */
export function byMonth(days: ReportDay[]): MonthTotals[] {
  const groups = Map.groupBy(days, (d) => d.date.slice(0, 7));
  return [...groups]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, list]) => ({
      month,
      ...totalsOf(list),
      cashOut: list.reduce((a, d) => a + d.cashOut, 0),
      days: list.length,
    }));
}

/** Cash the owner took out against the profit made: "took" more than "earned" is a warning. */
export function ownerTake(cashOut: Paise, profit: Paise) {
  return {
    cashOut,
    profit,
    overBy: cashOut > Math.max(profit, 0) ? cashOut - Math.max(profit, 0) : 0,
  };
}
