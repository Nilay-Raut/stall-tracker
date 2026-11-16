import { describe, expect, it } from "vitest";
import { rupeesToPaise as r } from "@/lib/money";
import { plateInsight, plateMarginTotal } from "./plates";

// The wireframe's items and the plate counts from its Close day screen.
const day = [
  { name: "Veg steam momos", quantity: 34, price: r(60), cost: r(24) },
  { name: "Fried momos", quantity: 22, price: r(70), cost: r(30) },
  { name: "Cheese momos", quantity: 12, price: r(90), cost: r(42) },
  { name: "Paneer momos", quantity: 6, price: r(100), cost: r(50) },
  { name: "Spring roll", quantity: 7, price: r(50), cost: r(26) },
];

describe("plateInsight", () => {
  it("names the best earner and a better-margin item (wireframe summary)", () => {
    const insight = plateInsight(day);
    expect(insight?.best).toEqual({ name: "Veg steam momos", earned: r(1224), quantity: 34 });
    // Paneer has the highest margin (₹50), ₹14 more than veg steam's ₹36.
    expect(insight?.better).toEqual({ name: "Paneer momos", extraPerPlate: r(14), quantity: 6 });
  });

  it("matches the wireframe when paneer is not sold", () => {
    const insight = plateInsight(day.filter((c) => c.name !== "Paneer momos"));
    expect(insight?.better).toEqual({ name: "Cheese momos", extraPerPlate: r(12), quantity: 12 });
  });

  it("has nothing to say without plates", () => {
    expect(plateInsight([])).toBeNull();
    expect(plateInsight([{ ...day[0], quantity: 0 }])).toBeNull();
  });

  it("skips the second line when the best earner also has the best margin", () => {
    expect(plateInsight([day[3]])?.better).toBeNull();
  });
});

describe("plateMarginTotal", () => {
  it("adds up margin from all plates", () => {
    // 34×36 + 22×40 + 12×48 + 6×50 + 7×24 = 1224 + 880 + 576 + 300 + 168
    expect(plateMarginTotal(day)).toBe(r(3148));
  });
});
