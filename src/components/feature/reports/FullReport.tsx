import { totalsOf } from "@/domain/analysis";
import { buildReport } from "@/domain/report";
import { translator } from "@/i18n/translate";
import type { BusinessDate, Lang } from "@/lib/dates";
import { formatRupees } from "@/lib/money";
import type { Range } from "@/lib/ranges";
import { compareDays, getReportInput } from "@/server/reports";
import { CompareCard, OwnerTakeCard } from "./ReportExtras";
import { ReportView } from "./ReportView";

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
  const [input, before] = await Promise.all([
    getReportInput(shopId, range, today, lang),
    compareDays(shopId, range),
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
        before && (
          <CompareCard
            range={range}
            now={totalsOf(input.days)}
            before={totalsOf(before)}
            lang={lang}
            t={t}
          />
        )
      }
      afterSpend={<OwnerTakeCard cashOut={cashOut} profit={report.profit} t={t} />}
    />
  );
}
