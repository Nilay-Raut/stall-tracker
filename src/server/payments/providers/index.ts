import { phonepe } from "./phonepe";
import type { PaymentProvider } from "./types";

/**
 * Every payment provider the app can connect to. Add a new one here (one file
 * implementing PaymentProvider); Settings, the callback route and matching pick it up.
 */
export const PROVIDERS: readonly PaymentProvider[] = [phonepe];

export function getProvider(id: string): PaymentProvider | null {
  return PROVIDERS.find((p) => p.id === id) ?? null;
}

export type { PaymentProvider } from "./types";
