import { expect, test } from "@playwright/test";
import { translator } from "../src/i18n/translate";
import { addSale, newShop, visibleScreen as screen } from "./shop";

// The app in Hindi and Marathi. Texts come from the same dictionary the app uses, so
// the test checks the wiring (language saved, remembered, used everywhere), not wording.

const hi = translator("hi");
const mr = translator("mr");

test("choosing Hindi in Setup switches the whole app, and it stays after logout", async ({
  page,
}) => {
  await newShop(page);
  await addSale(page, 250, "Cash");

  await page.goto("/setup");
  await page.getByRole("radio", { name: "हिंदी" }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);

  // Today (shown from the phone's storage) and the bottom tabs.
  const nav = page.getByRole("navigation", { name: hi("Main") });
  await expect(nav.getByRole("link", { name: hi("Today") })).toBeVisible();
  await expect(screen(page).getByText(hi("All entries saved"))).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");

  // A screen made on the server.
  await nav.getByRole("link", { name: hi("Reports") }).click();
  await expect(page).toHaveURL(/\/reports/);
  await expect(page.getByRole("heading", { level: 1, name: hi("Reports") })).toBeVisible();
  await expect(
    screen(page).getByText(hi("Figures as of {time}", { time: "" }).trim()),
  ).toBeVisible();

  // A screen that is built once for everyone and translated on the phone.
  await page.goto("/add/sale");
  await expect(screen(page).getByText(hi("Sale amount"))).toBeVisible();

  // Still Hindi after a reload and on the login screen after logging out.
  await page.goto("/settings");
  await screen(page)
    .getByRole("button", { name: hi("Log out") })
    .click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("button", { name: hi("Log in") })).toBeVisible();
});

test("Marathi works too", async ({ page }) => {
  await newShop(page);
  await page.goto("/setup");
  await page.getByRole("radio", { name: "मराठी" }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: mr("Calendar") })).toBeVisible();
  await expect(page.getByText(mr("All entries saved"))).toBeVisible();
});
