import { type BusinessDate, LOCALES, type Lang, daysInMonth } from "./dates";

/** A month as "YYYY-MM". */
export type Month = string;

export const isMonth = (value: unknown): value is Month =>
  typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

export function monthOf(date: BusinessDate): Month {
  return date.slice(0, 7);
}

/** The month before or after, e.g. shiftMonth("2026-01", -1) = "2025-12". */
export function shiftMonth(month: Month, by: number): Month {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(year, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

const monthFormats = new Map<Lang, Intl.DateTimeFormat>();

/** "November 2026" ("नवंबर 2026" in Hindi). */
export function formatMonth(month: Month, lang: Lang = "en"): string {
  let format = monthFormats.get(lang);
  if (!format) {
    format = new Intl.DateTimeFormat(LOCALES[lang], {
      timeZone: "UTC",
      month: "long",
      year: "numeric",
    });
    monthFormats.set(lang, format);
  }
  return format.format(new Date(`${month}-01T00:00:00Z`));
}

/** "November" ("नवंबर" in Hindi). */
export function formatMonthName(month: Month, lang: Lang = "en"): string {
  return formatMonth(month, lang).replace(/\s*\d+$/, "");
}

/**
 * The cells of a month grid, weeks starting on Sunday as in the wireframe:
 * null for the blank cells before the 1st and after the last day.
 */
export function monthGrid(month: Month): Array<BusinessDate | null> {
  const first = new Date(`${month}-01T00:00:00Z`).getUTCDay(); // 0 = Sunday
  const count = daysInMonth(`${month}-01`);
  const cells: Array<BusinessDate | null> = Array.from({ length: first }, () => null);
  for (let day = 1; day <= count; day++) {
    cells.push(`${month}-${String(day).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
