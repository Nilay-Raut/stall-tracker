"use client";

import { useEffect, useState } from "react";
import type { CloseSubmission } from "@/lib/closeForm";
import { type PendingClose, SNAPSHOT_KEY, localDb } from "./localDb";
import { notifyLocalChange, useLocalVersion } from "./localStore";
import { NotReadyError } from "./entries";
import { requestSync } from "./sync";

/** Saves a day's close on the phone (works offline) and asks for a sync. */
export async function queueClose(close: CloseSubmission): Promise<void> {
  const db = await localDb();
  const snapshot = await db.get("meta", SNAPSHOT_KEY);
  if (!snapshot) throw new NotReadyError();
  await db.put("closes", {
    ...close,
    userId: snapshot.userId,
    updatedAt: new Date().toISOString(),
  });
  notifyLocalChange();
  requestSync();
}

/** Gives up on a close the server refused, so the day can be closed again. */
export async function discardClose(date: string): Promise<void> {
  await (await localDb()).delete("closes", date);
  notifyLocalChange();
}

/** The day's close waiting on the phone, or null. Undefined while loading. */
export function usePendingClose(date: string | null): PendingClose | null | undefined {
  const changes = useLocalVersion();
  const [found, setFound] = useState<{ date: string; close: PendingClose | null } | null>(null);

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    localDb()
      .then((db) => db.get("closes", date))
      .then((close) => !cancelled && setFound({ date, close: close ?? null }))
      .catch(() => !cancelled && setFound({ date, close: null }));
    return () => {
      cancelled = true;
    };
  }, [date, changes]);

  if (!date) return null;
  return found?.date === date ? found.close : undefined;
}
