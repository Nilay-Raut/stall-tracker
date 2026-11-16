import { z } from "zod";
import type { Entry } from "./entry";

/** Most entry changes one sync request may carry. Larger queues go in batches. */
export const SYNC_BATCH_SIZE = 50;
export const MAX_CLOSES_PER_SYNC = 10;

const paise = z.int().min(0).max(1_00_00_000_00);

/** A day closed on a phone (possibly offline), as sent to the server. */
export const closeChangeSchema = z.object({
  date: z.iso.date(),
  input: z.object({
    openingCash: paise,
    countedCash: paise,
    upiTotal: paise,
    waste: paise.nullable(),
  }),
  plateCounts: z
    .array(z.object({ itemId: z.uuid(), quantity: z.int().min(0).max(9999) }))
    .max(50)
    .nullable(),
  updatedAt: z.iso.datetime({ offset: true }),
});
export type CloseChange = z.infer<typeof closeChangeSchema>;

export type SyncRequest = { entries?: Entry[]; closes?: CloseChange[] };

export type SyncResult =
  | { id: string; status: "saved" }
  /** The server already had a newer version of this entry. */
  | { id: string; status: "stale" }
  | { id: string; status: "rejected"; reason: string };

export type CloseResult =
  { date: string; status: "saved" } | { date: string; status: "rejected"; reason: string };

export type SyncResponse = { results: SyncResult[]; closeResults: CloseResult[] };
