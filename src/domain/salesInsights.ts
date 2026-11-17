import { type Translate, english, msg } from "@/i18n/translate";
import type { BusinessDate } from "@/lib/dates";
import type { Paise } from "@/lib/money";
import { WEEKDAY_NAMES } from "./report";

/*
 * Item and bill reports (docs/PLAN-v2.md, Phase 4). Pure functions, fed by
 * src/server/itemSales.ts. Rule 19: item figures come from bill lines; plate
 * counts are used only for days with no bills, so nothing is counted twice.
 */

/** One item on one day. `costedRevenue` and `cost` cover only the plates with a known cost. */
export type ItemDay = {
  date: BusinessDate;
  /** Lower-case name: "chai". Saved and custom items of the same name are one item. */
  key: string;
  name: string;
  quantity: number;
  revenue: Paise;
  costedRevenue: Paise;
  cost: Paise;
};

export type BillRecord = {
  date: BusinessDate;
  amount: Paise;
  items: Array<{ key: string; name: string; quantity: number }>;
};

/** Sales in one hour of one day (India time). */
export type SaleHour = { date: BusinessDate; hour: number; amount: Paise };

export type ItemStat = {
  key: string;
  name: string;
  quantity: number;
  revenue: Paise;
  /** Null when no plate of it has a known cost (custom items). */
  profit: Paise | null;
  /** Quantity on each date of the period, in order (for the sparkline). */
  daily: number[];
  /** Quantity change against the period before, in %, or null without a base. */
  change: number | null;
};

const weekdayOf = (date: BusinessDate) => new Date(`${date}T00:00:00Z`).getUTCDay();
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** Per-item totals for a period, best sellers (by sales) first. */
export function itemStats(
  rows: ReadonlyArray<ItemDay>,
  dates: ReadonlyArray<BusinessDate>,
  previous: ReadonlyArray<ItemDay> = [],
): ItemStat[] {
  const index = new Map(dates.map((d, i) => [d, i]));
  const before = new Map<string, number>();
  for (const row of previous) before.set(row.key, (before.get(row.key) ?? 0) + row.quantity);

  const byKey = new Map<string, ItemStat & { costed: Paise; cost: Paise; lastDate: string }>();
  for (const row of rows) {
    let stat = byKey.get(row.key);
    if (!stat) {
      stat = {
        key: row.key,
        name: row.name,
        quantity: 0,
        revenue: 0,
        profit: null,
        daily: dates.map(() => 0),
        change: null,
        costed: 0,
        cost: 0,
        lastDate: row.date,
      };
      byKey.set(row.key, stat);
    }
    stat.quantity += row.quantity;
    stat.revenue += row.revenue;
    stat.costed += row.costedRevenue;
    stat.cost += row.cost;
    if (row.date >= stat.lastDate) {
      stat.lastDate = row.date;
      stat.name = row.name; // the latest spelling
    }
    const i = index.get(row.date);
    if (i !== undefined) stat.daily[i] += row.quantity;
  }

  return [...byKey.values()]
    .map(({ costed, cost, key, name, quantity, revenue, daily }) => {
      const base = before.get(key) ?? 0;
      return {
        key,
        name,
        quantity,
        revenue,
        daily,
        profit: costed > 0 || cost > 0 ? costed - cost : null,
        change: base >= 3 ? Math.round(((quantity - base) / base) * 100) : null,
      };
    })
    .sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity);
}

export type BillSummary = { count: number; average: Paise; itemsPerBill: number };

export function billSummary(bills: ReadonlyArray<BillRecord>): BillSummary {
  const count = bills.length;
  if (count === 0) return { count, average: 0, itemsPerBill: 0 };
  const things = sum(bills.map((b) => sum(b.items.map((i) => i.quantity))));
  return {
    count,
    // Whole rupees: paise on an average would be false precision.
    average: Math.round(sum(bills.map((b) => b.amount)) / count / 100) * 100,
    itemsPerBill: Math.round((things / count) * 10) / 10,
  };
}

export type Pair = { a: string; b: string; bills: number };

/** Items most often on the same bill (each pair counted once per bill). */
export function boughtTogether(bills: ReadonlyArray<BillRecord>, top = 3, atLeast = 2): Pair[] {
  const counts = new Map<string, Pair>();
  for (const bill of bills) {
    const names = new Map(bill.items.map((i) => [i.key, i.name]));
    const keys = [...names.keys()].sort();
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const id = `${keys[i]}\u0000${keys[j]}`;
        const pair = counts.get(id) ?? { a: names.get(keys[i])!, b: names.get(keys[j])!, bills: 0 };
        pair.bills += 1;
        counts.set(id, pair);
      }
    }
  }
  return [...counts.values()]
    .filter((p) => p.bills >= atLeast)
    .sort((x, y) => y.bills - x.bills || x.a.localeCompare(y.a))
    .slice(0, top);
}

