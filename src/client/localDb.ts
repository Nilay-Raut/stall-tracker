import { type DBSchema, type IDBPDatabase, deleteDB, openDB } from "idb";
import type { CloseInput } from "@/domain/dayClose";
import type { Entry } from "@/domain/entry";
import type { NoteHint } from "@/domain/expenseNotes";
import type { FixedCostMonth } from "@/domain/fixedPaid";
import type { MaterialHint } from "@/domain/materials";
import type { RestockHint } from "@/domain/restock";
import type { BusinessDate, Lang } from "@/lib/dates";
import type { Paise } from "@/lib/money";
import type { SalesMode } from "@/domain/entry";

/**
 * Data kept on the phone (IndexedDB), so the app works without a network.
 * Small by design: today's entries, unsent changes and the shop basics.
 * Never holds passwords, PINs or the session token.
 */

/** What the server sends with the Today page; also what Today shows offline. */
export type ShopSnapshot = {
  userId: string;
  shopName: string;
  /** The language chosen in Setup (missing in snapshots stored before Phase 10). */
  language?: Lang;
  salesMode: SalesMode;
  /** The day the snapshot was made for, and that day's fixed cost. */
  date: BusinessDate;
  fixedCostPerDay: Paise;
  /** Profit from the closing count if that day is closed, else null. */
  closedProfit?: Paise | null;
  /** That day's sales target from the monthly profit target, or null if none is set. */
  dailyTarget?: Paise | null;
  /** "22:00": for the reminder banner after closing time. */
  closingTime?: string;
  /** What closing that day needs, so it works offline (Phase 9). */
  close?: {
    openingCash: Paise;
    previous: CloseInput | null;
    plateItems: Array<{ id: string; name: string; price: Paise; cost: Paise }>;
    previousCounts: Record<string, number>;
    paymentsConnected?: boolean;
  };
  /** A payment app (PhonePe) adds UPI sales by itself (Phase 12): Today refreshes often. */
  paymentsConnected?: boolean;
  /** Items to tap on a bill, so billing works offline (v2 Phase 3). */
  saleItems?: Array<{ id: string; name: string; price: Paise }>;
  /** Brand colour "#rrggbb" (null = the app's green) and logo version (v2 Phase 2). */
  accentColor?: string | null;
  logoVersion?: number | null;
  /** Last rate of each material and known suppliers, for the expense form (Phase 7). */
  materials?: MaterialHint[];
  suppliers?: string[];
  /** Notes of past "Other" expenses, for quick add on the expense form. */
  expenseNotes?: NoteHint[];
  /** False when the owner keeps fixed costs out of Today's profit (missing = true). */
  fixedCostInDailyProfit?: boolean;
  /** Latest earlier day with entries that was never closed, for a banner on Today. */
  unclosedDate?: BusinessDate | null;
  /** Sale amounts typed most lately, for one-tap buttons on Add sale. */
  quickAmounts?: Paise[];
  /** Materials usually bought by now, for a nudge on Today. */
  restock?: RestockHint[];
  /** The stall's UPI account balance at the start of that day; null until the owner sets it. */
  upiStart?: Paise | null;
  /** The month's fixed costs and what was paid towards each before that day (the phone adds that day's). */
  fixedCostsMonth?: FixedCostMonth[];
};

/** A change waiting to reach the server. One row per entry: the latest version. */
export type OutboxRow = {
  entryId: string;
  /** Whose change this is. Never sent while someone else is logged in. */
  userId: string;
  entry: Entry;
  queuedAt: string;
  /** Set when the server refused the change; it then waits for the user. */
  error?: string;
};

/** A day closed on the phone, waiting to reach the server. One row per day. */
export type PendingClose = {
  date: BusinessDate;
  userId: string;
  input: CloseInput;
  plateCounts: Array<{ itemId: string; quantity: number }> | null;
  updatedAt: string;
  /** Set when the server refused it (e.g. the drawer did not add up with its entries). */
  error?: string;
};

interface StallDb extends DBSchema {
  entries: { key: string; value: Entry; indexes: { "by-date": string } };
  outbox: { key: string; value: OutboxRow; indexes: { "by-queued": string } };
  meta: { key: string; value: ShopSnapshot };
  closes: { key: string; value: PendingClose };
}

const DB_NAME = "stall-tracker";
export const SNAPSHOT_KEY = "snapshot";

let dbPromise: Promise<IDBPDatabase<StallDb>> | undefined;

export function localDb(): Promise<IDBPDatabase<StallDb>> {
  dbPromise ??= openDB<StallDb>(DB_NAME, 2, {
    // Each step only adds; phones on an older version keep their data.
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore("entries", { keyPath: "id" }).createIndex("by-date", "businessDate");
        db.createObjectStore("outbox", { keyPath: "entryId" }).createIndex("by-queued", "queuedAt");
        db.createObjectStore("meta");
      }
      if (oldVersion < 2) {
        db.createObjectStore("closes", { keyPath: "date" }); // Phase 9: closing offline
      }
    },
    // Another tab upgraded the database: let it, and reopen next time.
    blocking() {
      void dbPromise?.then((db) => db.close());
      dbPromise = undefined;
    },
  });
  return dbPromise;
}

/** Removes everything stored on this phone (used at logout). */
export async function wipeLocalData(): Promise<void> {
  const db = await dbPromise;
  db?.close();
  dbPromise = undefined;
  await deleteDB(DB_NAME);
}
