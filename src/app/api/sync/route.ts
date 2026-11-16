import { z } from "zod";
import { computeClose } from "@/domain/dayClose";
import { entrySchema } from "@/domain/entry";
import {
  type CloseResult,
  MAX_CLOSES_PER_SYNC,
  SYNC_BATCH_SIZE,
  type SyncResult,
  closeChangeSchema,
} from "@/domain/sync";
import { businessDate, shiftDate } from "@/lib/dates";
import { getCloseContext, saveClose } from "@/server/days";
import type { Shop } from "@/server/db/schema";
import { applyEntryChanges } from "@/server/entries";
import { getShopForApi } from "@/server/queries/shop";

const bodySchema = z
  .object({
    entries: z.array(z.unknown()).max(SYNC_BATCH_SIZE).default([]),
    closes: z.array(z.unknown()).max(MAX_CLOSES_PER_SYNC).default([]),
  })
  .refine((b) => b.entries.length + b.closes.length > 0);

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Accepts a date from up to a year back, and tomorrow (phone clock a little ahead). */
function dateInRange(date: string): boolean {
  const today = businessDate();
  return date <= shiftDate(today, 1) && date >= shiftDate(today, -366);
}

/**
 * Receives changes saved on the phone (possibly while offline) and applies them:
 * entries first, then day closes, so a close is checked against every entry of its day.
 * Each item gets its own result so one bad item never blocks the rest.
 * POST /api/sync  { entries?, closes? }  ->  { results, closeResults }
 */
export async function POST(request: Request) {
  // Only pages of this app may call this (blocks cross-site requests).
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) {
    return json({ error: "forbidden" }, 403);
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return json({ error: "unsupported" }, 415);
  }

  const auth = await getShopForApi();
  if ("error" in auth) {
    return json({ error: auth.error }, auth.error === "unauthenticated" ? 401 : 409);
  }

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return json({ error: "bad-request" }, 400);

  const results: SyncResult[] = [];
  const valid = [];
  for (const raw of body.data.entries) {
    const parsed = entrySchema.safeParse(raw);
    const id = (raw as { id?: unknown })?.id;
    if (!parsed.success) {
      results.push({ id: typeof id === "string" ? id : "", status: "rejected", reason: "invalid" });
    } else if (!dateInRange(parsed.data.businessDate)) {
      results.push({ id: parsed.data.id, status: "rejected", reason: "date-out-of-range" });
    } else {
      valid.push(parsed.data);
    }
  }
  results.push(...(await applyEntryChanges(auth.shop.id, valid)));

  const closeResults: CloseResult[] = [];
  for (const raw of body.data.closes) {
    closeResults.push(await applyClose(auth.shop, raw));
  }
  return json({ results, closeResults });
}

async function applyClose(shop: Shop, raw: unknown): Promise<CloseResult> {
  const parsed = closeChangeSchema.safeParse(raw);
  const date = (raw as { date?: unknown })?.date;
  if (!parsed.success) {
    return { date: typeof date === "string" ? date : "", status: "rejected", reason: "invalid" };
  }
  const close = parsed.data;
  if (close.date > businessDate() || !dateInRange(close.date)) {
    return { date: close.date, status: "rejected", reason: "date-out-of-range" };
  }

  const context = await getCloseContext(shop, close.date);
  if (computeClose(context.entered, close.input).cashSales < 0) {
    return { date: close.date, status: "rejected", reason: "drawer-short" };
  }
  // Only this shop's items can be counted.
  const known = new Set(context.plateItems.map((i) => i.id));
  const counts = close.plateCounts?.filter((c) => known.has(c.itemId)) ?? null;
  await saveClose(shop.id, close.date, close.input, counts);
  return { date: close.date, status: "saved" };
}
