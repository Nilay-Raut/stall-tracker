"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { NotReadyError, deleteEntry, saveEntry } from "@/client/entries";
import type { Entry } from "@/domain/entry";
import { useT } from "@/i18n/client";
import { msg } from "@/i18n/translate";
import { type BusinessDate, businessDate } from "@/lib/dates";
import type { Paise } from "@/lib/money";

type Details = Pick<Entry, "type" | "paymentMode" | "category" | "paidFrom"> & {
  amount: Paise;
  purchase?: Entry["purchase"];
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

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
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
    return run(() =>
      saveEntry({
        id: existing?.id ?? crypto.randomUUID(),
        businessDate: date,
        occurredAt: existing?.occurredAt ?? now,
        updatedAt: now,
        deleted: false,
        purchase: null,
        ...details,
      }),
    );
  };

  const remove = () => {
    if (!existing || !window.confirm(t("Delete this entry?"))) return;
    return run(() => deleteEntry(existing));
  };

  return { date, setDate, save, remove, busy, error };
}
