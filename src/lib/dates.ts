/**
 * Business dates are plain "YYYY-MM-DD" strings in India time (Asia/Kolkata),
 * whatever time zone the server or phone is set to. A sale at 11:30 pm IST
 * belongs to that day, not the next one.
 */
export type BusinessDate = string;

const TIME_ZONE = "Asia/Kolkata";

const isoDateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Display language of the app. */
export type Lang = "en" | "hi" | "mr";

/** Intl locale per language. Western digits everywhere, to match the money figures. */
export const LOCALES: Record<Lang, string> = {
  en: "en-IN",
  hi: "hi-IN-u-nu-latn",
  mr: "mr-IN-u-nu-latn",
};

/** Formatters are costly to create, so each one is made once per language and reused. */
function cached(make: (locale: string) => Intl.DateTimeFormat) {
  const made = new Map<Lang, Intl.DateTimeFormat>();
  return (lang: Lang) => {
    let format = made.get(lang);
    if (!format) {
      format = make(LOCALES[lang]);
      made.set(lang, format);
    }
    return format;
  };
}

const dayLabelFormat = cached(
  (locale) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: "UTC", // business dates are parsed as UTC midnight below
      weekday: "short",
      day: "numeric",
      month: "short",
    }),
);

/** Today's business date, e.g. "2026-11-13". */
export function businessDate(now: Date = new Date()): BusinessDate {
  return isoDateFormat.format(now); // en-CA gives YYYY-MM-DD
}

function toUtcDate(date: BusinessDate): Date {
  return new Date(`${date}T00:00:00Z`);
}

/** "Fri, 13 Nov", as in the wireframe headers ("शुक्र, 13 नव॰" in Hindi). */
export function formatDayLabel(date: BusinessDate, lang: Lang = "en"): string {
  const parts = dayLabelFormat(lang).formatToParts(toUtcDate(date));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("weekday")}, ${get("day")} ${get("month")}`;
}

/** Number of days in the month of the given date (28 to 31). */
export function daysInMonth(date: BusinessDate): number {
  const [year, month] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

const timeFormat = cached(
  (locale) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: TIME_ZONE,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
);

/** "9:25 pm" in India time, as in the entries list. */
export function formatTime(iso: string, lang: Lang = "en"): string {
  return timeFormat(lang)
    .format(new Date(iso))
    .replace(/\s?(AM|PM)$/i, (m) => ` ${m.trim().toLowerCase()}`);
}

const weekdayFormat = cached(
  (locale) => new Intl.DateTimeFormat(locale, { timeZone: "UTC", weekday: "long" }),
);

/** "Friday" for a business date. */
export function formatWeekday(date: BusinessDate, lang: Lang = "en"): string {
  return weekdayFormat(lang).format(toUtcDate(date));
}

/** Adds (or with a negative count, subtracts) whole days: shiftDate("2026-11-01", -1) = "2026-10-31". */
export function shiftDate(date: BusinessDate, count: number): BusinessDate {
  return new Date(toUtcDate(date).getTime() + count * 86_400_000).toISOString().slice(0, 10);
}

const clockFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** The time of day in India as "HH:MM" (24-hour), comparable with the shop's closing time. */
export function businessTime(now: Date = new Date()): string {
  return clockFormat.format(now);
}
