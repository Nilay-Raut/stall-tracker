"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Entry } from "@/domain/entry";
import { type BusinessDate, businessDate } from "@/lib/dates";
import { type OutboxRow, SNAPSHOT_KEY, type ShopSnapshot, localDb } from "./localDb";

// ---------- Change notifications ----------
// Every write bumps a version number; screens re-read local data when it changes.
// A BroadcastChannel passes the news to other open tabs of the app.

let version = 0;
const listeners = new Set<() => void>();
let channel: BroadcastChannel | undefined;

function bump() {
  version += 1;
  for (const listener of listeners) listener();
}

function getChannel(): BroadcastChannel | undefined {
  if (!channel && typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel("stall-tracker");
    channel.onmessage = bump;
  }
  return channel;
}

/** Call after any change to local data. */
export function notifyLocalChange(): void {
  bump();
  getChannel()?.postMessage("changed");
}

function subscribe(listener: () => void) {
  getChannel();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLocalVersion(): number {
  return useSyncExternalStore(
    subscribe,
    () => version,
    () => 0,
  );
}

// ---------- Today's date ----------

const noSubscribe = () => () => {};

/**
 * Today's business date, read in the browser only (null while rendering on the
 * server), so a page prerendered yesterday never shows yesterday's date.
 */
export function useToday(): BusinessDate | null {
  return useSyncExternalStore(noSubscribe, businessDate, () => null);
}

// ---------- One day's data ----------

export type DayView = {
  loaded: boolean;
  snapshot: ShopSnapshot | null;
  /** Newest first, deleted entries left out. */
  entries: Entry[];
  /** Entries with a change not yet on the server, and why any were refused. */
  pending: Map<string, OutboxRow>;
  /** Local storage could not be opened (very rare: some private modes). */
  storageError: boolean;
};

const EMPTY: DayView = {
  loaded: false,
  snapshot: null,
  entries: [],
  pending: new Map(),
  storageError: false,
};

/** Everything Today needs for one day, re-read whenever local data changes. */
export function useDayView(date: BusinessDate | null): DayView {
  const changes = useLocalVersion();
  const [view, setView] = useState<DayView>(EMPTY);

  useEffect(() => {
    if (!date) return;
    let cancelled = false;

    (async () => {
      const db = await localDb();
      const [snapshot, dayEntries, outbox] = await Promise.all([
        db.get("meta", SNAPSHOT_KEY),
        db.getAllFromIndex("entries", "by-date", date),
        db.getAll("outbox"),
      ]);
      if (cancelled) return;
      const mine = outbox.filter((row) => row.userId === snapshot?.userId);
      setView({
        loaded: true,
        snapshot: snapshot ?? null,
        entries: dayEntries
          .filter((entry) => !entry.deleted)
          .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
        pending: new Map(mine.map((row) => [row.entryId, row])),
        storageError: false,
      });
    })().catch(() => {
      if (!cancelled) setView({ ...EMPTY, loaded: true, storageError: true });
    });

    return () => {
      cancelled = true;
    };
  }, [date, changes]);

  return view;
}

/**
 * One entry from local data, for the edit screens: undefined while loading,
 * null if there is no id or the entry is not on this phone.
 */
export function useLocalEntry(id: string | null): Entry | null | undefined {
  const [loaded, setLoaded] = useState<{ id: string; entry: Entry | null } | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    localDb()
      .then((db) => db.get("entries", id))
      .then((found) => {
        if (!cancelled) setLoaded({ id, entry: found && !found.deleted ? found : null });
      })
      .catch(() => !cancelled && setLoaded({ id, entry: null }));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) return null;
  // Only trust a result loaded for this same id (the screen may have shown another one before).
  return loaded?.id === id ? loaded.entry : undefined;
}

/** The shop basics saved on the phone (name, mode, purchase hints), or null before the first visit. */
export function useShopSnapshot(): ShopSnapshot | null {
  const changes = useLocalVersion();
  const [snapshot, setSnapshot] = useState<ShopSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    localDb()
      .then((db) => db.get("meta", SNAPSHOT_KEY))
      .then((found) => !cancelled && setSnapshot(found ?? null))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [changes]);

  return snapshot;
}
