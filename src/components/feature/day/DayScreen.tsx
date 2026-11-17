"use client";

import Link from "next/link";
import { useEffect } from "react";
import { applyDayEntries } from "@/client/entries";
import { useDayView } from "@/client/localStore";
import type { Entry } from "@/domain/entry";
import { useLang, useT } from "@/i18n/client";
import { type BusinessDate, formatDayLabel } from "@/lib/dates";
import type { Paise } from "@/lib/money";
import { DaySheet } from "./DaySheet";
import { LoadingNote } from "./LoadingNote";
import type { SalesMode } from "@/domain/entry";

type Props = {
  date: BusinessDate;
  serverEntries: Entry[];
  fixedCost: Paise;
  salesMode: SalesMode;
  closedProfit: Paise | null;
};

/**
 * An earlier day, opened from the Calendar: fill in what was missed, fix
 * entries, close the day. The day's entries are stored on the phone so they
 * can be edited the same way as today's.
 */
export function DayScreen({ date, serverEntries, fixedCost, salesMode, closedProfit }: Props) {
  const view = useDayView(date);
  const t = useT();
  const lang = useLang();

  useEffect(() => {
    applyDayEntries(date, serverEntries).catch((error) =>
      console.error("Could not store this day's entries on the phone", error),
    );
  }, [date, serverEntries]);

  return (
    <>
      <header className="flex min-h-12 items-center justify-between">
        <Link href="/calendar" className="flex min-h-11 items-center text-[15px] font-semibold">
          ‹ {t("Calendar")}
        </Link>
        <h1 className="font-display text-xl font-bold">{formatDayLabel(date, lang)}</h1>
      </header>
      {view.loaded ? (
        <DaySheet
          date={date}
          isToday={false}
          entries={view.entries}
          pending={view.pending}
          fixedCost={fixedCost}
          salesMode={salesMode}
          closedProfit={closedProfit}
        />
      ) : (
        <LoadingNote />
      )}
    </>
  );
}
