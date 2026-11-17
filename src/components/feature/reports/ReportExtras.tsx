import Link from "next/link";
import { type Change, type Totals, compareTotals, moneySplit, ownerTake } from "@/domain/analysis";
import type { Report } from "@/domain/report";
import { type Translate, msg } from "@/i18n/translate";
import { cn } from "@/lib/cn";
import type { Lang } from "@/lib/dates";
import { CATEGORY_LABELS } from "@/lib/labels";
import { formatRupees } from "@/lib/money";
import type { Range } from "@/lib/ranges";
import { Section, rangeLabel } from "./ReportView";

// Phase 11 parts of the Reports screen. Server components: they get the shop's t().

const SAME_AS: Record<Range["kind"], string> = {
  today: msg("same as the same day last week"),
  week: msg("same as the week before"),
  month: msg("same as last month"),
  custom: msg("same as the period before"),
};
const WAS: Record<Range["kind"], string> = {
  today: msg("was {share}% the same day last week"),
  week: msg("was {share}% the week before"),
  month: msg("was {share}% last month"),
  custom: msg("was {share}% the period before"),
};

/** Query string that keeps the report's period on the screens it links to. */
export const rangeQuery = (range: Range) => `range=${range.kind}&from=${range.from}&to=${range.to}`;

/** "Where the money goes": every ₹100 of sales split into spending, fixed costs and profit. */
export function MoneySplit({ range, report, t }: { range: Range; report: Report; t: Translate }) {
  const split = moneySplit(report.sales, report.spend, report.fixedCost);
  const profitShare = split.parts.find((p) => p.key === "profit")?.per100 ?? 0;

  return (
    <Section
      title={t("Where the money goes")}
      note={split.basis === "sales" ? t("Of every ₹100 of sales") : t("Of every ₹100 spent")}
    >
      {split.basis === "sales" ? (
        <div
          role="img"
          aria-label={t("Costs {costs} rupees, profit {profit} rupees of every 100", {
            costs: 100 - profitShare,
            profit: profitShare,
          })}
          className="mb-2 flex h-3 overflow-hidden rounded-full bg-track"
        >
          <div className="h-full bg-bar" style={{ width: `${100 - profitShare}%` }} />
          <div className="h-full bg-accent" style={{ width: `${profitShare}%` }} />
        </div>
      ) : (
        <p className="mb-2 rounded-control bg-warn-bg px-3 py-2 text-[13px] font-semibold text-warn-ink">
          {t("Costs were {amount} more than sales in this period.", {
            amount: formatRupees(split.loss),
          })}
        </p>
      )}

      {split.parts.map((part) => {
        const category = report.spend.find((s) => s.category === part.key);
        const label =
          part.key === "fixed"
            ? t("Fixed costs")
            : part.key === "profit"
              ? t("Profit")
              : t(CATEGORY_LABELS[part.key]);
        const body = (
          <>
            <div className="flex justify-between gap-3 text-sm">
              <span className="font-semibold">
                {label}
                {category && <span aria-hidden> ›</span>}
              </span>
              <span className="font-bold">{formatRupees(part.amount)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-track">
              <div
                className={cn("h-full", part.key === "profit" ? "bg-accent" : "bg-bar")}
                style={{ width: `${Math.max(part.per100, 2)}%` }}
              />
            </div>
            <span className="text-xs text-muted">
              {t("₹{n} of every ₹100", { n: part.per100 })}
              {category && category.previousShare !== null
                ? ` · ${
                    category.previousShare === category.share
                      ? t(SAME_AS[range.kind])
                      : t(WAS[range.kind], { share: category.previousShare })
                  }`
                : null}
            </span>
          </>
        );
        return category ? (
          <Link
            key={part.key}
            href={`/reports/spend/${part.key}?${rangeQuery(range)}`}
            className="flex flex-col gap-1 border-t border-line py-2.5"
          >
            {body}
          </Link>
        ) : (
          <div key={part.key} className="flex flex-col gap-1 border-t border-line py-2.5">
            {body}
          </div>
        );
      })}
    </Section>
  );
}

const COMPARE_ROWS = [
  { key: "sales", label: msg("Sales"), upIsGood: true },
  { key: "expenses", label: msg("Expenses"), upIsGood: false },
  { key: "profit", label: msg("Profit"), upIsGood: true },
] as const;

/** Sales, expenses and profit against the same number of days just before. */
export function CompareCard({
  range,
  now,
  before,
  lang,
  t,
}: {
  range: Range;
  now: Totals;
  before: Totals;
  lang: Lang;
  t: Translate;
}) {
  const changes = compareTotals(now, before);
  return (
    <Section
      title={t("Compared with before")}
      note={rangeLabel(range.compareFrom, range.compareTo, lang, t)}
    >
      {COMPARE_ROWS.map((row) => (
        <CompareRow
          key={row.key}
          label={t(row.label)}
          change={changes[row.key]}
          upIsGood={row.upIsGood}
          t={t}
        />
      ))}
    </Section>
  );
}

function changeText(change: Change, t: Translate): string {
  if (change.change === 0) return t("No change");
  const amount = formatRupees(Math.abs(change.change));
  const up = change.change > 0;
  if (change.percent === null) {
    return up ? t("{amount} more", { amount }) : t("{amount} less", { amount });
  }
  const percent = Math.abs(change.percent);
  return up
    ? t("{amount} more ({percent}%)", { amount, percent })
    : t("{amount} less ({percent}%)", { amount, percent });
}

function CompareRow({
  label,
  change,
  upIsGood,
  t,
}: {
  label: string;
  change: Change;
  upIsGood: boolean;
  t: Translate;
}) {
  const up = change.change > 0;
  const good = change.change === 0 ? null : up === upIsGood;
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 border-t border-line">
      <span className="flex flex-col">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs text-muted">
          {t("{now} now, {before} before", {
            now: formatRupees(change.now),
            before: formatRupees(change.before),
          })}
        </span>
      </span>
      <span
        className={cn(
          "text-right text-[13px] font-bold",
          good === null ? "text-muted" : good ? "text-accent-fg" : "text-danger",
        )}
      >
        {change.change !== 0 && <span aria-hidden>{up ? "▲ " : "▼ "}</span>}
        {changeText(change, t)}
      </span>
    </div>
  );
}