export type PeakHours = {
  /** Sales per weekday (0 = Sunday) and hour (0–23). */
  grid: Paise[][];
  max: Paise;
  /** First and last hour with any sales, to trim empty hours off the chart. */
  firstHour: number;
  lastHour: number;
  /** The busiest two hours of the week, or null with too little data. */
  busiest: { weekday: number; hour: number; share: number } | null;
};

export function peakHours(hours: ReadonlyArray<SaleHour>): PeakHours {
  const grid = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  for (const h of hours) grid[weekdayOf(h.date)][h.hour] += h.amount;
  const used = hours.filter((h) => h.amount > 0).map((h) => h.hour);
  const max = Math.max(0, ...grid.flat());

  let busiest: PeakHours["busiest"] = null;
  if (used.length >= 3) {
    let best = { weekday: 0, hour: 0, total: -1 };
    for (let weekday = 0; weekday < 7; weekday++) {
      for (let hour = 0; hour < 23; hour++) {
        const total = grid[weekday][hour] + grid[weekday][hour + 1];
        // On a tie, the window that starts with the busier hour ("7–9 pm", not "6–8 pm").
        const tieWins = total === best.total && grid[weekday][hour] > grid[best.weekday][best.hour];
        if (total > best.total || tieWins) best = { weekday, hour, total };
      }
    }
    const dayTotal = sum(grid[best.weekday]);
    busiest = {
      weekday: best.weekday,
      hour: best.hour,
      share: dayTotal > 0 ? Math.round((best.total / dayTotal) * 100) : 0,
    };
  }
  // Show at least an 8-hour window, so one busy hour is not one giant square.
  let firstHour = used.length ? Math.min(...used) : 0;
  let lastHour = used.length ? Math.max(...used) : 0;
  while (lastHour - firstHour < 7) {
    if (firstHour > 0) firstHour -= 1;
    if (lastHour - firstHour < 7 && lastHour < 23) lastHour += 1;
  }
  return { grid, max, firstHour, lastHour, busiest };
}

/** "7–9 pm", "11 am–1 pm" for a two-hour window starting at `hour`. */
export function hourWindow(hour: number): string {
  const label = (h: number) => `${((h + 11) % 12) + 1}`;
  const half = (h: number) => (h % 24 < 12 ? "am" : "pm");
  const end = hour + 2;
  return half(hour) === half(end)
    ? `${label(hour)}–${label(end)} ${half(end)}`
    : `${label(hour)} ${half(hour)}–${label(end)} ${half(end)}`;
}

export type MixRow = {
  key: string;
  name: string;
  salesShare: number;
  profitShare: number;
  /** Sells a lot but earns comparatively little. */
  lowEarner: boolean;
};

/** Each costed item's share of sales against its share of profit (whole %). */
export function marginMix(stats: ReadonlyArray<ItemStat>): MixRow[] {
  const costed = stats.filter((s) => s.profit !== null && s.profit > 0);
  const sales = sum(costed.map((s) => s.revenue));
  const profit = sum(costed.map((s) => s.profit!));
  if (costed.length < 2 || sales === 0 || profit === 0) return [];
  return costed.map((s) => {
    const salesShare = Math.round((s.revenue / sales) * 100);
    const profitShare = Math.round((s.profit! / profit) * 100);
    return {
      key: s.key,
      name: s.name,
      salesShare,
      profitShare,
      lowEarner: salesShare >= 10 && salesShare - profitShare >= 10,
    };
  });
}

export type SlowItem = { key: string; name: string; days: number | null };

/**
 * Saved items not sold for `quiet` days or more (null days = not in the whole
 * look-back). Longest quiet first.
 */
export function slowMovers(
  catalog: ReadonlyArray<{ key: string; name: string; since: BusinessDate }>,
  lastSold: ReadonlyMap<string, BusinessDate>,
  today: BusinessDate,
  quiet = 7,
): SlowItem[] {
  const daysBetween = (a: BusinessDate, b: BusinessDate) =>
    Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
  return catalog
    .map((item) => {
      const last = lastSold.get(item.key);
      return { ...item, days: last ? daysBetween(last, today) : null };
    })
    .filter((item) =>
      item.days === null ? daysBetween(item.since, today) >= quiet : item.days >= quiet,
    )
    .sort((a, b) => (b.days ?? Infinity) - (a.days ?? Infinity))
    .map(({ key, name, days }) => ({ key, name, days }));
}

// ---------- What to do ----------

export type Action = { kind: string; head: string; body: string };

export type ActionInput = {
  /** The last four weeks, ending today. */
  dates: BusinessDate[];
  rows: ItemDay[];
  /** Dates in `dates` the shop had any sales. */
  openDates: BusinessDate[];
  recentBills: BillRecord[];
  earlierBills: BillRecord[];
  hours: SaleHour[];
  slow: SlowItem[];
};

/**
 * Up to four rule-based suggestions (rule 18: fixed rules, not AI), most useful
 * first. Each needs enough data to be fair; otherwise it is left out.
 */
