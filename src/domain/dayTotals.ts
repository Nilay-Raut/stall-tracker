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
  /** Expenses paid by UPI from the stall's account. */
  upiExpenses: Paise;
  /** Expenses the owner paid from their own pocket: never stall money. */
  pocketExpenses: Paise;
  /** Money the owner took for themselves (drawer + UPI). Not an expense: profit stays. */
  cashOut: Paise;
  /** The part of cashOut taken from the drawer (all cash outs before the choice existed). */
  drawerCashOut: Paise;
  /** The part of cashOut taken from the UPI account. */
  upiCashOut: Paise;
  /** Cash moved from the drawer into the UPI/bank account. Not money in or out of the stall. */
  deposits: Paise;
  /**
   * Fixed costs actually paid (rent, monthly salary), by who paid. Not expenses:
   * each day's profit already carries its share. They only lower the money.
   */
  drawerFixedPaid: Paise;
  upiFixedPaid: Paise;
  pocketFixedPaid: Paise;
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
    upiExpenses: 0,
    pocketExpenses: 0,
    cashOut: 0,
    drawerCashOut: 0,
    upiCashOut: 0,
    deposits: 0,
    drawerFixedPaid: 0,
    upiFixedPaid: 0,
    pocketFixedPaid: 0,
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
        else if (entry.paidFrom === "upi") totals.upiExpenses += entry.amount;
        else if (entry.paidFrom === "own_pocket") totals.pocketExpenses += entry.amount;
        break;
      case "cash_out":
        totals.cashOut += entry.amount;
        if (entry.paidFrom === "upi") totals.upiCashOut += entry.amount;
        else totals.drawerCashOut += entry.amount;
        break;
      case "deposit":
        totals.deposits += entry.amount;
        break;
      case "fixed_paid":
        if (entry.paidFrom === "drawer") totals.drawerFixedPaid += entry.amount;
        else if (entry.paidFrom === "upi") totals.upiFixedPaid += entry.amount;
        else if (entry.paidFrom === "own_pocket") totals.pocketFixedPaid += entry.amount;
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
