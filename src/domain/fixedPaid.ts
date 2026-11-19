import type { Paise } from "@/lib/money";
import { noteKey } from "./expenseNotes";

/** One fixed cost for a month: what it costs and what has been paid towards it. */
export type FixedCostMonth = { name: string; monthly: Paise; paid: Paise };

type Payment = { note?: string | null; amount: Paise };

/**
 * Adds payments to the month's rows, matched by name (ignoring case and spacing).
 * A payment whose cost was since renamed or removed still shows, with no monthly
 * amount, so no money goes missing.
 */
export function withPayments(
  rows: ReadonlyArray<FixedCostMonth>,
  payments: ReadonlyArray<Payment>,
): FixedCostMonth[] {
  const byKey = new Map(rows.map((row) => [noteKey(row.name), { ...row }]));
  for (const payment of payments) {
    const key = noteKey(payment.note ?? "");
    if (!key) continue;
    const row = byKey.get(key) ?? { name: (payment.note ?? "").trim(), monthly: 0, paid: 0 };
    row.paid += payment.amount;
    byKey.set(key, row);
  }
  return [...byKey.values()];
}

/** The fixed costs in Setup for a month, with the payments made towards them. */
export function fixedCostsMonth(
  costs: ReadonlyArray<{ name: string; monthlyAmount: Paise }>,
  payments: ReadonlyArray<Payment>,
): FixedCostMonth[] {
  const rows = new Map<string, FixedCostMonth>();
  for (const cost of costs) {
    const key = noteKey(cost.name);
    const row = rows.get(key);
    if (row) {
      row.monthly += cost.monthlyAmount; // the same name twice: one cost
    } else {
      rows.set(key, { name: cost.name.trim(), monthly: cost.monthlyAmount, paid: 0 });
    }
  }
  return withPayments([...rows.values()], payments);
}

/** What is still to pay this month (never below zero). */
export const leftToPay = (row: FixedCostMonth): Paise => Math.max(0, row.monthly - row.paid);
