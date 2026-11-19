"use client";

import { CircleCheck, ChevronRight, Smartphone, Wallet } from "lucide-react";
import { AppLink } from "@/components/ui/AppLink";
import type { OutboxRow } from "@/client/localDb";
import { useState } from "react";
import { EntryList } from "@/components/feature/today/EntryList";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { computeDayTotals } from "@/domain/dayTotals";
import type { Entry } from "@/domain/entry";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";
import type { BusinessDate } from "@/lib/dates";
import { ENTRY_PATHS } from "@/lib/labels";
import { type Paise, formatRupees, parseRupeeInput } from "@/lib/money";
import { RepeatSale } from "./RepeatSale";
import { type SalesMode, takesSaleEntries } from "@/domain/entry";

type Props = {
  date: BusinessDate;
  isToday: boolean;
  entries: Entry[];
  pending: Map<string, OutboxRow>;
  fixedCost: Paise;
  salesMode: SalesMode;
  /** Profit from the closing count, if the day is closed. */
  closedProfit: Paise | null;
  /** The day's sales target (from the monthly profit target), if one is set. */
  dailyTarget?: Paise | null;
  /** Closed on this phone but not on the server yet (offline close). */
  closedPending?: boolean;
  /** False when the owner keeps fixed costs out of the day's profit (Settings). */
  fixedInProfit?: boolean;
  /** Cash in the drawer at the start of today: shows the cash expected in it now. */
  openingCash?: Paise | null;
};

/**
 * One day's money and entries, with the buttons to add, close or review it.
 * Used by Today and by the screen for earlier days (opened from the Calendar).
 */
