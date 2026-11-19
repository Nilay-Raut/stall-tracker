"use client";

import Link from "next/link";
import { useEffect } from "react";
import { applyDayEntries } from "@/client/entries";
import { useDaySwipe } from "@/client/gestures";
import { useDayView, useToday } from "@/client/localStore";
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
  fixedInProfit: boolean;
};

/**
 * An earlier day, opened from the Calendar: fill in what was missed, fix
 * entries, close the day. The day's entries are stored on the phone so they
 * can be edited the same way as today's.
 */
export function DayScreen({
  date,
  serverEntries,
  fixedCost,
  salesMode,
  closedProfit,
  fixedInProfit,
}: Props) {
  const view = useDayView(date);
  useDaySwipe(date, useToday()); // swipe between days
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
          fixedInProfit={fixedInProfit}
        />
      ) : (
        <LoadingNote />
      )}
    </>
  );
}
