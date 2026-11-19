import { describe, expect, it } from "vitest";
import { rankNoteHints } from "./expenseNotes";

describe("rankNoteHints", () => {
  it("puts the most used note first and keeps its newest amount", () => {
    const hints = rankNoteHints([
      { note: "Ice", amount: 6000 },
      { note: "Repairs", amount: 30000 },
      { note: "ice ", amount: 5000 },
    ]);
    expect(hints).toEqual([
      { note: "Ice", lastAmount: 6000 },
      { note: "Repairs", lastAmount: 30000 },
    ]);
  });

  it("breaks ties by the most recent use", () => {
    const hints = rankNoteHints([
      { note: "Water", amount: 2000 },
      { note: "Ice", amount: 5000 },
    ]);
    expect(hints.map((h) => h.note)).toEqual(["Water", "Ice"]);
  });

  it("skips blank notes and stops at the limit", () => {
    const uses = ["A", "B", "C", " "].map((note) => ({ note, amount: 100 }));
    expect(rankNoteHints(uses, 2).map((h) => h.note)).toEqual(["A", "B"]);
  });
});
