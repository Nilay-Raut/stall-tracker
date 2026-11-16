import { describe, expect, it } from "vitest";
import { formatRupees, rupeesToPaise as r } from "@/lib/money";
import { type ReportDay, buildReport } from "./report";

// The wireframe's month: 1–13 Nov 2026, 9 Nov closed, ₹750 fixed cost every day.
const salesByDay = [7850, 4120, 3960, 4480, 4900, 5720, 7340, 8060, 0, 4050, 4610, 5140, 5630];
const days: ReportDay[] = salesByDay.map((sales, i) => {
  const date = `2026-11-${String(i + 1).padStart(2, "0")}`;
  const off = i === 8;
  return {
    date,
    status: off ? "off" : "closed",
    sales: r(sales),
    cashSales: r(Math.round(sales * 0.56)),
    upiSales: r(sales - Math.round(sales * 0.56)),
    expenses: off ? 0 : r(2027), // about ₹26,350 over 13 days
    fixedCost: r(750),
  };
});

const input = {
  kind: "month" as const,
  days,
  categories: [
    { category: "raw_material" as const, amount: r(19900) },
    { category: "gas" as const, amount: r(2850) },
    { category: "packaging" as const, amount: r(2160) },
  ],
  items: [
    { name: "Cheese momos", plates: 138, margin: r(6624) },
    { name: "Veg steam momos", plates: 396, margin: r(14256) },
  ],
  previous: {
    sales: r(100000),
    categories: [
      { category: "raw_material" as const, amount: r(28600) },
      { category: "gas" as const, amount: r(3600) },
      { category: "packaging" as const, amount: r(3400) },
    ],
  },
  materialRise: { name: "Oil", unit: "litre", from: r(146), to: r(155), since: "October" },
};

describe("buildReport", () => {
  const report = buildReport(input, formatRupees);

  it("adds up the month (wireframe: sales ₹65,860, fixed ₹9,750)", () => {
    expect(report.sales).toBe(r(65860));
    expect(report.fixedCost).toBe(r(9750)); // 13 days × ₹750, closed day included
    expect(report.profit).toBe(report.sales - report.expenses - report.fixedCost);
    expect(report.offDates).toEqual(["2026-11-09"]);
  });

  it("averages weekdays over open days only", () => {
    const sunday = report.weekdays[0]; // 1 and 8 Nov
    expect(sunday.average).toBe(r((7850 + 8060) / 2));
    const monday = report.weekdays[1]; // 2 Nov only: 9 Nov was closed
    expect(monday.average).toBe(r(4120));
  });

  it("shows spending as a share of sales next to last month", () => {
    expect(report.spend[0]).toEqual({
      category: "raw_material",
      amount: r(19900),
      share: 30.2,
      previousShare: 28.6,
    });
  });

  it("works out profit per plate for each item, best first", () => {
    expect(report.items.map((i) => [i.name, i.perPlate])).toEqual([
      ["Veg steam momos", r(36)],
      ["Cheese momos", r(48)],
    ]);
  });

  it("writes the three kinds of insight", () => {
    const heads = report.insights.map((i) => i.head);
    expect(heads[0]).toBe("Sunday earns about double Tuesday.");
    expect(heads[1]).toBe("Raw material is taking a bigger share.");
    expect(report.insights[1].body).toBe(
      "Raw material is 30.2% of sales this month. It was 28.6% last month.",
    );
    expect(report.insights[2].body).toBe("Oil went from ₹146 to ₹155 a litre since October.");
  });

  it("stays quiet when there is nothing to say", () => {
    const quiet = buildReport(
      { ...input, days: days.slice(0, 1), previous: null, materialRise: null },
      formatRupees,
    );
    expect(quiet.insights).toEqual([]);
  });
});
