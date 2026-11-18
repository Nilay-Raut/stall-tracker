import "server-only";
import { and, asc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { businessDate } from "@/lib/dates";
import { type Tx, getDb } from "@/server/db/client";
import { entries, paymentConnections, paymentEvents } from "@/server/db/schema";
import { recomputeDay } from "@/server/entries";
import { accountOf, connectionByToken, isConnected } from "./connections";
import { getProvider } from "./providers";
import type { PaymentNotice } from "./providers/types";

/** A payment belongs to a UPI sale typed on the phone up to this long before or after it. */
export const MATCH_WINDOW_MS = 15 * 60_000;

export type ReceiveResult = { status: number; outcome: string };

/**
 * Handles one payment notice from a provider (Phase 12). Order matters:
 * 1. find the shop by the secret callback token; 2. check the provider's signature;
 * 3. keep the notice once (providers retry; repeats change nothing);
 * 4. a successful payment becomes a UPI sale: an existing typed one if it matches,
 *    otherwise a new one the phone will show after its next refresh.
 */
export async function receiveNotice(
  providerId: string,
  token: string,
  body: string,
  headers: Headers,
  { test = false } = {},
): Promise<ReceiveResult> {
  const provider = getProvider(providerId);
  if (!provider) return { status: 404, outcome: "unknown-provider" };
  const connection = await connectionByToken(providerId, token);
  if (!connection) return { status: 404, outcome: "unknown-address" };
  // Address made, details not saved yet: the provider will retry later.
  if (!isConnected(connection)) return { status: 409, outcome: "not-set-up" };

  const verified = provider.verify(body, headers, accountOf(connection));
  if (!verified.ok)
    return { status: verified.reason === "bad-body" ? 400 : 401, outcome: verified.reason };
  // Signed, but not a final state (pending): acknowledge so the provider stops retrying.
  if (!verified.notice) return { status: 200, outcome: "ignored" };
  const notice = verified.notice;

  return getDb().transaction(async (tx) => {
    const [event] = await tx
      .insert(paymentEvents)
      .values({
        shopId: connection.shopId,
        provider: providerId,
        reference: notice.reference,
        status: test ? "test" : notice.status,
        amount: notice.amount,
        paidAt: notice.paidAt,
        payload: notice.payload as object,
      })
      .onConflictDoNothing()
      .returning({ id: paymentEvents.id });

    const stamp = test ? { lastTestAt: new Date() } : { lastEventAt: new Date() };
    await tx.update(paymentConnections).set(stamp).where(eq(paymentConnections.id, connection.id));

    if (!event) return { status: 200, outcome: "repeat" };
    if (test || notice.status !== "success")
      return { status: 200, outcome: test ? "test" : notice.status };

    const outcome = await recordSale(tx, connection.shopId, providerId, event.id, notice);
    return { status: 200, outcome };
  });
}

/** Links the payment to a matching typed UPI sale, or adds a new UPI sale for it. */
async function recordSale(
  tx: Tx,
  shopId: string,
  providerId: string,
  eventId: string,
  notice: PaymentNotice,
): Promise<"matched" | "created"> {
  const paidAt = notice.paidAt;
  const [match] = await tx
    .select({ id: entries.id, businessDate: entries.businessDate })
    .from(entries)
    .where(
      and(
        eq(entries.shopId, shopId),
        eq(entries.type, "sale"),
        eq(entries.paymentMode, "upi"),
        eq(entries.amount, notice.amount),
        isNull(entries.deletedAt),
        isNull(entries.paidVia),
        gte(entries.occurredAt, new Date(paidAt.getTime() - MATCH_WINDOW_MS)),
        lte(entries.occurredAt, new Date(paidAt.getTime() + MATCH_WINDOW_MS)),
      ),
    )
    .orderBy(
      asc(
        sql`abs(extract(epoch from ${entries.occurredAt} - ${paidAt.toISOString()}::timestamptz))`,
      ),
    )
    .limit(1);

  if (match) {
    // Same version time: the phone takes the server's copy (with the PhonePe mark) on its next refresh.
    await tx.update(entries).set({ paidVia: providerId }).where(eq(entries.id, match.id));
    await tx.update(paymentEvents).set({ entryId: match.id }).where(eq(paymentEvents.id, eventId));
    return "matched";
  }

  const id = crypto.randomUUID();
  const date = businessDate(paidAt);
  await tx.insert(entries).values({
    id,
    shopId,
    businessDate: date,
    type: "sale",
    amount: notice.amount,
    paymentMode: "upi",
    occurredAt: paidAt,
    clientUpdatedAt: new Date(),
    paidVia: providerId,
  });
  await tx
    .update(paymentEvents)
    .set({ entryId: id, autoCreated: true })
    .where(eq(paymentEvents.id, eventId));
  await recomputeDay(tx, shopId, date);
  return "created";
}

/**
 * The other order: the owner types (or bills) a UPI sale after the payment already
 * made its own sale. The typed one is kept (it may carry a bill) and the automatic
 * one is removed, so the money counts once. Runs inside the sync transaction.
 * Returns the provider id to mark the typed sale with, and the day the removed sale was on.
 */
export async function takeOverAutoSale(
  tx: Tx,
  shopId: string,
  sale: { id: string; amount: number; occurredAt: Date },
): Promise<{ provider: string; removedFrom: string } | null> {
  const [auto] = await tx
    .select({
      eventId: paymentEvents.id,
      provider: paymentEvents.provider,
      entryId: entries.id,
      businessDate: entries.businessDate,
    })
    .from(paymentEvents)
    .innerJoin(entries, eq(entries.id, paymentEvents.entryId))
    .where(
      and(
        eq(paymentEvents.shopId, shopId),
        eq(paymentEvents.autoCreated, true),
        isNull(entries.deletedAt),
        eq(entries.amount, sale.amount),
        gte(entries.occurredAt, new Date(sale.occurredAt.getTime() - MATCH_WINDOW_MS)),
        lte(entries.occurredAt, new Date(sale.occurredAt.getTime() + MATCH_WINDOW_MS)),
      ),
    )
    .orderBy(
      asc(
        sql`abs(extract(epoch from ${entries.occurredAt} - ${sale.occurredAt.toISOString()}::timestamptz))`,
      ),
    )
    .limit(1);
  if (!auto || auto.entryId === sale.id) return null;

  const now = new Date();
  // A newer version time, so the phone drops its copy of the automatic sale.
  await tx
    .update(entries)
    .set({ deletedAt: now, clientUpdatedAt: now })
    .where(eq(entries.id, auto.entryId));
  await tx
    .update(paymentEvents)
    .set({ entryId: sale.id, autoCreated: false })
    .where(eq(paymentEvents.id, auto.eventId));
  return { provider: auto.provider, removedFrom: auto.businessDate };
}
