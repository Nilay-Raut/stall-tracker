import { describe, expect, it } from "vitest";
import {
  businessDate,
  businessTime,
  daysInMonth,
  formatDayLabel,
  formatTime,
  shiftDate,
} from "./dates";

describe("businessDate", () => {
  it("uses India time, not UTC", () => {
    // 13 Nov 2026, 11:30 pm IST is still 13 Nov, though UTC is 18:00 the same day.
    expect(businessDate(new Date("2026-11-13T18:00:00Z"))).toBe("2026-11-13");
    // 12:30 am IST on 14 Nov is 19:00 UTC on 13 Nov.
    expect(businessDate(new Date("2026-11-13T19:00:00Z"))).toBe("2026-11-14");
  });
});

describe("formatDayLabel", () => {
  it("matches the wireframe header", () => {
    expect(formatDayLabel("2026-11-13")).toBe("Fri, 13 Nov");
  });
});

describe("daysInMonth", () => {
  it("handles month lengths and leap years", () => {
    expect(daysInMonth("2026-11-13")).toBe(30);
    expect(daysInMonth("2026-12-01")).toBe(31);
    expect(daysInMonth("2028-02-10")).toBe(29);
    expect(daysInMonth("2026-02-10")).toBe(28);
  });
});

describe("formatTime", () => {
  it("shows India time in the wireframe's style", () => {
    expect(formatTime("2026-11-13T15:55:00Z")).toBe("9:25 pm");
    expect(formatTime("2026-11-13T03:30:00Z")).toBe("9:00 am");
  });
});

describe("shiftDate", () => {
  it("crosses months and years", () => {
    expect(shiftDate("2026-11-01", -1)).toBe("2026-10-31");
    expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftDate("2026-11-16", -7)).toBe("2026-11-09");
  });
});

describe("businessTime", () => {
  it("is India time in 24 hours", () => {
    expect(businessTime(new Date("2026-11-13T16:45:00Z"))).toBe("22:15");
    expect(businessTime(new Date("2026-11-13T18:35:00Z"))).toBe("00:05");
  });
});

describe("dates in Hindi and Marathi", () => {
  it("uses the language's names with Western digits", () => {
    expect(formatDayLabel("2026-11-13", "hi")).toBe("शुक्र, 13 नव॰");
    expect(formatDayLabel("2026-11-13", "mr")).toMatch(/^शुक्र, 13 /);
    expect(formatTime("2026-11-13T15:55:00Z", "mr")).toMatch(/^9:25/);
  });
});
