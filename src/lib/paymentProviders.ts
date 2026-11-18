/**
 * Display names of payment providers, safe to use on the phone (Phase 12).
 * Keep in step with src/server/payments/providers (which holds the server logic).
 */
export const PROVIDER_NAMES: Record<string, string> = { phonepe: "PhonePe" };

export const providerName = (id: string | null | undefined) =>
  id ? (PROVIDER_NAMES[id] ?? id) : null;
