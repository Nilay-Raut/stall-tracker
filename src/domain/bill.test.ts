import { describe, expect, it } from "vitest";
import {
  billMessage,
  billQuantity,
  billTotal,
  describeLines,
  lineNameKey,
  plateCountsFromBills,
  whatsAppLink,
} from "./bill";
import { type Entry, type SaleLine, entrySchema } from "./entry";

const VADA = "11111111-1111-4111-8111-111111111111";
const CHAI = "22222222-2222-4222-8222-222222222222";

const lines: SaleLine[] = [
  { itemId: VADA, name: "Vada pav", unitPrice: 2000, quantity: 2 },
  { itemId: CHAI, name: "Chai", unitPrice: 1000, quantity: 1 },
  { itemId: null, name: "Extra chutney", unitPrice: 500, quantity: 1 },
];

const sale = (over: Partial<Entry> = {}): Entry => ({
  id: crypto.randomUUID(),
  businessDate: "2026-11-18",
  type: "sale",
  amount: 5500,
  paymentMode: "cash",
  category: null,
  paidFrom: null,
  purchase: null,
  lines,
  occurredAt: "2026-11-18T13:00:00.000Z",
  updatedAt: "2026-11-18T13:00:00.000Z",
  deleted: false,
  ...over,
});

describe("bills", () => {
  it("adds up a bill", () => {
    expect(billTotal(lines)).toBe(5500);
    expect(billQuantity(lines)).toBe(4);
  });

  it("describes a bill shortly", () => {
    expect(describeLines(lines)).toBe("Vada pav ×2, Chai, +1");
    expect(describeLines(lines.slice(0, 1))).toBe("Vada pav ×2");
  });

  it("groups names ignoring case and spaces", () => {
    expect(lineNameKey("  Masala   Chai ")).toBe("masala chai");
  });

  it("counts plates of saved items from the day's bills", () => {
    const counts = plateCountsFromBills([
      sale(),
      sale({ lines: [{ itemId: VADA, name: "Vada pav", unitPrice: 2000, quantity: 3 }] }),
      sale({ deleted: true }),
      sale({ lines: null }),
    ]);
    expect(counts).toEqual({ [VADA]: 5, [CHAI]: 1 });
  });

  it("checks that a bill's amount is its total", () => {
    expect(entrySchema.safeParse(sale()).success).toBe(true);
    expect(entrySchema.safeParse(sale({ amount: 5000 })).success).toBe(false);
    // Only sales carry lines.
    expect(
      entrySchema.safeParse(
        sale({ type: "expense", paymentMode: null, category: "gas", paidFrom: "drawer" }),
      ).success,
    ).toBe(false);
    // Old phones send no lines: still a valid sale.
    const old: Partial<Entry> = sale({ amount: 300 });
    delete old.lines;
    expect(entrySchema.parse(old).lines).toBeNull();
  });

  it("refuses silly lines", () => {
    const bad = (line: Partial<SaleLine>) =>
      entrySchema.safeParse(
        sale({ amount: 100, lines: [{ ...lines[2], unitPrice: 100, ...line }] }),
      ).success;
    expect(bad({})).toBe(true);
    expect(bad({ quantity: 0 })).toBe(false);
    expect(bad({ quantity: 1000 })).toBe(false);
    expect(bad({ name: " " })).toBe(false);
    expect(entrySchema.safeParse(sale({ amount: 0, lines: [] })).success).toBe(false);
  });

  it("writes a WhatsApp bill and link", () => {
    const text = billMessage({
      shopName: "Momo Corner",
      when: "Wed, 18 Nov · 6:30 pm",
      lines,
      paidBy: "Paid by UPI",
      totalLabel: "Total",
      thanks: "Thank you!",
    });
    expect(text).toContain("*Momo Corner*");
    expect(text).toContain("Vada pav ×2  ₹40");
    expect(text).toContain("*Total: ₹55*");
    expect(whatsAppLink("hi there")).toBe("https://wa.me/?text=hi%20there");
    expect(whatsAppLink("hi", "98765 43210")).toBe("https://wa.me/919876543210?text=hi");
    expect(whatsAppLink("hi", "12345")).toBe("https://wa.me/?text=hi");
  });
});
