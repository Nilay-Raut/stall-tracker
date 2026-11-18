import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { type PaymentConnection, paymentConnections } from "@/server/db/schema";
import type { ProviderAccount } from "./providers/types";
import { newToken, open, seal, tokenHash } from "./secretBox";

/** A shop's connection to one provider, or null. */
export async function getConnection(
  shopId: string,
  provider: string,
): Promise<PaymentConnection | null> {
  const [row] = await getDb()
    .select()
    .from(paymentConnections)
    .where(and(eq(paymentConnections.shopId, shopId), eq(paymentConnections.provider, provider)));
  return row ?? null;
}

export async function listConnections(shopId: string): Promise<PaymentConnection[]> {
  return getDb().select().from(paymentConnections).where(eq(paymentConnections.shopId, shopId));
}

/** The connection a provider's callback token belongs to (only the hash is looked up). */
export async function connectionByToken(
  provider: string,
  token: string,
): Promise<PaymentConnection | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const [row] = await getDb()
    .select()
    .from(paymentConnections)
    .where(
      and(
        eq(paymentConnections.provider, provider),
        eq(paymentConnections.callbackTokenHash, tokenHash(token)),
      ),
    );
  return row ?? null;
}

/**
 * Saves (or updates) a connection. Updating keeps the callback address, so the
 * owner never has to send PhonePe a new one after fixing a typo.
 */
export async function saveConnection(
  shopId: string,
  provider: string,
  account: ProviderAccount,
): Promise<void> {
  const existing = await getConnection(shopId, provider);
  const token = existing ? open(existing.callbackToken) : newToken();
  const values = {
    accountId: account.accountId,
    secrets: seal(JSON.stringify(account.secrets)),
    callbackTokenHash: tokenHash(token),
    callbackToken: seal(token),
  };
  await getDb()
    .insert(paymentConnections)
    .values({ shopId, provider, ...values })
    .onConflictDoUpdate({
      target: [paymentConnections.shopId, paymentConnections.provider],
      set: values,
    });
}

/**
 * Step 1 of connecting: makes the shop's secret callback address before the
 * provider has sent any details (the provider needs the address first).
 */
export async function startConnection(shopId: string, provider: string): Promise<void> {
  if (await getConnection(shopId, provider)) return;
  const token = newToken();
  await getDb()
    .insert(paymentConnections)
    .values({
      shopId,
      provider,
      accountId: "",
      secrets: seal("{}"),
      callbackTokenHash: tokenHash(token),
      callbackToken: seal(token),
    })
    .onConflictDoNothing();
}

/** Details from the provider have been saved (not just the address made). */
export const isConnected = (connection: PaymentConnection | null) =>
  !!connection && connection.accountId !== "";

export async function deleteConnection(shopId: string, provider: string): Promise<void> {
  await getDb()
    .delete(paymentConnections)
    .where(and(eq(paymentConnections.shopId, shopId), eq(paymentConnections.provider, provider)));
}

export function accountOf(connection: PaymentConnection): ProviderAccount {
  return {
    accountId: connection.accountId,
    secrets: JSON.parse(open(connection.secrets)) as Record<string, string>,
  };
}

/** The address the provider must call for this shop. */
export function callbackPath(connection: PaymentConnection): string {
  return `/api/payments/${connection.provider}/${open(connection.callbackToken)}`;
}
