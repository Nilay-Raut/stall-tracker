import { type Page, expect } from "@playwright/test";
import { businessDate, daysInMonth } from "../src/lib/dates";
import { randomPhone, registerUser } from "./helpers";

// Helpers for tests that need a shop with entries.

/** Registers and sets up a shop whose fixed cost works out to exactly ₹750 a day. */
export async function newShop(
  page: Page,
  options: { totalsOnly?: boolean; openingCash?: number } = {},
) {
  const phone = randomPhone();
  await registerUser(page, phone);
  await page.getByLabel("Shop name").fill("Momo Corner");
  if (options.openingCash)
    await page.getByLabel("Opening cash (₹)").fill(String(options.openingCash));
  await page.getByLabel("Cost 1 name").fill("Rent and salary");
  await page.locator("#cost-0-amount").fill(String(750 * daysInMonth(businessDate())));
  if (options.totalsOnly) await page.getByText("Totals only").click();
  await page.getByRole("button", { name: "Save and start" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("All entries saved")).toBeVisible();
  return phone;
}

export async function typeOnKeypad(page: Page, rupees: number) {
  for (const digit of String(rupees)) {
    await page.getByRole("button", { name: digit, exact: true }).click();
  }
}

export async function addSale(page: Page, rupees: number, mode: "Cash" | "UPI") {
  await page.getByRole("link", { name: "+ Sale" }).click();
  await expect(page.getByText("Sale amount")).toBeVisible();
  await typeOnKeypad(page, rupees);
  await page.getByRole("radio", { name: mode }).click();
  await page.getByRole("button", { name: "Save sale" }).click();
  // Back on Today, or on the earlier day the entry belongs to.
  await expect(page).not.toHaveURL(/\/add\//);
}

export async function addExpense(page: Page, rupees: number, category: string, paidFrom: string) {
  await page.getByRole("link", { name: "+ Expense" }).click();
  await page.getByLabel("Amount").fill(String(rupees));
  await page
    .getByRole("radiogroup", { name: "Category" })
    .getByRole("radio", { name: category })
    .click();
  await page
    .getByRole("radiogroup", { name: "Paid from" })
    .getByRole("radio", { name: paidFrom })
    .click();
  await page.getByRole("button", { name: "Save expense" }).click();
  // Back on Today, or on the earlier day the entry belongs to.
  await expect(page).not.toHaveURL(/\/add\//);
}

export async function addCashOut(page: Page, rupees: number) {
  await page.getByRole("link", { name: "Cash taken out" }).click();
  await page.getByLabel("Amount taken out").fill(String(rupees));
  await page.getByRole("button", { name: "Save cash out" }).click();
  // Back on Today, or on the earlier day the entry belongs to.
  await expect(page).not.toHaveURL(/\/add\//);
}

/** An entry row in Today's list (not the hidden quick-add buttons of a cached screen). */
export function entryRow(page: Page, amountText: string) {
  return page.getByRole("link").filter({ hasText: amountText });
}

/** Reads a labelled amount from the Today screen ("Expenses", "Profit so far" ...). */
export function amountFor(page: Page, label: string) {
  return page
    .locator("div", { has: page.getByText(label, { exact: true }) })
    .filter({ visible: true }) // skip screens Next keeps mounted but hidden
    .last();
}

/**
 * Waits until the app works offline: the service worker controls the page (the
 * app's files are stored), it has stored Today and the plain screens (add, close),
 * and Next has finished prefetching.
 */
export async function waitForOfflineReady(page: Page) {
  await page.waitForFunction(async () => {
    await navigator.serviceWorker.ready;
    return navigator.serviceWorker.controller !== null;
  });
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          for (const name of await caches.keys()) {
            if (!name.startsWith("pages-")) continue;
            const paths = (await (await caches.open(name)).keys()).map(
              (r) => new URL(r.url).pathname,
            );
            if (["/", "/add/sale", "/close/today"].every((p) => paths.includes(p))) return true;
          }
          return false;
        }),
      { timeout: 20_000 },
    )
    .toBe(true);
  await page.waitForLoadState("networkidle");
}

/** The screen currently shown (Next keeps recently visited screens mounted but hidden). */
export const visibleScreen = (page: Page) => page.locator("main").filter({ visible: true }).first();

type Basis = "My cost" | "Margin in ₹" | "Margin in %";

export async function addItem(
  page: Page,
  name: string,
  price: number,
  basis: Basis,
  value: number,
) {
  await page.goto("/settings/items/new");
  await visibleScreen(page).getByLabel("Item name").fill(name);
  await visibleScreen(page).getByLabel("Selling price for one plate (₹)").fill(String(price));
  await visibleScreen(page).getByRole("radio", { name: basis }).click();
  const valueLabel =
    basis === "My cost"
      ? "Cost to make one plate (₹)"
      : basis === "Margin in ₹"
        ? "Margin you keep on one plate (₹)"
        : "Margin as % of selling price";
  await visibleScreen(page).getByLabel(valueLabel).fill(String(value));
  await visibleScreen(page).getByRole("button", { name: "Save item" }).click();
  await expect(page).toHaveURL(/\/settings\/items$/);
}
