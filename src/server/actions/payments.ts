"use server";

import { revalidatePath } from "next/cache";
import { msg } from "@/i18n/translate";
import {
  accountOf,
  deleteConnection,
  getConnection,
  isConnected,
  saveConnection,
  startConnection,
} from "@/server/payments/connections";
import { getProvider } from "@/server/payments/providers";
import { receiveNotice } from "@/server/payments/receive";
import { open, paymentsAvailable } from "@/server/payments/secretBox";
import { requireShop } from "@/server/queries/shop";
import type { FormState } from "./formState";

// Settings > UPI payments (Phase 12). Every action works on the owner's own shop only.

const page = (provider: string) => `/settings/payments/${provider}`;

async function setUp(providerId: string) {
  const shop = await requireShop();
  const provider = getProvider(providerId);
  if (!provider) throw new Error("Unknown payment provider");
  if (!paymentsAvailable()) throw new Error("PAYMENTS_KEY is not set on the server");
  return { shop, provider };
}

/** Step 1: make the shop's callback address. */
export async function startPayments(providerId: string): Promise<void> {
  const { shop } = await setUp(providerId);
  await startConnection(shop.id, providerId);
  revalidatePath(page(providerId));
}

/** Step 3: save the details the provider sent. */
export async function savePaymentDetails(
  providerId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { shop, provider } = await setUp(providerId);
  const input = Object.fromEntries(
    provider.fields.map((f) => [f.key, String(formData.get(f.key) ?? "")]),
  );
  const parsed = provider.parseSettings(input);
  if (!parsed.ok) {
    // Secrets are never sent back to the form.
    const values = Object.fromEntries(
      provider.fields.filter((f) => !f.secret).map((f) => [f.key, input[f.key]]),
    );
    return { error: msg("Some details need fixing."), fieldErrors: parsed.errors, values };
  }
  await saveConnection(shop.id, providerId, parsed.account);
  revalidatePath(page(providerId));
  revalidatePath("/settings/payments");
  return {};
}

export type TestResult = { ok: boolean; message: string };

/**
 * Step 4: a correctly signed sample notice, sent through the same checks as a real
 * one (decrypting the key, the signature, storing it). It adds no sale.
 */
export async function sendTestPayment(providerId: string): Promise<TestResult> {
  const { shop, provider } = await setUp(providerId);
  const connection = await getConnection(shop.id, providerId);
  if (!connection || !isConnected(connection)) {
    return { ok: false, message: msg("Save the details from PhonePe first.") };
  }
  const sample = provider.sampleNotice(accountOf(connection), {
    reference: `TEST-${Date.now()}`,
    amount: 100,
  });
  const result = await receiveNotice(
    providerId,
    open(connection.callbackToken),
    sample.body,
    new Headers(sample.headers),
    { test: true },
  );
  revalidatePath(page(providerId));
  return result.outcome === "test"
    ? { ok: true, message: msg("Test payment received and checked. You are ready.") }
    : { ok: false, message: msg("The test did not pass. Check the details and try again.") };
}

export async function disconnectPayments(providerId: string): Promise<void> {
  const { shop } = await setUp(providerId);
  await deleteConnection(shop.id, providerId);
  revalidatePath(page(providerId));
  revalidatePath("/settings/payments");
}
