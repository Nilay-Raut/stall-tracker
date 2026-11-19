import { describe, expect, it } from "vitest";
import { rupeesToPaise as r } from "@/lib/money";
import { computeClose } from "./dayClose";
import { computeDayTotals } from "./dayTotals";
import type { Entry } from "./entry";
import { fixedCostsMonth, leftToPay } from "./fixedPaid";
import { moneyNow } from "./stallMoney";

describe("fixedCostsMonth", () => {
  const costs = [
    { name: "Rent", monthlyAmount: r(15000) },
    { name: "Helper salary", monthlyAmount: r(7500) },
  ];

  it("adds up what was paid towards each cost, matching names loosely", () => {
    const month = fixedCostsMonth(costs, [
      { note: "rent ", amount: r(10000) },
      { note: "Rent", amount: r(5000) },
      { note: "Helper salary", amount: r(3000) },
    ]);
    expect(month).toEqual([
      { name: "Rent", monthly: r(15000), paid: r(15000) },
      { name: "Helper salary", monthly: r(7500), paid: r(3000) },
    ]);
    expect(month.map(leftToPay)).toEqual([0, r(4500)]);
  });

  it("keeps a payment for a cost that was since renamed", () => {
    const month = fixedCostsMonth(costs, [{ note: "Electricity", amount: r(1200) }]);
    expect(month[2]).toEqual({ name: "Electricity", monthly: 0, paid: r(1200) });
  });
});

let n = 0;
const entry = (partial: Partial<Entry> & Pick<Entry, "type" | "amount">): Entry => ({
  id: `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`,
  businessDate: "2026-11-19",
  paymentMode: null,
  category: null,
  paidFrom: null,
  purchase: null,
  lines: null,
  occurredAt: "2026-11-19T10:00:00.000Z",
  updatedAt: "2026-11-19T10:00:00.000Z",
  deleted: false,
  ...partial,
});

describe("paying a fixed cost", () => {
  const day = [
    entry({ type: "sale", amount: r(3000), paymentMode: "cash" }),
    entry({ type: "fixed_paid", amount: r(2000), paidFrom: "drawer", note: "Rent" }),
    entry({ type: "fixed_paid", amount: r(500), paidFrom: "own_pocket", note: "Electricity" }),
  ];
  const totals = computeDayTotals(day, r(750));

  it("does not lower profit again: the day's share is already counted", () => {
    expect(totals.expenses).toBe(0);
    expect(totals.profit).toBe(r(2250)); // 3,000 − 750 fixed share
  });

  it("lowers the drawer, and money from the pocket is owed to the owner", () => {
    const money = moneyNow(r(1000), totals);
    expect(money.cash).toBe(r(2000)); // 1,000 + 3,000 − 2,000 rent
    expect(money.pocket).toBe(r(500));
  });

  it("is not read as missing sales at close", () => {
    const close = computeClose(totals, {
      openingCash: r(1000),
      countedCash: r(2000),
      upiTotal: 0,
      waste: null,
    });
    expect(close.cashSales).toBe(r(3000));
    expect(close.cashDifference).toBe(0);
  });
});
