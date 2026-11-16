import { describe, expect, it } from "vitest";
import { rupeesToPaise as r } from "@/lib/money";
import { byMonth, compareTotals, moneySplit, ownerTake, sharesOf100, totalsOf } from "./analysis";
import type { ReportDay } from "./report";

describe("sharesOf100", () => {
  it("always adds up to exactly 100", () => {
    expect(sharesOf100([1, 1, 1])).toEqual([34, 33, 33]);
    expect(sharesOf100([5, 3, 2])).toEqual([50, 30, 20]);
    for (const amounts of [
      [7, 13, 29, 51],
      [1, 2],
      [999, 1],
      [3, 3, 3, 3, 3, 3, 3],
    ]) {
      expect(sharesOf100(amounts).reduce((a, b) => a + b, 0)).toBe(100);
    }
  });

  it("gives zeros when there is nothing", () => {
    expect(sharesOf100([0, 0])).toEqual([0, 0]);
  });
});

describe("moneySplit", () => {
  it("splits sales into spending, fixed costs and profit (wireframe month)", () => {
    const split = moneySplit(
      r(65860),
      [
        { category: "raw_material", amount: r(19900) },
        { category: "gas", amount: r(3400) },
        { category: "packaging", amount: r(3050) },
      ],
      r(9750),
    );
    expect(split.basis).toBe("sales");
    expect(split.loss).toBe(0);
    expect(split.parts.map((p) => [p.key, p.per100])).toEqual([
      ["raw_material", 30],
      ["gas", 5],
      ["packaging", 5],
      ["fixed", 15],
      ["profit", 45],
    ]);
    expect(split.parts.find((p) => p.key === "profit")!.amount).toBe(r(29760));
  });

  it("with a loss, splits the costs and says how much sales fell short", () => {
    const split = moneySplit(r(1000), [{ category: "gas", amount: r(600) }], r(900));
    expect(split.basis).toBe("costs");
    expect(split.loss).toBe(r(500));
    expect(split.parts.map((p) => [p.key, p.per100])).toEqual([
      ["gas", 40],
      ["fixed", 60],
    ]);
  });

  it("handles a period with no sales", () => {
    expect(moneySplit(0, [], r(750))).toEqual({
      basis: "costs",
      parts: [{ key: "fixed", amount: r(750), per100: 100 }],
      loss: r(750),
    });
  });
});

const day = (date: string, sales: number, expenses: number, cashOut = 0): ReportDay => ({
  date,
  status: "closed",
  sales: r(sales),
  cashSales: r(sales),
  upiSales: 0,
  expenses: r(expenses),
  fixedCost: r(100),
  cashOut: r(cashOut),
});

describe("compareTotals", () => {
  it("gives the change and percent for each total", () => {
    const now = totalsOf([day("2026-11-01", 1200, 300)]);
    const before = totalsOf([day("2026-10-01", 1000, 400)]);
    const c = compareTotals(now, before);
    expect(c.sales).toEqual({ now: r(1200), before: r(1000), change: r(200), percent: 20 });
    expect(c.expenses.percent).toBe(-25);
    expect(c.profit).toMatchObject({ now: r(800), before: r(500), percent: 60 });
  });

  it("measures change from a loss against its size", () => {
    const c = compareTotals(
      { sales: 0, expenses: 0, fixedCost: 0, profit: r(100) },
      { sales: 0, expenses: 0, fixedCost: 0, profit: r(-200) },
    );
    expect(c.profit.percent).toBe(150);
    expect(c.sales.percent).toBeNull();
  });
});

describe("byMonth", () => {
  it("adds up each month, oldest first", () => {
    const months = byMonth([
      day("2026-11-02", 500, 100, 50),
      day("2026-10-31", 300, 50),
      day("2026-11-01", 700, 200),
    ]);
    expect(months).toEqual([
      {
        month: "2026-10",
        sales: r(300),
        expenses: r(50),
        fixedCost: r(100),
        profit: r(150),
        cashOut: 0,
        days: 1,
      },
      {
        month: "2026-11",
        sales: r(1200),
        expenses: r(300),
        fixedCost: r(200),
        profit: r(700),
        cashOut: r(50),
        days: 2,
      },
    ]);
  });
});

describe("ownerTake", () => {
  it("warns only when more was taken than earned", () => {
    expect(ownerTake(r(500), r(800)).overBy).toBe(0);
    expect(ownerTake(r(900), r(800)).overBy).toBe(r(100));
    expect(ownerTake(r(300), r(-200)).overBy).toBe(r(300));
  });
});
