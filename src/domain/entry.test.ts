import { describe, expect, it } from "vitest";
import { entrySchema } from "./entry";

const base = {
  id: "3f1c2b8e-5d4a-4c3b-9a2e-1f0e9d8c7b6a",
  businessDate: "2026-11-13",
  amount: 190000,
  occurredAt: "2026-11-13T15:50:00.000Z",
  updatedAt: "2026-11-13T15:50:00.000Z",
  deleted: false,
};

describe("entrySchema", () => {
  it("accepts a sale, an expense and a cash out", () => {
    for (const entry of [
      { ...base, type: "sale", paymentMode: "upi", category: null, paidFrom: null },
      { ...base, type: "expense", paymentMode: null, category: "gas", paidFrom: "drawer" },
      { ...base, type: "cash_out", paymentMode: null, category: null, paidFrom: null },
    ]) {
      expect(entrySchema.safeParse(entry).success, entry.type).toBe(true);
    }
  });

  it("needs the right details for each type", () => {
    const saleWithoutMode = {
      ...base,
      type: "sale",
      paymentMode: null,
      category: null,
      paidFrom: null,
    };
    const expenseWithMode = {
      ...base,
      type: "expense",
      paymentMode: "cash",
      category: "gas",
      paidFrom: "drawer",
    };
    expect(entrySchema.safeParse(saleWithoutMode).success).toBe(false);
    expect(entrySchema.safeParse(expenseWithMode).success).toBe(false);
  });

  it("rejects bad amounts and ids", () => {
    const sale = { ...base, type: "sale", paymentMode: "cash", category: null, paidFrom: null };
    expect(entrySchema.safeParse({ ...sale, amount: 0 }).success).toBe(false);
    expect(entrySchema.safeParse({ ...sale, amount: 12.5 }).success).toBe(false);
    expect(entrySchema.safeParse({ ...sale, amount: 10_00_000_01 }).success).toBe(false);
    expect(entrySchema.safeParse({ ...sale, id: "not-a-uuid" }).success).toBe(false);
  });
});
