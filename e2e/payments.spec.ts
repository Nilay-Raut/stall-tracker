import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { type Page, expect, test } from "@playwright/test";
import { expectNoSidewaysScroll } from "./helpers";
import { addSale, entryRow, newShop, visibleScreen as screen } from "./shop";

// Phase 12: UPI payments added by themselves (PhonePe Integrated Static QR callback).

const MERCHANT = "M2306160483220675579140";
const SALT_KEY = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";

/** A notice exactly as PhonePe documents it, signed independently of the app's own code. */
function phonePeNotice(amountPaise: number, transactionId: string, saltKey = SALT_KEY) {
  const decoded = {
    success: true,
    code: "PAYMENT_SUCCESS",
    message: "Your payment is successful.",
    data: {
      transactionId,
      merchantId: MERCHANT,
      providerReferenceId: `P${transactionId}`,
      amount: amountPaise,
      paymentState: "COMPLETED",
      payResponseCode: "SUCCESS",
      paymentModes: [{ mode: "ACCOUNT", amount: amountPaise, utr: "816626521616" }],
      transactionContext: { storeId: "store1", terminalId: "terminal1" },
    },
  };
  const response = Buffer.from(JSON.stringify(decoded)).toString("base64");
  const xVerify = `${createHash("sha256")
    .update(response + saltKey)
    .digest("hex")}###1`;
  return {
    data: { response },
    headers: { "Content-Type": "application/json", "X-VERIFY": xVerify },
  };
}

/** Connects PhonePe through Settings the way an owner would. Returns the callback address. */
async function connectPhonePe(page: Page): Promise<string> {
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Settings" })
    .click();
  await screen(page)
    .getByRole("link", { name: /UPI payments/ })
    .click();
  await screen(page)
    .getByRole("link", { name: /PhonePe/ })
    .click();
  await expect(page).toHaveURL(/\/settings\/payments\/phonepe$/);

  await screen(page).getByRole("button", { name: "Get my address" }).click();
  const address = screen(page)
    .getByText(/\/api\/payments\/phonepe\//)
    .first();
  await expect(address).toBeVisible();
  const url = (await address.textContent())!.trim();
  // The message for PhonePe carries the same address.
  await expect(screen(page).getByText(`Callback URL: ${url}`, { exact: false })).toBeVisible();
  // The long address wraps; the page must stay phone-wide.
  await expectNoSidewaysScroll(page);

  await screen(page).getByLabel("Merchant ID").fill(MERCHANT);
  await screen(page).getByLabel("Salt key").fill(SALT_KEY);
  await screen(page).getByLabel("Salt index").fill("1");
  await screen(page).getByRole("button", { name: "Save and connect" }).click();
  await expect(screen(page).getByText("PhonePe is connected")).toBeVisible();
  return url;
}

const callbackPath = (url: string) => new URL(url).pathname;

test("PhonePe connects in four steps and its test passes", async ({ page }) => {
  await newShop(page);
  await connectPhonePe(page);

  await screen(page).getByRole("button", { name: "Send a test" }).click();
  await expect(
    screen(page).getByText("Test payment received and checked. You are ready."),
  ).toBeVisible();

  // The test added no sale.
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Today's entries (0)" })).toBeVisible();
  await page.goto("/settings");
  await expect(screen(page).getByText("PhonePe connected")).toBeVisible();
});

test("signed payments become one UPI sale each; repeats and fakes add nothing", async ({
  page,
}) => {
  await newShop(page);
  const path = callbackPath(await connectPhonePe(page));

  const paid = phonePeNotice(250_00, `TX${Date.now()}`);
  expect((await page.request.post(path, paid)).status()).toBe(200);
  // PhonePe retries: the same transaction again changes nothing.
  expect((await page.request.post(path, paid)).status()).toBe(200);
  // Unsigned, wrongly signed, and unknown addresses are refused.
  const unsigned = { ...paid, headers: { "Content-Type": "application/json" } };
  expect((await page.request.post(path, unsigned)).status()).toBe(401);
  const forged = phonePeNotice(999_00, `TX${Date.now()}-f`, "not-the-salt-key");
  expect((await page.request.post(path, forged)).status()).toBe(401);
  expect(
    (
      await page.request.post("/api/payments/phonepe/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", paid)
    ).status(),
  ).toBe(404);

  await page.goto("/");
  await expect(entryRow(page, "+ ₹250")).toContainText("UPI · PhonePe");
  await expect(page.getByRole("heading", { name: "Today's entries (1)" })).toBeVisible();

  // Day close starts the UPI total from it.
  await page.goto("/close/today");
  await expect(screen(page).getByLabel("2. UPI total")).toHaveValue("250");
  await expect(
    screen(page).getByText("Filled in from PhonePe and your UPI entries.", { exact: false }),
  ).toBeVisible();
});

test("a payment attaches to the UPI sale typed just before it", async ({ page }) => {
  await newShop(page);
  const path = callbackPath(await connectPhonePe(page));
  await page.goto("/");
  await addSale(page, 120, "UPI");
  await expect(page.getByText("All entries saved")).toBeVisible();

  expect((await page.request.post(path, phonePeNotice(120_00, `TX${Date.now()}`))).status()).toBe(
    200,
  );
  await page.reload();
  await expect(entryRow(page, "+ ₹120")).toContainText("UPI · PhonePe");
  await expect(page.getByRole("heading", { name: "Today's entries (1)" })).toBeVisible();
});

test("a UPI sale typed after the payment replaces the automatic one", async ({ page }) => {
  await newShop(page);
  const path = callbackPath(await connectPhonePe(page));
  expect((await page.request.post(path, phonePeNotice(90_00, `TX${Date.now()}`))).status()).toBe(
    200,
  );
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Today's entries (1)" })).toBeVisible();

  // The owner also types it (say, as a bill): the money must count once.
  await addSale(page, 90, "UPI");
  await expect(page.getByText("All entries saved")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Today's entries (1)" })).toBeVisible();
  await expect(entryRow(page, "+ ₹90")).toContainText("UPI · PhonePe");
});

test("the payment screens pass the accessibility checks in light and dark", async ({ page }) => {
  const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
  await newShop(page);
  await connectPhonePe(page);
  type Violation = { id: string; nodes: Array<{ target: string[] }> };
  type Axe = { run: (ctx: Document, opts: object) => Promise<{ violations: Violation[] }> };
  const problems: string[] = [];
  for (const theme of ["light", "dark"] as const) {
    await page.evaluate((t) => localStorage.setItem("stall:theme", t), theme);
    for (const path of ["/settings/payments", "/settings/payments/phonepe"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await page.addScriptTag({ content: axeSource });
      const found: Violation[] = await page.evaluate(async () => {
        const axe = (window as unknown as { axe: Axe }).axe;
        const result = await axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
        });
        return result.violations;
      });
      problems.push(
        ...found.map((v) => `${theme} ${path}: ${v.id} -> ${v.nodes[0]?.target.join(" ")}`),
      );
    }
  }
  expect(problems).toEqual([]);
});
