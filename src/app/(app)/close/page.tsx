import Link from "next/link";
import { Suspense } from "react";
import { CloseForm } from "@/components/feature/close/CloseForm";
import { translator } from "@/i18n/translate";
import { businessDate, formatDayLabel } from "@/lib/dates";
import { getCloseContext } from "@/server/days";
import { requireShop } from "@/server/queries/shop";

export const metadata = { title: "Close day" };

/** /close closes today; /close?date=YYYY-MM-DD closes (or edits) an earlier day. */
export default function ClosePage({ searchParams }: PageProps<"/close">) {
  return (
    <main className="flex flex-1 flex-col gap-3 px-5 pt-3.5 pb-6">
      <Suspense fallback={<p className="py-10 text-center text-sm text-muted">Loading…</p>}>
        <CloseContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function CloseContent({ searchParams }: Pick<PageProps<"/close">, "searchParams">) {
  const shop = await requireShop();
  const today = businessDate();
  const asked = (await searchParams).date;
  const date =
    typeof asked === "string" && /^\d{4}-\d{2}-\d{2}$/.test(asked) && asked <= today
      ? asked
      : today;
  const context = await getCloseContext(shop, date);
  const t = translator(shop.language);

  return (
    <>
      <header className="grid min-h-12 grid-cols-[1fr_auto_1fr] items-center">
        <Link href="/" className="flex min-h-11 items-center text-[15px] font-semibold">
          ‹ {t("Today")}
        </Link>
        <h1 className="font-display text-xl font-bold">
          {context.previousClose ? t("Edit closed day") : t("Close day")}
        </h1>
        <span className="text-right text-[13px] text-muted">
          {formatDayLabel(date, shop.language)}
        </span>
      </header>
      <CloseForm context={context} />
    </>
  );
}
