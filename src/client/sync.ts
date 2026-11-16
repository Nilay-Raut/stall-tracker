"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { MAX_CLOSES_PER_SYNC, SYNC_BATCH_SIZE, type SyncResponse } from "@/domain/sync";
import { businessDate } from "@/lib/dates";
import { SNAPSHOT_KEY, localDb } from "./localDb";
import { notifyLocalChange, useLocalVersion } from "./localStore";

/**
 * Sends changes waiting on the phone to the server.
 * - Only one sync runs at a time; a request during a run triggers one more run.
 * - A change leaves the outbox only after the server confirms it.
 * - Network trouble: retry later (5s, 15s, 30s, then every 60s).
 * - Logged out (401): wait until the user logs in again.
 */

export type SyncState = "idle" | "syncing" | "offline" | "signed-out";

let state: SyncState = "idle";
const listeners = new Set<() => void>();
function setState(next: SyncState) {
  if (next === state) return;
  state = next;
  for (const listener of listeners) listener();
}

let running = false;
let runAgain = false;
let currentRun: Promise<void> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let failures = 0;
const RETRY_DELAYS_MS = [5_000, 15_000, 30_000, 60_000];

class SignedOutError extends Error {}

/** Ask for a sync soon. Safe to call often. */
export function requestSync(): void {
  if (typeof window === "undefined") return;
  if (running) {
    runAgain = true;
    return;
  }
  clearTimeout(retryTimer);
  currentRun = run();
}

/** Syncs now and waits until that sync (and any queued right behind it) has finished. */
export async function syncNow(): Promise<void> {
  requestSync();
  await currentRun;
}

async function run() {
  running = true;
  setState("syncing");
  try {
    do {
      runAgain = false;
      await sendOutbox();
    } while (runAgain);
    failures = 0;
    setState("idle");
  } catch (error) {
    if (error instanceof SignedOutError) {
      setState("signed-out");
    } else {
      setState("offline");
      const delay = RETRY_DELAYS_MS[Math.min(failures, RETRY_DELAYS_MS.length - 1)];
      failures += 1;
      retryTimer = setTimeout(requestSync, delay);
    }
  } finally {
    running = false;
  }
}

async function sendOutbox() {
  const db = await localDb();
  const snapshot = await db.get("meta", SNAPSHOT_KEY);
  if (!snapshot) return; // not set up on this phone yet

  const queue = (await db.getAllFromIndex("outbox", "by-queued")).filter(
    (row) => row.userId === snapshot.userId && !row.error,
  );

  for (let i = 0; i < queue.length; i += SYNC_BATCH_SIZE) {
    const batch = queue.slice(i, i + SYNC_BATCH_SIZE);
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: batch.map((row) => row.entry) }),
      cache: "no-store",
    });
    if (response.status === 401) throw new SignedOutError();
    if (!response.ok) throw new Error(`sync failed: ${response.status}`);
    const { results } = (await response.json()) as SyncResponse;

    const sent = new Map(batch.map((row) => [row.entryId, row.entry.updatedAt]));
    const tx = db.transaction("outbox", "readwrite");
    for (const result of results) {
      const row = await tx.store.get(result.id);
      // Edited again while this batch was on its way: keep the newer change queued.
      if (!row || row.entry.updatedAt !== sent.get(result.id)) continue;
      if (result.status === "rejected") {
        await tx.store.put({ ...row, error: result.reason });
      } else {
        await tx.store.delete(result.id);
      }
    }
    await tx.done;
    notifyLocalChange();
  }

  await sendCloses(snapshot.userId);
}

/** Sends days closed on the phone, after their entries (so the server checks the full day). */
async function sendCloses(userId: string) {
  const db = await localDb();
  const closes = (await db.getAll("closes")).filter((c) => c.userId === userId && !c.error);
  for (let i = 0; i < closes.length; i += MAX_CLOSES_PER_SYNC) {
    const batch = closes.slice(i, i + MAX_CLOSES_PER_SYNC);
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        closes: batch.map(({ date, input, plateCounts, updatedAt }) => ({
          date,
          input,
          plateCounts,
          updatedAt,
        })),
      }),
      cache: "no-store",
    });
    if (response.status === 401) throw new SignedOutError();
    if (!response.ok) throw new Error(`sync failed: ${response.status}`);
    const { closeResults } = (await response.json()) as SyncResponse;

    const sent = new Map(batch.map((c) => [c.date, c.updatedAt]));
    const tx = db.transaction("closes", "readwrite");
    for (const result of closeResults) {
      const row = await tx.store.get(result.date);
      if (!row || row.updatedAt !== sent.get(result.date)) continue; // changed meanwhile
      if (result.status === "rejected") await tx.store.put({ ...row, error: result.reason });
      else await tx.store.delete(result.date);
    }
    await tx.done;
    notifyLocalChange();
  }
}

/**
 * Keeps local storage small: entries from earlier days are dropped once they
 * are safely on the server. Today and anything still unsent stay. Runs when the
 * app opens (not after every sync), so a past day being edited is never pulled
 * out from under the edit screen.
 */
export async function cleanUpOldEntries() {
  const db = await localDb();
  const today = businessDate();
  const unsent = new Set(await db.getAllKeys("outbox"));
  const tx = db.transaction("entries", "readwrite");
  let cursor = await tx.store.index("by-date").openCursor(IDBKeyRange.upperBound(today, true));
  let removed = 0;
  while (cursor) {
    if (!unsent.has(cursor.value.id)) {
      await cursor.delete();
      removed += 1;
    }
    cursor = await cursor.continue();
  }
  await tx.done;
  if (removed > 0) notifyLocalChange();
}

// ---------- For screens ----------

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export type SyncStatus = {
  state: SyncState;
  /** Changes not yet on the server (including refused ones). */
  waiting: number;
  /** Changes the server refused; they need the user's attention. */
  refused: number;
};

export function useSyncStatus(): SyncStatus {
  const current = useSyncExternalStore(
    subscribe,
    () => state,
    () => "idle" as SyncState,
  );
  const changes = useLocalVersion();
  const [counts, setCounts] = useState({ waiting: 0, refused: 0 });

  useEffect(() => {
    let cancelled = false;
    localDb()
      .then((db) => Promise.all([db.getAll("outbox"), db.getAll("closes")]))
      .then(([rows, closes]) => {
        if (!cancelled) {
          setCounts({
            waiting: rows.length + closes.length,
            refused: rows.filter((r) => r.error).length + closes.filter((c) => c.error).length,
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [changes]);

  return { state: current, ...counts };
}
