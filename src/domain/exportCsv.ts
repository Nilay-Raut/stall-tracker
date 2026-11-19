import { type Translate, english, msg } from "@/i18n/translate";
import { type Cell, rupeesCell, toCsv } from "@/lib/csv";
import { formatTime } from "@/lib/dates";
import type { Lang } from "@/lib/dates";
import { CATEGORY_LABELS, PAID_FROM_LABELS, PAYMENT_LABELS } from "@/lib/labels";
import type { ExpenseCategory, PaidFrom, PaymentMode } from "./entry";
import type { ReportDay } from "./report";

// The CSV files from Reports > Share or download, in the shop's language.

const STATUS: Record<ReportDay["status"], string> = {
  open: msg("Open"),
  closed: msg("Day closed"),
  off: msg("Shop closed"),
  none: msg("Nothing recorded"),
};

/** One row per day: the same figures as the Reports screen, so totals match. */
export function daysCsv(days: ReportDay[], t: Translate = english): string {
  const header = [
    t("Date"),
    t("Status"),
    t("Sales"),
    t("Cash sales"),
    t("UPI sales"),
    t("Expenses"),
    t("Fixed costs"),
    t("Profit"),
    t("Cash taken out"),
  ];
  const rows: Cell[][] = days.map((d) => [
    d.date,
    t(STATUS[d.status]),
    rupeesCell(d.sales),
    rupeesCell(d.cashSales),
    rupeesCell(d.upiSales),
    rupeesCell(d.expenses),
    rupeesCell(d.fixedCost),
    rupeesCell(d.sales - d.expenses - d.fixedCost),
    rupeesCell(d.cashOut),
  ]);
  const sum = (pick: (d: ReportDay) => number) => rupeesCell(days.reduce((a, d) => a + pick(d), 0));
  rows.push([
    t("Total"),
    null,
    sum((d) => d.sales),
    sum((d) => d.cashSales),
    sum((d) => d.upiSales),
    sum((d) => d.expenses),
    sum((d) => d.fixedCost),
    sum((d) => d.sales - d.expenses - d.fixedCost),
    sum((d) => d.cashOut),
  ]);
  return toCsv(header, rows);
}

export type CsvEntry = {
  date: string;
  time: Date;
  type: "sale" | "expense" | "cash_out";
  amount: number;
  paymentMode: PaymentMode | null;
  category: ExpenseCategory | null;
  paidFrom: PaidFrom | null;
  /** What an "Other" expense was for (missing in old callers = none). */
  note?: string | null;
  material: string | null;
  quantity: number | null;
  unit: string | null;
  supplier: string | null;
};

const TYPES: Record<CsvEntry["type"], string> = {
  sale: msg("Sale"),
  expense: msg("Expense"),
  cash_out: msg("Cash taken out"),
};

/** One row per entry, oldest first. Material and supplier are what the owner typed. */
export function entriesCsv(list: CsvEntry[], lang: Lang = "en", t: Translate = english): string {
  const header = [
    t("Date"),
    t("Time"),
    t("Type"),
    t("Amount"),
    t("Payment"),
    t("Category"),
    t("Paid from"),
    t("Material"),
    t("Quantity"),
    t("Unit"),
    t("Supplier"),
    t("Note"),
  ];
  const rows: Cell[][] = list.map((e) => [
    e.date,
    formatTime(e.time.toISOString(), lang),
    t(TYPES[e.type]),
    rupeesCell(e.amount),
    e.paymentMode ? t(PAYMENT_LABELS[e.paymentMode]) : null,
    e.category ? t(CATEGORY_LABELS[e.category]) : null,
    e.paidFrom ? t(PAID_FROM_LABELS[e.paidFrom]) : null,
    e.material,
    e.quantity,
    e.unit,
    e.supplier,
    e.note ?? null,
  ]);
  return toCsv(header, rows);
}

export type CsvBillLine = {
  date: string;
  occurredAt: Date;
  billId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  paymentMode: PaymentMode | null;
};

/** One row per item on a bill (v2 Phase 4). Rows of one bill share its short number. */
export function billsCsv(list: CsvBillLine[], lang: Lang = "en", t: Translate = english): string {
  const header = [
    t("Date"),
    t("Time"),
    t("Bill"),
    t("Item"),
    t("Quantity"),
    t("Price"),
    t("Amount"),
    t("Payment"),
  ];
  const rows: Cell[][] = list.map((l) => [
    l.date,
    formatTime(l.occurredAt.toISOString(), lang),
    l.billId.slice(0, 8),
    l.name,
    l.quantity,
    rupeesCell(l.unitPrice),
    rupeesCell(l.unitPrice * l.quantity),
    l.paymentMode ? t(PAYMENT_LABELS[l.paymentMode]) : null,
  ]);
  return toCsv(header, rows);
}
