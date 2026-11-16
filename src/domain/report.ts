import { type Translate, english, msg } from "@/i18n/translate";
import type { BusinessDate } from "@/lib/dates";
import { CATEGORY_LABELS } from "@/lib/labels";
import { unitName } from "./materials";
import type { Paise } from "@/lib/money";
import type { ExpenseCategory } from "./entry";

/** One day of the report range (every date up to today is present). */
export type ReportDay = {
  date: BusinessDate;
  /** "none": nothing recorded that day (not marked closed either). */
  status: "open" | "closed" | "off" | "none";
  sales: Paise;
  cashSales: Paise;
  upiSales: Paise;
  expenses: Paise;
  /** Rule 5: every day carries its share of fixed costs, closed days too. */
  fixedCost: Paise;
};

export type CategoryTotal = { category: ExpenseCategory; amount: Paise };
export type ItemTotal = { name: string; plates: number; margin: Paise };
export type MaterialRise = {
  name: string;
  unit: string;
  from: Paise;
  to: Paise;
  /** Month name the old rate is from, e.g. "October". */
  since: string;
};

export type PeriodKind = "week" | "month" | "custom";

export type ReportInput = {
  kind: PeriodKind;
  days: ReportDay[];
  categories: CategoryTotal[];
  items: ItemTotal[];
  previous: { sales: Paise; categories: CategoryTotal[] } | null;
  materialRise: MaterialRise | null;
};

export type Insight = { head: string; body: string };

export type Report = {
  sales: Paise;
  expenses: Paise;
  fixedCost: Paise;
  profit: Paise;
  cashSales: Paise;
  upiSales: Paise;
  /** Cash share of sales, 0–100. */
  cashShare: number;
  bars: Array<{ date: BusinessDate; sales: Paise; off: boolean }>;
  offDates: BusinessDate[];
  /** Spending by category, biggest first. Shares are % of sales. */
  spend: Array<{
    category: ExpenseCategory;
    amount: Paise;
    share: number;
    previousShare: number | null;
  }>;
  /** Average sales per weekday (0 = Sunday) over open days, null if no such day. */
  weekdays: Array<{ weekday: number; average: Paise | null }>;
  items: Array<ItemTotal & { perPlate: Paise }>;
  insights: Insight[];
};

/** In English; show through t(). */
export const WEEKDAY_NAMES = [
  msg("Sunday"),
  msg("Monday"),
  msg("Tuesday"),
  msg("Wednesday"),
  msg("Thursday"),
  msg("Friday"),
  msg("Saturday"),
] as const;

/** Insight about a growing spending category, per kind of period. */
const SHARE_NOTES: Record<PeriodKind, string> = {
  week: msg("{name} is {share}% of sales this week. It was {previous}% the week before."),
  month: msg("{name} is {share}% of sales this month. It was {previous}% last month."),
  custom: msg(
    "{name} is {share}% of sales in this period. It was {previous}% in the period before.",
  ),
};

const weekdayOf = (date: BusinessDate) => new Date(`${date}T00:00:00Z`).getUTCDay();
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const share = (part: Paise, whole: Paise) => (whole > 0 ? (part / whole) * 100 : 0);
const oneDecimal = (n: number) => Math.round(n * 10) / 10;

