import { describe, expect, it } from "vitest";
import { restockHints } from "./restock";

const today = "2026-11-19";
const bought = (material: string, ...dates: string[]) => dates.map((date) => ({ material, date }));

describe("restockHints", () => {
  it("says when a material is bought less often than usual", () => {
    // Every 4 days, last on the 14th: 5 days ago.
    const hints = restockHints(
      bought("Oil", "2026-11-02", "2026-11-06", "2026-11-10", "2026-11-14"),
      today,
    );
    expect(hints).toEqual([{ material: "Oil", everyDays: 4, daysSince: 5 }]);
  });

  it("stays quiet while it is not due yet", () => {
    expect(restockHints(bought("Oil", "2026-11-07", "2026-11-11", "2026-11-15"), today)).toEqual(
      [],
    );
  });

  it("needs three purchase days before trusting a pattern", () => {
    expect(restockHints(bought("Paneer", "2026-11-01", "2026-11-03"), today)).toEqual([]);
    // Two purchases on one day count as one day.
    expect(restockHints(bought("Paneer", "2026-11-01", "2026-11-01", "2026-11-03"), today)).toEqual(
      [],
    );
  });

  it("drops materials not bought for a long time", () => {
    // Every 2 days, last 12 days ago: no longer bought.
    expect(restockHints(bought("Ice", "2026-11-03", "2026-11-05", "2026-11-07"), today)).toEqual(
      [],
    );
  });

  it("joins names that differ only in case and lists the most overdue first", () => {
    const hints = restockHints(
      [
        ...bought("Oil", "2026-11-02", "2026-11-06", "2026-11-10", "2026-11-14"),
        ...bought("milk", "2026-11-13", "2026-11-14"),
        ...bought("Milk", "2026-11-15", "2026-11-16"),
      ],
      today,
    );
    expect(hints.map((h) => h.material)).toEqual(["milk", "Oil"]);
    expect(hints[0]).toMatchObject({ everyDays: 1, daysSince: 3 });
  });
});
