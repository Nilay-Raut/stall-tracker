import type { Entry, ExpenseCategory, PaidFrom, PaymentMode } from "@/domain/entry";
import { type Translate, english, msg } from "@/i18n/translate";

// Words shown on screen, in English. Screens show them through t() for Hindi and Marathi.

export const PAYMENT_LABELS: Record<PaymentMode, string> = { cash: msg("Cash"), upi: msg("UPI") };

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  raw_material: msg("Raw material"),
  gas: msg("Gas"),
  packaging: msg("Packaging"),
  transport: msg("Transport"),
  salary: msg("Salary"),
  other: msg("Other"),
};

export const PAID_FROM_LABELS: Record<PaidFrom, string> = {
  drawer: msg("Drawer"),
  upi: msg("UPI"),
  own_pocket: msg("Own pocket"),
};

const PAID_FROM_NOTES: Record<PaidFrom, string> = {
  drawer: msg("Paid from drawer"),
  upi: msg("Paid by UPI"),
  own_pocket: msg("Paid from own pocket"),
};

/** Title and small line for an entry in the list: "Sale" / "UPI", "Gas" / "Paid from drawer". */
export function describeEntry(
  entry: Entry,
  t: Translate = english,
): { title: string; note: string } {
  switch (entry.type) {
    case "sale":
      return { title: t("Sale"), note: t(PAYMENT_LABELS[entry.paymentMode ?? "cash"]) };
    case "expense":
      return {
        title: t(CATEGORY_LABELS[entry.category ?? "other"]),
        note: t(PAID_FROM_NOTES[entry.paidFrom ?? "drawer"]),
      };
    case "cash_out":
      return { title: t("Cash taken out"), note: t("Owner") };
  }
}

/** Address of the add/edit screen for an entry type. */
export const ENTRY_PATHS = {
  sale: "/add/sale",
  expense: "/add/expense",
  cash_out: "/add/cash-out",
} as const;
