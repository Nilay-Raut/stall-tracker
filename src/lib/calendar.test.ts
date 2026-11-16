import { describe, expect, it } from "vitest";
import { formatMonth, isMonth, monthGrid, shiftMonth } from "./calendar";

describe("monthGrid", () => {
  it("starts November 2026 on a Sunday, like the wireframe", () => {
    const cells = monthGrid("2026-11");
    expect(cells[0]).toBe("2026-11-01"); // 1 Nov 2026 is a Sunday
    expect(cells.filter(Boolean)).toHaveLength(30);
    expect(cells).toHaveLength(35); // 5 full weeks
    expect(cells.at(-1)).toBeNull();
  });

  it("leaves blanks before the 1st", () => {
    const cells = monthGrid("2026-12"); // 1 Dec 2026 is a Tuesday
    expect(cells.slice(0, 3)).toEqual([null, null, "2026-12-01"]);
    expect(cells.length % 7).toBe(0);
  });
});

describe("months", () => {
  it("moves across years", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });

  it("checks and names months", () => {
    expect(isMonth("2026-11")).toBe(true);
    expect(isMonth("2026-13")).toBe(false);
    expect(isMonth("2026-1")).toBe(false);
    expect(formatMonth("2026-11")).toBe("November 2026");
  });
});
