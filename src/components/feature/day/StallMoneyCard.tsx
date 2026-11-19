"use client";

import { Smartphone, Wallet } from "lucide-react";
import { useState, useTransition } from "react";
import { patchSnapshot } from "@/client/entries";
import { useIsOffline } from "@/client/online";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { CloseInput } from "@/domain/dayClose";
import type { DayTotals } from "@/domain/dayTotals";
import { moneyAtClose, moneyNow, upiOutflow } from "@/domain/stallMoney";
import type { BusinessDate } from "@/lib/dates";
import { setTodayUpiBalance } from "@/server/actions/days";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { type Paise, formatRupees, parseRupeeInput } from "@/lib/money";

/**
 * The stall's money on Today, always shown: the cash in the drawer plus the UPI
 * account (its balance once the owner has given it, else today's change), with
 * the sums behind each. Spending from the owner's own pocket is shown apart,
 * since it never was stall money.
 *
 * Open day: what the entries say should be there now ("Totals only" shops do
 * not enter sales until closing, so those come in at close). Closed day: the
 * cash counted and the UPI total typed at close.
 */
export function StallMoneyCard({
  today,
  openingCash,
  totals,
  upiStart,
  close = null,
  salesAtClose = false,
}: {
  today: BusinessDate;
  openingCash: Paise;
  totals: DayTotals;
  /** The UPI account balance at the start of today, or null if not given yet. */
  upiStart: Paise | null;
  /** Today's closing figures, once the day is closed. */
  close?: CloseInput | null;
  /** "Totals only" shop: sales are entered at closing, not during the day. */
  salesAtClose?: boolean;
}) {
  const t = useT();
  const money = close
    ? moneyAtClose(close.countedCash, close.upiTotal, totals, upiStart)
    : moneyNow(openingCash, totals, upiStart);
  // At close the UPI total typed is the day's UPI sales (rule 4).
  const upiSales = close ? close.upiTotal : totals.upiSales;
  const upiChange = upiSales - upiOutflow(totals);
  const plus = upiStart !== null ? "+ " : "";
  const showUpiSales = !!close || !salesAtClose;
  const cashSteps = close
    ? [t("Counted at close")]
    : [
        t("Opening {amount}", { amount: formatRupees(openingCash) }),
        totals.cashSales > 0 &&
          `+ ${t("Cash sales {amount}", { amount: formatRupees(totals.cashSales) })}`,
        totals.drawerExpenses > 0 &&
          `− ${t("Expenses {amount}", { amount: formatRupees(totals.drawerExpenses) })}`,
        totals.drawerCashOut > 0 &&
          `− ${t("Taken out {amount}", { amount: formatRupees(totals.drawerCashOut) })}`,
        totals.deposits > 0 &&
          `− ${t("To bank {amount}", { amount: formatRupees(totals.deposits) })}`,
        totals.drawerFixedPaid > 0 &&
          `− ${t("Fixed costs paid {amount}", { amount: formatRupees(totals.drawerFixedPaid) })}`,
      ];
  const shownCashSteps = cashSteps.filter(Boolean);
  const upiSteps = [
    upiStart !== null && t("Start {amount}", { amount: formatRupees(upiStart) }),
    showUpiSales && plus + t("UPI sales {amount}", { amount: formatRupees(upiSales) }),
    totals.upiExpenses > 0 &&
      `− ${t("Expenses {amount}", { amount: formatRupees(totals.upiExpenses) })}`,
    totals.upiCashOut > 0 &&
      `− ${t("Taken out {amount}", { amount: formatRupees(totals.upiCashOut) })}`,
    totals.deposits > 0 &&
      `+ ${t("From drawer {amount}", { amount: formatRupees(totals.deposits) })}`,
    totals.upiFixedPaid > 0 &&
      `− ${t("Fixed costs paid {amount}", { amount: formatRupees(totals.upiFixedPaid) })}`,
  ].filter(Boolean);

  return (
    <Card className="gap-2.5 py-3.5">
      <div className="flex items-end justify-between gap-3">
        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-muted">
          <Wallet size={16} aria-hidden />
          {close ? t("Stall money at close") : t("Stall money now")}
        </span>
        <span
          className={cn(
            "font-display text-[30px] leading-tight font-bold",
            money.total < 0 && "text-danger",
          )}
        >
          {formatRupees(money.total)}
        </span>
      </div>

      <div className="flex flex-col gap-2 border-t border-line pt-2.5">
        <MoneyLine
          label={t("Cash in drawer")}
          amount={money.cash}
          steps={shownCashSteps.join(" ")}
        />
        {money.cash < 0 && (
          <p className="-mt-1 text-xs font-semibold text-danger">
            {t("More cash went out than came in. Check the entries.")}
          </p>
        )}
        <MoneyLine
          label={money.upiIsBalance ? t("UPI account") : t("UPI today")}
          icon={<Smartphone size={14} aria-hidden />}
          amount={money.upi}
          steps={upiSteps.join(" ")}
        />
      </div>

      {money.pocket > 0 && (
        <p className="rounded-control bg-warn-bg px-3 py-2 text-xs text-warn-ink">
          {t("Paid from your own pocket today: {amount}. The stall owes you this.", {
            amount: formatRupees(money.pocket),
          })}
        </p>
      )}
      {salesAtClose && !close && (
        <p className="text-xs font-semibold text-ink">
          {t("Cash and UPI sales are added when you close the day.")}
        </p>
      )}
      <p className="text-xs text-muted">
        {t("This is money, not profit: fixed costs and cash you take out count differently.")}
      </p>

      <div className="flex flex-wrap gap-x-5">
        {/* Counting only helps while sales are being entered; after close it is done. */}
        {!close && !salesAtClose && <DrawerCount expected={money.cash} />}
        <UpiCheck
          today={today}
          expected={money.upiIsBalance ? money.upi : null}
          todayChange={upiChange}
        />
      </div>
    </Card>
  );
}

