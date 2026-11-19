import { expect, test } from "@playwright/test";
import postgres from "postgres";
import { businessDate, shiftDate } from "../src/lib/dates";
import { addExpense, addSale, amountFor, newShop } from "./shop";

const local = !process.env.E2E_BASE_URL && !!process.env.DATABASE_URL;

test("the UPI account balance, cash to bank and cash out from UPI", async ({ page }) => {
  await newShop(page, { openingCash: 1000 });
  await addSale(page, 300, "UPI");
  await addExpense(page, 50, "Transport", "UPI");
  await expect(amountFor(page, "UPI today")).toContainText("₹250");

  // The UPI app shows ₹5,250 now: the day started with 5,000.
  await page.getByRole("button", { name: "Add UPI balance" }).click();
  await page.getByLabel("Balance your UPI or bank app shows now (₹)").fill("5250");
  await page.getByRole("button", { name: "Use this balance" }).click();
  await expect(amountFor(page, "UPI account")).toContainText("₹5,250");
  await expect(page.getByText("Start ₹5,000 + UPI sales ₹300 − Expenses ₹50")).toBeVisible();
  await expect(amountFor(page, "Stall money now")).toContainText("₹6,250");

  // ₹400 from the drawer into the bank: the total stays the same.
  await page.getByRole("button", { name: "Add an entry" }).click();
  await page.getByRole("link", { name: /Cash to bank/ }).click();
  await page.getByLabel("Cash put in the bank").fill("400");
  await page.getByRole("button", { name: "Save cash to bank" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(amountFor(page, "Cash in drawer")).toContainText("₹600");
  await expect(amountFor(page, "UPI account")).toContainText("₹5,650");
  await expect(amountFor(page, "Stall money now")).toContainText("₹6,250");
  await expect(page.getByRole("link").filter({ hasText: "Cash to bank" })).toContainText("₹400");

  // ₹200 taken for the owner, from UPI: the drawer is untouched.
  await page.getByRole("link", { name: "Cash taken out" }).click();
  await page.getByLabel("Amount taken out").fill("200");
  await page
    .getByRole("radiogroup", { name: "Taken from" })
    .getByRole("radio", { name: "UPI account" })
    .click();
  await page.getByRole("button", { name: "Save cash out" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(amountFor(page, "Cash in drawer")).toContainText("₹600");
  await expect(amountFor(page, "UPI account")).toContainText("₹5,450");
  await expect(page.getByText("Owner · from UPI")).toBeVisible();

  // The balance check says when the app and the entries differ.
  await page.getByRole("button", { name: "Check UPI balance" }).click();
  await page.getByLabel("Balance your UPI or bank app shows now (₹)").fill("5400");
  await expect(
    page.getByText("₹50 less than expected. A UPI payment may be missing."),
  ).toBeVisible();

  // Closing: the drawer has the 600 the entries say (cash to bank is not a missing sale).
  await page.getByRole("link", { name: "Close day" }).click();
  await page.getByLabel("1. Cash in drawer now").fill("600");
  await page.getByLabel("2. UPI total").fill("300");
  await page.getByRole("button", { name: "Close day and see summary" }).click();
  await expect(page.getByRole("heading", { name: "Day closed" })).toBeVisible();
  await page.goto(`/summary/${businessDate()}`);
  await expect(amountFor(page, "UPI account")).toContainText("₹5,450");
  await expect(amountFor(page, "Stall money at close")).toContainText("₹6,050");

  // Today keeps showing the money after closing: the figures counted at close.
  await page.goto("/");
  await expect(amountFor(page, "Stall money at close")).toContainText("₹6,050");
  await expect(page.getByText("Counted at close")).toBeVisible();
  await expect(page.getByRole("button", { name: "Count the drawer now" })).toHaveCount(0);
});

test("a Totals only shop sees its money too, with sales to come at closing", async ({ page }) => {
  await newShop(page, { totalsOnly: true, openingCash: 1000 });
  await expect(amountFor(page, "Stall money now")).toContainText("₹1,000");
  await expect(
    page.getByText("Cash and UPI sales are added when you close the day."),
  ).toBeVisible();
  await addExpense(page, 100, "Gas", "Drawer");
  await expect(amountFor(page, "Cash in drawer")).toContainText("₹900");
  await expect(page.getByText("Opening ₹1,000 − Expenses ₹100")).toBeVisible();
});

test("the UPI balance carries over from earlier days", async ({ page }) => {
  test.skip(!local, "needs the local database to add an earlier day");
  const phone = await newShop(page);
  const yesterday = shiftDate(businessDate(), -1);
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    const [shop] = await sql`
      select s.id from shops s join users u on u.id = s.owner_id where u.phone = ${phone}`;
    // Yesterday started with ₹5,000; ₹1,000 came in by UPI and ₹200 went out by UPI.
    await sql`update shops set upi_balance = 500000, upi_balance_date = ${yesterday}
              where id = ${shop.id}`;
    await sql`insert into days (shop_id, business_date, status, upi_sales, sales_total, entry_count)
              values (${shop.id}, ${yesterday}, 'open', 100000, 100000, 1)`;
    await sql`insert into entries (id, shop_id, business_date, type, amount, category, paid_from,
                                   occurred_at, client_updated_at)
              values (gen_random_uuid(), ${shop.id}, ${yesterday}, 'expense', 20000, 'gas', 'upi',
                      now(), now())`;
  } finally {
    await sql.end();
  }

  await page.reload();
  await expect(amountFor(page, "UPI account")).toContainText("₹5,800");
  await expect(page.getByText("Start ₹5,800 + UPI sales ₹0")).toBeVisible();
});
