import { expect, test } from "@playwright/test";
import { businessDate, daysInMonth } from "../src/lib/dates";
import { addSale, amountFor, newShop } from "./shop";

const monthly = 750 * daysInMonth(businessDate()); // newShop's fixed cost: ₹750 a day
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

test("paying rent lowers the stall's money, not profit, and Settings tracks it", async ({
  page,
}) => {
  await newShop(page, { openingCash: 2000 });
  await addSale(page, 1000, "Cash");
  await expect(amountFor(page, "Profit so far")).toContainText("₹250"); // 1,000 − 750

  // Settings: nothing paid yet this month.
  await page.goto("/settings");
  await expect(page.getByText(`${rupees(monthly)} left`)).toBeVisible();

  // Pay ₹5,000 from the owner's pocket: the amount starts at what is left to pay.
  await page.getByRole("link", { name: "Pay a fixed cost" }).click();
  await expect(page.getByRole("heading", { name: "Pay a fixed cost" })).toBeVisible();
  await expect(page.getByLabel("Amount paid")).toHaveValue(String(monthly));
  await page.getByLabel("Amount paid").fill("5000");
  await page
    .getByRole("radiogroup", { name: "Paid from" })
    .getByRole("radio", { name: "Own pocket" })
    .click();
  await page.getByRole("button", { name: "Save payment" }).click();
  await expect(page).toHaveURL(/\/$/);

  // And ₹500 from the drawer, from the + sheet.
  await page.getByRole("button", { name: "Add an entry" }).click();
  await page.getByRole("link", { name: /Pay rent or salary/ }).click();
  await expect(page.getByLabel("Amount paid")).toHaveValue(String(monthly - 5000));
  await page.getByLabel("Amount paid").fill("500");
  await page.getByRole("button", { name: "Save payment" }).click();
  await expect(page).toHaveURL(/\/$/);

  await expect(amountFor(page, "Profit so far")).toContainText("₹250"); // unchanged
  await expect(amountFor(page, "Cash in drawer")).toContainText("₹2,500"); // 2,000 + 1,000 − 500
  await expect(
    page.getByText("Paid from your own pocket today: ₹5,000. The stall owes you this."),
  ).toBeVisible();
  await expect(
    page.getByRole("link").filter({ hasText: "Fixed cost · Paid from drawer" }),
  ).toContainText("₹500");

  await page.goto("/settings");
  await expect(page.getByText(`₹5,500 paid of ${rupees(monthly)}`)).toBeVisible();
  await expect(page.getByText(`${rupees(monthly - 5500)} left`)).toBeVisible();

  // Closing with the ₹2,500 in the drawer: the rent is not read as missing sales.
  await page.goto("/");
  await page.getByRole("link", { name: "Close day" }).click();
  await page.getByLabel("1. Cash in drawer now").fill("2500");
  await page.getByLabel("2. UPI total").fill("0");
  await expect(
    page.getByText(/more cash than you recorded|less cash than you recorded/),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Close day and see summary" }).click();
  await expect(page.getByRole("heading", { name: "Day closed" })).toBeVisible();
  await expect(page.getByText("₹250").first()).toBeVisible(); // profit
});
