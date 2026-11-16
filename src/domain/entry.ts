import { z } from "zod";
import type { BusinessDate } from "@/lib/dates";
import type { Paise } from "@/lib/money";

export const ENTRY_TYPES = ["sale", "expense", "cash_out"] as const;
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

export type EntryType = (typeof ENTRY_TYPES)[number];
export type PaymentMode = (typeof PAYMENT_MODES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type PaidFrom = (typeof PAID_FROM)[number];

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
  /** Expenses only. */
  paidFrom: PaidFrom | null;
  /** Expenses only, optional: what was bought, for supplier price tracking. */
  purchase: Purchase | null;
  /** When it happened (ISO time), for the time shown in the list. */
  occurredAt: string;
  /** When it was last changed on the phone (ISO time). The latest change wins. */
  updatedAt: string;
  deleted: boolean;
};

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
    need("paidFrom", entry.type === "expense");
    if (entry.purchase !== null && entry.type !== "expense") {
      ctx.addIssue({
        code: "custom",
        path: ["purchase"],
        message: "only expenses have a purchase",
      });
    }
  });
