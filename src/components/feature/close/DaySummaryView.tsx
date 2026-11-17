import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { PlateInsight } from "@/domain/plates";
import { translator } from "@/i18n/translate";
import { type BusinessDate, type Lang, formatDayLabel } from "@/lib/dates";
import { type Paise, formatRupees } from "@/lib/money";
import type { SummaryNote } from "@/lib/summaryNotes";

type Props = {
  date: BusinessDate;
  sales: Paise;
  cashSales: Paise;
  upiSales: Paise;
  expenses: Paise;
  fixedCost: Paise;
  profit: Paise;
  notes: SummaryNote[];
  insight: PlateInsight | null;
  dayTarget: Paise | null;
  /** Shown under the heading, e.g. "Saved on this phone, sent when back online". */
  banner?: ReactNode;
  /** Buttons at the bottom (Edit day, Done). */
  footer: ReactNode;
  /** Language to show it in (a prop, as this renders on the server and on the phone). */
  lang?: Lang;
};

/**
 * The day summary (wireframe screen 6). Used by the server summary page and by
 * the summary shown right after closing offline, so both look the same.
 */
export function DaySummaryView(props: Props) {
  const { date, sales, cashSales, upiSales, expenses, fixedCost, profit } = props;
  const { notes, insight, dayTarget, lang = "en" } = props;
  const t = translator(lang);
  const breakEven = expenses + fixedCost;
  const crossed = sales >= breakEven;
  const bestValues = insight
    ? {
        item: insight.best.name,
        amount: formatRupees(insight.best.earned),
        n: insight.best.quantity,
      }
    : undefined;

  return (
    <>
      <header className="flex min-h-12 items-center justify-between">
        <h1 className="font-display text-xl font-bold">{t("Day closed")}</h1>
        <span className="text-[13px] text-muted">{formatDayLabel(date, lang)}</span>
      </header>
      {props.banner}

      <Card tone="muted" className="gap-1.5 py-4">
        <span className="text-[13px] font-semibold text-muted">{t("Profit today")}</span>
        <div className="font-display text-[46px] leading-none font-bold">
          {formatRupees(profit)}
        </div>
        <span
          className={
            crossed
              ? "self-start rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-ink"
              : "self-start rounded-full bg-warn-bg px-3 py-1 text-xs font-bold text-warn-ink"
          }
        >
          {crossed
            ? t("Break-even crossed")
            : t("{amount} short of break-even", { amount: formatRupees(breakEven - sales) })}
        </span>
        <span className="text-[13px] text-muted">
          {t("You needed {amount} to cover today's costs.", { amount: formatRupees(breakEven) })}
        </span>
      </Card>

      <Card className="gap-0 py-1">
        <Row
          label={t("Sales")}
          note={t("Cash {cash} · UPI {upi}", {
            cash: formatRupees(cashSales),
            upi: formatRupees(upiSales),
          })}
          value={formatRupees(sales)}
        />
        <Row label={t("Expenses")} value={`− ${formatRupees(expenses)}`} />
        <Row
          label={t("Fixed costs for one day")}
          note={t("Rent, salary, electricity")}
          value={`− ${formatRupees(fixedCost)}`}
        />
        <Row label={t("Profit")} value={formatRupees(profit)} strong />
      </Card>

      {dayTarget !== null && (
        <Card className="gap-2">
          <div className="flex justify-between text-sm">
            <span className="font-bold">
              {sales >= dayTarget
                ? t("The day's sales target was reached")
                : t("{amount} short of the day's target", {
                    amount: formatRupees(dayTarget - sales),
                  })}
            </span>
            <span className="text-muted">{formatRupees(dayTarget)}</span>
          </div>
          <ProgressBar value={sales / dayTarget} label={t("Sales against the day's target")} />
        </Card>
      )}

      <section className="flex flex-col">
        <h2 className="pb-1 text-sm font-bold">{t("Things to know")}</h2>
        {notes.map((note) => (
          <div
            key={note.label}
            className="flex min-h-11 items-center justify-between gap-3 border-t border-line"
          >
            <span className="text-sm">{note.label}</span>
            <span className="text-[15px] font-bold whitespace-nowrap">{note.value}</span>
          </div>
        ))}
      </section>

      {insight && (
        <section className="flex flex-col gap-1 rounded-card border border-dashed border-edge px-3.5 py-3">
          <span className="text-xs font-semibold text-muted">{t("From the plate count")}</span>
          <span className="text-sm font-bold">
            {insight.best.quantity === 1
              ? t("{item} earned the most: {amount} from {n} plate.", bestValues)
              : t("{item} earned the most: {amount} from {n} plates.", bestValues)}
          </span>
          {insight.better && (
            <span className="text-[13px] text-muted">
              {t("{item} earn {amount} more per plate. Only {n} sold.", {
                item: insight.better.name,
                amount: formatRupees(insight.better.extraPerPlate),
                n: insight.better.quantity,
              })}
            </span>
          )}
        </section>
      )}

      <div className="mt-auto grid grid-cols-2 gap-2.5 pt-2">{props.footer}</div>
    </>
  );
}

function Row({
  label,
  note,
  value,
  strong,
}: {
  label: string;
  note?: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={
        strong
          ? "flex min-h-12 items-center justify-between border-t border-line"
          : "flex min-h-12 items-center justify-between border-t border-line first:border-t-0"
      }
    >
      <span className="flex flex-col">
        <span className={strong ? "text-base font-bold" : "text-[15px] font-semibold"}>
          {label}
        </span>
        {note && <span className="text-xs text-muted">{note}</span>}
      </span>
      <span className={strong ? "text-lg font-bold" : "text-base font-bold"}>{value}</span>
    </div>
  );
}
