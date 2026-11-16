import Link from "next/link";
import { Suspense } from "react";
import { FullReport } from "@/components/feature/reports/FullReport";
import { Loading } from "@/components/feature/reports/Loading";
import { PrintButton } from "@/components/feature/reports/PrintButton";
import { rangeQuery } from "@/components/feature/reports/ReportExtras";
import { rangeLabel } from "@/components/feature/reports/ReportView";
import { AsOf } from "@/components/ui/AsOf";
import { translator } from "@/i18n/translate";
import { businessDate } from "@/lib/dates";
import { resolveRange } from "@/lib/ranges";
import { requireShop } from "@/server/queries/shop";

export const metadata = { title: "Report" };

/** /reports/print?range=… — the report on its own page, laid out for printing or PDF. */
export default function PrintPage({ searchParams }: PageProps<"/reports/print">) {
  return (
    <main className="flex flex-1 flex-col gap-3 px-5 pt-3.5 pb-6">
      <Suspense fallback={<Loading />}>
        <PrintContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function PrintContent({ searchParams }: Pick<PageProps<"/reports/print">, "searchParams">) {
  const shop = await requireShop();
  const lang = shop.language;
  const t = translator(lang);
  const today = businessDate();
  const query = await searchParams;
  const range = resolveRange(query.range, today, query.from, query.to);

  return (
    <>
      <Link
        href={`/reports/share?${rangeQuery(range)}`}
        className="flex min-h-11 items-center text-[15px] font-semibold print:hidden"
      >
        ‹ {t("Share or download")}
      </Link>
      <PrintButton />
      <header className="flex flex-col">
        <h1 className="font-display text-2xl font-bold">{shop.name}</h1>
        <span className="text-sm text-muted">
          {t("Report for {period}", { period: rangeLabel(range.from, range.to, lang, t) })}
        </span>
      </header>
      <AsOf lang={lang} />
      <FullReport shopId={shop.id} range={range} today={today} lang={lang} />
    </>
  );
}
