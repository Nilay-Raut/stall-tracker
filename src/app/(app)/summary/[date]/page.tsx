import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DaySummaryView } from "@/components/feature/close/DaySummaryView";
import { ButtonLink } from "@/components/ui/Button";
import { plateInsight } from "@/domain/plates";
import { translator } from "@/i18n/translate";
import { businessDate } from "@/lib/dates";
import { summaryNotes } from "@/lib/summaryNotes";
import { getDaySummary } from "@/server/days";
import { requireShop } from "@/server/queries/shop";
import { dailySalesTarget } from "@/server/target";

export const metadata = { title: "Day summary" };

export default function SummaryPage({ params }: PageProps<"/summary/[date]">) {
  return (
    <main className="flex flex-1 flex-col gap-3 px-5 pt-3.5 pb-6">
      <Suspense fallback={<p className="py-10 text-center text-sm text-muted">Loading…</p>}>
        <SummaryContent params={params} />
      </Suspense>
    </main>
  );
}

async function SummaryContent({ params }: Pick<PageProps<"/summary/[date]">, "params">) {
  const shop = await requireShop();
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > businessDate()) redirect("/");

  const [summary, dayTarget] = await Promise.all([
    getDaySummary(shop.id, date),
    dailySalesTarget(shop.id, date),
  ]);
  if (!summary) redirect(`/close?date=${date}`); // not closed yet

  const { day, close, plates, lastWeek } = summary;
  const t = translator(shop.language);
  return (
    <DaySummaryView
      date={date}
      sales={day.salesTotal}
      cashSales={day.cashSales}
      upiSales={day.upiSales}
      expenses={day.expenseTotal}
      fixedCost={day.fixedCost}
      profit={day.profit}
      dayTarget={dayTarget}
      insight={plateInsight(plates)}
      lang={shop.language}
      notes={summaryNotes(
        {
          cashDifference: day.enteredCashSales > 0 ? day.cashSales - day.enteredCashSales : null,
          cashOut: day.cashOutTotal,
          waste: close.waste,
          cashLeft: close.countedCash,
          sales: day.salesTotal,
          lastWeek,
        },
        t,
        shop.language,
      )}
      footer={
        <>
          {/* The server's close form: always has the latest figures for an edit. */}
          <ButtonLink href={`/close?date=${date}`} variant="outline" size="lg">
            {t("Edit day")}
          </ButtonLink>
          <ButtonLink href="/" size="lg">
            {t("Done")}
          </ButtonLink>
        </>
      }
    />
  );
}
