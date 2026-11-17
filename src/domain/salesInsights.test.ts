import { describe, expect, it } from "vitest";
import { formatRupees } from "@/lib/money";
import { datesBetween } from "@/lib/ranges";
import {
  type BillRecord,
  type ItemDay,
  billSummary,
  boughtTogether,
  hourWindow,
  itemStats,
  marginMix,
  peakHours,
  slowMovers,
  whatToDo,
} from "./salesInsights";

const row = (date: string, key: string, quantity: number, price: number, cost: number | null) => ({
  date,
  key,
  name: key[0].toUpperCase() + key.slice(1),
  quantity,
  revenue: quantity * price,
  costedRevenue: cost === null ? 0 : quantity * price,
  cost: cost === null ? 0 : quantity * cost,
});

const bill = (date: string, ...items: Array<[string, number]>): BillRecord => ({
  date,
  amount: items.reduce((s, [, q]) => s + q * 1000, 0),
  items: items.map(([key, quantity]) => ({ key, name: key, quantity })),
});

describe("item stats", () => {
  const dates = ["2026-11-16", "2026-11-17", "2026-11-18"];
  const rows: ItemDay[] = [
    row("2026-11-16", "chai", 10, 1000, 400),
    row("2026-11-18", "chai", 5, 1000, 400),
    row("2026-11-17", "vada pav", 4, 2000, 800),
    row("2026-11-17", "chutney", 3, 500, null), // custom item, no cost
  ];

  it("adds up each item, best sales first, with a daily series and profit", () => {
    const stats = itemStats(rows, dates, [row("2026-11-10", "chai", 10, 1000, 400)]);
    expect(stats.map((s) => s.key)).toEqual(["chai", "vada pav", "chutney"]);
    expect(stats[0]).toMatchObject({ quantity: 15, revenue: 15000, profit: 9000, change: 50 });
    expect(stats[0].daily).toEqual([10, 0, 5]);
    expect(stats[2].profit).toBeNull();
    expect(stats[1].change).toBeNull(); // nothing before to compare with
  });

  it("splits sales and profit shares and flags busy items that earn little", () => {
    const mix = marginMix([
      ...itemStats([row("2026-11-16", "tea", 100, 1000, 900)], dates), // ₹1,000 sales, ₹100 profit
      ...itemStats([row("2026-11-16", "dosa", 10, 6000, 1000)], dates), // ₹600 sales, ₹500 profit
    ]);
    expect(mix.find((m) => m.key === "tea")).toMatchObject({
      salesShare: 63,
      profitShare: 17,
      lowEarner: true,
    });
    expect(mix.find((m) => m.key === "dosa")?.lowEarner).toBe(false);
  });
});

describe("bills", () => {
  const bills = [
    bill("2026-11-18", ["chai", 2], ["vada pav", 1]),
    bill("2026-11-18", ["chai", 1], ["vada pav", 2]),
    bill("2026-11-18", ["chai", 1], ["samosa", 1]),
  ];

  it("summarises count, average and items per bill", () => {
    expect(billSummary(bills)).toEqual({ count: 3, average: 2700, itemsPerBill: 2.7 });
    expect(billSummary([])).toEqual({ count: 0, average: 0, itemsPerBill: 0 });
  });

  it("finds items bought together", () => {
    expect(boughtTogether(bills)).toEqual([{ a: "chai", b: "vada pav", bills: 2 }]);
  });
});

describe("peak hours", () => {
  it("finds the busiest two hours of the week", () => {
    const peak = peakHours([
      { date: "2026-11-14", hour: 19, amount: 5000 }, // Saturday
      { date: "2026-11-14", hour: 20, amount: 4000 },
      { date: "2026-11-14", hour: 12, amount: 1000 },
      { date: "2026-11-16", hour: 9, amount: 800 },
    ]);
    expect(peak.busiest).toEqual({ weekday: 6, hour: 19, share: 90 });
    expect([peak.firstHour, peak.lastHour]).toEqual([9, 20]);
    // One busy hour: still an 8-hour window, and the label starts at that hour.
    const single = peakHours([
      { date: "2026-11-14", hour: 19, amount: 100 },
      { date: "2026-11-15", hour: 19, amount: 100 },
      { date: "2026-11-16", hour: 19, amount: 100 },
    ]);
    expect([single.firstHour, single.lastHour]).toEqual([15, 22]);
    expect(single.busiest?.hour).toBe(19);
    expect(hourWindow(19)).toBe("7–9 pm");
    expect(hourWindow(11)).toBe("11 am–1 pm");
  });
});

describe("slow movers", () => {
  it("lists saved items not sold for a week, longest first", () => {
    const slow = slowMovers(
      [
        { key: "chai", name: "Chai", since: "2026-09-01" },
        { key: "lassi", name: "Lassi", since: "2026-09-01" },
        { key: "new", name: "New thing", since: "2026-11-17" },
        { key: "old", name: "Old thing", since: "2026-09-01" },
      ],
      new Map([
        ["chai", "2026-11-18"],
        ["lassi", "2026-11-08"],
      ]),
      "2026-11-18",
    );
    expect(slow).toEqual([
      { key: "old", name: "Old thing", days: null },
      { key: "lassi", name: "Lassi", days: 10 },
    ]);
  });
});

describe("what to do", () => {
  const dates = datesBetween("2026-10-22", "2026-11-18");
  it("suggests prepping more on the best seller's busy weekday, and a price nudge", () => {
    // Chai: 10 a day, 20 on Saturdays; keeps only 20% of its price.
    const rows = dates.map((d) =>
      row(d, "chai", new Date(`${d}T00:00:00Z`).getUTCDay() === 6 ? 20 : 10, 1000, 800),
    );
    const actions = whatToDo(
      {
        dates,
        rows,
        openDates: dates,
        recentBills: [],
        earlierBills: [],
        hours: [],
        slow: [{ key: "lassi", name: "Lassi", days: 9 }],
      },
      formatRupees,
    );
    expect(actions.map((a) => a.kind)).toEqual(["weekday", "price", "slow"]);
    expect(actions[0].head).toBe("Make about 9 more Chai on Saturday.");
    expect(actions[1].head).toBe("Raise Chai by ₹1?");
    expect(actions[2].head).toBe("Lassi has not sold in 9 days.");
  });

  it("says nothing without enough data", () => {
    expect(
      whatToDo(
        {
          dates,
          rows: [],
          openDates: [],
          recentBills: [],
          earlierBills: [],
          hours: [],
          slow: [],
        },
        formatRupees,
      ),
    ).toEqual([]);
  });
});
