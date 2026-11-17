import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { Loading } from "@/components/feature/reports/Loading";
import { FullReport } from "@/components/feature/reports/FullReport";
import { MoreLinks } from "@/components/feature/reports/ReportExtras";
import { rangeLabel } from "@/components/feature/reports/ReportView";
import { AsOf } from "@/components/ui/AsOf";
import { Button } from "@/components/ui/Button";
import { type Translate, msg, translator } from "@/i18n/translate";
import { cn } from "@/lib/cn";
import { businessDate } from "@/lib/dates";
import { type Range, resolveRange } from "@/lib/ranges";
import { requireShop } from "@/server/queries/shop";

export const metadata = { title: "Reports" };

/** /reports?range=week|month|custom&from=YYYY-MM-DD&to=YYYY-MM-DD */
export default function ReportsPage({ searchParams }: PageProps<"/reports">) {
  return (
    <Suspense fallback={<Loading />}>
      <ReportsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ReportsContent({ searchParams }: Pick<PageProps<"/reports">, "searchParams">) {
  const shop = await requireShop();
  const lang = shop.language;
  const t = translator(lang);
  const today = businessDate();
  const params = await searchParams;
  const range = resolveRange(params.range, today, params.from, params.to);
  return (
    <>
      <header className="flex min-h-12 items-center justify-between">
        <h1 className="font-display text-2xl font-bold">{t("Reports")}</h1>
        <span className="text-[13px] text-muted">{rangeLabel(range.from, range.to, lang, t)}</span>
      </header>
      <AsOf lang={shop.language} />
      <RangePicker range={range} today={today} t={t} />
      <FullReport shopId={shop.id} range={range} today={today} lang={lang} />
      <MoreLinks range={range} t={t} />
    </>
  );
}

const TABS = [
  { kind: "today", label: msg("Today") },
  { kind: "week", label: msg("Week") },
  { kind: "month", label: msg("Month") },
  { kind: "custom", label: msg("Custom") },
] as const;

/** Week / Month / Custom. Links and a GET form: they also work before the page's script loads. */
function RangePicker({ range, today, t }: { range: Range; today: string; t: Translate }) {
  return (
    <div className="flex flex-col gap-2">
      <nav
        aria-label={t("Report period")}
        className="grid h-12 grid-cols-4 gap-1 rounded-full glass-soft p-1"
      >
        {TABS.map((tab) => (
          <Link
            key={tab.kind}
            href={
              tab.kind === "custom"
                ? `/reports?range=custom&from=${range.from}&to=${range.to}`
                : `/reports?range=${tab.kind}`
            }
            aria-current={range.kind === tab.kind ? "page" : undefined}
            className={cn(
              "flex press items-center justify-center rounded-full text-[13px]",
              range.kind === tab.kind ? "bg-ink font-bold text-paper" : "font-semibold text-muted",
            )}
          >
            {t(tab.label)}
          </Link>
        ))}
      </nav>
      {range.kind === "custom" && (
        <Form action="/reports" className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
          <input type="hidden" name="range" value="custom" />
          <DateField label={t("From")} name="from" value={range.from} max={today} />
          <DateField label={t("To")} name="to" value={range.to} max={today} />
          <Button type="submit" variant="outline" className="min-h-11">
            {t("Show")}
          </Button>
        </Form>
      )}
    </div>
  );
}

function DateField({
  label,
  name,
  value,
  max,
}: {
  label: string;
  name: string;
  value: string;
  max: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
      {label}
      <input
        type="date"
        name={name}
        defaultValue={value}
        max={max}
        className="h-11 w-full min-w-0 rounded-control border border-edge bg-field px-2 text-sm text-ink"
      />
    </label>
  );
}
