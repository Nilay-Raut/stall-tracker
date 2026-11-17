import { totalsOf } from "@/domain/analysis";
import { buildReport } from "@/domain/report";
import { translator } from "@/i18n/translate";
import type { BusinessDate, Lang } from "@/lib/dates";
import { formatRupees } from "@/lib/money";
import type { Range } from "@/lib/ranges";
import { compareDays, getReportInput } from "@/server/reports";
import { salesReport } from "@/server/salesReport";
import { CompareCard, OwnerTakeCard, rangeQuery } from "./ReportExtras";
import { ReportView } from "./ReportView";
import {
  BillKpis,
  BoughtTogether,
  MarginMixChart,
  PeakHoursChart,
  SlowMovers,
  WhatToDo,
} from "./SalesSections";
import { TopItems } from "./TopItems";

/** Every section of a report for one period: used by Reports and its print page. */
export async function FullReport({
  shopId,
  range,
  today,
  lang,
}: {
  shopId: string;
  range: Range;
  today: BusinessDate;
  lang: Lang;
}) {
  const t = translator(lang);
  const [input, before, sales] = await Promise.all([
    getReportInput(shopId, range, today, lang),
    compareDays(shopId, range),
    salesReport(shopId, range, today, t),
  ]);
  const report = buildReport(input, formatRupees, t);
  const cashOut = input.days.reduce((sum, d) => sum + d.cashOut, 0);

  return (
    <ReportView
      range={range}
      report={report}
      lang={lang}
      t={t}
      afterProfit={
        <>
          {sales.bills.count > 0 && <BillKpis now={sales.bills} before={sales.billsBefore} t={t} />}
          {before && (
            <CompareCard
              range={range}
              now={totalsOf(input.days)}
              before={totalsOf(before)}
              lang={lang}
              t={t}
            />
          )}
          <WhatToDo actions={sales.actions} t={t} />
        </>
      }
      afterSpend={<OwnerTakeCard cashOut={cashOut} profit={report.profit} t={t} />}
      itemSections={
        <>
          {sales.stats.length > 0 && <TopItems stats={sales.stats} query={rangeQuery(range)} />}
          <PeakHoursChart peak={sales.peak} t={t} />
          <MarginMixChart rows={sales.mix} t={t} />
          <BoughtTogether pairs={sales.pairs} t={t} />
          <SlowMovers items={sales.slow} t={t} />
        </>
      }
    />
  );
}
