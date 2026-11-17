import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { MoneySplit } from "./ReportExtras";
import type { Report } from "@/domain/report";
import { type Translate, msg } from "@/i18n/translate";
import { cn } from "@/lib/cn";
import { type BusinessDate, type Lang, formatDayLabel } from "@/lib/dates";
import { formatRupees } from "@/lib/money";
import type { Range } from "@/lib/ranges";

const WEEKDAY_SHORT = [
  msg("Sun"),
  msg("Mon"),
  msg("Tue"),
  msg("Wed"),
  msg("Thu"),
  msg("Fri"),
  msg("Sat"),
] as const;
const MAX_BARS = 62;

/** "13 Nov" from "Fri, 13 Nov" (in any language). */
export const dayAndMonth = (date: BusinessDate, lang: Lang = "en") =>
  formatDayLabel(date, lang).split(", ").at(-1)!;

/** "1 to 13 Nov", or "28 Oct to 3 Nov" across months. */
export function rangeLabel(from: BusinessDate, to: BusinessDate, lang: Lang, t: Translate): string {
  if (from === to) return dayAndMonth(from, lang);
  const [fromDay, ...fromMonth] = dayAndMonth(from, lang).split(" ");
  const toText = dayAndMonth(to, lang);
  const sameMonth = fromMonth.join(" ") === toText.split(" ").slice(1).join(" ");
  return t("{from} to {to}", {
    from: sameMonth ? fromDay : dayAndMonth(from, lang),
    to: toText,
  });
}

function profitTitle(range: Range, lang: Lang, t: Translate): string {
  if (range.kind === "today") return t("Profit today");
  if (range.kind === "month") return t("Profit this month");
  if (range.kind === "week") return t("Profit, last 7 days");
  return t("Profit, {range}", { range: rangeLabel(range.from, range.to, lang, t) });
}

function offNote(dates: string, count: number, t: Translate): string {
  return count === 1 ? t("{dates} was closed.", { dates }) : t("{dates} were closed.", { dates });
}

type Props = {
  range: Range;
  report: Report;
  lang: Lang;
  t: Translate;
  /** Shown under the profit card (comparison) and under the spending (owner's take). */
  afterProfit?: ReactNode;
  afterSpend?: ReactNode;
  /** Item and bill sections (v2 Phase 4); replace the plate-count "Profit by item". */
  itemSections?: ReactNode;
};

