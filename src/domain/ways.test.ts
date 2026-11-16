import { describe, expect, it } from "vitest";
import { formatRupees, rupeesToPaise as r } from "@/lib/money";
import { waysToReach } from "./ways";

// The wireframe's items with their average plates a day.
const items = [
  { name: "Veg steam momos", price: r(60), cost: r(24), platesPerDay: 34 },
  { name: "Fried momos", price: r(70), cost: r(30), platesPerDay: 22 },
  { name: "Cheese momos", price: r(90), cost: r(42), platesPerDay: 12 },
  { name: "Spring roll", price: r(50), cost: r(26), platesPerDay: 7 },
];

describe("waysToReach", () => {
  it("suggests the wireframe's three levers for a ₹415 gap", () => {
    const ways = waysToReach(items, r(415), formatRupees);
    expect(ways).toEqual([
      {
        head: "Sell 9 more cheese momos", // 9 × ₹48 = ₹432 ≥ ₹415
        body: "₹48 profit a plate. This alone covers the gap.",
        gain: r(432),
      },
      {
        head: "Move 10 plates from veg steam momos to cheese momos",
        body: "Cheese momos earns ₹12 more a plate than veg steam momos.",
        gain: r(120),
      },
      {
        head: "Raise veg steam momos by ₹5",
        body: "At 34 plates a day, if sales stay the same.",
        gain: r(170),
      },
    ]);
  });

  it("still offers ideas when on track", () => {
    const ways = waysToReach(items, null, formatRupees);
    expect(ways[0]).toMatchObject({ head: "Sell 10 more cheese momos", gain: r(480) });
  });

  it("needs counted items", () => {
    expect(waysToReach([], r(415), formatRupees)).toEqual([]);
    expect(waysToReach([{ ...items[0], platesPerDay: 0 }], r(415), formatRupees)).toEqual([]);
  });

  it("skips moving plates when the best seller already has the best margin", () => {
    const ways = waysToReach([items[2]], r(100), formatRupees);
    expect(ways.map((w) => w.head)).toEqual([
      "Sell 3 more cheese momos",
      "Raise cheese momos by ₹5",
    ]);
  });
});
