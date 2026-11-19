import { describe, expect, it } from "vitest";
import { english } from "@/i18n/translate";
import { daySummaryMessage } from "./shareSummary";

const day = {
  shopName: "Momo Corner",
  day: "Thu, 19 Nov",
  sales: 563000,
  cashSales: 315000,
  upiSales: 248000,
  expenses: 227500,
  fixedCost: 75000,
  profit: 260500,
};

describe("daySummaryMessage", () => {
  it("lists the day's money in a few lines", () => {
    expect(daySummaryMessage(day, english)).toBe(
      [
        "*Momo Corner* · Thu, 19 Nov",
        "Sales ₹5,630 (Cash ₹3,150 · UPI ₹2,480)",
        "Expenses ₹2,275",
        "Fixed costs ₹750",
        "*Profit ₹2,605*",
      ].join("\n"),
    );
  });

  it("adds the stall's money when known", () => {
    const text = daySummaryMessage(
      {
        ...day,
        money: { cash: 115000, upi: 98500, upiIsBalance: false, total: 213500, pocket: 9000 },
      },
      english,
    );
    expect(text.split("\n").slice(-2)).toEqual([
      "Stall money ₹2,135 (Cash ₹1,150 · UPI ₹985)",
      "Paid from own pocket ₹90",
    ]);
  });

  it("says loss for a day below zero and skips fixed costs when there are none", () => {
    const text = daySummaryMessage({ ...day, fixedCost: 0, profit: -12000 }, english);
    expect(text).not.toContain("Fixed costs");
    expect(text).toContain("*Loss ₹120*");
  });
});
