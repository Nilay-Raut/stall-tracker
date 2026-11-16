import { Suspense } from "react";
import { CalendarView } from "@/components/feature/calendar/CalendarView";
import { AsOf } from "@/components/ui/AsOf";
import { isMonth, monthOf } from "@/lib/calendar";
import { businessDate } from "@/lib/dates";
import { getMonthDays } from "@/server/days";
import { requireShop } from "@/server/queries/shop";

export const metadata = { title: "Calendar" };

/** /calendar shows this month; /calendar?month=YYYY-MM an earlier one. */
export default function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-sm text-muted">Loading…</p>}>
      <CalendarContent searchParams={searchParams} />
    </Suspense>
  );
}

async function CalendarContent({ searchParams }: Pick<PageProps<"/calendar">, "searchParams">) {
  const shop = await requireShop();
  const today = businessDate();
  const asked = (await searchParams).month;
  const month = isMonth(asked) && asked <= monthOf(today) ? asked : monthOf(today);
  const days = await getMonthDays(shop.id, month);

  // Keyed by month so the picked day resets when the month changes.
  return (
    <>
      <CalendarView key={month} month={month} today={today} days={days} />
      <AsOf lang={shop.language} />
    </>
  );
}
