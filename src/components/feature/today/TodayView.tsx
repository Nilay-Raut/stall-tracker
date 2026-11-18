"use client";

import { AppLink } from "@/components/ui/AppLink";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePendingClose } from "@/client/closes";
import { useDayView, useToday } from "@/client/localStore";
import { storeOfflineScreens } from "@/client/online";
import { InstallHint } from "@/components/feature/InstallHint";
import { DaySheet } from "@/components/feature/day/DaySheet";
import { Notice } from "@/components/ui/Notice";
import { computeClose } from "@/domain/dayClose";
import { useLang, useT } from "@/i18n/client";
import { computeDayTotals } from "@/domain/dayTotals";
import { businessTime, formatClock, formatDayLabel } from "@/lib/dates";
import { ENTRY_PATHS } from "@/lib/labels";
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

  return (
    <>
      {header}
      <SyncLine />
      <InstallHint />
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
      />
    </>
  );
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
