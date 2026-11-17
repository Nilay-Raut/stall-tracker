import { formatRupees, type Paise } from "@/lib/money";
import type { Entry, SaleLine } from "./entry";

// Bills (docs/PLAN-v2.md, Phase 3): a sale made of items, saved or custom.

/** Total of a bill, in paise. */
export function billTotal(lines: ReadonlyArray<SaleLine>): Paise {
  return lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
}

/** Number of things on a bill (3 chai + 1 samosa = 4). */
export function billQuantity(lines: ReadonlyArray<SaleLine>): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

/** Lower-case name with single spaces, so "Chai " and "chai" are the same item in reports. */
export const lineNameKey = (name: string) => name.trim().toLowerCase().replace(/\s+/g, " ");

/** "Vada pav ×2, Chai, +2 more" for the entry list. */
export function describeLines(lines: ReadonlyArray<SaleLine>, shown = 2): string {
  const parts = lines
    .slice(0, shown)
    .map((l) => (l.quantity > 1 ? `${l.name} ×${l.quantity}` : l.name));
  if (lines.length > shown) parts.push(`+${lines.length - shown}`);
  return parts.join(", ");
}

/**
 * Plates sold per saved item according to the day's bills, to fill in the
 * plate counter at closing. Custom items have no id, so they are not counted.
 */
export function plateCountsFromBills(entries: ReadonlyArray<Entry>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    if (entry.deleted || entry.type !== "sale" || !entry.lines) continue;
    for (const line of entry.lines) {
      if (line.itemId) counts[line.itemId] = (counts[line.itemId] ?? 0) + line.quantity;
    }
  }
  return counts;
}

export type BillText = {
  shopName: string;
  /** "Wed, 18 Nov · 7:42 pm" */
  when: string;
  lines: ReadonlyArray<SaleLine>;
  /** "Paid by UPI" (already in the shop's language). */
  paidBy: string;
  /** "Total" (already in the shop's language). */
  totalLabel: string;
  /** "Thank you!" (already in the shop's language). */
  thanks: string;
};

/** The bill as plain text for WhatsApp (*bold* is WhatsApp's own markup). */
export function billMessage(bill: BillText): string {
  const rows = bill.lines.map(
    (l) =>
      `${l.name}${l.quantity > 1 ? ` ×${l.quantity}` : ""}  ${formatRupees(l.unitPrice * l.quantity)}`,
  );
  return [
    `*${bill.shopName}*`,
    bill.when,
    "",
    ...rows,
    "",
    `*${bill.totalLabel}: ${formatRupees(billTotal(bill.lines))}*`,
    bill.paidBy,
    "",
    bill.thanks,
  ].join("\n");
}

/**
 * A wa.me link that opens WhatsApp with the bill typed in. With a 10-digit
 * Indian number it opens that chat; without, WhatsApp asks whom to send it to.
 * Nothing is sent by the app itself.
 */
export function whatsAppLink(message: string, phone?: string | null): string {
  const digits = phone?.replace(/\D/g, "") ?? "";
  const to = /^[6-9]\d{9}$/.test(digits) ? `91${digits}` : "";
  return `https://wa.me/${to}?text=${encodeURIComponent(message)}`;
}
