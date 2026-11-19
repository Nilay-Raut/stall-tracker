import type { BusinessDate } from "@/lib/dates";

/** Minutes after closing time for the "still not closed" follow-up. */
export const FOLLOW_UP_MINUTES = 60;

export type ReminderCheck = {
  reminderEnabled: boolean;
  /** "22:00" */
  closingTime: string;
  /** India time now, "HH:MM". */
  now: string;
  today: BusinessDate;
  /** The day the closing-time reminder last went out, if any. */
  lastReminderDate: BusinessDate | null;
  /** India time ("HH:MM") it went out that day; the follow-up waits an hour after it. */
  lastReminderTime?: string | null;
  /** The day the follow-up last went out, if any. */
  lastFollowUpDate?: BusinessDate | null;
  /** Today's status: closed (counted) or off (shop closed) need no reminder. */
  todayStatus: "open" | "closed" | "off" | "none";
};

export type ReminderKind = "closing" | "follow-up";

/** "22:00" + 60 = "23:00"; null when that is past midnight (a new business day). */
export function addMinutes(time: string, minutes: number): string | null {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  if (total >= 24 * 60) return null;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Rule 17: at closing time, if today is not closed and not marked "shop closed",
 * send one reminder. If the day is still open an hour later, send one follow-up.
 * At most one of each a day. The first can go out until the end of the day, so a
 * phone that was off at closing time still gets it later.
 */
export function dueReminder(check: ReminderCheck): ReminderKind | null {
  if (!check.reminderEnabled) return null;
  if (check.todayStatus === "closed" || check.todayStatus === "off") return null;
  if (check.now < check.closingTime) return null;
  if (check.lastReminderDate !== check.today) return "closing";
  if (check.lastFollowUpDate === check.today) return null;
  // An hour after closing time, and never sooner than an hour after the first
  // reminder (which goes out late if reminders were switched on after closing time).
  const afterClosing = addMinutes(check.closingTime, FOLLOW_UP_MINUTES);
  const afterFirst = check.lastReminderTime
    ? addMinutes(check.lastReminderTime, FOLLOW_UP_MINUTES)
    : afterClosing;
  if (!afterClosing || !afterFirst) return null; // would fall after midnight
  const followUpAt = afterFirst > afterClosing ? afterFirst : afterClosing;
  return check.now >= followUpAt ? "follow-up" : null;
}

/** Whether any reminder is due now. */
export const isReminderDue = (check: ReminderCheck): boolean => dueReminder(check) !== null;