/** Cash the owner took out against the profit, when anything was taken. */
export function OwnerTakeCard({
  cashOut,
  profit,
  t,
}: {
  cashOut: number;
  profit: number;
  t: Translate;
}) {
  if (cashOut <= 0) return null;
  const take = ownerTake(cashOut, profit);
  return (
    <Section title={t("Your take")}>
      <div className="flex justify-between border-t border-line py-2.5 text-sm">
        <span>{t("Cash you took out")}</span>
        <strong>{formatRupees(take.cashOut)}</strong>
      </div>
      <div className="flex justify-between border-t border-line py-2.5 text-sm">
        <span>{t("Profit the stall made")}</span>
        <strong>{formatRupees(take.profit)}</strong>
      </div>
      {take.overBy > 0 ? (
        <p className="rounded-control bg-warn-bg px-3 py-2 text-[13px] text-warn-ink">
          {t(
            "You took out {amount} more than the stall earned. It came from earlier savings in the drawer.",
            { amount: formatRupees(take.overBy) },
          )}
        </p>
      ) : (
        <p className="text-xs text-muted">
          {t("{amount} of the profit is still in the business.", {
            amount: formatRupees(take.profit - take.cashOut),
          })}
        </p>
      )}
    </Section>
  );
}

/** Links at the end of Reports: month by month and sharing. */
export function MoreLinks({ range, t }: { range: Range; t: Translate }) {
  return (
    <section className="flex flex-col rounded-card border border-edge print:hidden">
      <Link
        href="/reports/months"
        className="flex min-h-13 items-center justify-between border-b border-line px-3.5"
      >
        <span className="text-[15px] font-semibold">{t("Month by month")}</span>
        <span aria-hidden>›</span>
      </Link>
      <Link
        href={`/reports/share?${rangeQuery(range)}`}
        className="flex min-h-13 items-center justify-between px-3.5"
      >
        <span className="text-[15px] font-semibold">{t("Share or download")}</span>
        <span aria-hidden>›</span>
      </Link>
    </section>
  );
}
