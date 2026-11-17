import { Suspense } from "react";
import { Loading } from "@/components/feature/reports/Loading";
import { TargetForm } from "@/components/feature/target/TargetForm";
import { AsOf } from "@/components/ui/AsOf";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import type { TargetPlan } from "@/domain/target";
import { waysToReach } from "@/domain/ways";
import { type Translate, translator } from "@/i18n/translate";
import { formatMonthName, monthOf } from "@/lib/calendar";
import { businessDate, daysInMonth } from "@/lib/dates";
import { formatRupees } from "@/lib/money";
import { requireShop } from "@/server/queries/shop";
import { itemStats, monthPlan, previousTarget } from "@/server/target";

export const metadata = { title: "Target" };

/** Target (wireframe screen 9). Lives under Settings since v2 (docs/PLAN-v2.md, Phase 2). */
export default function TargetPage() {
  return (
    <Suspense fallback={<Loading />}>
      <TargetContent />
    </Suspense>
  );
}

async function TargetContent() {
  const shop = await requireShop();
  const t = translator(shop.language);
  const today = businessDate();
  const month = monthOf(today);
  const monthName = formatMonthName(month, shop.language);
  const [current, suggestion, stats] = await Promise.all([
    monthPlan(shop.id, month, today),
    previousTarget(shop.id, month),
    itemStats(shop.id, today),
  ]);

  const header = (
    <ScreenHeader
      title={t("Target")}
      aside={monthName}
      back={{ href: "/settings", label: t("Settings") }}
    />
  );
  const asOf = <AsOf lang={shop.language} />;

  if (!current) {
    return (
      <>
        {header}
        <Card className="gap-3">
          <h2 className="text-base font-bold">
            {t("Set a profit target for {month}", { month: monthName })}
          </h2>
          <p className="text-sm text-muted">
            {t("The app then works out the sales you need each day and how to get there.")}
          </p>
          <TargetForm monthName={monthName} target={null} suggestion={suggestion} />
        </Card>
      </>
    );
  }

  const { target, plan } = current;
  const totalDays = daysInMonth(`${month}-01`);
  const daysGone = totalDays - plan.remainingDays;
  const ways = waysToReach(stats, plan.extraProfit, formatRupees, t);

  return (
    <>
      {header}
      {asOf}
      <Card className="gap-2">
        <TargetForm monthName={monthName} target={target} suggestion={null} />
        <div className="font-display text-[32px] leading-none font-bold">
          {formatRupees(plan.earned)}{" "}
          <span className="font-sans text-sm font-semibold text-muted">
            {t("earned · {percent}%", { percent: Math.max(Math.round(plan.percent), 0) })}
          </span>
        </div>
        <ProgressBar value={plan.percent / 100} label={t("Profit earned against the target")} />
        <span className="text-[13px] text-muted">
          {t("{gone} of {total} days gone ({percent}%).", {
            gone: daysGone,
            total: totalDays,
            percent: Math.round((daysGone / totalDays) * 100),
          })}{" "}
          {paceText(plan, target, t)}
        </span>
      </Card>

      {!plan.reached && <ToReachIt plan={plan} t={t} />}

      <section className="flex flex-col">
        <div className="flex items-baseline justify-between pb-1">
          <h2 className="text-sm font-bold">{t("Ways to get there")}</h2>
          {ways.length > 0 && (
            <span className="text-xs text-muted">{t("Extra profit per day")}</span>
          )}
        </div>
        {ways.length === 0 && (
          <p className="border-t border-line py-3 text-sm text-muted">
            {t("Add your items and count plates at closing to get ideas here.")}
          </p>
        )}
        {ways.map((way) => (
          <div
            key={way.head}
            className="flex min-h-14 items-center justify-between gap-3 border-t border-line py-2"
          >
            <span className="flex flex-col">
              <span className="text-sm font-bold">{way.head}</span>
              <span className="text-[13px] text-muted">{way.body}</span>
            </span>
            <span className="text-[15px] font-bold whitespace-nowrap text-accent-fg">
              + {formatRupees(way.gain)}
            </span>
          </div>
        ))}
      </section>
    </>
  );
}

function paceText(plan: TargetPlan, target: number, t: Translate): string {
  if (plan.reached) {
    return t("Target reached, {amount} above it.", { amount: formatRupees(plan.earned - target) });
  }
  if (plan.behind > 0) return t("About {amount} behind.", { amount: formatRupees(plan.behind) });
  if (plan.behind < 0) return t("About {amount} ahead.", { amount: formatRupees(-plan.behind) });
  return t("Right on pace.");
}

function ToReachIt({ plan, t }: { plan: TargetPlan; t: Translate }) {
  return (
    <Card tone="muted" className="gap-1">
      <span className="text-[13px] font-semibold text-muted">{t("To reach it")}</span>
      {plan.salesPerDay === null ? (
        <span className="text-sm">
          {plan.remainingDays === 0
            ? t("This is the last day of the month.")
            : t("Record a few days of sales to work out what each day needs.")}
        </span>
      ) : (
        <>
          <span className="text-lg font-bold">
            {plan.remainingDays === 1
              ? t("{amount} sales a day for {days} day", {
                  amount: formatRupees(plan.salesPerDay),
                  days: 1,
                })
              : t("{amount} sales a day for {days} days", {
                  amount: formatRupees(plan.salesPerDay),
                  days: plan.remainingDays,
                })}
          </span>
          {plan.averageSales !== null && (
            <span className="text-[13px] text-muted">
              {plan.extraSales !== null && plan.extraProfit !== null
                ? t(
                    "Your average is {average}. That is {extraSales} more sales, or about {extraProfit} more profit, each day.",
                    {
                      average: formatRupees(plan.averageSales),
                      extraSales: formatRupees(plan.extraSales),
                      extraProfit: formatRupees(plan.extraProfit),
                    },
                  )
                : t("Your average of {average} already covers it. Keep it up.", {
                    average: formatRupees(plan.averageSales),
                  })}
            </span>
          )}
        </>
      )}
    </Card>
  );
}
