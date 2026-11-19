import { describe, expect, it } from "vitest";
import { type ReminderCheck, addMinutes, dueReminder, isReminderDue } from "./reminder";

const base: ReminderCheck = {
  reminderEnabled: true,
  closingTime: "22:00",
  now: "22:03",
  today: "2026-11-16",
  lastReminderDate: "2026-11-15",
  lastFollowUpDate: null,
  todayStatus: "open",
};

describe("dueReminder", () => {
  it("is due at closing time on an open day", () => {
    expect(dueReminder(base)).toBe("closing");
    expect(dueReminder({ ...base, todayStatus: "none" })).toBe("closing"); // nothing entered yet
  });

  it("waits until closing time", () => {
    expect(isReminderDue({ ...base, now: "21:59" })).toBe(false);
  });

  it("sends the closing reminder only once a day", () => {
    expect(dueReminder({ ...base, lastReminderDate: "2026-11-16" })).toBeNull();
  });

  it("follows up an hour later if the day is still open, once", () => {
    const sent = { ...base, lastReminderDate: "2026-11-16" };
    expect(dueReminder({ ...sent, now: "22:59" })).toBeNull();
    expect(dueReminder({ ...sent, now: "23:00" })).toBe("follow-up");
    expect(dueReminder({ ...sent, now: "23:30", lastFollowUpDate: "2026-11-16" })).toBeNull();
    // Yesterday's follow-up does not count for today.
    expect(dueReminder({ ...sent, now: "23:05", lastFollowUpDate: "2026-11-15" })).toBe(
      "follow-up",
    );
  });

  it("waits an hour after a late first reminder", () => {
    const late = { ...base, lastReminderDate: "2026-11-16", lastReminderTime: "23:10" };
    expect(dueReminder({ ...late, now: "23:15" })).toBeNull();
    // 00:10 would be the next day: no follow-up at all.
    const early = { ...base, lastReminderDate: "2026-11-16", lastReminderTime: "22:20" };
    expect(dueReminder({ ...early, now: "23:00" })).toBeNull();
    expect(dueReminder({ ...early, now: "23:20" })).toBe("follow-up");
  });

  it("sends no follow-up when it would fall after midnight", () => {
    const late = { ...base, closingTime: "23:30", lastReminderDate: "2026-11-16" };
    expect(dueReminder({ ...late, now: "23:59" })).toBeNull();
  });

  it("is not sent when the day is closed or the shop was closed", () => {
    expect(isReminderDue({ ...base, todayStatus: "closed" })).toBe(false);
    expect(isReminderDue({ ...base, todayStatus: "off" })).toBe(false);
    const sent = { ...base, lastReminderDate: "2026-11-16", now: "23:10" };
    expect(dueReminder({ ...sent, todayStatus: "closed" })).toBeNull();
  });

  it("is not sent when switched off", () => {
    expect(isReminderDue({ ...base, reminderEnabled: false })).toBe(false);
  });
});

describe("addMinutes", () => {
  it("adds within the day and gives null past midnight", () => {
    expect(addMinutes("22:00", 60)).toBe("23:00");
    expect(addMinutes("09:45", 30)).toBe("10:15");
    expect(addMinutes("23:30", 60)).toBeNull();
  });
});
