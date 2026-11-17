import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Lightbulb,
  Link2,
  type LucideIcon,
  Percent,
  Repeat,
  Snail,
  TrendingUp,
} from "lucide-react";
import type {
  Action,
  BillSummary,
  MixRow,
  Pair,
  PeakHours,
  SlowItem,
} from "@/domain/salesInsights";
import { hourWindow } from "@/domain/salesInsights";
import { WEEKDAY_NAMES } from "@/domain/report";
import { type Translate, msg } from "@/i18n/translate";
import { cn } from "@/lib/cn";
import { formatRupees } from "@/lib/money";
import { Section } from "./ReportView";

// Item and bill sections of Reports (docs/PLAN-v2.md, Phase 4). Server components.

const WEEKDAY_SHORT = [
  msg("Sun"),
  msg("Mon"),
  msg("Tue"),
  msg("Wed"),
  msg("Thu"),
  msg("Fri"),
  msg("Sat"),
] as const;

/** Bills, average bill and items per bill, each against the period before. */
export function BillKpis({
  now,
  before,
  t,
}: {
  now: BillSummary;
  before: BillSummary | null;
  t: Translate;
}) {
  const change = (a: number, b: number | undefined) => (b ? Math.round(((a - b) / b) * 100) : null);
  const tiles = [
    { label: t("Bills"), value: String(now.count), change: change(now.count, before?.count) },
    {
      label: t("Average bill"),
      value: formatRupees(now.average),
      change: change(now.average, before?.average),
    },
    {
      label: t("Items per bill"),
      value: now.itemsPerBill.toLocaleString("en-IN"),
      change: change(now.itemsPerBill, before?.itemsPerBill),
    },
  ];
  return (
    <section aria-label={t("Bills")} className="grid grid-cols-3 gap-2">
      {tiles.map((tile) => (
        <div key={tile.label} className="flex flex-col gap-0.5 rounded-control glass-soft p-3">
          <span className="text-[11px] font-semibold text-muted">{tile.label}</span>
          <span className="font-display text-lg leading-tight font-bold">{tile.value}</span>
          {tile.change !== null && tile.change !== 0 && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-[11px] font-semibold",
                tile.change > 0 ? "text-accent-fg" : "text-danger",
              )}
            >
              {tile.change > 0 ? (
                <ArrowUpRight size={12} aria-hidden />
              ) : (
                <ArrowDownRight size={12} aria-hidden />
              )}
              {t(tile.change > 0 ? "{n}% more than before" : "{n}% less than before", {
                n: Math.abs(tile.change),
              })}
            </span>
          )}
        </div>
      ))}
    </section>
  );
}

const ACTION_ICONS: Record<string, LucideIcon> = {
  weekday: TrendingUp,
  price: Percent,
  slow: Snail,
  bill: ArrowDownRight,
  pair: Link2,
  peak: Clock,
};

