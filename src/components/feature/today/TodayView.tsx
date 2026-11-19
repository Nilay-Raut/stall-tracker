"use client";

import { AppLink } from "@/components/ui/AppLink";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePendingClose } from "@/client/closes";
import { useDaySwipe } from "@/client/gestures";
import { playCue } from "@/client/sound";
import { useDayView, useToday } from "@/client/localStore";
import { storeOfflineScreens } from "@/client/online";
import { InstallHint } from "@/components/feature/InstallHint";
import { DaySheet } from "@/components/feature/day/DaySheet";
import { Notice } from "@/components/ui/Notice";
import { computeClose } from "@/domain/dayClose";
import { useLang, useT } from "@/i18n/client";
import { computeDayTotals } from "@/domain/dayTotals";
import {
  type BusinessDate,
  businessTime,
  formatClock,
  formatDayLabel,
  shiftDate,
} from "@/lib/dates";
import { ENTRY_PATHS } from "@/lib/labels";
import { MorningCheck } from "./MorningCheck";
import { RestockNudge } from "./RestockNudge";
import { SyncLine } from "./SyncLine";

/**
 * The Today screen. Reads from the phone's storage, so it keeps working
 * offline; the server's latest data flows in through TodaySnapshot.
 */
export function TodayView() {
  const today = useToday();
  const view = useDayView(today);
  const snapshot = view.snapshot;
  const pendingClose = usePendingClose(today);
  const clock = useClock();
  const t = useT();
  const lang = useLang();
  useDaySwipe(today, today); // swipe right: yesterday

  // Load the add screens now, while there is internet, so "+ Sale" still opens
  // if the connection drops a moment later.
  const router = useRouter();
  useEffect(() => {
    for (const path of Object.values(ENTRY_PATHS)) router.prefetch(path);
  }, [router]);

  // Logged in with the shop loaded: have the service worker keep the plain screens ready.
  // A payment app adds UPI sales on the server: fetch them while Today is open.
  const polls = !!snapshot?.paymentsConnected;
  useEffect(() => {
    if (!polls) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) router.refresh();
    }, 30_000);
    return () => clearInterval(timer);
  }, [polls, router]);

  const shopLoaded = !!snapshot;
  useEffect(() => {
    if (shopLoaded) storeOfflineScreens();
  }, [shopLoaded]);

  // Shop name and Settings now live in the app bar and the tab bar.
  const header = (
    <header className="flex min-h-12 flex-col justify-center px-1">
      <span className="text-[13px] font-semibold text-muted">{t("Today")}</span>
      <h1 className="font-display text-[26px] leading-tight font-bold">
        {today ? formatDayLabel(today, lang) : t("Today")}
      </h1>
    </header>
  );

  if (view.storageError) {
    return (
      <>
        {header}
        <Notice title={t("This browser cannot save entries")}>
          {t("Private or incognito mode may be blocking storage. Open the app in a normal window.")}
        </Notice>
      </>
    );
  }

  if (!view.loaded || !snapshot) {
    // First visit on this phone: waiting for the server's data.
    return (
      <>
        {header}
        <p className="py-10 text-center text-sm text-muted" aria-live="polite">
          {t("Loading your shop…")}
        </p>
      </>
    );
  }

  // The snapshot is for its own date; after midnight it describes yesterday.
  const serverProfit =
    snapshot.date === today && typeof snapshot.closedProfit === "number"
      ? snapshot.closedProfit
      : null;
  // A close made on this phone that has not reached the server yet counts too.
  const localClose = pendingClose && !pendingClose.error ? pendingClose : null;
  const closedProfit =
    serverProfit ??
    (localClose
      ? computeClose(computeDayTotals(view.entries, snapshot.fixedCostPerDay), localClose.input)
          .profit
      : null);
  const closingTime = snapshot.closingTime;
  const pastClosing = !!closingTime && closedProfit === null && clock >= closingTime;
  // Morning drawer check: a shop that enters sales, before its first entry of the day.
  const morningCheckDue =
    closedProfit === null && snapshot.salesMode !== "totals" && view.entries.length === 0;
  // An earlier day with entries that was never closed (from the server; gone once closed).
  const unclosed =
    snapshot.unclosedDate && today && snapshot.unclosedDate < today ? snapshot.unclosedDate : null;

  return (
    <>
      {header}
      <SyncLine />
      <InstallHint />
      <TodaySounds today={today} entries={view.entries} pastClosing={pastClosing} />
      {unclosed && (
        <AppLink
          href={`/close?date=${unclosed}`}
          className="flex items-center justify-between gap-3 rounded-card bg-warn-bg px-3.5 py-3 text-warn-ink"
        >
          <span className="text-sm font-bold">
            {unclosed === shiftDate(today ?? unclosed, -1)
              ? t("Yesterday was not closed. Close it now.")
              : t("{day} was not closed. Close it now.", {
                  day: formatDayLabel(unclosed, lang),
                })}
          </span>
          <span aria-hidden>›</span>
        </AppLink>
      )}
      {pastClosing && (
        <AppLink
          href="/close/today"
          className="flex items-center justify-between rounded-card bg-warn-bg px-3.5 py-3 text-warn-ink"
        >
          <span className="text-sm font-bold">
            {t("It is past closing time ({time}). Close the day.", {
              time: formatClock(closingTime),
            })}
          </span>
          <span aria-hidden>›</span>
        </AppLink>
      )}
      {today && snapshot.date === today && snapshot.close && morningCheckDue && (
        <MorningCheck today={today} openingCash={snapshot.close.openingCash} />
      )}
      {today && snapshot.date === today && closedProfit === null && (
        <RestockNudge today={today} hints={snapshot.restock ?? []} />
      )}
      <DaySheet
        date={today ?? snapshot.date}
        isToday
        entries={view.entries}
        pending={view.pending}
        fixedCost={snapshot.fixedCostPerDay}
        salesMode={snapshot.salesMode}
        closedProfit={closedProfit}
        dailyTarget={snapshot.date === today ? (snapshot.dailyTarget ?? null) : null}
        closedPending={serverProfit === null && localClose !== null}
        fixedInProfit={snapshot.fixedCostInDailyProfit ?? true}
        openingCash={
          snapshot.date === today
            ? (snapshot.close?.openingCash ?? null)
            : // Just after midnight, before today's data arrives: the last known
              // count (yesterday's close), else yesterday's opening.
              (snapshot.close?.previous?.countedCash ?? snapshot.close?.openingCash ?? null)
        }
        upiStart={snapshot.date === today ? (snapshot.upiStart ?? null) : null}
        closeInput={
          localClose?.input ?? (snapshot.date === today ? (snapshot.close?.previous ?? null) : null)
        }
      />
    </>
  );
}

