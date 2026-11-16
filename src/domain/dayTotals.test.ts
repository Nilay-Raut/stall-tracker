import { describe, expect, it } from "vitest";
import { rupeesToPaise as r } from "@/lib/money";
import { computeDayTotals } from "./dayTotals";
import type { Entry } from "./entry";

let n = 0;
function entry(partial: Partial<Entry> & Pick<Entry, "type" | "amount">): Entry {
  n += 1;
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    businessDate: "2026-11-13",
    paymentMode: partial.type === "sale" ? "cash" : null,
    category: partial.type === "expense" ? "other" : null,
    paidFrom: partial.type === "expense" ? "drawer" : null,
    purchase: null,
    occurredAt: "2026-11-13T14:00:00.000Z",
    updatedAt: "2026-11-13T14:00:00.000Z",
    deleted: false,
    ...partial,
  };
}

describe("computeDayTotals", () => {
  // The Today wireframe: sales ₹5,580, expenses ₹2,275, fixed ₹750.
  const day = [
    entry({ type: "sale", amount: r(1900), paymentMode: "cash" }),
    entry({ type: "sale", amount: r(1200), paymentMode: "cash" }),
    entry({ type: "sale", amount: r(1150), paymentMode: "upi" }),
    entry({ type: "sale", amount: r(1330), paymentMode: "upi" }),
    entry({ type: "expense", amount: r(1195), category: "raw_material", paidFrom: "drawer" }),
    entry({ type: "expense", amount: r(180), category: "packaging", paidFrom: "drawer" }),
    entry({ type: "expense", amount: r(900), category: "gas", paidFrom: "own_pocket" }),
    entry({ type: "cash_out", amount: r(500) }),
  ];
  const totals = computeDayTotals(day, r(750));

  it("matches the wireframe's Today numbers", () => {
    expect(totals.sales).toBe(r(5580));
    expect(totals.expenses).toBe(r(2275));
    expect(totals.profit).toBe(r(2555)); // 5,580 − 2,275 − 750
    expect(totals.breakEven).toBe(r(3025)); // 2,275 + 750
  });

  it("splits sales and drawer money", () => {
    expect(totals.cashSales).toBe(r(3100));
    expect(totals.upiSales).toBe(r(2480));
    expect(totals.drawerExpenses).toBe(r(1375)); // own-pocket gas is not from the drawer
    expect(totals.cashOut).toBe(r(500));
    expect(totals.entryCount).toBe(8);
  });

  it("does not count cash taken out as an expense", () => {
    const withoutCashOut = computeDayTotals(
      day.filter((e) => e.type !== "cash_out"),
      r(750),
    );
    expect(withoutCashOut.profit).toBe(totals.profit);
  });

  it("skips deleted entries", () => {
    const withDeleted = [...day, entry({ type: "sale", amount: r(999), deleted: true })];
    expect(computeDayTotals(withDeleted, r(750)).sales).toBe(r(5580));
  });

  it("shows a loss on a day with no sales", () => {
    const empty = computeDayTotals([], r(750));
    expect(empty.profit).toBe(-r(750));
    expect(empty.breakEven).toBe(r(750));
  });
});
