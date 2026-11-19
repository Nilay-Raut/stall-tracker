"use client";

import { type Entry, entrySchema } from "@/domain/entry";
import { SNAPSHOT_KEY, type ShopSnapshot, localDb } from "./localDb";
import { mergeDay } from "./merge";
import { notifyLocalChange } from "./localStore";
import { requestSync } from "./sync";
import { msg } from "@/i18n/translate";

export class NotReadyError extends Error {
  constructor() {
    // English; FormError shows it in the phone's language.
    super(msg("Open the app once with internet before adding entries on this phone."));
  }
}

/**
 * The one way entries are written. Saves on the phone first (works offline),
 * then asks for a sync. The screen updates straight away.
 */
export async function saveEntry(entry: Entry): Promise<void> {
  const valid = entrySchema.parse(entry); // a bug, not user input, if this throws
  const db = await localDb();
  const snapshot = await db.get("meta", SNAPSHOT_KEY);
  if (!snapshot) throw new NotReadyError();

  const tx = db.transaction(["entries", "outbox"], "readwrite");
  await Promise.all([
    tx.objectStore("entries").put(valid),
    // One outbox row per entry: a second edit replaces the first unsent one.
    tx.objectStore("outbox").put({
      entryId: valid.id,
      userId: snapshot.userId,
      entry: valid,
      queuedAt: new Date().toISOString(),
    }),
    tx.done,
  ]);

  notifyLocalChange();
  requestSync();
  void keepStorage();
}

export function deleteEntry(entry: Entry): Promise<void> {
  return saveEntry({ ...entry, deleted: true, updatedAt: new Date().toISOString() });
}

/** Changes the shop basics stored on the phone (e.g. today's opening cash after the morning check). */
export async function patchSnapshot(change: (snapshot: ShopSnapshot) => ShopSnapshot) {
  const db = await localDb();
  const snapshot = await db.get("meta", SNAPSHOT_KEY);
  if (!snapshot) return;
  await db.put("meta", change(snapshot), SNAPSHOT_KEY);
  notifyLocalChange();
}

/** Gives up on a change the server refused, and drops the phone's copy of it. */
export async function discardRefusedChange(entryId: string): Promise<void> {
  const db = await localDb();
  const tx = db.transaction(["entries", "outbox"], "readwrite");
  await Promise.all([
    tx.objectStore("outbox").delete(entryId),
    tx.objectStore("entries").delete(entryId),
    tx.done,
  ]);
  notifyLocalChange();
}

/**
 * Takes in fresh data from the server (sent with the Today page). If a different
 * person logged in on this phone, the previous person's entries are cleared first.
 */
export async function applySnapshot(snapshot: ShopSnapshot, serverEntries: Entry[]) {
  const db = await localDb();
  const tx = db.transaction(["meta", "entries", "outbox"], "readwrite");
  const entries = tx.objectStore("entries");

  const previous = await tx.objectStore("meta").get(SNAPSHOT_KEY);
  if (previous && previous.userId !== snapshot.userId) {
    await entries.clear();
  }
  await tx.objectStore("meta").put(snapshot, SNAPSHOT_KEY);

  const pendingIds = new Set(await tx.objectStore("outbox").getAllKeys());
  const local = await entries.index("by-date").getAll(snapshot.date);
  await Promise.all(mergeDay(local, serverEntries, pendingIds).map((e) => entries.put(e)));
  await tx.done;

  notifyLocalChange();
  requestSync(); // anything queued while logged out can go now
}

let persistAsked = false;
/** Asks the browser not to clear the app's storage when space runs low. */
async function keepStorage() {
  if (persistAsked) return;
  persistAsked = true;
  try {
    if (navigator.storage?.persisted && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    // Not supported: entries still save; the browser just may evict them under pressure.
  }
}

/**
 * Takes in one earlier day's entries from the server (Calendar > a day), so they
 * show offline-first and can be edited like today's. Leaves the shop snapshot alone.
 */
export async function applyDayEntries(date: string, serverEntries: Entry[]) {
  const db = await localDb();
  const tx = db.transaction(["entries", "outbox"], "readwrite");
  const entries = tx.objectStore("entries");
  const pendingIds = new Set(await tx.objectStore("outbox").getAllKeys());
  const local = await entries.index("by-date").getAll(date);
  await Promise.all(mergeDay(local, serverEntries, pendingIds).map((e) => entries.put(e)));
  await tx.done;
  notifyLocalChange();
}
