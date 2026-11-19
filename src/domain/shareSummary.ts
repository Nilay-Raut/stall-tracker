import type { Translate } from "@/i18n/translate";
import { type Paise, formatRupees } from "@/lib/money";

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
};

/**
 * The closed day as a short WhatsApp message for a partner or family, in the
 * shop's language. Sent only when the owner taps Share, never on its own.
 */
export function daySummaryMessage(f: SummaryFigures, t: Translate): string {
  return [
    `*${f.shopName}* · ${f.day}`,
    t("Sales {amount}", { amount: formatRupees(f.sales) }) +
      ` (${t("Cash {amount}", { amount: formatRupees(f.cashSales) })} · ${t("UPI {amount}", { amount: formatRupees(f.upiSales) })})`,
    t("Expenses {amount}", { amount: formatRupees(f.expenses) }),
    ...(f.fixedCost > 0 ? [t("Fixed costs {amount}", { amount: formatRupees(f.fixedCost) })] : []),
    `*${f.profit < 0 ? t("Loss {amount}", { amount: formatRupees(-f.profit) }) : t("Profit {amount}", { amount: formatRupees(f.profit) })}*`,
  ].join("\n");
}
