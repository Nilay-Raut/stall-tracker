import { describe, expect, it } from "vitest";
import { rupeesToPaise as r } from "@/lib/money";
import { workOutMargin } from "./itemMargin";

describe("workOutMargin", () => {
  // Wireframe: cheese momos, price ₹90, cost ₹42 -> margin ₹48, 53%.
  it("works from the cost", () => {
    const m = workOutMargin(r(90), "cost", r(42));
    expect(m.margin).toBe(r(48));
    expect(Math.round(m.percent)).toBe(53);
  });

  it("works from the margin in rupees", () => {
    const m = workOutMargin(r(90), "margin", r(48));
    expect(m.cost).toBe(r(42));
    expect(Math.round(m.percent)).toBe(53);
  });

  it("works from the margin in percent", () => {
    const m = workOutMargin(r(60), "percent", 60); // veg steam: 60% of ₹60
    expect(m.cost).toBe(r(24));
    expect(m.margin).toBe(r(36));
  });

  it("shows a loss when cost is above price", () => {
    const m = workOutMargin(r(50), "cost", r(55));
    expect(m.margin).toBe(-r(5));
    expect(m.percent).toBeLessThan(0);
  });

  it("does not divide by a zero price", () => {
    expect(workOutMargin(0, "cost", 0).percent).toBe(0);
  });
});