/** Reports (wireframe screen 8). */
export function ReportView({
  range,
  report,
  lang,
  t,
  afterProfit,
  afterSpend,
  itemSections,
}: Props) {
  const maxDay = Math.max(...report.bars.map((b) => b.sales), 1);
  const known = report.weekdays.filter((w) => w.average !== null);
  const bestAverage = Math.max(...known.map((w) => w.average!), 1);
  const worstAverage = Math.min(...known.map((w) => w.average!));

  return (
    <>
      <Card tone="muted" className="gap-1.5 py-4">
        <span className="text-[13px] font-semibold text-muted">{profitTitle(range, lang, t)}</span>
        <div className="font-display text-[40px] leading-none font-bold">
          {formatRupees(report.profit)}
        </div>
        <span className="text-xs text-muted">
          {t("Sales {sales} − Expenses {expenses} − Fixed {fixed}", {
            sales: formatRupees(report.sales),
            expenses: formatRupees(report.expenses),
            fixed: formatRupees(report.fixedCost),
          })}
        </span>
        {report.bars.length <= MAX_BARS && (
          <>
            <div
              role="img"
              aria-label={t("Sales for each day from {range}", {
                range: rangeLabel(range.from, range.to, lang, t),
              })}
              className="mt-2 flex h-[78px] items-end gap-[3px]"
            >
              {report.bars.map((bar) => (
                <div key={bar.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <div
                    className={cn("w-full rounded-t-[3px]", bar.off ? "bg-idle" : "bg-accent")}
                    style={{
                      height: bar.sales > 0 ? `${Math.max((bar.sales / maxDay) * 60, 2)}px` : "3px",
                    }}
                  />
                  {report.bars.length <= 16 && (
                    <span className="text-[10px] text-muted">{Number(bar.date.slice(8))}</span>
                  )}
                </div>
              ))}
            </div>
            <span className="text-xs text-muted">
              {t("Sales per day.")}
              {report.offDates.length > 0 &&
                ` ${offNote(
                  report.offDates.map((d) => dayAndMonth(d, lang)).join(", "),
                  report.offDates.length,
                  t,
                )}`}
            </span>
          </>
        )}
      </Card>

      {afterProfit}

      {report.insights.length > 0 && (
        <Section title={t("What the numbers say")}>
          {report.insights.map((insight) => (
            <div key={insight.head} className="flex flex-col gap-0.5 border-t border-line py-2.5">
              <span className="text-sm font-bold">{insight.head}</span>
              <span className="text-[13px] text-muted">{insight.body}</span>
            </div>
          ))}
        </Section>
      )}

      {(report.sales > 0 || report.spend.length > 0) && (
        <MoneySplit range={range} report={report} t={t} />
      )}

      {afterSpend}

      {known.length > 0 && (
        <Section title={t("Best and worst days")} note={t("Average sales per day in rupees")}>
          <div
            role="img"
            aria-label={t("Average sales by weekday")}
            className="flex h-[118px] items-end gap-1.5 border-t border-line pt-2"
          >
            {report.weekdays.map((w) => (
              <div key={w.weekday} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-semibold">
                  {w.average !== null ? (w.average / 100).toLocaleString("en-IN") : "–"}
                </span>
                <div
                  className={cn(
                    "w-full rounded-t-[3px]",
                    w.average === bestAverage
                      ? "bg-accent"
                      : w.average === worstAverage
                        ? "bg-idle"
                        : "bg-bar",
                  )}
                  style={{
                    height: `${w.average ? Math.max((w.average / bestAverage) * 70, 3) : 0}px`,
                  }}
                />
                <span className="text-[11px] text-muted">{t(WEEKDAY_SHORT[w.weekday])}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {report.sales > 0 && (
        <Section title={t("Cash and UPI")}>
          <div
            role="img"
            aria-label={t("Cash {cash} percent, UPI {upi} percent", {
              cash: report.cashShare,
              upi: 100 - report.cashShare,
            })}
            className="flex h-3 overflow-hidden rounded-full bg-track"
          >
            <div className="h-full bg-accent" style={{ width: `${report.cashShare}%` }} />
          </div>
          <div className="flex justify-between pt-1.5 text-[13px]">
            <span>
              <strong>
                {t("Cash")} {formatRupees(report.cashSales)}
              </strong>{" "}
              · {report.cashShare}%
            </span>
            <span>
              <strong>UPI {formatRupees(report.upiSales)}</strong> · {100 - report.cashShare}%
            </span>
          </div>
        </Section>
      )}

      {itemSections}

      {!itemSections && report.items.length > 0 && (
        <Section title={t("Profit by item")} note={t("From plate counts")}>
          {report.items.map((item) => (
            <div
              key={item.name}
              className="flex min-h-13 items-center justify-between gap-3 border-t border-line"
            >
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{item.name}</span>
                <span className="text-xs text-muted">
                  {t("{plates} plates · {amount} profit each", {
                    plates: item.plates,
                    amount: formatRupees(item.perPlate),
                  })}
                </span>
              </span>
              <span className="text-[15px] font-bold">{formatRupees(item.margin)}</span>
            </div>
          ))}
        </Section>
      )}

      {report.sales === 0 && report.expenses === 0 && (
        <p className="text-sm text-muted">{t("Nothing recorded in this period yet.")}</p>
      )}

      <Link
        href="/reports/prices"
        className="flex min-h-13 items-center justify-between rounded-card border border-edge px-3.5"
      >
        <span className="text-[15px] font-semibold">{t("Supplier prices")}</span>
        <span aria-hidden>›</span>
      </Link>
    </>
  );
}

export function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col">
      <div className="flex items-baseline justify-between pb-1.5">
        <h2 className="text-sm font-bold">{title}</h2>
        {note && <span className="text-xs text-muted">{note}</span>}
      </div>
      {children}
    </section>
  );
}
