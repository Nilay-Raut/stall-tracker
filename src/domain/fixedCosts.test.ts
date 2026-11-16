import { describe, expect, it } from "vitest";
import { rupeesToPaise } from "@/lib/money";
import { fixedCostPerDay, monthlyFixedTotal } from "./fixedCosts";

describe("fixed costs", () => {
  // Wireframe Setup screen: rent 9,000 + salary 12,000 + electricity 1,500.
  const costs = [9000, 12000, 1500].map((r) => ({ monthlyAmount: rupeesToPaise(r) }));

  it("adds up the month", () => {
    expect(monthlyFixedTotal(costs)).toBe(rupeesToPaise(22500));
    expect(monthlyFixedTotal([])).toBe(0);
  });

  it("spreads the month over its days (₹22,500 / 30 = ₹750)", () => {
    expect(fixedCostPerDay(rupeesToPaise(22500), 30)).toBe(rupeesToPaise(750));
    expect(fixedCostPerDay(rupeesToPaise(22500), 31)).toBe(72581); // ₹725.81
  });
});
