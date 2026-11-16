import { type Page, expect, test } from "@playwright/test";
import { businessDate } from "../src/lib/dates";
import { addItem, addSale, newShop } from "./shop";

/** The screen currently shown (Next keeps recently visited screens mounted but hidden). */
const screen = (page: Page) => page.locator("main").filter({ visible: true }).first();

function itemRow(page: Page, name: string) {
  return screen(page).getByRole("link").filter({ hasText: name });
}

test("items can be added from cost, margin or margin %, and the app works out the rest", async ({
  page,
}) => {
  await newShop(page);
  await addItem(page, "Veg steam momos", 60, "My cost", 24);
  await addItem(page, "Cheese momos", 90, "Margin in ₹", 48);
  await addItem(page, "Spring roll", 50, "Margin in %", 48);

  await expect(itemRow(page, "Veg steam momos")).toContainText("Price ₹60 · Cost ₹24");
  await expect(itemRow(page, "Veg steam momos")).toContainText("₹36");
  await expect(itemRow(page, "Veg steam momos")).toContainText("60% of price");
  await expect(itemRow(page, "Cheese momos")).toContainText("Cost ₹42");
  await expect(itemRow(page, "Spring roll")).toContainText("Cost ₹26");
  await expect(screen(page).getByText("Best margin")).toBeVisible();
  await expect(screen(page).locator("div", { hasText: /^Best margin60%$/ })).toBeVisible();
  await expect(screen(page).locator("div", { hasText: /^Lowest margin48%$/ })).toBeVisible();

  // Live working on the edit screen, and switching what you know keeps the numbers.
  await itemRow(page, "Cheese momos").click();
  await expect(screen(page).getByRole("heading", { name: "Edit item" })).toBeVisible();
  await expect(screen(page).getByText("53%")).toBeVisible();
  await screen(page).getByRole("radio", { name: "Margin in ₹" }).click();
  await expect(screen(page).getByLabel("Margin you keep on one plate (₹)")).toHaveValue("48");

  // A loss is pointed out.
  await screen(page).getByLabel("Selling price for one plate (₹)").fill("40");
  await screen(page).getByRole("radio", { name: "My cost" }).click();
  await screen(page).getByLabel("Cost to make one plate (₹)").fill("55");
  await expect(screen(page).getByText("Cost is higher than price.")).toBeVisible();
});

test("an item can be changed and removed", async ({ page }) => {
  await newShop(page);
  await addItem(page, "Veg steam momos", 60, "My cost", 24);
  await addItem(page, "Spring roll", 50, "My cost", 26);

  await itemRow(page, "Veg steam momos").click();
  await screen(page).getByLabel("Selling price for one plate (₹)").fill("65");
  await screen(page).getByRole("button", { name: "Save item" }).click();
  await expect(itemRow(page, "Veg steam momos")).toContainText("₹41");

  await itemRow(page, "Spring roll").click();
  page.once("dialog", (dialog) => dialog.accept());
  await screen(page).getByRole("button", { name: "Remove item" }).click();
  await expect(page).toHaveURL(/\/settings\/items$/);
  await expect(itemRow(page, "Spring roll")).toHaveCount(0);

  await page.goto("/setup");
  await expect(screen(page).getByRole("link", { name: /Items and margins/ })).toContainText(
    "1 item",
  );
});

test("plates counted at closing show on the summary and keep that day's prices", async ({
  page,
}) => {
  await newShop(page, { openingCash: 1000 });
  await addItem(page, "Veg steam momos", 60, "My cost", 24);
  await addItem(page, "Cheese momos", 90, "My cost", 42);
  await page.goto("/");
  await addSale(page, 2000, "Cash");
  await expect(page.getByText("All entries saved")).toBeVisible();

  await page.goto("/close");
  await screen(page).getByLabel("1. Cash in drawer now").fill("3000");
  await screen(page).getByLabel("2. UPI total").fill("0");
  await screen(page).getByLabel("Veg steam momos plates").fill("34");
  for (let i = 0; i < 12; i++) {
    await screen(page).getByRole("button", { name: "One more Cheese momos" }).click();
  }
  await expect(screen(page).getByLabel("Cheese momos plates")).toHaveValue("12");
  await screen(page).getByLabel("4. Food wasted today (optional)").fill("");
  await screen(page).getByRole("button", { name: "Close day and see summary" }).click();

  await expect(page).toHaveURL(new RegExp(`/summary/${businessDate()}$`));
  await expect(
    screen(page).getByText("Veg steam momos earned the most: ₹1,224 from 34 plates."),
  ).toBeVisible();
  await expect(
    screen(page).getByText("Cheese momos earn ₹12 more per plate. Only 12 sold."),
  ).toBeVisible();

  // Rule 11: a later price change does not rewrite the day.
  await page.goto("/settings/items");
  await itemRow(page, "Veg steam momos").click();
  await screen(page).getByLabel("Selling price for one plate (₹)").fill("80");
  await screen(page).getByRole("button", { name: "Save item" }).click();
  await expect(page).toHaveURL(/\/settings\/items$/);
  await page.goto(`/summary/${businessDate()}`);
  await expect(screen(page).getByText(/earned the most: ₹1,224 from 34 plates/)).toBeVisible();

  // Edit day: counts are filled in; "Skip today" clears them.
  await screen(page).getByRole("link", { name: "Edit day" }).click();
  await expect(screen(page).getByLabel("Veg steam momos plates")).toHaveValue("34");
  await screen(page).getByRole("button", { name: "Skip today" }).click();
  await expect(screen(page).getByText("Not counting plates today.")).toBeVisible();
  await screen(page).getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(new RegExp(`/summary/${businessDate()}$`));
  await expect(screen(page).getByText("From the plate count")).toHaveCount(0);
});

test("Totals only mode has no plate count at closing", async ({ page }) => {
  await newShop(page, { totalsOnly: true });
  await addItem(page, "Veg steam momos", 60, "My cost", 24);
  await page.goto("/close");
  await expect(screen(page).getByLabel("3. Food wasted today (optional)")).toBeVisible();
  await expect(screen(page).getByText("Plates sold (optional)")).toHaveCount(0);
});
