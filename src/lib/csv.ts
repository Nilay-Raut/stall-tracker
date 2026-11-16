/**
 * CSV for spreadsheets (Excel, Google Sheets). Text that starts with = + - @ or a tab
 * could run as a formula when opened, so it gets a leading apostrophe. Numbers are
 * written as numbers and are left alone.
 */
export type Cell = string | number | null;

function cell(value: Cell): string {
  if (value === null) return "";
  if (typeof value === "number") return String(value);
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

/** Header row plus data rows, with a byte-order mark so Excel reads ₹ and Hindi correctly. */
export function toCsv(header: string[], rows: Cell[][]): string {
  return "﻿" + [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
}

/** Paise as rupees with two decimals, as a number cell: 12550 -> 125.5 */
export const rupeesCell = (paise: number): number => paise / 100;
