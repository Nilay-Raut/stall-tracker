import { describe, expect, it } from "vitest";
import { type ReminderCheck, isReminderDue } from "./reminder";

const base: ReminderCheck = {
  reminderEnabled: true,
  closingTime: "22:00",
  now: "22:03",
  today: "2026-11-16",
  lastReminderDate: "2026-11-15",
  todayStatus: "open",
};

describe("isReminderDue", () => {
  it("is due at closing time on an open day", () => {
    expect(isReminderDue(base)).toBe(true);
    expect(isReminderDue({ ...base, todayStatus: "none" })).toBe(true); // nothing entered yet
  });

  it("waits until closing time", () => {
    expect(isReminderDue({ ...base, now: "21:59" })).toBe(false);
  });

  it("sends only one a day", () => {
    expect(isReminderDue({ ...base, lastReminderDate: "2026-11-16" })).toBe(false);
  });

  it("is not sent when the day is closed or the shop was closed", () => {
    expect(isReminderDue({ ...base, todayStatus: "closed" })).toBe(false);
    expect(isReminderDue({ ...base, todayStatus: "off" })).toBe(false);
  });

  it("is not sent when switched off", () => {
    expect(isReminderDue({ ...base, reminderEnabled: false })).toBe(false);
  });
});
