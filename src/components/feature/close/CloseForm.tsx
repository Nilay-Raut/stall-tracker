"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { useDayView } from "@/client/localStore";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Notice } from "@/components/ui/Notice";
import { computeClose } from "@/domain/dayClose";
import { useT } from "@/i18n/client";
import type { Translate } from "@/i18n/translate";
import { cn } from "@/lib/cn";
import { formatRupees, parseRupeeInput } from "@/lib/money";
import { closeDay } from "@/server/actions/close";
import { type FormState, initialFormState } from "@/server/actions/formState";
import type { CloseContext } from "@/server/days";

const toText = (paise: number | null | undefined) =>
  paise === null || paise === undefined ? "" : String(paise / 100);

type Props = {
  context: CloseContext;
  /** What saving does: the server action (default), or saving on the phone (today, offline-ready). */
  action?: (prev: FormState, formData: FormData) => Promise<FormState>;
  /**
   * Wait until all of the day's entries reached the server before allowing the close
   * (needed when the server does the sums; not when the phone does).
   */
  waitForEntries?: boolean;
};

/** The Close day form: count the drawer, type the UPI total, see the working live. */
export function CloseForm({ context, action = closeDay, waitForEntries = true }: Props) {
  const t = useT();
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const errors = state.fieldErrors ?? {};
  const previous = context.previousClose;

  const [opening, setOpening] = useState(toText(context.openingCash));
  const [editOpening, setEditOpening] = useState(false);
  const [counted, setCounted] = useState(toText(previous?.countedCash));
  // With a payment app connected, the UPI sales it added are the starting total.
  const [upi, setUpi] = useState(
    toText(
      previous?.upiTotal ??
        (context.paymentsConnected && context.entered.upiSales > 0
          ? context.entered.upiSales
          : null),
    ),
  );
  const [waste, setWaste] = useState(toText(previous?.waste));

  const countsPlates = context.plateItems.length > 0;
  // First close of a day with bills: start from the bills' counts (v2 Phase 3).
  const fromBills = previous === null && Object.keys(context.billCounts).length > 0;
  const [plates, setPlates] = useState<Record<string, number>>(
    fromBills ? context.billCounts : context.previousCounts,
  );
  // An earlier close of this day without counts means the owner skipped them.
  const [skipPlates, setSkipPlates] = useState(
    previous !== null && Object.keys(context.previousCounts).length === 0,
  );
  const wasteStep = countsPlates ? 4 : 3;

  const unsentEntries = useUnsentCount(context.date);
  const unsent = waitForEntries ? unsentEntries : 0;
  const { entered } = context;

  const openingPaise = parseRupeeInput(opening) ?? 0;
  const countedPaise = parseRupeeInput(counted);
  const upiPaise = parseRupeeInput(upi);
  const result =
    countedPaise === null
      ? null
      : computeClose(entered, {
          openingCash: openingPaise,
          countedCash: countedPaise,
          upiTotal: upiPaise ?? 0,
          waste: null,
        });

  return (
    <form action={formAction} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="date" value={context.date} />
      <input type="hidden" name="openingCash" value={opening} />

      {unsent > 0 && (
        <Notice
          title={
            unsent === 1
              ? t("Sending {n} entry for this day…", { n: unsent })
              : t("Sending {n} entries for this day…", { n: unsent })
          }
        >
          {t(
            "Connect to the internet. The day can be closed once every entry has reached the server.",
          )}
        </Notice>
      )}

      <MoneyInput
        label={t("1. Cash in drawer now")}
        name="countedCash"
        value={counted}
        onChange={(e) => setCounted(e.target.value)}
        placeholder="0"
        error={errors.countedCash}
        autoFocus
      />

      <div className="flex flex-col gap-1.5 rounded-card bg-surface p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {t("Opening cash")}
            <button
              type="button"
              onClick={() => setEditOpening((v) => !v)}
              className="text-xs font-semibold underline"
            >
              {editOpening ? t("Done") : t("Change")}
            </button>
          </span>
          <span>− {formatRupees(openingPaise)}</span>
        </div>
        {editOpening && (
          <MoneyInput
            label={t("Cash in the drawer when the day started")}
            name="openingCashInput"
            value={opening}
            onChange={(e) => setOpening(e.target.value)}
            error={errors.openingCash}
          />
        )}
        <Line
          label={t("Expenses paid from drawer")}
          value={`+ ${formatRupees(entered.drawerExpenses)}`}
        />
        <Line label={t("Cash taken out")} value={`+ ${formatRupees(entered.cashOut)}`} />
        <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
          <span>{t("Cash sales today")}</span>
          <span>{result ? formatRupees(result.cashSales) : "—"}</span>
        </div>
      </div>

      {result && <CashCheck context={context} cashSales={result.cashSales} />}

      <MoneyInput
        label={t("2. UPI total")}
        name="upiTotal"
        value={upi}
        onChange={(e) => setUpi(e.target.value)}
        placeholder="0"
        error={errors.upiTotal}
        hint={upiHint(context, upiPaise, t)}
      />

      {countsPlates && (
        <PlateCounter
          items={context.plateItems}
          plates={plates}
          onChange={(id, quantity) => setPlates((p) => ({ ...p, [id]: quantity }))}
          skipped={skipPlates}
          onSkip={setSkipPlates}
          fromBills={fromBills}
        />
      )}

      <div className="flex flex-col gap-1.5">
        <MoneyInput
          label={t("{step}. Food wasted today (optional)", { step: wasteStep })}
          name="waste"
          value={waste}
          onChange={(e) => setWaste(e.target.value)}
          placeholder="0"
          error={errors.waste}
          className="text-lg"
        />
      </div>

      {result && upiPaise !== null && (
        <p className="text-sm text-muted">
          {t("Sales today {amount} · profit", { amount: formatRupees(result.sales) })}{" "}
          <strong className={cn(result.profit < 0 ? "text-danger" : "text-ink")}>
            {formatRupees(result.profit)}
          </strong>
        </p>
      )}

      <div className="mt-2 flex flex-col gap-1.5">
        <FormError message={state.error} />
        <Button
          type="submit"
          size="lg"
          disabled={pending || unsent > 0 || countedPaise === null || upiPaise === null}
        >
          {pending ? t("Closing…") : previous ? t("Save changes") : t("Close day and see summary")}
        </Button>
      </div>
    </form>
  );
}