export function DaySheet({
  date,
  isToday,
  entries,
  pending,
  fixedCost,
  salesMode,
  closedProfit,
  dailyTarget = null,
  closedPending = false,
  fixedInProfit = true,
  openingCash = null,
}: Props) {
  const t = useT();
  const totals = computeDayTotals(entries, fixedInProfit ? fixedCost : 0);
  const breakEvenShare = totals.breakEven > 0 ? totals.sales / totals.breakEven : 1;
  const crossed = totals.sales >= totals.breakEven;
  const takesSales = takesSaleEntries(salesMode);
  const closed = closedProfit !== null;
  // The stored profit always has the fixed cost taken out; add it back when it is kept out.
  const shownClosedProfit =
    closedProfit !== null && !fixedInProfit ? closedProfit + fixedCost : closedProfit;
  // Only shops that enter sales one by one know the cash sales before closing.
  const showDrawer = isToday && !closed && takesSales && openingCash !== null;
  // Entries are newest first. Sales a payment app added by itself are not repeated.
  const lastSale =
    isToday && takesSales ? entries.find((e) => e.type === "sale" && !e.paidVia) : undefined;
  // Add screens for another day carry the date along.
  const add = (path: string) => (isToday ? path : `${path}?date=${date}`);

  return (
    <>
      {closed && (
        <AppLink
          href={closedPending ? "/close/today" : `/summary/${date}`}
          className="flex press items-center gap-3 rounded-card bg-accent bg-[linear-gradient(135deg,rgb(255_255_255/0.22),transparent_55%)] px-4 py-3.5 text-accent-ink shadow-lift"
        >
          <CircleCheck size={26} aria-hidden className="shrink-0" />
          <span className="flex flex-1 flex-col">
            <span className="text-sm font-bold">
              {t("Day closed")}
              {closedPending && ` · ${t("not sent yet")}`}
            </span>
            <span className="text-xs">
              {fixedInProfit
                ? t("Profit {amount}", { amount: formatRupees(shownClosedProfit ?? 0) })
                : t("Profit before fixed costs {amount}", {
                    amount: formatRupees(shownClosedProfit ?? 0),
                  })}
            </span>
          </span>
          <span className="flex items-center text-sm font-bold">
            {t("See summary")}
            <ChevronRight size={18} aria-hidden />
          </span>
        </AppLink>
      )}

      <Card tone="muted" className="gap-3 px-5 py-5">
        <div className="flex justify-between text-[13px]">
          <span className="font-semibold text-muted">
            {isToday ? t("Sales so far") : t("Sales entered")}
          </span>
          <span className="text-muted">
            {dailyTarget !== null
              ? t("Target {amount}", { amount: formatRupees(dailyTarget) })
              : t("Break-even {amount}", { amount: formatRupees(totals.breakEven) })}
          </span>
        </div>
        <div className="font-display text-[52px] leading-none font-bold tracking-tight">
          {formatRupees(totals.sales)}
        </div>
        <ProgressBar
          value={dailyTarget !== null ? totals.sales / dailyTarget : breakEvenShare}
          label={
            dailyTarget !== null
              ? t("Sales against today's target")
              : t("Sales against the day's break-even")
          }
        />
        <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] font-semibold">
          {dailyTarget !== null && (
            <span>
              {totals.sales >= dailyTarget
                ? t("Today's target reached")
                : t("{amount} to go", { amount: formatRupees(dailyTarget - totals.sales) })}
            </span>
          )}
          {crossed ? (
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-ink">
              {dailyTarget !== null
                ? t("Break-even {amount} crossed", { amount: formatRupees(totals.breakEven) })
                : t("Break-even crossed")}
            </span>
          ) : (
            <span className={dailyTarget !== null ? "text-muted" : undefined}>
              {t("{amount} to go to cover the day's costs", {
                amount: formatRupees(totals.breakEven - totals.sales),
              })}
            </span>
          )}
        </div>
      </Card>

      {showDrawer && (
        <DrawerCard
          openingCash={openingCash}
          cashSales={totals.cashSales}
          drawerExpenses={totals.drawerExpenses}
          cashOut={totals.cashOut}
          upiSales={totals.upiSales}
        />
      )}

      <Card className="gap-0 py-1.5">
        <Row label={t("Expenses")} value={formatRupees(totals.expenses)} />
        {fixedInProfit && <Row label={t("Fixed costs")} value={formatRupees(totals.fixedCost)} />}
        <Row
          label={isToday ? t("Profit so far") : t("Profit")}
          value={formatRupees(totals.profit)}
          strong
          tone={totals.profit < 0 ? "bad" : totals.profit > 0 ? "good" : undefined}
        />
        {!fixedInProfit && fixedCost > 0 && (
          <p className="pb-2 text-xs text-muted">
            {t("Fixed costs ({amount} a day) are not taken out here. Reports still count them.", {
              amount: formatRupees(fixedCost),
            })}
          </p>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-2.5">
        {takesSales ? (
          <ButtonLink href={add(ENTRY_PATHS.sale)} size="lg">
            {t("+ Sale")}
          </ButtonLink>
        ) : null}
        <ButtonLink
          href={add(ENTRY_PATHS.expense)}
          size="lg"
          variant={takesSales ? "outline" : "primary"}
          className={takesSales ? "" : "col-span-2"}
        >
          {t("+ Expense")}
        </ButtonLink>
        <ButtonLink href={add(ENTRY_PATHS.cash_out)} variant="outline">
          {t("Cash taken out")}
        </ButtonLink>
        {closed && !closedPending ? (
          <ButtonLink href={`/summary/${date}`} variant="outline">
            {t("Day summary")}
          </ButtonLink>
        ) : (
          <ButtonLink href={isToday ? "/close/today" : `/close?date=${date}`} variant="outline">
            {closed ? t("Edit close") : t("Close day")}
          </ButtonLink>
        )}
      </div>
      {lastSale && <RepeatSale last={lastSale} date={date} />}
      {!takesSales && (
        <p className="text-xs text-muted">
          {t("You chose {mode}: enter cash and UPI sales when you close the day.", {
            mode: `"${t("Totals only")}"`,
          })}
        </p>
      )}

      <EntryList
        title={isToday ? t("Today's entries") : t("Entries")}
        entries={entries}
        pending={pending}
      />
    </>
  );
}

/**
 * The cash that should be in the drawer now: what it opened with, plus cash
 * sales, less expenses paid from it and cash taken out. UPI goes to the bank.
 */
function DrawerCard({
  openingCash,
  cashSales,
  drawerExpenses,
  cashOut,
  upiSales,
}: {
  openingCash: Paise;
  cashSales: Paise;
  drawerExpenses: Paise;
  cashOut: Paise;
  upiSales: Paise;
}) {
  const t = useT();
  const [counting, setCounting] = useState(false);
  const [counted, setCounted] = useState("");
  const inDrawer = openingCash + cashSales - drawerExpenses - cashOut;
  const countedPaise = counted.trim() ? parseRupeeInput(counted) : null;
  const difference = countedPaise === null ? null : countedPaise - inDrawer;
  const steps = [
    t("Opening {amount}", { amount: formatRupees(openingCash) }),
    cashSales > 0 && `+ ${t("Cash sales {amount}", { amount: formatRupees(cashSales) })}`,
    drawerExpenses > 0 && `− ${t("Expenses {amount}", { amount: formatRupees(drawerExpenses) })}`,
    cashOut > 0 && `− ${t("Taken out {amount}", { amount: formatRupees(cashOut) })}`,
  ].filter(Boolean);

  return (
    <Card className="gap-2 py-3.5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-muted">
            <Wallet size={16} aria-hidden />
            {t("Cash in drawer now")}
          </span>
          <span
            className={cn(
              "font-display text-[30px] leading-tight font-bold",
              inDrawer < 0 && "text-danger",
            )}
          >
            {formatRupees(inDrawer)}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5 border-l border-line pl-3">
          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-muted">
            <Smartphone size={16} aria-hidden />
            {t("UPI today")}
          </span>
          <span className="font-display text-xl font-bold">{formatRupees(upiSales)}</span>
        </div>
      </div>
      <p className="text-xs text-muted">{steps.join(" ")}</p>
      {inDrawer < 0 && (
        <p className="text-xs font-semibold text-danger">
          {t("More cash went out than came in. Check the entries.")}
        </p>
      )}
      {counting ? (
        <div className="flex flex-col gap-1.5 border-t border-line pt-2.5">
          <label htmlFor="drawer-count" className="text-xs font-semibold text-muted">
            {t("Cash counted in the drawer now (₹)")}
          </label>
          <input
            id="drawer-count"
            inputMode="decimal"
            autoFocus
            value={counted}
            onChange={(e) => setCounted(e.target.value)}
            placeholder={String(Math.max(0, inDrawer) / 100)}
            className="h-11 rounded-control border border-edge bg-field px-3 text-base"
          />
          {difference !== null && (
            <p
              role="status"
              className={cn(
                "text-sm font-bold",
                difference === 0 ? "text-accent-fg" : difference < 0 ? "text-danger" : "text-ink",
              )}
            >
              {difference === 0
                ? t("It matches.")
                : difference > 0
                  ? t("{amount} more than expected. A sale may be missing.", {
                      amount: formatRupees(difference),
                    })
                  : t("{amount} short. An expense or cash out may be missing.", {
                      amount: formatRupees(-difference),
                    })}
            </p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCounting(true)}
          className="min-h-10 self-start text-[13px] font-bold underline"
        >
          {t("Count the drawer now")}
        </button>
      )}
    </Card>
  );
}

function Row({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "good" | "bad";
}) {
  return (
    <div
      className={
        strong
          ? "mt-1 flex min-h-13 items-center justify-between border-t border-line"
          : "flex min-h-11 items-center justify-between"
      }
    >
      <span className={strong ? "text-base font-bold" : "text-[15px] font-medium text-muted"}>
        {label}
      </span>
      <span
        className={cn(
          "font-display",
          strong ? "text-xl font-bold" : "text-base font-bold",
          tone === "good" && "text-accent-fg",
          tone === "bad" && "text-danger",
        )}
      >
        {value}
      </span>
    </div>
  );
}
