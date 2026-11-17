import { Suspense } from "react";
import { Loading } from "@/components/feature/reports/Loading";
import { rangeQuery } from "@/components/feature/reports/ReportExtras";
import { Section, rangeLabel } from "@/components/feature/reports/ReportView";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { lineNameKey } from "@/domain/bill";
import { WEEKDAY_NAMES } from "@/domain/report";
import { changeLabel, itemStats } from "@/domain/salesInsights";
import { type Translate, translator } from "@/i18n/translate";
import { cn } from "@/lib/cn";
import { businessDate } from "@/lib/dates";
import { formatRupees } from "@/lib/money";
import { datesBetween, resolveRange } from "@/lib/ranges";
import { billRecords, itemDays } from "@/server/itemSales";
import { requireShop } from "@/server/queries/shop";

export const metadata = { title: "Item report" };

/** /reports/items/[key]?range=… — one item's sales over the report period (v2 Phase 4). */
export default function ItemReportPage({
  params,
  searchParams,
}: PageProps<"/reports/items/[key]">) {
  return (
    <main className="flex flex-1 flex-col gap-3.5 px-4 pt-3.5 pb-6">
      <Suspense fallback={<Loading />}>
        <ItemReport params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ItemReport({ params, searchParams }: PageProps<"/reports/items/[key]">) {
  const shop = await requireShop();
  const lang = shop.language;
  const t = translator(lang);
  const key = lineNameKey(decodeURIComponent((await params).key));
  const query = await searchParams;
  const range = resolveRange(query.range, businessDate(), query.from, query.to);
  const back = { href: `/reports?${rangeQuery(range)}`, label: t("Reports") };

  const [rows, before, bills] = await Promise.all([
    itemDays(shop.id, range.from, range.to),
    itemDays(shop.id, range.compareFrom, range.compareTo),
    billRecords(shop.id, range.from, range.to),
  ]);
  const dates = datesBetween(range.from, range.to);
  const mine = rows.filter((r) => r.key === key);
  const [stat] = itemStats(
    mine,
    dates,
    before.filter((r) => r.key === key),
  );

  if (!stat) {
    return (
      <>
        <ScreenHeader title={t("Item report")} back={back} />
        <p className="text-sm text-muted">{t("Not sold in this period.")}</p>
      </>
    );
  }

  const change = changeLabel(stat.change);
  const prices = mine.map((r) => Math.round(r.revenue / r.quantity));
  const [low, high] = [Math.min(...prices), Math.max(...prices)];
  const tiles = [
    { label: t("Sold"), value: String(stat.quantity), note: change },
    { label: t("Sales"), value: formatRupees(stat.revenue), note: null },
    stat.profit !== null
      ? { label: t("Profit"), value: formatRupees(stat.profit), note: null }
      : null,
    {
      label: t("Price"),
      value: low === high ? formatRupees(low) : `${formatRupees(low)}–${formatRupees(high)}`,
      note: null,
    },
  ].filter((tile) => tile !== null);

  return (
    <>
      <ScreenHeader
        title={stat.name}
        aside={rangeLabel(range.from, range.to, lang, t)}
        back={back}
      />
      <section aria-label={t("Totals")} className="grid grid-cols-2 gap-2">
        {tiles.map((tile) => (
          <div key={tile.label} className="flex flex-col gap-0.5 rounded-control glass-soft p-3">
            <span className="text-xs font-semibold text-muted">{tile.label}</span>
            <span className="font-display text-xl font-bold">{tile.value}</span>
            {tile.note && (
              <span
                className={cn(
                  "text-xs font-semibold",
                  stat.change! > 0 ? "text-accent-fg" : "text-danger",
                )}
              >
                {tile.note} {t("against before")}
              </span>
            )}
          </div>
        ))}
      </section>

      {dates.length > 1 && <DailyBars dates={dates} values={stat.daily} t={t} />}
      {dates.length >= 14 && <WeekdayBars dates={dates} values={stat.daily} t={t} />}
      <Companions itemKey={key} bills={bills} t={t} />
    </>
  );
}

function DailyBars({ dates, values, t }: { dates: string[]; values: number[]; t: Translate }) {
  const max = Math.max(...values, 1);
  return (
    <Section title={t("Sold each day")}>
      <div className="rounded-card glass-soft p-3">
        <div
          role="img"
          aria-label={t("Sold each day: {list}", {
            list: dates
              .map((d, i) => `${Number(d.slice(8))}: ${values[i]}`)
              .filter((_, i) => values[i] > 0)
              .join(", "),
          })}
          className="flex h-24 items-end gap-[2px]"
        >
          {values.map((v, i) => (
            <div key={dates[i]} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div
                title={`${dates[i]}: ${v}`}
                className="w-full rounded-t-[4px] bg-accent"
                style={{
                  height: v > 0 ? `${Math.max((v / max) * 72, 3)}px` : "2px",
                  opacity: v > 0 ? 1 : 0.25,
                }}
              />
              {dates.length <= 16 && (
                <span className="text-[10px] text-muted">{Number(dates[i].slice(8))}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function WeekdayBars({ dates, values, t }: { dates: string[]; values: number[]; t: Translate }) {
  const averages = WEEKDAY_NAMES.map((name, weekday) => {
    const same = dates
      .map((d, i) => ({ d, v: values[i] }))
      .filter(({ d }) => new Date(`${d}T00:00:00Z`).getUTCDay() === weekday);
    const avg = same.length ? same.reduce((s, x) => s + x.v, 0) / same.length : 0;
    return { name, avg: Math.round(avg * 10) / 10 };
  });
  const max = Math.max(...averages.map((a) => a.avg), 1);
  return (
    <Section title={t("Average sold by weekday")}>
      <ul className="flex flex-col gap-1.5 rounded-card glass-soft p-3">
        {averages.map((a) => (
          <li key={a.name} className="grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-2">
            <span className="text-xs text-muted">{t(a.name)}</span>
            <span className="h-2 rounded-full bg-track">
              <span
                className="block h-full rounded-full bg-accent"
                style={{ width: `${(a.avg / max) * 100}%` }}
              />
            </span>
            <span className="text-right text-xs font-bold">{a.avg.toLocaleString("en-IN")}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Companions({
  itemKey,
  bills,
  t,
}: {
  itemKey: string;
  bills: Awaited<ReturnType<typeof billRecords>>;
  t: Translate;
}) {
  const withIt = bills.filter((b) => b.items.some((i) => i.key === itemKey));
  const counts = new Map<string, { name: string; bills: number }>();
  for (const bill of withIt) {
    for (const other of new Map(bill.items.map((i) => [i.key, i.name]))) {
      if (other[0] === itemKey) continue;
      const seen = counts.get(other[0]) ?? { name: other[1], bills: 0 };
      seen.bills += 1;
      counts.set(other[0], seen);
    }
  }
  const top = [...counts.values()].sort((a, b) => b.bills - a.bills).slice(0, 3);
  if (top.length === 0) return null;
  return (
    <Section title={t("Often bought with")} note={t("On {n} of its bills", { n: withIt.length })}>
      <ul className="flex flex-col rounded-card glass-soft px-3.5 py-1">
        {top.map((c) => (
          <li
            key={c.name}
            className="flex min-h-12 items-center justify-between border-t border-line first:border-t-0"
          >
            <span className="text-sm font-semibold">{c.name}</span>
            <span className="text-xs text-muted">{t("{n} bills", { n: c.bills })}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
