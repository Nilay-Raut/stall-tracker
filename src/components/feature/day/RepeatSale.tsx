"use client";

import { Repeat2 } from "lucide-react";
import { useState } from "react";
import { saveEntry } from "@/client/entries";
import { playCue } from "@/client/sound";
import { offerUndo } from "@/client/undo";
import { describeLines } from "@/domain/bill";
import type { Entry } from "@/domain/entry";
import { useT } from "@/i18n/client";
import type { BusinessDate } from "@/lib/dates";
import { PAYMENT_LABELS } from "@/lib/labels";
import { formatRupees } from "@/lib/money";

/**
 * One tap adds the same sale again (same amount, items and Cash/UPI), for the
 * order that comes again and again. Undo is offered straight after.
 */
export function RepeatSale({ last, date }: { last: Entry; date: BusinessDate }) {
  const t = useT();
  const [busy, setBusy] = useState(false);

  const repeat = async () => {
    setBusy(true);
    const now = new Date().toISOString();
    const copy: Entry = {
      id: crypto.randomUUID(),
      businessDate: date,
      type: "sale",
      amount: last.amount,
      paymentMode: last.paymentMode,
      category: null,
      paidFrom: null,
      purchase: null,
      note: null,
      lines: last.lines,
      paidVia: null,
      occurredAt: now,
      updatedAt: now,
      deleted: false,
    };
    try {
      await saveEntry(copy);
      playCue("sale");
      offerUndo({
        kind: "saved",
        type: "sale",
        amount: copy.amount,
        restore: { ...copy, deleted: true },
      });
    } finally {
      setBusy(false);
    }
  };

  const what = last.lines
    ? describeLines(last.lines)
    : t(PAYMENT_LABELS[last.paymentMode ?? "cash"]);
  return (
    <button
      type="button"
      onClick={() => void repeat()}
      disabled={busy}
      className="flex min-h-12 press items-center gap-3 rounded-card border border-dashed border-accent/40 px-4 text-left disabled:opacity-50"
    >
      <Repeat2 size={20} aria-hidden className="shrink-0 text-accent-fg" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-bold">{t("Repeat last sale")}</span>
        <span className="truncate text-xs text-muted">
          {last.lines ? `${what} · ${t(PAYMENT_LABELS[last.paymentMode ?? "cash"])}` : what}
        </span>
      </span>
      <span className="font-display text-base font-bold">{formatRupees(last.amount)}</span>
    </button>
  );
}
