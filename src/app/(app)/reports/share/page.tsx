import { Suspense } from "react";
import { Loading } from "@/components/feature/reports/Loading";
import { rangeQuery } from "@/components/feature/reports/ReportExtras";
import { rangeLabel } from "@/components/feature/reports/ReportView";
import { ShareFile } from "@/components/feature/reports/ShareFile";
import { SubHeader } from "@/components/feature/reports/SubHeader";
import { ButtonLink } from "@/components/ui/Button";
import { msg, translator } from "@/i18n/translate";
import { businessDate } from "@/lib/dates";
import { resolveRange } from "@/lib/ranges";
import { requireShop } from "@/server/queries/shop";

export const metadata = { title: "Share or download" };

/** /reports/share?range=… — the period's numbers as files, or a page to print or save as PDF. */
export default function SharePage({ searchParams }: PageProps<"/reports/share">) {
  return (
    <main className="flex flex-1 flex-col gap-3 px-5 pt-3.5 pb-6">
      <SubHeader title={msg("Share or download")} />
      <Suspense fallback={<Loading />}>
        <ShareContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ShareContent({ searchParams }: Pick<PageProps<"/reports/share">, "searchParams">) {
  const shop = await requireShop();
  const lang = shop.language;
  const t = translator(lang);
  const query = await searchParams;
  const range = resolveRange(query.range, businessDate(), query.from, query.to);
  const period = rangeLabel(range.from, range.to, lang, t);
  const file = (kind: string) => `stall-${kind}-${range.from}-to-${range.to}.csv`;
  const q = rangeQuery(range);

  return (
    <>
      <p className="text-sm">
        {t("Period: {period}. Change it on Reports with Week, Month or Custom.", { period })}
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold">{t("For a spreadsheet or your accountant")}</h2>
        <ShareFile
          url={`/api/export/days?${q}`}
          fileName={file("days")}
          label={t("One row per day (CSV)")}
        />
        <ShareFile
          url={`/api/export/entries?${q}`}
          fileName={file("entries")}
          label={t("Every entry (CSV)")}
        />
        <p className="text-xs text-muted">
          {t("CSV files open in Excel, Google Sheets and WhatsApp.")}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold">{t("As a page")}</h2>
        <ButtonLink href={`/reports/print?${q}`} variant="outline">
          {t("Print or save as PDF")}
        </ButtonLink>
      </section>
    </>
  );
}
