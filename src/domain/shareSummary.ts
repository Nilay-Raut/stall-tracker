import type { Translate } from "@/i18n/translate";
import { type Paise, formatRupees } from "@/lib/money";
import type { StallMoney } from "./stallMoney";

export type SummaryFigures = {
  shopName: string;
  /** "Thu, 19 Nov" */
  day: string;
  sales: Paise;
  cashSales: Paise;
  upiSales: Paise;
  expenses: Paise;
  fixedCost: Paise;
  profit: Paise;
  /** The stall's money at close, if known. */
  money?: StallMoney | null;
};

/**
 * The closed day as a short WhatsApp message for a partner or family, in the
 * shop's language. Sent only when the owner taps Share, never on its own.
 */
export function daySummaryMessage(f: SummaryFigures, t: Translate): string {
  const split = (cash: Paise, upi: Paise) =>
    `(${t("Cash {amount}", { amount: formatRupees(cash) })} · ${t("UPI {amount}", { amount: formatRupees(upi) })})`;
  const lines = [
    `*${f.shopName}* · ${f.day}`,
    `${t("Sales {amount}", { amount: formatRupees(f.sales) })} ${split(f.cashSales, f.upiSales)}`,
    t("Expenses {amount}", { amount: formatRupees(f.expenses) }),
  ];
  if (f.fixedCost > 0) {
    lines.push(t("Fixed costs {amount}", { amount: formatRupees(f.fixedCost) }));
  }
  lines.push(
    `*${f.profit < 0 ? t("Loss {amount}", { amount: formatRupees(-f.profit) }) : t("Profit {amount}", { amount: formatRupees(f.profit) })}*`,
  );
  if (f.money) {
    lines.push(
      `${t("Stall money {amount}", { amount: formatRupees(f.money.total) })} ${split(f.money.cash, f.money.upi)}`,
    );
    if (f.money.pocket > 0) {
      lines.push(t("Paid from own pocket {amount}", { amount: formatRupees(f.money.pocket) }));
    }
  }
  return lines.join("\n");
}
