"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { NotReadyError, deleteEntry, saveEntry } from "@/client/entries";
import { playCue } from "@/client/sound";
import { offerUndo } from "@/client/undo";
import type { Entry } from "@/domain/entry";
import { useT } from "@/i18n/client";
import { msg } from "@/i18n/translate";
import { type BusinessDate, businessDate } from "@/lib/dates";
import type { Paise } from "@/lib/money";

type Details = Pick<Entry, "type" | "paymentMode" | "category" | "paidFrom"> & {
  amount: Paise;
  purchase?: Entry["purchase"];
  lines?: Entry["lines"];
  note?: Entry["note"];
};

/**
 * Shared save/delete logic for the add and edit screens. Saving happens on
 * the phone first, so it is instant and works offline.
 */
export function useEntryEditor(existing: Entry | null, initialDate: BusinessDate) {
  const router = useRouter();
  const t = useT();
  const [date, setDate] = useState(initialDate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Back to where the entry belongs: Today, or the screen of its (earlier) day.
  const done = () => {
    const target = date === businessDate() ? "/" : `/day/${date}`;
    // Offline, a plain page load is answered by the service worker's stored copy.
    if (navigator.onLine) router.push(target);
    else window.location.assign(target);
  };

  const run = async (work: () => Promise<void>, onSaved?: () => void) => {
    setBusy(true);
    setError(null);
    try {
      await work();
      onSaved?.();
      done();
    } catch (err) {
      setError(
        // English here; FormError translates it.
        err instanceof NotReadyError
          ? err.message
          : msg("Could not save on this phone. Try again."),
      );
      setBusy(false);
    }
  };

  const save = (details: Details) => {
    const now = new Date().toISOString();
    const entry: Entry = {
      id: existing?.id ?? crypto.randomUUID(),
      businessDate: date,
      occurredAt: existing?.occurredAt ?? now,
      updatedAt: now,
      deleted: false,
      purchase: null,
      lines: null,
      note: null,
      paidVia: existing?.paidVia ?? null,
      ...details,
    };
    return run(
      () => saveEntry(entry),
      () => {
        playCue(details.type === "sale" ? "sale" : "expense");
        // Undo puts back the entry as it was, or removes a new one.
        offerUndo({
          kind: "saved",
          type: entry.type,
          amount: entry.amount,
          restore: existing ?? { ...entry, deleted: true },
        });
      },
    );
  };

  const remove = () => {
    if (!existing || !window.confirm(t("Delete this entry?"))) return;
    return run(
      () => deleteEntry(existing),
      () =>
        offerUndo({
          kind: "deleted",
          type: existing.type,
          amount: existing.amount,
          restore: { ...existing, deleted: false },
        }),
    );
  };

  return { date, setDate, save, remove, busy, error };
}
