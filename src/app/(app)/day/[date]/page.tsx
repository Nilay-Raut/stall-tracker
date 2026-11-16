import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DayScreen } from "@/components/feature/day/DayScreen";
import { LoadingNote } from "@/components/feature/day/LoadingNote";
import { businessDate } from "@/lib/dates";
import { closedProfit, getCloseContext } from "@/server/days";
import { getDayEntries } from "@/server/entries";
import { requireShop } from "@/server/queries/shop";

export const metadata = { title: "Day" };

export default function DayPage({ params }: PageProps<"/day/[date]">) {
  return (
    <main className="flex flex-1 flex-col gap-3 px-5 pt-3.5 pb-6">
      <Suspense fallback={<LoadingNote />}>
        <DayContent params={params} />
      </Suspense>
    </main>
  );
}

async function DayContent({ params }: Pick<PageProps<"/day/[date]">, "params">) {
  const shop = await requireShop();
  const { date } = await params;
  const today = businessDate();
  if (date === today) redirect("/");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today) redirect("/calendar");

  const [entries, context, profit] = await Promise.all([
    getDayEntries(shop.id, date, { withDeleted: true }),
    getCloseContext(shop, date),
    closedProfit(shop.id, date),
  ]);

  return (
    <DayScreen
      date={date}
      serverEntries={entries}
      fixedCost={context.entered.fixedCost}
      salesMode={shop.salesMode}
      closedProfit={profit}
    />
  );
}
