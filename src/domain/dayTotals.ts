import type { Paise } from "@/lib/money";
import type { Entry } from "./entry";

export type DayTotals = {
  /** All sales, cash + UPI. */
  sales: Paise;
  cashSales: Paise;
  upiSales: Paise;
  /** All expenses, whoever paid. */
  expenses: Paise;
  /** Expenses paid with cash from the drawer (needed for the drawer check at close). */
  drawerExpenses: Paise;
  /** Cash the owner took out of the drawer. Not an expense: it does not lower profit. */
  cashOut: Paise;
  fixedCost: Paise;
  /** Rule 6: sales − expenses − fixed cost for the day. */
  profit: Paise;
  /** Rule 7: the sales needed to cover today's costs (expenses + fixed cost). */
  breakEven: Paise;
  entryCount: number;
};

/** Totals for one day from its entries. Deleted entries are skipped. */
export function computeDayTotals(entries: ReadonlyArray<Entry>, fixedCost: Paise): DayTotals {
  const totals = {
    sales: 0,
    cashSales: 0,
    upiSales: 0,
    expenses: 0,
    drawerExpenses: 0,
    cashOut: 0,
    entryCount: 0,
  };

  for (const entry of entries) {
    if (entry.deleted) continue;
    totals.entryCount += 1;

    switch (entry.type) {
      case "sale":
        totals.sales += entry.amount;
        if (entry.paymentMode === "cash") totals.cashSales += entry.amount;
        else totals.upiSales += entry.amount;
        break;
      case "expense":
        totals.expenses += entry.amount;
        if (entry.paidFrom === "drawer") totals.drawerExpenses += entry.amount;
        break;
      case "cash_out":
        totals.cashOut += entry.amount;
        break;
    }
  }

  return {
    ...totals,
    fixedCost,
    profit: totals.sales - totals.expenses - fixedCost,
    breakEven: totals.expenses + fixedCost,
  };
}