/** Builds every number on the Reports screen from the period's days and totals. */
export function buildReport(
  input: ReportInput,
  format: (p: Paise) => string,
  t: Translate = english,
): Report {
  const { days } = input;
  const sales = sum(days.map((d) => d.sales));
  const expenses = sum(days.map((d) => d.expenses));
  const fixedCost = sum(days.map((d) => d.fixedCost));
  const cashSales = sum(days.map((d) => d.cashSales));
  const upiSales = sum(days.map((d) => d.upiSales));

  // Rule 8: averages leave out closed-shop days (and days with nothing recorded).
  const openDays = days.filter((d) => d.status !== "off" && d.status !== "none" && d.sales > 0);
  const weekdays = WEEKDAY_NAMES.map((_, weekday) => {
    const same = openDays.filter((d) => weekdayOf(d.date) === weekday);
    return {
      weekday,
      average: same.length ? Math.round(sum(same.map((d) => d.sales)) / same.length) : null,
    };
  });

  const previousShare = (category: ExpenseCategory) => {
    if (!input.previous || input.previous.sales === 0) return null;
    const before = input.previous.categories.find((c) => c.category === category)?.amount ?? 0;
    return oneDecimal(share(before, input.previous.sales));
  };
  const spend = [...input.categories]
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map((c) => ({
      ...c,
      share: oneDecimal(share(c.amount, sales)),
      previousShare: previousShare(c.category),
    }));

  const items = [...input.items]
    .filter((i) => i.plates > 0)
    .sort((a, b) => b.margin - a.margin)
    .map((i) => ({ ...i, perPlate: Math.round(i.margin / i.plates) }));

  return {
    sales,
    expenses,
    fixedCost,
    profit: sales - expenses - fixedCost,
    cashSales,
    upiSales,
    cashShare: Math.round(share(cashSales, cashSales + upiSales)),
    bars: days.map((d) => ({ date: d.date, sales: d.sales, off: d.status === "off" })),
    offDates: days.filter((d) => d.status === "off").map((d) => d.date),
    spend,
    weekdays,
    items,
    insights: insights(input.kind, weekdays, spend, input.materialRise, format, t),
  };
}

/** Rule-based notes for "What the numbers say" (rule 18). At most one of each kind. */
function insights(
  kind: PeriodKind,
  weekdays: Report["weekdays"],
  spend: Report["spend"],
  rise: MaterialRise | null,
  format: (p: Paise) => string,
  t: Translate,
): Insight[] {
  const notes: Insight[] = [];

  // 1. Best against worst weekday.
  const known = weekdays.filter((w) => w.average !== null) as Array<{
    weekday: number;
    average: Paise;
  }>;
  if (known.length >= 2) {
    const best = known.reduce((a, b) => (b.average > a.average ? b : a));
    const worst = known.reduce((a, b) => (b.average < a.average ? b : a));
    const ratio = best.average / worst.average;
    if (ratio >= 1.2) {
      const bestName = t(WEEKDAY_NAMES[best.weekday]);
      const worstName = t(WEEKDAY_NAMES[worst.weekday]);
      notes.push({
        head:
          ratio >= 1.8
            ? t("{best} earns about double {worst}.", { best: bestName, worst: worstName })
            : t("{best} earns {percent}% more than {worst}.", {
                best: bestName,
                percent: Math.round((ratio - 1) * 100),
                worst: worstName,
              }),
        body: t(
          "{best} averages {bestAmount} and {worst} {worstAmount}. Prepare less on {worst} to cut waste.",
          {
            best: bestName,
            bestAmount: format(best.average),
            worst: worstName,
            worstAmount: format(worst.average),
          },
        ),
      });
    }
  }

  // 2. The spending category whose share of sales grew the most.
  const grown = spend
    .filter((s) => s.previousShare !== null && s.share - s.previousShare >= 0.5)
    .sort((a, b) => b.share - b.previousShare! - (a.share - a.previousShare!))[0];
  if (grown) {
    const name = t(CATEGORY_LABELS[grown.category]);
    notes.push({
      head: t("{name} is taking a bigger share.", { name }),
      body: t(SHARE_NOTES[kind], { name, share: grown.share, previous: grown.previousShare! }),
    });
  }

  // 3. A material that got dearer.
  if (rise && rise.to > rise.from) {
    notes.push({
      head: t("{name} costs more.", { name: rise.name }),
      body: t("{name} went from {from} to {to} a {unit} since {month}.", {
        name: rise.name,
        from: format(rise.from),
        to: format(rise.to),
        unit: unitName(rise.unit, t),
        month: rise.since,
      }),
    });
  }
  return notes;
}
