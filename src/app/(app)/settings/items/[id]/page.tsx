import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ItemForm } from "@/components/feature/items/ItemForm";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { translator } from "@/i18n/translate";
import { averagePlates, getItem } from "@/server/items";
import { requireShop } from "@/server/queries/shop";

export const metadata = { title: "Item" };

/** /settings/items/new adds an item; /settings/items/<id> edits one. */
export default function ItemPage({ params }: PageProps<"/settings/items/[id]">) {
  return (
    <main className="flex flex-1 flex-col gap-3 px-5 pt-3.5 pb-6">
      <Suspense fallback={<p className="py-10 text-center text-sm text-muted">…</p>}>
        <ItemContent params={params} />
      </Suspense>
    </main>
  );
}

async function ItemContent({ params }: Pick<PageProps<"/settings/items/[id]">, "params">) {
  const shop = await requireShop();
  const t = translator(shop.language);
  const { id } = await params;
  const isNew = id === "new";

  const item = isNew || !/^[0-9a-f-]{36}$/.test(id) ? null : await getItem(shop.id, id);
  if (!isNew && !item) notFound();
  const plates = item ? await averagePlates(shop.id, item.id) : null;

  return (
    <>
      <ScreenHeader
        title={isNew ? t("Add item") : t("Edit item")}
        back={{ href: "/settings/items", label: t("Items") }}
      />
      <ItemForm
        key={item ? `${item.id}-${item.updatedAt.toISOString()}` : "new"}
        item={item && { id: item.id, name: item.name, price: item.price, cost: item.cost }}
        averagePlates={plates}
      />
    </>
  );
}
