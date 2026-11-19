"use client";

import { useSyncExternalStore } from "react";
import type { Entry, EntryType } from "@/domain/entry";
import type { Paise } from "@/lib/money";
import { saveEntry } from "./entries";

/**
 * "Saved ₹500 Cash · Undo" for a few seconds after a save or delete. Undo writes
 * back the entry as it was before (a new entry comes back deleted), through the
 * normal save, so it also works offline and syncs like any other change.
 * Kept in sessionStorage too, since an offline save reloads the page.
 */
export type UndoOffer = {
  kind: "saved" | "deleted";
  type: EntryType;
  amount: Paise;
  /** The entry as it should be after Undo. */
  restore: Entry;
  /**
   * The screen the offer belongs to ("/" or "/day/2026-11-18"): the bar shows only
   * there, so it never covers the buttons of another screen. Missing: anywhere.
   */
  where?: string;
  /** Time (ms) after which the offer goes away. */
  until: number;
};

export const UNDO_SECONDS = 6;
const KEY = "stall:undo";
const listeners = new Set<() => void>();
let current: UndoOffer | null | undefined; // undefined = not read from storage yet

function emit() {
  for (const listener of listeners) listener();
}

function read(): UndoOffer | null {
  if (current === undefined) {
    try {
      const saved = sessionStorage.getItem(KEY);
      current = saved ? (JSON.parse(saved) as UndoOffer) : null;
    } catch {
      current = null;
    }
  }
  if (current && current.until <= Date.now()) current = null;
  return current;
}

function write(offer: UndoOffer | null) {
  current = offer;
  try {
    if (offer) sessionStorage.setItem(KEY, JSON.stringify(offer));
    else sessionStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the offer lasts while this page is open.
  }
  emit();
}

export function offerUndo(offer: Omit<UndoOffer, "until">) {
  write({ ...offer, until: Date.now() + UNDO_SECONDS * 1000 });
}

export function dismissUndo() {
  write(null);
}

export async function runUndo(): Promise<void> {
  const offer = read();
  write(null);
  if (offer) await saveEntry({ ...offer.restore, updatedAt: new Date().toISOString() });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useUndoOffer(): UndoOffer | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
