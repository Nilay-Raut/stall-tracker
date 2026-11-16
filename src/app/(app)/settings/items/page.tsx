import Link from "next/link";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { workOutMargin } from "@/domain/itemMargin";
import { translator } from "@/i18n/translate";
import { businessDate } from "@/lib/dates";
import { formatRupees } from "@/lib/money";
import { listItems } from "@/server/items";
import { requireShop } from "@/server/queries/shop";
import { latestMaterialRise } from "@/server/reports";

export const metadata = { title: "Items" };

/** Items and margins (wireframe screen 11). */
export default function ItemsPage() {
  return (
    <main className="flex flex-1 flex-col gap-3 px-5 pt-3.5 pb-6">
      <Suspense fallback={<p className="py-10 text-center text-sm text-muted">…</p>}>
        <ItemsContent />
      </Suspense>
    </main>
  );
}

async function ItemsContent() {
  const shop = await requireShop();
  const t = translator(shop.language);
  const [itemRows, rise] = await Promise.all([
    listItems(shop.id),
    latestMaterialRise(shop.id, businessDate(), shop.language),
  ]);
  const items = itemRows.map((item) => ({
    ...item,
    ...workOutMargin(item.price, "cost", item.cost),
  }));
  const percents = items.map((i) => Math.round(i.percent));

  return (
    <>
      <ScreenHeader title={t("Items")} back={{ href: "/setup", label: t("Settings") }} />
      {items.length > 0 && (
        <section className="grid grid-cols-3 gap-2">
          <Stat label={t("Items")} value={String(items.length)} />
          <Stat label={t("Best margin")} value={`${Math.max(...percents)}%`} />
          <Stat label={t("Lowest margin")} value={`${Math.min(...percents)}%`} />
        </section>
      )}

      <section className="flex flex-col">
        <div className="grid grid-cols-[1fr_5.25rem] gap-2 pb-1.5 text-xs font-semibold text-muted">
          <span>{t("Item, price and cost")}</span>
          <span className="text-right">{t("Margin a plate")}</span>
        </div>
        {items.length === 0 && (
          <p className="border-t border-line py-4 text-sm text-muted">
            {t(
              "No items yet. Add the things you sell to count plates at closing and see which earn the most.",
            )}
          </p>
        )}
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/settings/items/${item.id}`}
            className="grid min-h-15 grid-cols-[1fr_5.25rem_0.75rem] items-center gap-2 border-t border-line"
          >
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px] font-semibold">{item.name}</span>
              <span className="text-xs text-muted">
                {t("Price {price} · Cost {cost}", {
                  price: formatRupees(item.price),
                  cost: formatRupees(item.cost),
                })}
              </span>
            </span>
            <span className="flex flex-col gap-0.5 text-right">
              <span className={item.margin < 0 ? "font-bold text-danger" : "font-bold"}>
                {formatRupees(item.margin)}
              </span>
              <span className="text-xs text-muted">
                {t("{percent}% of price", { percent: Math.round(item.percent) })}
              </span>
            </span>
            <span aria-hidden className="text-muted">
              ›
            </span>
          </Link>
        ))}
      </section>

      {rise && items.length > 0 && (
        <Notice
          title={t("{material} is up {amount} a {unit} since {since}", {
            material: rise.name,
            amount: formatRupees(rise.to - rise.from),
            unit: rise.unit,
            since: rise.since,
          })}
        >
          {t("Recheck the cost of items that use {material} so their margins stay correct.", {
            material: rise.name.toLowerCase(),
          })}
        </Notice>
      )}

      <p className="text-xs text-muted">
        {t(
          "Margin is price minus the cost to make one plate. Rent, salary and other fixed costs are counted separately.",
        )}
      </p>

      <ButtonLink href="/settings/items/new" size="lg" className="mt-auto">
        {t("+ Add item")}
      </ButtonLink>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-card bg-surface px-3 py-2.5">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}
