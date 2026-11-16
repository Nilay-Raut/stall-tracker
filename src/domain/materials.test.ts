import { describe, expect, it } from "vitest";
import { formatRupees, rupeesToPaise as r } from "@/lib/money";
import { findMaterial, purchaseRate, rateNote, toMilli } from "./materials";

const oil = {
  name: "Oil",
  unit: "litre",
  lastRate: r(149),
  lastSupplier: "City Wholesale",
  lastDate: "2026-11-04",
};

describe("purchase rate", () => {
  it("is amount ÷ quantity (wireframe: ₹775 for 5 litres = ₹155)", () => {
    expect(purchaseRate(r(775), 5)).toBe(r(155));
    expect(purchaseRate(r(100), 3)).toBe(3333); // ₹33.33, rounded to the paisa
  });

  it("stores quantity in thousandths", () => {
    expect(toMilli(2.5)).toBe(2500);
    expect(toMilli(0.125)).toBe(125);
  });
});

describe("rateNote", () => {
  it("compares with the last purchase (wireframe)", () => {
    expect(rateNote(r(155), "litre", oil, formatRupees)).toEqual({
      title: "Rate ₹155 a litre",
      detail: "₹6 more than your last purchase (₹149, City Wholesale).",
    });
  });

  it("says when it is cheaper or the same", () => {
    expect(rateNote(r(140), "litre", oil, formatRupees).detail).toBe(
      "₹9 less than your last purchase (₹149, City Wholesale).",
    );
    expect(rateNote(r(149), "litre", oil, formatRupees).detail).toMatch(/^Same as/);
  });

  it("does not compare different units or unknown materials", () => {
    expect(rateNote(r(155), "kg", oil, formatRupees).detail).toBeNull();
    expect(rateNote(r(155), "litre", undefined, formatRupees).detail).toBeNull();
  });
});

describe("findMaterial", () => {
  it("ignores case and spaces", () => {
    expect(findMaterial([oil], "  oIL ")?.name).toBe("Oil");
    expect(findMaterial([oil], "")).toBeUndefined();
  });
});
