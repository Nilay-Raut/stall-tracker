"use client";

import { useEffect } from "react";
import { dismissUndo, runUndo, useUndoOffer } from "@/client/undo";
import { useT } from "@/i18n/client";
import { PAYMENT_LABELS } from "@/lib/labels";
import { formatRupees } from "@/lib/money";

/** The few-second "Saved · Undo" bar above the tab bar, on every screen of the app. */
export function UndoToast() {
  const t = useT();
  const offer = useUndoOffer();

  useEffect(() => {
    if (!offer) return;
    const timer = setTimeout(dismissUndo, Math.max(0, offer.until - Date.now()));
    return () => clearTimeout(timer);
  }, [offer]);

  if (!offer) return null;
  const amount = formatRupees(offer.amount);
  const what =
    offer.kind === "deleted"
      ? t("Entry deleted · {amount}", { amount })
      : offer.type === "sale"
        ? t("Sale saved · {amount} {mode}", {
            amount,
            mode: t(PAYMENT_LABELS[offer.restore.paymentMode ?? "cash"]),
          })
        : offer.type === "expense"
          ? t("Expense saved · {amount}", { amount })
          : t("Cash out saved · {amount}", { amount });

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+92px)] z-40 flex justify-center px-4 print:hidden">
      <div
        role="status"
        className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-full bg-ink py-1.5 pr-1.5 pl-4 text-paper shadow-lift"
      >
        <span className="truncate text-sm font-semibold">{what}</span>
        <button
          type="button"
          onClick={() => void runUndo()}
          className="min-h-10 shrink-0 press rounded-full bg-accent px-4 text-sm font-bold text-accent-ink"
        >
          {t("Undo")}
        </button>
      </div>
    </div>
  );
}
