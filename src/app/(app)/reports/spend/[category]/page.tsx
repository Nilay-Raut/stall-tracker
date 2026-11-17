import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading } from "@/components/feature/reports/Loading";
import { rangeQuery } from "@/components/feature/reports/ReportExtras";
import { dayAndMonth, rangeLabel } from "@/components/feature/reports/ReportView";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import type { ExpenseCategory } from "@/domain/entry";
import { unitName } from "@/domain/materials";
import { type Translate, translator } from "@/i18n/translate";
import { businessDate } from "@/lib/dates";
import { CATEGORY_LABELS, PAID_FROM_LABELS } from "@/lib/labels";
import { formatRupees } from "@/lib/money";
import { resolveRange } from "@/lib/ranges";
import { requireShop } from "@/server/queries/shop";
import { type SpendEntry, spendEntries } from "@/server/reports";

export const metadata = { title: "Spending" };

const isCategory = (value: string): value is ExpenseCategory => value in CATEGORY_LABELS;

/** /reports/spend/raw_material?range=month — the expenses behind one spending row. */
export default function SpendPage({
  params,
  searchParams,
}: PageProps<"/reports/spend/[category]">) {
  return (
    <main className="flex flex-1 flex-col gap-3 px-5 pt-3.5 pb-6">
      <Suspense fallback={<Loading />}>
        <SpendContent params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

type Group = { name: string; amount: number; count: number };

/** Totals per name, biggest first; entries without a name are left out. */
function groupBy(list: SpendEntry[], name: (e: SpendEntry) => string | null): Group[] {
  const groups = new Map<string, Group>();
  for (const entry of list) {
    const key = name(entry);
    if (!key) continue;
    const group = groups.get(key) ?? { name: key, amount: 0, count: 0 };
    group.amount += entry.amount;
    group.count += 1;
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => b.amount - a.amount);
}

async function SpendContent({
  params,
  searchParams,
}: Pick<PageProps<"/reports/spend/[category]">, "params" | "searchParams">) {
  const { category } = await params;
  if (!isCategory(category)) notFound();
  const shop = await requireShop();
  const lang = shop.language;
  const t = translator(lang);
  const query = await searchParams;
  const range = resolveRange(query.range, businessDate(), query.from, query.to);
  const list = await spendEntries(shop.id, category, range.from, range.to);
  const total = list.reduce((sum, e) => sum + e.amount, 0);
  const bySupplier = groupBy(list, (e) => e.supplier);
  const byMaterial = groupBy(list, (e) => e.material);

  return (
    <>
      <ScreenHeader
        title={t(CATEGORY_LABELS[category])}
        back={{ href: `/reports?${rangeQuery(range)}`, label: t("Reports") }}
      />
      <Card tone="muted" className="gap-1 py-4">
        <span className="text-[13px] font-semibold text-muted">
          {rangeLabel(range.from, range.to, lang, t)}
        </span>
        <div className="font-display text-[34px] leading-none font-bold">{formatRupees(total)}</div>
        <span className="text-xs text-muted">
          {list.length === 1
            ? t("{count} expense", { count: list.length })
            : t("{count} expenses", { count: list.length })}
        </span>
      </Card>

      {byMaterial.length > 0 && <Groups title={t("By material")} groups={byMaterial} t={t} />}
      {bySupplier.length > 0 && <Groups title={t("By supplier")} groups={bySupplier} t={t} />}

      <section className="flex flex-col">
        <h2 className="pb-1 text-sm font-bold">{t("Every expense")}</h2>
        {list.length === 0 && (
          <p className="text-sm text-muted">{t("Nothing spent on this in the period.")}</p>
        )}
        {list.map((e) => (
          <div
            key={e.id}
            className="flex min-h-13 items-center justify-between gap-3 border-t border-line"
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">
                {e.material
                  ? e.quantity !== null && e.unit
                    ? `${e.material} · ${e.quantity.toLocaleString("en-IN")} ${unitName(e.unit, t)}`
                    : e.material
                  : t(CATEGORY_LABELS[category])}
              </span>
              <span className="truncate text-xs text-muted">
                {[
                  dayAndMonth(e.date, lang),
                  e.supplier,
                  e.paidFrom ? t(PAID_FROM_LABELS[e.paidFrom]) : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
            <span className="text-[15px] font-bold">{formatRupees(e.amount)}</span>
          </div>
        ))}
        {list.length === 500 && (
          <p className="text-xs text-muted">{t("Showing the latest 500.")}</p>
        )}
      </section>
    </>
  );
}

function Groups({ title, groups, t }: { title: string; groups: Group[]; t: Translate }) {
  const biggest = groups[0]?.amount || 1;
  return (
    <section className="flex flex-col">
      <h2 className="pb-1 text-sm font-bold">{title}</h2>
      {groups.map((g) => (
        <div key={g.name} className="flex flex-col gap-1 border-t border-line py-2.5">
          <div className="flex justify-between gap-3 text-sm">
            <span className="truncate font-semibold">{g.name}</span>
            <span className="font-bold">{formatRupees(g.amount)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-track">
            <div
              className="h-full bg-bar"
              style={{ width: `${Math.max((g.amount / biggest) * 100, 2)}%` }}
            />
          </div>
          <span className="text-xs text-muted">
            {g.count === 1 ? t("1 time") : t("{count} times", { count: g.count })}
          </span>
        </div>
      ))}
    </section>
  );
}
