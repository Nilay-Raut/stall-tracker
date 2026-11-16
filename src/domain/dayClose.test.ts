import { describe, expect, it } from "vitest";
import { rupeesToPaise as r } from "@/lib/money";
import { computeClose } from "./dayClose";
import type { DayTotals } from "./dayTotals";

// The day from the wireframe, before closing.
const entered: DayTotals = {
  sales: r(5580),
  cashSales: r(3100),
  upiSales: r(2480),
  expenses: r(2275),
  drawerExpenses: r(1375),
  cashOut: r(500),
  fixedCost: r(750),
  profit: r(2555),
  breakEven: r(3025),
  entryCount: 8,
};

describe("computeClose", () => {
  const result = computeClose(entered, {
    openingCash: r(1000),
    countedCash: r(2275),
    upiTotal: r(2480),
    waste: r(140),
  });

  it("works out cash sales from the drawer (wireframe: ₹3,150)", () => {
    // 2,275 − 1,000 + 1,375 + 500
    expect(result.cashSales).toBe(r(3150));
  });

  it("finds ₹50 more cash than was entered", () => {
    expect(result.cashDifference).toBe(r(50));
    expect(result.upiDifference).toBe(0);
  });

  it("uses the closing figures for the day's sales and profit (wireframe: ₹2,605)", () => {
    expect(result.sales).toBe(r(5630));
    expect(result.profit).toBe(r(2605)); // 5,630 − 2,275 − 750
    expect(result.breakEven).toBe(r(3025));
    expect(result.cashLeft).toBe(r(2275));
  });

  it("shows a shortfall as a negative difference", () => {
    const short = computeClose(entered, {
      openingCash: r(1000),
      countedCash: r(2175),
      upiTotal: r(2400),
      waste: null,
    });
    expect(short.cashDifference).toBe(-r(50));
    expect(short.upiDifference).toBe(-r(80));
  });
});
