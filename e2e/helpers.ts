import { type Browser, type Page, devices, expect } from "@playwright/test";

/** A random, valid mobile number so tests never collide with each other. */
export function randomPhone(): string {
  return `9${Math.floor(Math.random() * 1e9)
    .toString()
    .padStart(9, "0")}`;
}

export const PASSWORD = "chai-and-momos-42";
export const PIN = "482915";

export async function registerUser(page: Page, phone: string) {
  await page.goto("/register");
  await page.getByLabel("Mobile number").fill(phone);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Password again").fill(PASSWORD);
  await page.getByLabel("Recovery PIN (6 digits)").fill(PIN);
  await page.getByLabel("Recovery PIN again").fill(PIN);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/setup$/);
}

export async function logIn(page: Page, phone: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Mobile number").fill(phone);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
}

export async function completeSetup(page: Page, shopName: string) {
  await page.getByLabel("Shop name").fill(shopName);
  await page.getByRole("button", { name: "Save and start" }).click();
  await expect(page).toHaveURL(/\/$/);
}

/** The form's own error message (Next also renders a page-change announcer with role="alert"). */
export function formAlert(page: Page) {
  return page.locator("form").getByRole("alert");
}

/** Fails if the page is wider than the phone screen (sideways scrolling breaks taps). */
export async function expectNoSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "page is wider than the screen").toBeLessThanOrEqual(0);
}

/**
 * A second phone (separate cookies), set up like the main one: same screen,
 * and the origin header when testing a server directly (E2E_ORIGIN_SECRET).
 */
export async function secondPhone(browser: Browser): Promise<Page> {
  const secret = process.env.E2E_ORIGIN_SECRET;
  const context = await browser.newContext({
    ...devices["Pixel 7"],
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    extraHTTPHeaders: secret ? { "X-Origin-Verify": secret } : undefined,
  });
  return context.newPage();
}
