import { expect, test } from "@playwright/test";
import postgres from "postgres";
import { businessDate, shiftDate } from "../src/lib/dates";
import { addCashOut, addExpense, addSale, amountFor, newShop } from "./shop";

test("Today shows the cash that should be in the drawer", async ({ page }) => {
  await newShop(page, { openingCash: 1000 });

  await addSale(page, 500, "Cash");
  await addSale(page, 300, "UPI");
  await addExpense(page, 200, "Gas", "Drawer");
  await addExpense(page, 90, "Packaging", "Own pocket"); // not from the drawer
  await addCashOut(page, 100);

  // 1,000 opening + 500 cash sales − 200 from the drawer − 100 taken out.
  await expect(amountFor(page, "Cash in drawer now")).toContainText("₹1,200");
  await expect(amountFor(page, "UPI today")).toContainText("₹300");
  await expect(
    page.getByText("Opening ₹1,000 + Cash sales ₹500 − Expenses ₹200 − Taken out ₹100"),
  ).toBeVisible();
});

test("an Other expense keeps a note and offers it next time", async ({ page }) => {
  await newShop(page);

  await page.getByRole("link", { name: "+ Expense" }).click();
  await page.getByLabel("Amount").fill("60");
  await page
    .getByRole("radiogroup", { name: "Category" })
    .getByRole("radio", { name: "Other" })
    .click();
  await page.getByLabel("What was it for? (optional)").fill("Ice");
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page).toHaveURL(/\/$/);

  // The list shows what it was for instead of just "Other".
  await expect(page.getByRole("link").filter({ hasText: "Ice" })).toBeVisible();
  await expect(page.getByText("All entries saved")).toBeVisible();

  // Next time: one tap fills the note and the amount.
  await page.reload();
  await page.getByRole("link", { name: "+ Expense" }).click();
  await page
    .getByRole("radiogroup", { name: "Category" })
    .getByRole("radio", { name: "Other" })
    .click();
  const chip = page.getByRole("button", { name: /Ice/ });
  await expect(chip).toBeVisible();
  await chip.click();
  await expect(page.getByLabel("What was it for? (optional)")).toHaveValue("Ice");
  await expect(page.getByLabel("Amount")).toHaveValue("60");
});

test("fixed costs can be kept out of the day's profit", async ({ page }) => {
  await newShop(page); // ₹750 a day of fixed costs
  await addSale(page, 1000, "Cash");
  await addExpense(page, 200, "Gas", "Drawer");
  await expect(amountFor(page, "Profit so far")).toContainText("₹50");

  await page.goto("/setup");
  const fixedSwitch = page.getByRole("switch", { name: "Take them out of each day's profit" });
  await expect(fixedSwitch).toHaveAttribute("aria-checked", "true");
  await fixedSwitch.click();
  await expect(fixedSwitch).toHaveAttribute("aria-checked", "false");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);

  // 1,000 − 200, with no fixed cost taken out.
  await expect(amountFor(page, "Profit so far")).toContainText("₹800");
  await expect(
    page.getByText("Fixed costs (₹750 a day) are not taken out here.", { exact: false }),
  ).toBeVisible();
});

test("Settings has a Sounds switch that is remembered on the phone", async ({ page }) => {
  await newShop(page);
  await page.goto("/settings");
  const sounds = page.getByRole("switch", { name: "Sounds" });
  await expect(sounds).toHaveAttribute("aria-checked", "true");
  await sounds.click();
  await expect(sounds).toHaveAttribute("aria-checked", "false");
  await page.reload();
  await expect(page.getByRole("switch", { name: "Sounds" })).toHaveAttribute(
    "aria-checked",
    "false",
  );
});

test("Today asks to close yesterday when it was left open", async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL || !process.env.DATABASE_URL, "needs the local database");
  const phone = await newShop(page);
  const yesterday = shiftDate(businessDate(), -1);

  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    await sql`
      insert into days (shop_id, business_date, status, entry_count, sales_total)
      select s.id, ${yesterday}, 'open', 1, 10000
      from shops s join users u on u.id = s.owner_id where u.phone = ${phone}`;
  } finally {
    await sql.end();
  }

  await page.reload();
  const banner = page.getByRole("link", { name: "Yesterday was not closed. Close it now." });
  await expect(banner).toBeVisible();
  await banner.click();
  await expect(page).toHaveURL(new RegExp(`/close\\?date=${yesterday}$`));
});