const ALERT_KEY = "stall-closing-alert";

/**
 * Sounds while Today is open: a chime when a UPI payment adds a sale by itself,
 * and one alert a day when closing time comes and the day is still open.
 */
function TodaySounds({
  today,
  entries,
  pastClosing,
}: {
  today: BusinessDate | null;
  entries: ReadonlyArray<{ id: string; paidVia?: string | null }>;
  pastClosing: boolean;
}) {
  // Payment sales seen so far; null until the first list, which must not chime.
  const seen = useRef<Set<string> | null>(null);
  const paidIds = entries.filter((e) => e.paidVia).map((e) => e.id);
  const paidKey = paidIds.join(",");
  useEffect(() => {
    const ids = paidKey ? paidKey.split(",") : [];
    const before = seen.current;
    seen.current = new Set(ids);
    if (before && ids.some((id) => !before.has(id))) playCue("payment");
  }, [paidKey]);

  useEffect(() => {
    if (!pastClosing || !today) return;
    let played: string | null = null;
    try {
      played = localStorage.getItem(ALERT_KEY);
    } catch {
      // Storage blocked: may alert again after a reload, which is fine.
    }
    if (played === today) return;
    if (playCue("alert")) {
      try {
        localStorage.setItem(ALERT_KEY, today);
      } catch {
        // see above
      }
    }
  }, [pastClosing, today]);

  return null;
}

/** India time as "HH:MM", updated every minute (for the closing-time banner). */
function useClock(): string {
  const [now, setNow] = useState("00:00");
  useEffect(() => {
    const tick = () => setNow(businessTime());
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
