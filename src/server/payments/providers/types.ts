import type { Paise } from "@/lib/money";

/*
 * One app, many payment providers (Phase 12). Each provider is one file that
 * describes how an owner connects it and how its payment notices are checked.
 * Everything else (storage, matching notices to sales, Settings) is shared.
 * To add one: write providers/<name>.ts, register it in providers/index.ts.
 */

/** A field the owner fills in to connect. Labels are English keys shown through t(). */
export type ProviderField = {
  key: string;
  label: string;
  hint?: string;
  /** Stored encrypted and never shown again (only "saved"). */
  secret: boolean;
  inputMode?: "text" | "numeric";
};

/** The parts of a connection a provider needs to check a notice. */
export type ProviderAccount = { accountId: string; secrets: Record<string, string> };

/** A payment notice in the app's own terms, whatever the provider. */
export type PaymentNotice = {
  /** The provider's transaction id: a notice with a known reference is a repeat. */
  reference: string;
  status: "success" | "failed" | "cancelled";
  amount: Paise;
  paidAt: Date;
  payload: unknown;
};

export type VerifyResult =
  | { ok: true; notice: PaymentNotice | null } // null: signed but not final (pending): ignore
  | { ok: false; reason: "bad-body" | "bad-signature" | "wrong-account" };

export type SettingsResult =
  { ok: true; account: ProviderAccount } | { ok: false; errors: Record<string, string> };

export interface PaymentProvider {
  /** Used in addresses and the database: lower-case, stable. */
  id: string;
  /** Brand name, shown as is. */
  name: string;
  /** What to ask the provider for, as a message the owner can copy (English key). */
  askMessage: string;
  fields: ProviderField[];
  /** Checks and splits what the owner typed into the public id and the secrets. */
  parseSettings(input: Record<string, string>): SettingsResult;
  /** Checks a notice's signature and reads it. Must never trust an unsigned body. */
  verify(body: string, headers: Headers, account: ProviderAccount): VerifyResult;
  /** A correctly signed sample notice, for "Send a test" in Settings. */
  sampleNotice(
    account: ProviderAccount,
    sample: { reference: string; amount: Paise },
  ): { body: string; headers: Record<string, string> };
}
