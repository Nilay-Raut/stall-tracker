import { z } from "zod";
import type { BusinessDate } from "@/lib/dates";
import type { Paise } from "@/lib/money";

/**
 * sale, expense, cash_out (owner takes money), deposit (cash from the drawer put
 * into the stall's UPI/bank account: stall money and profit stay the same),
 * fixed_paid (rent or monthly salary actually paid: lowers the stall's money but
 * not profit, since every day's profit already carries its share).
 */
export const ENTRY_TYPES = ["sale", "expense", "cash_out", "deposit", "fixed_paid"] as const;
export const PAYMENT_MODES = ["cash", "upi"] as const;
export const EXPENSE_CATEGORIES = [
  "raw_material",
  "gas",
  "packaging",
  "transport",
  "salary",
  "other",
] as const;
export const PAID_FROM = ["drawer", "upi", "own_pocket"] as const;
/**
 * How the shop records sales (rule 13): totals at closing only, sale entries
 * (+ plate counts), or a bill of items for each sale (v2 Phase 3).
 */
export const SALES_MODES = ["totals", "totals_items", "bills"] as const;

export type EntryType = (typeof ENTRY_TYPES)[number];
export type PaymentMode = (typeof PAYMENT_MODES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type PaidFrom = (typeof PAID_FROM)[number];
export type SalesMode = (typeof SALES_MODES)[number];

/** "Totals only" shops enter sales at closing, not one by one. */
export const takesSaleEntries = (mode: SalesMode) => mode !== "totals";

/** Longest note on an "Other" expense. */
export const MAX_NOTE_LENGTH = 40;

/** ₹10 lakh: far above any single entry at a stall, catches typing mistakes. */
export const MAX_ENTRY_AMOUNT: Paise = 10_00_000_00;

/**
 * One sale, expense or cash-out. The id is made on the phone, so an entry can
 * be saved offline and sent later without ever being created twice.
 */
export type Entry = {
  id: string;
  businessDate: BusinessDate;
  type: EntryType;
  amount: Paise;
  /** Sales only. */
  paymentMode: PaymentMode | null;
  /** Expenses only. */
  category: ExpenseCategory | null;
  /**
   * Expenses and fixed costs paid: who paid (drawer, UPI, own pocket). Cash out:
   * where it was taken from (drawer or UPI; none = drawer, as before this choice existed).
   */
  paidFrom: PaidFrom | null;
  /** Expenses only, optional: what was bought, for supplier price tracking. */
  purchase: Purchase | null;
  /**
   * Expenses, optional: what an "Other" expense was for ("Ice", "Repairs").
   * Fixed cost paid, required: which fixed cost ("Rent"), by its name in Setup.
   * Missing on entries saved before it existed: treat that as none.
   */
  note?: string | null;
  /** Sales only, optional: the bill's items (v2 Phase 3). The amount is their total. */
  lines: SaleLine[] | null;
  /**
   * Set by the server only: the payment provider that confirmed this sale ("phonepe").
   * Phones may send it back; the server never takes it from them (Phase 12).
   */
  paidVia?: string | null;
  /** When it happened (ISO time), for the time shown in the list. */
  occurredAt: string;
  /** When it was last changed on the phone (ISO time). The latest change wins. */
  updatedAt: string;
  deleted: boolean;
};

/**
 * One row of a bill: a saved item (itemId) or a custom one (itemId null).
 * The price is what this customer paid for one; the server adds the cost itself.
 */
export type SaleLine = {
  itemId: string | null;
  name: string;
  unitPrice: Paise;
  quantity: number;
};

export const MAX_BILL_LINES = 50;
export const MAX_LINE_QUANTITY = 999;

export const saleLineSchema = z.object({
  itemId: z.uuid().nullable(),
  name: z.string().trim().min(1).max(40),
  unitPrice: z.int().positive().max(1_00_000_00), // ₹1 lakh for one item
  quantity: z.int().min(1).max(MAX_LINE_QUANTITY),
});

/** Material details of an expense: "5 litre of Oil from Gupta Traders". */
export type Purchase = {
  material: string;
  supplier: string | null;
  /** Up to 3 decimals (2.5 kg). */
  quantity: number;
  unit: string;
};

export const purchaseSchema = z.object({
  material: z.string().trim().min(1).max(40),
  supplier: z.string().trim().max(40).nullable(),
  quantity: z
    .number()
    .positive()
    .max(100_000)
    .refine((q) => Math.abs(q * 1000 - Math.round(q * 1000)) < 1e-6, "Up to 3 decimals"),
  unit: z.string().trim().min(1).max(12),
});

const isoDate = z.iso.date();
const isoTime = z.iso.datetime({ offset: true });

/** Checks an entry coming from the phone. Used by the server and the forms. */
export const entrySchema = z
  .object({
    id: z.uuid(),
    businessDate: isoDate,
    type: z.enum(ENTRY_TYPES),
    amount: z.int().positive().max(MAX_ENTRY_AMOUNT),
    paymentMode: z.enum(PAYMENT_MODES).nullable(),
    category: z.enum(EXPENSE_CATEGORIES).nullable(),
    paidFrom: z.enum(PAID_FROM).nullable(),
    // Phones from before Phase 7 send no purchase at all: treat that as none.
    purchase: purchaseSchema.nullable().default(null),
    // Phones from before expense notes send none: treat that as none. Blank = none.
    note: z
      .string()
      .trim()
      .max(MAX_NOTE_LENGTH)
      .nullable()
      .default(null)
      .transform((note) => note || null),
    // Phones from before v2 send no lines at all: treat that as a plain sale.
    lines: z.array(saleLineSchema).min(1).max(MAX_BILL_LINES).nullable().default(null),
    paidVia: z.string().max(20).nullable().default(null),
    occurredAt: isoTime,
    updatedAt: isoTime,
    deleted: z.boolean(),
  })
  .superRefine((entry, ctx) => {
    const need = (field: keyof Entry, present: boolean) => {
      if (present && entry[field] === null) {
        ctx.addIssue({ code: "custom", path: [field], message: `${field} is required` });
      }
      if (!present && entry[field] !== null) {
        ctx.addIssue({ code: "custom", path: [field], message: `${field} must be empty` });
      }
    };
    need("paymentMode", entry.type === "sale");
    need("category", entry.type === "expense");
    if (entry.type === "expense" || entry.type === "fixed_paid") need("paidFrom", true);
    else if (entry.type === "cash_out") {
      if (entry.paidFrom === "own_pocket") {
        ctx.addIssue({
          code: "custom",
          path: ["paidFrom"],
          message: "cash out is from drawer or UPI",
        });
      }
    } else need("paidFrom", false);
    if (entry.purchase !== null && entry.type !== "expense") {
      ctx.addIssue({
        code: "custom",
        path: ["purchase"],
        message: "only expenses have a purchase",
      });
    }
    if (entry.type === "fixed_paid") need("note", true);
    else if (entry.note !== null && entry.type !== "expense") {
      ctx.addIssue({ code: "custom", path: ["note"], message: "only expenses have a note" });
    }
    if (entry.lines !== null) {
      if (entry.type !== "sale") {
        ctx.addIssue({ code: "custom", path: ["lines"], message: "only sales have bill lines" });
      } else if (
        entry.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0) !== entry.amount
      ) {
        ctx.addIssue({ code: "custom", path: ["amount"], message: "amount must equal the bill" });
      }
    }
  });
