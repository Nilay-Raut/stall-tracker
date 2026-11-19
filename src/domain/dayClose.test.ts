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
  upiExpenses: 0,
  pocketExpenses: r(900), // the gas, paid from the owner's pocket
  cashOut: r(500),
  drawerCashOut: r(500),
  upiCashOut: 0,
  deposits: 0,
  drawerFixedPaid: 0,
  upiFixedPaid: 0,
  pocketFixedPaid: 0,
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

  it("counts cash put in the bank as gone from the drawer, but not cash taken from UPI", () => {
    const close = {
      openingCash: r(1000),
      countedCash: r(1475), // 2,275 − 800 put in the bank
      upiTotal: r(2480),
      waste: null,
    };
    const banked = computeClose({ ...entered, deposits: r(800) }, close);
    expect(banked.cashSales).toBe(r(3150)); // the same sales as without the deposit

    // ₹300 of the ₹500 taken out came from UPI: the drawer only lost 200 of it.
    const fromUpi = { ...entered, drawerCashOut: r(200), upiCashOut: r(300) };
    expect(computeClose(fromUpi, { ...close, countedCash: r(2575) }).cashSales).toBe(r(3150));
  });
});
