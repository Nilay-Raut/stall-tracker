import { describe, expect, it } from "vitest";
import { datesBetween, dayCount, resolveRange } from "./ranges";

const today = "2026-11-13";

describe("resolveRange", () => {
  it("month: this month so far, compared with all of last month", () => {
    expect(resolveRange("month", today)).toEqual({
      kind: "month",
      from: "2026-11-01",
      to: "2026-11-13",
      previousFrom: "2026-10-01",
      previousTo: "2026-10-31",
    });
  });

  it("week: the last 7 days and the 7 before", () => {
    expect(resolveRange("week", today)).toMatchObject({
      from: "2026-11-07",
      to: "2026-11-13",
      previousFrom: "2026-10-31",
      previousTo: "2026-11-06",
    });
  });

  it("custom: stays within today and a year", () => {
    expect(resolveRange("custom", today, "2026-11-01", "2026-12-31")).toMatchObject({
      from: "2026-11-01",
      to: "2026-11-13",
      previousFrom: "2026-10-19",
      previousTo: "2026-10-31",
    });
    expect(
      dayCount(
        ...(Object.values(resolveRange("custom", today, "2020-01-01", today)).slice(1, 3) as [
          string,
          string,
        ]),
      ),
    ).toBe(366);
  });

  it("falls back to the month for anything unknown", () => {
    expect(resolveRange("nonsense", today).kind).toBe("month");
    expect(resolveRange("custom", today, "bad", today).kind).toBe("month");
  });
});

describe("datesBetween", () => {
  it("lists every day, ends included", () => {
    expect(datesBetween("2026-10-30", "2026-11-02")).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
  });
});
