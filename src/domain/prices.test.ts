import { describe, expect, it } from "vitest";
import { rupeesToPaise as r } from "@/lib/money";
import { type PurchaseRecord, priceSummary } from "./prices";

const buy = (date: string, rate: number, quantity: number, supplier: string): PurchaseRecord => ({
  date,
  rate: r(rate),
  quantity,
  amount: r(rate * quantity),
  supplier,
  unit: "litre",
});

// Oil from the wireframe, newest first. About 40 litres a month.
const oil = [
  buy("2026-11-13", 155, 5, "Gupta Traders"),
  buy("2026-11-04", 149, 10, "City Wholesale"),
  buy("2026-11-01", 155, 25, "Gupta Traders"),
  buy("2026-10-27", 146, 15, "Gupta Traders"),
  buy("2026-10-12", 146, 25, "Gupta Traders"),
  buy("2026-09-20", 138, 40, "Gupta Traders"),
];

describe("priceSummary", () => {
  const summary = priceSummary(oil)!;

  it("shows the latest rate and the monthly trend (wireframe)", () => {
    expect(summary.latestRate).toBe(r(155));
    expect(summary.months).toEqual([
      { month: "2026-09", rate: r(138), change: null },
      { month: "2026-10", rate: r(146), change: r(8) },
      { month: "2026-11", rate: r(155), change: r(9) },
    ]);
  });

  it("works out what the rise costs a month (₹9 × 40 litres = ₹360)", () => {
    expect(summary.monthlyQuantity).toBe(40);
    expect(summary.riseCost).toEqual({ perUnit: r(9), monthly: r(360) });
  });

  it("compares suppliers and the saving from switching (₹6 a litre, ₹240 a month)", () => {
    expect(summary.suppliers.map((s) => [s.name, s.rate, s.cheapest])).toEqual([
      ["City Wholesale", r(149), true],
      ["Gupta Traders", r(155), false],
    ]);
    expect(summary.switchSaving).toEqual({
      supplier: "City Wholesale",
      perUnit: r(6),
      monthly: r(240),
    });
  });

  it("handles a single purchase and no purchases", () => {
    const one = priceSummary([oil[0]])!;
    expect(one.riseCost).toBeNull();
    expect(one.switchSaving).toBeNull();
    expect(one.suppliers[0].cheapest).toBe(false);
    expect(priceSummary([])).toBeNull();
  });
});