export function whatToDo(
  input: ActionInput,
  format: (p: Paise) => string,
  t: Translate = english,
  limit = 4,
): Action[] {
  const actions: Action[] = [];
  const stats = itemStats(input.rows, input.dates);
  const open = new Set(input.openDates);

  // 1. The best seller's busiest weekday: prepare more then.
  const top = [...stats].sort((a, b) => b.quantity - a.quantity)[0];
  if (top && open.size >= 14) {
    const perWeekday = WEEKDAY_NAMES.map((_, weekday) => {
      const days = input.dates.filter((d) => open.has(d) && weekdayOf(d) === weekday);
      const qty = days.map((d) => top.daily[input.dates.indexOf(d)]);
      return days.length >= 2 ? sum(qty) / days.length : null;
    });
    const openDays = input.dates.filter((d) => open.has(d));
    const average = sum(openDays.map((d) => top.daily[input.dates.indexOf(d)])) / openDays.length;
    const known = perWeekday
      .map((avg, weekday) => ({ avg, weekday }))
      .filter((w): w is { avg: number; weekday: number } => w.avg !== null);
    const best = known.sort((a, b) => b.avg - a.avg)[0];
    if (best && average > 0 && best.avg >= average * 1.3 && best.avg - average >= 3) {
      const extra = Math.round(best.avg - average);
      const day = t(WEEKDAY_NAMES[best.weekday]);
      actions.push({
        kind: "weekday",
        head: t("Make about {n} more {item} on {day}.", { n: extra, item: top.name, day }),
        body: t("{item} sells about {n} more on {day}s than on an average day.", {
          item: top.name,
          n: extra,
          day,
        }),
      });
    }
  }

  // 2. A popular item that keeps little of its price: a small price rise.
  const thin = stats
    .filter((s) => s.profit !== null && s.quantity >= 20 && s.revenue > 0)
    .map((s) => ({ ...s, keep: s.profit! / s.revenue, price: s.revenue / s.quantity }))
    .filter((s) => s.keep < 0.4)
    .sort((a, b) => b.quantity - a.quantity)[0];
  if (thin) {
    const raise = Math.max(100, Math.round((thin.price * 0.05) / 100) * 100); // ≥ ₹1, whole rupees
    // An estimate: rounded to ₹10.
    const monthly = Math.round((((raise * thin.quantity) / input.dates.length) * 30) / 1000) * 1000;
    actions.push({
      kind: "price",
      head: t("Raise {item} by {amount}?", { item: thin.name, amount: format(raise) }),
      body: t(
        "You keep {percent}% of its price. {amount} more on each adds about {gain} a month at today's sales.",
        { percent: Math.round(thin.keep * 100), amount: format(raise), gain: format(monthly) },
      ),
    });
  }

  // 3. A saved item that has stopped selling.
  const stale = input.slow.find((s) => s.days !== null);
  if (stale) {
    actions.push({
      kind: "slow",
      head: t("{item} has not sold in {n} days.", { item: stale.name, n: stale.days! }),
      body: t("Promote it, or take it off the menu to cut waste."),
    });
  }

  // 4. Smaller bills than before.
  const now = billSummary(input.recentBills);
  const then = billSummary(input.earlierBills);
  if (now.count >= 10 && then.count >= 10 && now.average <= then.average * 0.9) {
    actions.push({
      kind: "bill",
      head: t("Average bill fell to {now}.", { now: format(now.average) }),
      body: t("It was {before}. Suggest a drink or an add-on with each order.", {
        before: format(then.average),
      }),
    });
  }

  // 5. Two items often bought together: a combo.
  const pair = boughtTogether([...input.recentBills, ...input.earlierBills], 1, 3)[0];
  if (pair) {
    actions.push({
      kind: "pair",
      head: t("{a} and {b} sell together.", { a: pair.a, b: pair.b }),
      body: t("They were on the same bill {n} times. A combo price could sell more of both.", {
        n: pair.bills,
      }),
    });
  }

  // 6. The busiest two hours.
  const peak = peakHours(input.hours).busiest;
  if (peak && peak.share >= 30) {
    const day = t(WEEKDAY_NAMES[peak.weekday]);
    actions.push({
      kind: "peak",
      head: t("Busiest: {day}, {time}.", { day, time: hourWindow(peak.hour) }),
      body: t(
        "{percent}% of that day's sales come in these two hours. Keep stock and change ready.",
        {
          percent: peak.share,
        },
      ),
    });
  }

  return actions.slice(0, limit);
}

/** Text for an item's change against before: "▲ 12%", "▼ 30%", or null. */
export const changeLabel = (change: number | null) =>
  change === null || change === 0 ? null : `${change > 0 ? "▲" : "▼"} ${Math.abs(change)}%`;

/** For the "Top items" tabs (shown through t()). */
export const ITEM_SORTS = [
  { key: "revenue", label: msg("Sales") },
  { key: "quantity", label: msg("Sold") },
  { key: "profit", label: msg("Profit") },
] as const;
