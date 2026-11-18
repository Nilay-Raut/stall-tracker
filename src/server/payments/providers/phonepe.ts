import { createHash, timingSafeEqual } from "node:crypto";
import { msg } from "@/i18n/translate";
import type { PaymentNotice, PaymentProvider, ProviderAccount, VerifyResult } from "./types";

/*
 * PhonePe "Integrated Static QR" with server-to-server callback (Phase 12).
 * PhonePe POSTs to the shop's callback address within seconds of each payment to
 * the shop's QR (and retries 3 times unless it gets 200 OK):
 *
 *   body:      {"response": "<base64 of the JSON result>"}
 *   X-VERIFY:  SHA256(response + saltKey) + "###" + saltIndex
 *   decoded:   { success, code, message, data: { merchantId, transactionId,
 *                providerReferenceId, amount (paise), paymentState, payResponseCode, ... } }
 *
 * Success is decided by `code` (PhonePe: "Success/Failure ... should be dependent on
 * the code"): a cancelled payment also has success: true.
 * Docs: developer.phonepe.com/offline-integration/response-capturing-api/server-to-server-callback
 */

const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

const STATUS: Record<string, PaymentNotice["status"]> = {
  PAYMENT_SUCCESS: "success",
  PAYMENT_ERROR: "failed",
  PAYMENT_DECLINED: "failed",
  PAYMENT_CANCELLED: "cancelled",
};

type Decoded = {
  code?: unknown;
  data?: {
    merchantId?: unknown;
    transactionId?: unknown;
    amount?: unknown;
    paymentState?: unknown;
    updateTimestamp?: unknown;
  };
};

/** "1763440200000" ms or seconds -> Date; anything else -> now. */
function timeOf(value: unknown): Date {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n) || n <= 0) return new Date();
  return new Date(n < 1e12 ? n * 1000 : n);
}

function sameText(a: string, b: string): boolean {
  const x = Buffer.from(a.toLowerCase());
  const y = Buffer.from(b.toLowerCase());
  return x.length === y.length && timingSafeEqual(x, y);
}

function sign(response: string, account: ProviderAccount): string {
  return `${sha256(response + account.secrets.saltKey)}###${account.secrets.saltIndex}`;
}

export const phonepe: PaymentProvider = {
  id: "phonepe",
  name: "PhonePe",
  askMessage: msg(
    "Hello PhonePe Business team. Please switch on Integrated Static QR with S2S callback for my merchant account, and send me my Merchant ID, Salt Key and Salt Index. Callback URL: {url}",
  ),
  fields: [
    { key: "merchantId", label: msg("Merchant ID"), secret: false },
    { key: "saltKey", label: msg("Salt key"), secret: true },
    { key: "saltIndex", label: msg("Salt index"), secret: false, inputMode: "numeric" },
  ],

  parseSettings(input) {
    const merchantId = (input.merchantId ?? "").trim();
    const saltKey = (input.saltKey ?? "").trim();
    const saltIndex = (input.saltIndex ?? "").trim();
    const errors: Record<string, string> = {};
    if (!/^[A-Za-z0-9_-]{3,64}$/.test(merchantId)) {
      errors.merchantId = msg("Enter the Merchant ID from PhonePe.");
    }
    if (!/^[A-Za-z0-9-]{8,128}$/.test(saltKey))
      errors.saltKey = msg("Enter the salt key from PhonePe.");
    if (!/^\d{1,3}$/.test(saltIndex)) errors.saltIndex = msg("Enter the salt index, like 1.");
    return Object.keys(errors).length
      ? { ok: false, errors }
      : { ok: true, account: { accountId: merchantId, secrets: { saltKey, saltIndex } } };
  },

  verify(body, headers, account): VerifyResult {
    let response: string;
    try {
      const parsed = JSON.parse(body) as { response?: unknown };
      if (typeof parsed.response !== "string" || !parsed.response)
        return { ok: false, reason: "bad-body" };
      response = parsed.response;
    } catch {
      return { ok: false, reason: "bad-body" };
    }

    // Signature first: nothing in an unsigned body is read.
    const given = headers.get("x-verify") ?? "";
    if (!given || !sameText(given, sign(response, account))) {
      return { ok: false, reason: "bad-signature" };
    }

    let decoded: Decoded;
    try {
      decoded = JSON.parse(Buffer.from(response, "base64").toString("utf8")) as Decoded;
    } catch {
      return { ok: false, reason: "bad-body" };
    }
    const data = decoded.data ?? {};
    if (data.merchantId !== account.accountId) return { ok: false, reason: "wrong-account" };

    const status = typeof decoded.code === "string" ? STATUS[decoded.code] : undefined;
    if (!status) return { ok: true, notice: null }; // pending or unknown: not final
    // A success must also say COMPLETED; anything else is not counted as money in.
    const finalStatus =
      status === "success" && data.paymentState !== "COMPLETED" ? "failed" : status;

    const amount = data.amount;
    const reference = data.transactionId;
    if (typeof reference !== "string" || !reference || typeof amount !== "number") {
      return { ok: false, reason: "bad-body" };
    }
    if (!Number.isInteger(amount) || amount <= 0 || amount > 1_00_00_000_00) {
      return { ok: false, reason: "bad-body" };
    }
    return {
      ok: true,
      notice: {
        reference: reference.slice(0, 64),
        status: finalStatus,
        amount,
        paidAt: timeOf(data.updateTimestamp),
        payload: decoded,
      },
    };
  },

  sampleNotice(account, sample) {
    const decoded = {
      success: true,
      code: "PAYMENT_SUCCESS",
      message: "Your payment is successful.",
      data: {
        transactionId: sample.reference,
        merchantId: account.accountId,
        providerReferenceId: `TEST${sample.reference}`,
        amount: sample.amount,
        paymentState: "COMPLETED",
        payResponseCode: "SUCCESS",
        paymentModes: [{ mode: "ACCOUNT", amount: sample.amount, utr: "000000000000" }],
        transactionContext: { storeId: "test", terminalId: "test" },
      },
    };
    const response = Buffer.from(JSON.stringify(decoded)).toString("base64");
    return {
      body: JSON.stringify({ response }),
      headers: { "Content-Type": "application/json", "X-VERIFY": sign(response, account) },
    };
  },
};
