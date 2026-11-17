import { monthOf, shiftMonth } from "./calendar";
import { type BusinessDate, daysInMonth, shiftDate } from "./dates";

export type RangeKind = "today" | "week" | "month" | "custom";

export type Range = {
  kind: RangeKind;
  from: BusinessDate;
  to: BusinessDate;
  /** The period to compare with (same length before, or last month). */
  previousFrom: BusinessDate;
  previousTo: BusinessDate;
  /**
   * The same number of days just before, for "compared with before". Equal to the
   * previous period, except Month: 1–16 Nov is compared with 1–16 Oct, not all of October.
   */
  compareFrom: BusinessDate;
  compareTo: BusinessDate;
};

const MAX_DAYS = 366;
const isDate = (v: unknown): v is BusinessDate =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Days from `from` to `to`, both included. */
export function dayCount(from: BusinessDate, to: BusinessDate): number {
  return (
    Math.round(
      (new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) /
        86_400_000,
    ) + 1
  );
}

/** Every date from `from` to `to`, both included. */
export function datesBetween(from: BusinessDate, to: BusinessDate): BusinessDate[] {
  return Array.from({ length: Math.max(dayCount(from, to), 0) }, (_, i) => shiftDate(from, i));
}

/**
 * The report period. Today = today, compared with the same weekday last week
 * (a stall's days differ by weekday more than from one day to the next); Week = the last 7 days; Month = this month so far, compared
 * with all of last month; Custom = the chosen dates (never past today, at most a
 * year), compared with the same number of days just before.
 */
export function resolveRange(
  kind: unknown,
  today: BusinessDate,
  customFrom?: unknown,
  customTo?: unknown,
): Range {
  if (kind === "today") {
    const lastWeek = shiftDate(today, -7);
    return {
      kind,
      from: today,
      to: today,
      previousFrom: lastWeek,
      previousTo: lastWeek,
      compareFrom: lastWeek,
      compareTo: lastWeek,
    };
  }
  if (kind === "week") {
    const from = shiftDate(today, -6);
    return {
      kind,
      from,
      to: today,
      previousFrom: shiftDate(from, -7),
      previousTo: shiftDate(from, -1),
      compareFrom: shiftDate(from, -7),
      compareTo: shiftDate(from, -1),
    };
  }
  if (kind === "custom" && isDate(customFrom) && isDate(customTo)) {
    const to = customTo > today ? today : customTo;
    let from = customFrom > to ? to : customFrom;
    if (dayCount(from, to) > MAX_DAYS) from = shiftDate(to, -(MAX_DAYS - 1));
    const length = dayCount(from, to);
    return {
      kind,
      from,
      to,
      previousFrom: shiftDate(from, -length),
      previousTo: shiftDate(from, -1),
      compareFrom: shiftDate(from, -length),
      compareTo: shiftDate(from, -1),
    };
  }
  const month = monthOf(today);
  const last = shiftMonth(month, -1);
  const lastDays = daysInMonth(`${last}-01`);
  const sameDay = Math.min(Number(today.slice(8)), lastDays); // 31 Mar -> 28 Feb
  return {
    kind: "month",
    from: `${month}-01`,
    to: today,
    previousFrom: `${last}-01`,
    previousTo: `${last}-${lastDays}`,
    compareFrom: `${last}-01`,
    compareTo: `${last}-${String(sameDay).padStart(2, "0")}`,
  };
}
