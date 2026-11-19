import type { Paise } from "@/lib/money";
import type { DayTotals } from "./dayTotals";

/** What the owner types at closing time. */
export type CloseInput = {
  openingCash: Paise;
  /** Cash counted in the drawer now. */
  countedCash: Paise;
  /** Today's UPI total from the payment app. */
  upiTotal: Paise;
  /** Food thrown away (information only; its cost is already in the expenses). */
  waste: Paise | null;
};

export type CloseResult = {
  /**
   * Rule 2: cash sales worked out from the drawer: counted − opening + expenses
   * paid from the drawer + cash taken out of the drawer + cash put in the bank
   * + fixed costs paid from the drawer.
   */
  cashSales: Paise;
  /** Rule 3: drawer cash sales − cash sales entered during the day. */
  cashDifference: Paise;
  /** UPI total typed at close − UPI sales entered during the day. */
  upiDifference: Paise;
  /** Rule 4: after closing, the closing figures are the day's sales. */
  sales: Paise;
  expenses: Paise;
  fixedCost: Paise;
  profit: Paise;
  breakEven: Paise;
  /** What stays in the drawer for tomorrow's opening cash. */
  cashLeft: Paise;
};

export function computeClose(entered: DayTotals, input: CloseInput): CloseResult {
  const cashSales =
    input.countedCash -
    input.openingCash +
    entered.drawerExpenses +
    entered.drawerCashOut +
    entered.deposits +
    entered.drawerFixedPaid;
  const sales = cashSales + input.upiTotal;
  return {
    cashSales,
    cashDifference: cashSales - entered.cashSales,
    upiDifference: input.upiTotal - entered.upiSales,
    sales,
    expenses: entered.expenses,
    fixedCost: entered.fixedCost,
    profit: sales - entered.expenses - entered.fixedCost,
    breakEven: entered.breakEven,
    cashLeft: input.countedCash,
  };
}
