import Link from "next/link";
import { Suspense } from "react";
import { Loading } from "@/components/feature/reports/Loading";
import { PricesHeader } from "@/components/feature/reports/PricesHeader";
import { dayAndMonth } from "@/components/feature/reports/ReportView";
import { Card } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { unitName } from "@/domain/materials";
import { priceSummary } from "@/domain/prices";
import { translator } from "@/i18n/translate";
import { formatMonthName } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { formatRupees, formatSignedRupees } from "@/lib/money";
import { requireShop } from "@/server/queries/shop";
import { listMaterials, materialPurchases } from "@/server/reports";

export const metadata = { title: "Supplier prices" };

/** Supplier prices (wireframe screen 10). /reports/prices?material=<id> */
export default function PricesPage({ searchParams }: PageProps<"/reports/prices">) {
  return (
    <main className="flex flex-1 flex-col gap-3 px-5 pt-3.5 pb-6">
      <PricesHeader />
      <Suspense fallback={<Loading />}>
        <PricesContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

const quantityText = (q: number) => q.toLocaleString("en-IN", { maximumFractionDigits: 3 });

async function PricesContent({ searchParams }: Pick<PageProps<"/reports/prices">, "searchParams">) {
  const shop = await requireShop();
  const lang = shop.language;
  const t = translator(lang);
  const day = (date: string) => dayAndMonth(date, lang); // "13 Nov"
  const materials = await listMaterials(shop.id);
  if (materials.length === 0) {
    return (
      <p className="text-sm text-muted">
        {t(
          'No purchases yet. When you add an expense, fill in "Material details" (what, how much, from whom) to see prices here.',
        )}
      </p>
    );
  }

  const asked = (await searchParams).material;
  const material = materials.find((m) => m.id === asked) ?? materials[0];
  const records = await materialPurchases(shop.id, material.id);
  const summary = priceSummary(records);
  const unit = summary ? unitName(summary.unit, t) : "";

  return (
    <>
      <nav aria-label={t("Material")} className="flex gap-2 overflow-x-auto pb-1">
        {materials.map((m) => (
          <Link
            key={m.id}
            href={`/reports/prices?material=${m.id}`}
            aria-current={m.id === material.id ? "page" : undefined}
            className={cn(
              "flex min-h-11 shrink-0 items-center rounded-control border-[1.5px] border-ink px-4 text-[13px]",
              m.id === material.id ? "bg-ink font-bold text-white" : "font-semibold",
            )}
          >
            {m.name}
          </Link>
        ))}
      </nav>

      {!summary ? (
        <p className="text-sm text-muted">
          {t("No purchases of {name} yet.", { name: material.name })}
        </p>
      ) : (
        <>
          <Card tone="muted" className="gap-1.5 py-4">
            <span className="text-[13px] font-semibold text-muted">
              {t("{name}, latest rate", { name: material.name })}
            </span>
            <div className="font-display text-[40px] leading-none font-bold">
              {formatRupees(summary.latestRate)}{" "}
              <span className="font-sans text-base font-semibold text-muted">
                {t("a {unit}", { unit })}
              </span>
            </div>
            <div className="mt-1 flex flex-col">
              {summary.months.map((m) => (
                <div key={m.month} className="grid grid-cols-[1fr_auto_4.5rem] gap-2 text-sm">
                  <span>{formatMonthName(m.month, lang)}</span>
                  <span className="font-semibold">{formatRupees(m.rate)}</span>
                  <span className="text-right text-muted">
                    {m.change === null
                      ? t("start")
                      : m.change === 0
                        ? t("same")
                        : formatSignedRupees(m.change)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {summary.riseCost && (
            <Notice
              title={t("This rise costs about {amount} more a month", {
                amount: formatRupees(summary.riseCost.monthly),
              })}
            >
              {t(
                "You buy about {quantity} {unit} a month, at {amount} more per {unit} than the month before.",
                {
                  quantity: quantityText(summary.monthlyQuantity),
                  unit,
                  amount: formatRupees(summary.riseCost.perUnit),
                },
              )}
            </Notice>
          )}

          {summary.suppliers.length > 0 && (
            <section className="flex flex-col">
              <h2 className="pb-1 text-sm font-bold">{t("Compare suppliers")}</h2>
              {summary.suppliers.map((s) => (
                <div
                  key={s.name}
                  className="flex min-h-13 items-center justify-between border-t border-line"
                >
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold">{s.name}</span>
                    <span className="text-xs text-muted">
                      {t("Last bought {date}", { date: day(s.lastDate) })}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    {s.cheapest && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-ink">
                        {t("Cheaper")}
                      </span>
                    )}
                    <span className="text-[15px] font-bold">{formatRupees(s.rate)}</span>
                  </span>
                </div>
              ))}
              {summary.switchSaving && (
                <p className="border-t border-line pt-2 text-[13px] text-muted">
                  {t(
                    "Buying only from {supplier} saves {perUnit} a {unit}, about {monthly} a month.",
                    {
                      supplier: summary.switchSaving.supplier,
                      perUnit: formatRupees(summary.switchSaving.perUnit),
                      unit,
                      monthly: formatRupees(summary.switchSaving.monthly),
                    },
                  )}
                </p>
              )}
            </section>
          )}

          <section className="flex flex-col">
            <h2 className="pb-1 text-sm font-bold">{t("Purchase history")}</h2>
            {records.slice(0, 15).map((r, i) => (
              <div
                key={`${r.date}-${i}`}
                className="grid min-h-11 grid-cols-[3.75rem_1fr_auto] items-center gap-2 border-t border-line text-sm"
              >
                <span className="text-xs text-muted">{day(r.date)}</span>
                <span>
                  {quantityText(r.quantity)} {unitName(r.unit, t)} · {formatRupees(r.amount)}
                  {r.supplier && ` · ${r.supplier}`}
                </span>
                <span className="font-semibold">{formatRupees(r.rate)}</span>
              </div>
            ))}
          </section>
        </>
      )}
    </>
  );
}
