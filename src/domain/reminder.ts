import type { BusinessDate } from "@/lib/dates";

export type ReminderCheck = {
  reminderEnabled: boolean;
  /** "22:00" */
  closingTime: string;
  /** India time now, "HH:MM". */
  now: string;
  today: BusinessDate;
  /** The day the last reminder went out, if any. */
  lastReminderDate: BusinessDate | null;
  /** Today's status: closed (counted) or off (shop closed) need no reminder. */
  todayStatus: "open" | "closed" | "off" | "none";
};

/**
 * Rule 17: at closing time, if today is not closed and not marked "shop closed",
 * send one reminder. At most one a day. A reminder can go out until the end of
 * the day, so a phone that was off at closing time still gets it later.
 */
export function isReminderDue(check: ReminderCheck): boolean {
  return (
    check.reminderEnabled &&
    check.now >= check.closingTime &&
    check.lastReminderDate !== check.today &&
    check.todayStatus !== "closed" &&
    check.todayStatus !== "off"
  );
}