function MoneyLine({
  label,
  amount,
  steps,
  icon,
}: {
  label: string;
  amount: Paise;
  steps: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          {icon}
          {label}
        </span>
        <span className={cn("font-display text-lg font-bold", amount < 0 && "text-danger")}>
          {formatRupees(amount)}
        </span>
      </div>
      <p className="text-xs text-muted">{steps}</p>
    </div>
  );
}

/** "Count the drawer now": type what is really there and see if it matches. Not saved. */
function DrawerCount({ expected }: { expected: Paise }) {
  const t = useT();
  const [counting, setCounting] = useState(false);
  const [counted, setCounted] = useState("");
  const countedPaise = counted.trim() ? parseRupeeInput(counted) : null;
  const difference = countedPaise === null ? null : countedPaise - expected;

  if (!counting) {
    return (
      <button
        type="button"
        onClick={() => setCounting(true)}
        className="min-h-10 self-start text-[13px] font-bold underline"
      >
        {t("Count the drawer now")}
      </button>
    );
  }
  return (
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
        placeholder={String(Math.max(0, expected) / 100)}
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
  );
}

/**
 * "Check UPI balance": type what the UPI/bank app shows. With a balance known it
 * says whether it matches; either way the owner can keep the app's figure as the
 * balance from now on (the first time, this is how the balance is set).
 */
function UpiCheck({
  today,
  expected,
  todayChange,
}: {
  today: BusinessDate;
  expected: Paise | null;
  todayChange: Paise;
}) {
  const t = useT();
  const offline = useIsOffline();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const typed = text.trim() ? parseRupeeInput(text) : null;
  const difference = typed === null || expected === null ? null : typed - expected;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-10 self-start text-[13px] font-bold underline"
      >
        {expected === null ? t("Add UPI balance") : t("Check UPI balance")}
      </button>
    );
  }

  const save = () =>
    startTransition(async () => {
      setError(null);
      if (typed === null) return setError(t("Enter an amount like 500"));
      let result: Awaited<ReturnType<typeof setTodayUpiBalance>>;
      try {
        result = await setTodayUpiBalance(text, todayChange);
      } catch {
        return setError(t("Needs internet. Try again when you are online."));
      }
      if (result === "bad-amount") return setError(t("Enter an amount like 500"));
      const start = result.start;
      await patchSnapshot((s) => (s.date === today ? { ...s, upiStart: start } : s));
      setOpen(false);
      setText("");
    });

  return (
    <div className="flex w-full flex-col gap-1.5 border-t border-line pt-2.5">
      <label htmlFor="upi-check" className="text-xs font-semibold text-muted">
        {t("Balance your UPI or bank app shows now (₹)")}
      </label>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <input
          id="upi-check"
          inputMode="decimal"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={expected === null ? "0" : String(Math.max(0, expected) / 100)}
          className="h-11 min-w-0 rounded-control border border-edge bg-field px-3 text-base"
        />
        <Button type="button" onClick={save} disabled={pending || offline || typed === null}>
          {pending ? t("Saving…") : t("Use this balance")}
        </Button>
      </div>
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
              ? t("{amount} more than expected. A UPI sale may be missing.", {
                  amount: formatRupees(difference),
                })
              : t("{amount} less than expected. A UPI payment may be missing.", {
                  amount: formatRupees(-difference),
                })}
        </p>
      )}
      {(error || offline) && (
        <p role="alert" className="text-xs font-semibold text-danger">
          {error ?? t("Needs internet. Try again when you are online.")}
        </p>
      )}
    </div>
  );
}
