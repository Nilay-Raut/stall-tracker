"use client";

import { plateCountsFromBills } from "@/domain/bill";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { queueClose, usePendingClose } from "@/client/closes";
import { localDb } from "@/client/localDb";
import { useDayView, useShopSnapshot, useToday } from "@/client/localStore";
import { syncNow } from "@/client/sync";
import { AppLink } from "@/components/ui/AppLink";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { computeClose } from "@/domain/dayClose";
import { computeDayTotals } from "@/domain/dayTotals";
import { plateInsight } from "@/domain/plates";
import { useLang, useT } from "@/i18n/client";
import { msg } from "@/i18n/translate";
import { type CloseSubmission, DRAWER_SHORT, readCloseForm } from "@/lib/closeForm";
import { formatDayLabel } from "@/lib/dates";
import { summaryNotes } from "@/lib/summaryNotes";
import type { FormState } from "@/server/actions/formState";
import type { CloseContext } from "@/server/days";
import { CloseForm } from "./CloseForm";
import { DaySummaryView } from "./DaySummaryView";

const REFUSALS: Record<string, string> = {
  "drawer-short": DRAWER_SHORT,
  "date-out-of-range": msg("This day can no longer be closed."),
  invalid: msg("Something in the close was not valid. Check the amounts."),
};

/**
 * Close day for today, worked out on the phone from its own entries, so it also
 * works offline. The close is queued like an entry: online it is sent at once and
 * the usual summary opens; offline the summary is shown from the phone's figures.
 */
export function CloseTodayScreen() {
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const today = useToday();
  const snapshot = useShopSnapshot();
  const view = useDayView(today);
  const pending = usePendingClose(today);
  const [shownSummary, setShownSummary] = useState<CloseSubmission | null>(null);

  const ready = today && view.loaded && pending !== undefined;
  const info = snapshot?.date === today ? snapshot?.close : undefined;

  // Built from the phone's data; useActionState always calls the newest save action,
  // so the action below sees the latest figures.
  const context: CloseContext | null =
    ready && snapshot && info
      ? {
          date: today,
          entered: computeDayTotals(view.entries, snapshot.fixedCostPerDay),
          cashSaleCount: view.entries.filter((e) => e.type === "sale" && e.paymentMode === "cash")
            .length,
          upiSaleCount: view.entries.filter((e) => e.type === "sale" && e.paymentMode === "upi")
            .length,
          openingCash: pending?.input.openingCash ?? info.openingCash,
          previousClose: pending?.input ?? info.previous,
          plateItems: info.plateItems,
          previousCounts: pending
            ? Object.fromEntries((pending.plateCounts ?? []).map((c) => [c.itemId, c.quantity]))
            : info.previousCounts,
          billCounts: plateCountsFromBills(view.entries),
        }
      : null;

  const saveOnPhone = async (_prev: FormState, formData: FormData): Promise<FormState> => {
    const ctx = context;
    if (!ctx) return { error: msg("The shop's data is not on this phone yet.") };
    const read = readCloseForm(
      formData,
      ctx.plateItems.map((i) => i.id),
    );
    if ("fieldErrors" in read) return { fieldErrors: read.fieldErrors };
    if (computeClose(ctx.entered, read.ok.input).cashSales < 0) {
      return { fieldErrors: { countedCash: DRAWER_SHORT } };
    }

    await queueClose(read.ok);
    if (navigator.onLine) await syncNow().catch(() => {});

    const stillWaiting = await (await localDb()).get("closes", read.ok.date);
    if (!stillWaiting) {
      router.push(`/summary/${read.ok.date}`); // on the server: the full summary
      return {};
    }
    if (stillWaiting.error) {
      return {
        error: REFUSALS[stillWaiting.error] ?? msg("The server could not save this close."),
      };
    }
    setShownSummary(read.ok); // offline: the summary from the phone's figures
    return {};
  };

  const header = (
    <header className="grid min-h-12 grid-cols-[1fr_auto_1fr] items-center">
      <AppLink href="/" className="flex min-h-11 items-center text-[15px] font-semibold">
        ‹ {t("Today")}
      </AppLink>
      <h1 className="font-display text-xl font-bold">
        {context?.previousClose ? t("Edit closed day") : t("Close day")}
      </h1>
      <span className="text-right text-[13px] text-muted">
        {today ? formatDayLabel(today, lang) : ""}
      </span>
    </header>
  );

  if (!ready) return <p className="py-10 text-center text-sm text-muted">{t("Loading…")}</p>;

  if (!context || !snapshot) {
    return (
      <>
        {header}
        <Notice title={t("Open Today once with internet first")}>
          {t("The phone needs today's shop details before it can close the day without signal.")}
        </Notice>
        <ButtonLink href="/close" variant="outline">
          {t("Close with internet")}
        </ButtonLink>
      </>
    );
  }

  if (shownSummary) {
    const result = computeClose(context.entered, shownSummary.input);
    const prices = new Map(context.plateItems.map((i) => [i.id, i]));
    const plates = (shownSummary.plateCounts ?? []).flatMap((c) => {
      const item = prices.get(c.itemId);
      return item
        ? [{ name: item.name, quantity: c.quantity, price: item.price, cost: item.cost }]
        : [];
    });
    return (
      <DaySummaryView
        date={context.date}
        sales={result.sales}
        cashSales={result.cashSales}
        upiSales={shownSummary.input.upiTotal}
        expenses={result.expenses}
        fixedCost={result.fixedCost}
        profit={result.profit}
        dayTarget={snapshot.dailyTarget ?? null}
        insight={plateInsight(plates)}
        lang={lang}
        notes={summaryNotes(
          {
            cashDifference: context.cashSaleCount > 0 ? result.cashDifference : null,
            cashOut: context.entered.cashOut,
            waste: shownSummary.input.waste,
            cashLeft: result.cashLeft,
            sales: result.sales,
            lastWeek: null,
          },
          t,
          lang,
        )}
        banner={
          <Notice title={t("Saved on this phone")}>
            {t("It will be sent when you are back online. Nothing else to do.")}
          </Notice>
        }
        footer={
          <>
            <Button variant="outline" size="lg" onClick={() => setShownSummary(null)}>
              {t("Edit day")}
            </Button>
            <ButtonLink href="/" size="lg">
              {t("Done")}
            </ButtonLink>
          </>
        }
      />
    );
  }

  return (
    <>
      {header}
      {pending?.error && (
        <Notice title={t("This close was not saved")}>
          {t(REFUSALS[pending.error] ?? msg("The server could not save it."))}{" "}
          {t("Correct it and save again.")}
        </Notice>
      )}
      <CloseForm
        key={`${context.date}-${pending?.updatedAt ?? "new"}`}
        context={context}
        action={saveOnPhone}
        waitForEntries={false}
      />
    </>
  );
}
