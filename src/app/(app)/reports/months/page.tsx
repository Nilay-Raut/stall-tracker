import Link from "next/link";
import { Suspense } from "react";
import { Loading } from "@/components/feature/reports/Loading";
import { SubHeader } from "@/components/feature/reports/SubHeader";
import { AsOf } from "@/components/ui/AsOf";
import { msg, translator } from "@/i18n/translate";
import { formatMonth, formatMonthShort } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { businessDate, daysInMonth } from "@/lib/dates";
import { formatRupees } from "@/lib/money";
import { requireShop } from "@/server/queries/shop";
import { monthTrend } from "@/server/reports";

export const metadata = { title: "Month by month" };

/** The last 12 months: profit bars and each month's sales, costs and profit. */
export default function MonthsPage() {
  return (
    <main className="flex flex-1 flex-col gap-3 px-5 pt-3.5 pb-6">
      <SubHeader title={msg("Month by month")} />
      <Suspense fallback={<Loading />}>
        <MonthsContent />
      </Suspense>
    </main>
  );
}

async function MonthsContent() {
  const shop = await requireShop();
  const lang = shop.language;
  const t = translator(lang);
  const today = businessDate();
  const months = await monthTrend(shop, today);
  const thisMonth = today.slice(0, 7);
  const biggest = Math.max(...months.map((m) => Math.abs(m.profit)), 1);
  const hasLoss = months.some((m) => m.profit < 0);

  return (
    <>
      <AsOf lang={lang} />
      <section className="flex flex-col gap-1">
        <h2 className="text-sm font-bold">{t("Profit each month")}</h2>
        <div
          role="img"
          aria-label={t("Profit for each of the last {count} months", { count: months.length })}
          className="flex h-[132px] items-stretch gap-1.5 border-b border-line"
        >
          {months.map((m) => {
            const height = `${Math.max((Math.abs(m.profit) / biggest) * 100, 2)}%`;
            return (
              <div key={m.month} className="flex min-w-0 flex-1 flex-col">
                {/* Profits grow up from the middle line, losses down, when there are any. */}
                <div className={cn("flex flex-col justify-end", hasLoss ? "h-1/2" : "h-full")}>
                  {m.profit >= 0 && (
                    <div className="rounded-t-[3px] bg-accent" style={{ height }} />
                  )}
                </div>
                {hasLoss && (
                  <div className="flex h-1/2 flex-col border-t border-ink">
                    {m.profit < 0 && (
                      <div className="rounded-b-[3px] bg-danger" style={{ height }} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-1.5">
          {months.map((m) => (
            <span
              key={m.month}
              className="min-w-0 flex-1 truncate text-center text-[10px] text-muted"
            >
              {formatMonthShort(m.month, lang)}
            </span>
          ))}
        </div>
      </section>

      <section className="flex flex-col">
        {[...months].reverse().map((m) => {
          const last = m.month === thisMonth ? today : `${m.month}-${daysInMonth(`${m.month}-01`)}`;
          return (
            <Link
              key={m.month}
              href={`/reports?range=custom&from=${m.month}-01&to=${last}`}
              className="flex min-h-14 items-center justify-between gap-3 border-t border-line"
            >
              <span className="flex flex-col">
                <span className="text-sm font-semibold">
                  {formatMonth(m.month, lang)}
                  {m.month === thisMonth && (
                    <span className="font-normal text-muted"> · {t("so far")}</span>
                  )}
                </span>
                <span className="text-xs text-muted">
                  {t("Sales {sales} · Costs {costs}", {
                    sales: formatRupees(m.sales),
                    costs: formatRupees(m.expenses + m.fixedCost),
                  })}
                </span>
              </span>
              <span
                className={cn("text-[15px] font-bold", m.profit < 0 && "text-danger")}
                aria-label={t("Profit {amount}", { amount: formatRupees(m.profit) })}
              >
                {formatRupees(m.profit)} <span aria-hidden>›</span>
              </span>
            </Link>
          );
        })}
      </section>
      <p className="text-xs text-muted">{t("Tap a month to see its full report.")}</p>
    </>
  );
}
