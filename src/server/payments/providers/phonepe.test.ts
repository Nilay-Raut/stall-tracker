import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { phonepe } from "./phonepe";

const account = {
  accountId: "M2306160483220675579140",
  secrets: { saltKey: "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399", saltIndex: "1" },
};

/** A notice built the way PhonePe documents it. */
function notice(decoded: object, saltKey = account.secrets.saltKey) {
  const response = Buffer.from(JSON.stringify(decoded)).toString("base64");
  const xVerify = `${createHash("sha256")
    .update(response + saltKey)
    .digest("hex")}###1`;
  return { body: JSON.stringify({ response }), headers: new Headers({ "X-VERIFY": xVerify }) };
}

const paid = {
  success: true,
  code: "PAYMENT_SUCCESS",
  message: "Your payment is successful.",
  data: {
    transactionId: "TX32321849644234",
    merchantId: account.accountId,
    providerReferenceId: "P1806151323093900554957",
    amount: 1000,
    paymentState: "COMPLETED",
    payResponseCode: "SUCCESS",
    paymentModes: [{ mode: "ACCOUNT", amount: 1000, utr: "816626521616" }],
    transactionContext: { storeId: "store1", terminalId: "terminal1" },
  },
};

describe("PhonePe notices", () => {
  it("reads a correctly signed payment (the documented sample)", () => {
    const { body, headers } = notice(paid);
    const result = phonepe.verify(body, headers, account);
    expect(result).toMatchObject({
      ok: true,
      notice: { reference: "TX32321849644234", status: "success", amount: 1000 },
    });
  });

  it("refuses a wrong or missing signature, and another merchant's notice", () => {
    const forged = notice(paid, "not-the-salt-key");
    expect(phonepe.verify(forged.body, forged.headers, account)).toEqual({
      ok: false,
      reason: "bad-signature",
    });
    const { body } = notice(paid);
    expect(phonepe.verify(body, new Headers(), account)).toMatchObject({ reason: "bad-signature" });
    const other = notice({ ...paid, data: { ...paid.data, merchantId: "SOMEONE_ELSE" } });
    expect(phonepe.verify(other.body, other.headers, account)).toMatchObject({
      reason: "wrong-account",
    });
    expect(phonepe.verify("not json", new Headers(), account)).toMatchObject({
      reason: "bad-body",
    });
  });

  it("goes by the code: cancelled and failed are not money in, pending is ignored", () => {
    const cancelled = notice({
      success: true,
      code: "PAYMENT_CANCELLED",
      data: { ...paid.data, paymentState: "CANCELLED" },
    });
    expect(phonepe.verify(cancelled.body, cancelled.headers, account)).toMatchObject({
      notice: { status: "cancelled" },
    });
    const failed = notice({
      success: false,
      code: "PAYMENT_ERROR",
      data: { ...paid.data, paymentState: "FAILED" },
    });
    expect(phonepe.verify(failed.body, failed.headers, account)).toMatchObject({
      notice: { status: "failed" },
    });
    const odd = notice({ ...paid, data: { ...paid.data, paymentState: "PENDING" } });
    expect(phonepe.verify(odd.body, odd.headers, account)).toMatchObject({
      notice: { status: "failed" },
    });
    const pending = notice({ success: true, code: "PAYMENT_PENDING", data: paid.data });
    expect(phonepe.verify(pending.body, pending.headers, account)).toEqual({
      ok: true,
      notice: null,
    });
  });

  it("makes test notices that pass its own check", () => {
    const sample = phonepe.sampleNotice(account, { reference: "TEST-1", amount: 100 });
    const result = phonepe.verify(sample.body, new Headers(sample.headers), account);
    expect(result).toMatchObject({ ok: true, notice: { reference: "TEST-1", amount: 100 } });
  });

  it("checks what the owner types", () => {
    expect(
      phonepe.parseSettings({ merchantId: "M123", saltKey: "abc", saltIndex: "x" }),
    ).toMatchObject({
      ok: false,
      errors: { saltKey: expect.any(String), saltIndex: expect.any(String) },
    });
    expect(
      phonepe.parseSettings({
        merchantId: " M2306160483220675579140 ",
        saltKey: account.secrets.saltKey,
        saltIndex: "1",
      }),
    ).toEqual({ ok: true, account });
  });
});
