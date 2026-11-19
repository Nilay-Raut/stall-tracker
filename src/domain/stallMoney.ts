import type { Paise } from "@/lib/money";
import type { DayTotals } from "./dayTotals";

/**
 * The stall's own money: cash in the drawer plus the UPI/bank account. Not
 * profit: fixed costs are counted every day but paid once a month, and cash the
 * owner takes out lowers the money but not the profit.
 *
 * The UPI part is the account balance when the owner has told the app the
 * balance once (upiStart = balance at the start of the day). Until then it is
 * only what this day added to or took from the account.
 */
export type StallMoney = {
  /** Cash in the drawer. */
  cash: Paise;
  /** UPI account balance (or, when not known, this day's UPI change). Can be below zero. */
  upi: Paise;
  /** True when `upi` is the account balance, false when it is this day's change only. */
  upiIsBalance: boolean;
  /** cash + upi */
  total: Paise;
  /** Paid from the owner's own pocket: not stall money; the stall owes it back. */
  pocket: Paise;
};

export type MoneyMoves = Pick<
  DayTotals,
  | "cashSales"
  | "upiSales"
  | "drawerExpenses"
  | "upiExpenses"
  | "pocketExpenses"
  | "drawerCashOut"
  | "upiCashOut"
  | "deposits"
  | "drawerFixedPaid"
  | "upiFixedPaid"
  | "pocketFixedPaid"
>;

/** What the day's entries did to the UPI account, other than UPI sales. */
export const upiOutflow = (day: MoneyMoves): Paise =>
  day.upiExpenses + day.upiCashOut + day.upiFixedPaid - day.deposits;

/** Paid from the owner's own pocket for the stall (expenses and fixed costs). */
const pocketOf = (day: MoneyMoves): Paise => day.pocketExpenses + day.pocketFixedPaid;

function money(cash: Paise, upiChange: Paise, upiStart: Paise | null, pocket: Paise): StallMoney {
  const upi = (upiStart ?? 0) + upiChange;
  return { cash, upi, upiIsBalance: upiStart !== null, total: cash + upi, pocket };
}

/** While the day is open: what the entries say should be there now. */
export function moneyNow(
  openingCash: Paise,
  day: MoneyMoves,
  upiStart: Paise | null = null,
): StallMoney {
  return money(
    openingCash +
      day.cashSales -
      day.drawerExpenses -
      day.drawerCashOut -
      day.deposits -
      day.drawerFixedPaid,
    day.upiSales - upiOutflow(day),
    upiStart,
    pocketOf(day),
  );
}

/**
 * After closing: the cash counted in the drawer and the UPI total typed at close
 * (the closing figures win over the entries, as for sales, rule 4).
 */
export function moneyAtClose(
  countedCash: Paise,
  upiTotal: Paise,
  day: MoneyMoves,
  upiStart: Paise | null = null,
): StallMoney {
  return money(countedCash, upiTotal - upiOutflow(day), upiStart, pocketOf(day));
}

/**
 * The balance to store when the owner says "my UPI app shows X now": the balance
 * at the start of today is X less what today has done to the account so far.
 */
export const upiStartFrom = (balanceNow: Paise, todayChange: Paise): Paise =>
  balanceNow - todayChange;
