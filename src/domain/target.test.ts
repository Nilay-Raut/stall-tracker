import { describe, expect, it } from "vitest";
import { rupeesToPaise as r } from "@/lib/money";
import { targetPlan } from "./target";

// The wireframe: target ₹80,000 for November; 13 of 30 days gone, 9 Nov closed.
const november = {
  target: r(80000),
  daysInMonth: 30,
  daysGone: 13,
  sales: r(65860),
  expenses: r(26350),
  fixedCost: r(9750),
  openDays: 12,
  fixedPerDay: r(750),
};

describe("targetPlan", () => {
  const plan = targetPlan(november);

  it("shows what is earned and how far behind (wireframe)", () => {
    expect(plan.earned).toBe(r(29760));
    expect(Math.round(plan.percent)).toBe(37);
    expect(plan.behind).toBe(r(4900)); // 80,000 × 13/30 − 29,760 ≈ 4,907
    expect(plan.remainingDays).toBe(17);
  });

  it("works out the sales needed each day (rule 9: ≈ ₹6,180)", () => {
    expect(plan.salesPerDay).toBe(r(6180));
    expect(plan.averageSales).toBe(r(5488));
    expect(plan.extraSales).toBe(r(692));
    expect(plan.extraProfit).toBe(r(415));
  });

  it("knows when the target is reached", () => {
    const done = targetPlan({ ...november, target: r(20000) });
    expect(done.reached).toBe(true);
    expect(done.salesPerDay).toBeNull();
    expect(done.behind).toBeLessThan(0); // ahead of pace
  });

  it("cannot plan without sales or days left", () => {
    expect(targetPlan({ ...november, sales: 0, expenses: 0, openDays: 0 }).salesPerDay).toBeNull();
    expect(targetPlan({ ...november, daysGone: 30 }).salesPerDay).toBeNull();
  });
});
