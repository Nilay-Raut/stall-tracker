import { describe, expect, it } from "vitest";
import { rupeesToPaise as r } from "./money";
import { summaryNotes } from "./summaryNotes";

describe("summaryNotes", () => {
  it("matches the wireframe's Things to know", () => {
    const notes = summaryNotes({
      cashDifference: r(50),
      cashOut: r(500),
      waste: r(140),
      cashLeft: r(2275),
      sales: r(5630),
      lastWeek: { date: "2026-11-06", sales: r(5720) }, // a Friday
    });
    expect(notes).toEqual([
      { label: "Cash check: more in drawer than recorded", value: "+ ₹50" },
      { label: "Cash taken out by owner", value: "₹500" },
      { label: "Food wasted", value: "₹140" },
      { label: "Cash left for tomorrow", value: "₹2,275" },
      { label: "Last Friday sales were ₹5,720", value: "₹90 less" },
    ]);
  });

  it("leaves out what does not apply", () => {
    const notes = summaryNotes({
      cashDifference: null, // Totals only: no cash sales were entered
      cashOut: 0,
      waste: null,
      cashLeft: r(1800),
      sales: r(4000),
      lastWeek: null,
    });
    expect(notes).toEqual([{ label: "Cash left for tomorrow", value: "₹1,800" }]);
  });

  it("reports a shortfall", () => {
    const [note] = summaryNotes({
      cashDifference: -r(30),
      cashOut: 0,
      waste: null,
      cashLeft: 0,
      sales: 0,
      lastWeek: null,
    });
    expect(note).toEqual({ label: "Cash check: less in drawer than recorded", value: "− ₹30" });
  });
});