/** Step 3: plates sold per item, with − / + buttons. Optional: "Skip today". */
function PlateCounter({
  items,
  plates,
  onChange,
  skipped,
  onSkip,
  fromBills,
}: {
  items: Array<{ id: string; name: string }>;
  plates: Record<string, number>;
  onChange: (id: string, quantity: number) => void;
  skipped: boolean;
  onSkip: (skip: boolean) => void;
  /** The counts were filled in from today's bills. */
  fromBills: boolean;
}) {
  const t = useT();
  return (
    <section className="flex flex-col gap-1 rounded-card border border-dashed border-edge p-3">
      <input type="hidden" name="platesSkipped" value={skipped ? "1" : "0"} />
      <div className="flex min-h-7 items-center justify-between">
        <h2 className="text-[13px] font-bold">{t("3. Plates sold (optional)")}</h2>
        <button
          type="button"
          onClick={() => onSkip(!skipped)}
          className="min-h-9 px-1 text-[13px] font-bold underline"
        >
          {skipped ? t("Count plates") : t("Skip today")}
        </button>
      </div>
      {!skipped && fromBills && (
        <p className="text-xs text-muted">
          {t("Filled in from today's bills. Add any sold without a bill.")}
        </p>
      )}
      {skipped ? (
        <p className="text-xs text-muted">{t("Not counting plates today.")}</p>
      ) : (
        items.map((item) => {
          const quantity = plates[item.id] ?? 0;
          return (
            <div
              key={item.id}
              className="grid h-12 grid-cols-[1fr_2.75rem_3rem_2.75rem] items-center gap-1 border-t border-line"
            >
              <input type="hidden" name={`plate-${item.id}`} value={quantity} />
              <span className="text-sm font-semibold">{item.name}</span>
              <button
                type="button"
                aria-label={t("One less {item}", { item: item.name })}
                disabled={quantity === 0}
                onClick={() => onChange(item.id, Math.max(quantity - 1, 0))}
                className="h-11 rounded-control border border-edge text-xl font-semibold disabled:opacity-30"
              >
                −
              </button>
              <input
                aria-label={t("{item} plates", { item: item.name })}
                inputMode="numeric"
                value={quantity}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/\D/g, "").slice(0, 4));
                  onChange(item.id, Number.isFinite(n) ? n : 0);
                }}
                onFocus={(e) => e.target.select()}
                className="h-11 w-full min-w-0 bg-transparent text-center text-[17px] font-bold"
              />
              <button
                type="button"
                aria-label={t("One more {item}", { item: item.name })}
                onClick={() => onChange(item.id, Math.min(quantity + 1, 9999))}
                className="h-11 rounded-control border border-edge text-xl font-semibold"
              >
                +
              </button>
            </div>
          );
        })
      )}
    </section>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

/** Rule 3: compare the drawer with the cash sales typed in during the day. */
function CashCheck({ context, cashSales }: { context: CloseContext; cashSales: number }) {
  const t = useT();
  if (cashSales < 0) {
    return (
      <Notice title={t("The drawer has less than you started with")}>
        {t("Check the amounts, or add a missing expense or cash taken out.")}
      </Notice>
    );
  }
  if (context.cashSaleCount === 0) return null; // nothing entered to compare with
  const difference = cashSales - context.entered.cashSales;
  if (difference === 0) {
    return (
      <p className="text-sm font-semibold text-accent-fg">{t("Cash matches your entries.")}</p>
    );
  }
  return (
    <Notice
      title={
        difference > 0
          ? t("{amount} more cash than you recorded", { amount: formatRupees(difference) })
          : t("{amount} less cash than you recorded", { amount: formatRupees(-difference) })
      }
    >
      {t("You entered {entered} in cash sales. The drawer shows {drawer}.", {
        entered: formatRupees(context.entered.cashSales),
        drawer: formatRupees(cashSales),
      })}
    </Notice>
  );
}

function upiHint(context: CloseContext, upi: number | null, t: Translate): string {
  if (context.paymentsConnected) {
    return t("Filled in from PhonePe and your UPI entries. Check it against the PhonePe app.");
  }
  if (context.upiSaleCount === 0) return t("Check today's total in your payment app.");
  const n = context.upiSaleCount;
  const entries = n === 1 ? t("{n} UPI entry", { n }) : t("{n} UPI entries", { n });
  if (upi !== null && upi === context.entered.upiSales) {
    return t("Check today's total in your payment app. Matches your {entries}.", { entries });
  }
  return t("Check today's total in your payment app. Your {entries} add up to {amount}.", {
    entries,
    amount: formatRupees(context.entered.upiSales),
  });
}

/**
 * Entries for this day still waiting on the phone. When they have all been sent,
 * the page reloads its figures from the server so the close uses every entry.
 */
function useUnsentCount(date: string): number {
  const router = useRouter();
  const view = useDayView(date);
  const unsent = [...view.pending.values()].filter((row) => row.entry.businessDate === date).length;
  const before = useRef(unsent);

  useEffect(() => {
    if (before.current > 0 && unsent === 0) router.refresh();
    before.current = unsent;
  }, [unsent, router]);

  return unsent;
}