/** "What to do": rule-based suggestions from the last four weeks. */
export function WhatToDo({ actions, t }: { actions: Action[]; t: Translate }) {
  if (actions.length === 0) return null;
  return (
    <Section title={t("What to do")} note={t("From the last 4 weeks")}>
      <ul className="flex flex-col gap-2">
        {actions.map((action) => {
          const Icon = ACTION_ICONS[action.kind] ?? Lightbulb;
          return (
            <li key={action.kind} className="flex gap-3 rounded-card glass-soft px-3.5 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-fg">
                <Icon size={18} aria-hidden />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-bold">{action.head}</span>
                <span className="text-[13px] text-muted">{action.body}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

export function SlowMovers({ items, t }: { items: SlowItem[]; t: Translate }) {
  if (items.length === 0) return null;
  return (
    <Section title={t("Not selling")} note={t("Saved items, last 60 days")}>
      <ul className="flex flex-col rounded-card glass-soft px-3.5 py-1">
        {items.slice(0, 5).map((item) => (
          <li
            key={item.key}
            className="flex min-h-12 items-center justify-between gap-3 border-t border-line first:border-t-0"
          >
            <span className="text-sm font-semibold">{item.name}</span>
            <span className="text-xs text-muted">
              {item.days === null
                ? t("Not sold in 60 days")
                : t("Last sold {n} days ago", { n: item.days })}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** Amount -> one of 4 steps of the accent (sequential: one hue, light to dark). */
const LEVELS = [0, 28, 52, 76, 100];
const level = (value: number, max: number) => (value <= 0 ? 0 : Math.ceil((value / max) * 4));

/** Sales by weekday and hour: when the stall is busiest. */
export function PeakHoursChart({ peak, t }: { peak: PeakHours; t: Translate }) {
  if (peak.max === 0) return null;
  const hours = Array.from(
    { length: peak.lastHour - peak.firstHour + 1 },
    (_, i) => peak.firstHour + i,
  );
  const busiest = peak.busiest
    ? t("Busiest: {day}, {time}.", {
        day: t(WEEKDAY_NAMES[peak.busiest.weekday]),
        time: hourWindow(peak.busiest.hour),
      })
    : null;
  const hourLabel = (h: number) => `${((h + 11) % 12) + 1}${h < 12 ? "a" : "p"}`;
  const days = [1, 2, 3, 4, 5, 6, 0].filter((d) => peak.grid[d].some((v) => v > 0));

  return (
    <Section title={t("Busy hours")} note={busiest ?? undefined}>
      <div className="flex flex-col gap-2 rounded-card glass-soft p-3">
        <div
          role="img"
          aria-label={busiest ?? t("Sales by weekday and hour")}
          className="grid gap-[3px]"
          style={{ gridTemplateColumns: `2.25rem repeat(${hours.length}, minmax(0, 28px))` }}
        >
          {days.map((day) => (
            <div key={day} className="contents">
              <span className="self-center text-[11px] text-muted">{t(WEEKDAY_SHORT[day])}</span>
              {hours.map((hour) => {
                const value = peak.grid[day][hour];
                const step = level(value, peak.max);
                return (
                  <span
                    key={hour}
                    title={`${t(WEEKDAY_SHORT[day])} ${hourLabel(hour)}: ${formatRupees(value)}`}
                    className="aspect-square rounded-[4px]"
                    style={{
                      background:
                        step === 0
                          ? "var(--color-track)"
                          : `color-mix(in oklab, var(--color-accent) ${LEVELS[step]}%, transparent)`,
                    }}
                  />
                );
              })}
            </div>
          ))}
          <span />
          {hours.map((hour) => (
            <span key={hour} className="text-center text-[10px] text-muted">
              {(hour - peak.firstHour) % 3 === 0 ? hourLabel(hour) : ""}
            </span>
          ))}
        </div>
        <div aria-hidden className="flex items-center justify-end gap-1 text-[10px] text-muted">
          {t("Less")}
          {LEVELS.slice(1).map((pct) => (
            <span
              key={pct}
              className="size-2.5 rounded-[3px]"
              style={{
                background: `color-mix(in oklab, var(--color-accent) ${pct}%, transparent)`,
              }}
            />
          ))}
          {t("More")}
        </div>
      </div>
    </Section>
  );
}

/**
 * Each item's share of profit (bar) against its share of sales (tick), one hue:
 * identity comes from the written numbers, not from a second colour.
 */
export function MarginMixChart({ rows, t }: { rows: MixRow[]; t: Translate }) {
  if (rows.length === 0) return null;
  const top = Math.max(...rows.flatMap((r) => [r.salesShare, r.profitShare]), 1);
  const width = (pct: number) => `${(pct / top) * 100}%`;
  return (
    <Section title={t("Where the profit comes from")} note={t("Bar: profit · Line: sales")}>
      <ul className="flex flex-col rounded-card glass-soft px-3.5 py-1">
        {[...rows]
          .sort((a, b) => b.profitShare - a.profitShare)
          .slice(0, 8)
          .map((row) => (
            <li
              key={row.key}
              className="flex flex-col gap-1.5 border-t border-line py-2.5 first:border-t-0"
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold">{row.name}</span>
                <span className="text-xs text-muted">
                  {t("{profit}% of profit · {sales}% of sales", {
                    profit: row.profitShare,
                    sales: row.salesShare,
                  })}
                </span>
              </span>
              <span className="relative h-2 rounded-full bg-track">
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-accent"
                  style={{ width: width(row.profitShare) }}
                />
                <span
                  aria-hidden
                  className="absolute -inset-y-1 w-0.5 rounded-full bg-ink"
                  style={{ left: `calc(${width(row.salesShare)} - 1px)` }}
                />
              </span>
              {row.lowEarner && (
                <span className="flex items-center gap-1 text-xs font-semibold text-warn-ink">
                  <Repeat size={12} aria-hidden />
                  {t("Sells a lot, earns little. Check its price or cost.")}
                </span>
              )}
            </li>
          ))}
      </ul>
    </Section>
  );
}

export function BoughtTogether({ pairs, t }: { pairs: Pair[]; t: Translate }) {
  if (pairs.length === 0) return null;
  return (
    <Section title={t("Bought together")} note={t("On the same bill")}>
      <ul className="flex flex-col rounded-card glass-soft px-3.5 py-1">
        {pairs.map((pair) => (
          <li
            key={`${pair.a}+${pair.b}`}
            className="flex min-h-12 items-center justify-between gap-3 border-t border-line first:border-t-0"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Link2 size={14} aria-hidden className="text-muted" />
              {pair.a} + {pair.b}
            </span>
            <span className="text-xs text-muted">{t("{n} bills", { n: pair.bills })}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
