import { expect, test } from "@playwright/test";
import { targetPlan } from "../src/domain/target";
import { formatMonth } from "../src/lib/calendar";
import { businessDate, daysInMonth, shiftDate } from "../src/lib/dates";
import { formatRupees, rupeesToPaise as r } from "../src/lib/money";
import { addExpense, addItem, addSale, newShop, visibleScreen as screen } from "./shop";

const today = businessDate();
const dayOfMonth = Number(today.slice(8));
const monthName = formatMonth(today.slice(0, 7)).split(" ")[0];

test("a monthly profit target can be set and changed", async ({ page }) => {
  await newShop(page);
  await page.goto("/target");
  await expect(screen(page).getByText(`Set a profit target for ${monthName}`)).toBeVisible();

  await screen(page).getByLabel(`Profit you want in ${monthName}`).fill("80000");
  await screen(page).getByRole("button", { name: "Save target" }).click();
  await expect(screen(page).getByText("Profit target ₹80,000")).toBeVisible();
  await expect(
    screen(page).getByText(`${dayOfMonth} of ${daysInMonth(today)} days gone`, { exact: false }),
  ).toBeVisible();
  await expect(screen(page).getByText("Record a few days of sales")).toBeVisible();

  // A bad amount keeps the form open with the message.
  await screen(page).getByRole("button", { name: "Change" }).click();
  await screen(page).getByLabel(`Profit you want in ${monthName}`).fill("");
  await screen(page).getByRole("button", { name: "Save target" }).click();
  await expect(screen(page).getByText("Enter the profit you want this month")).toBeVisible();

  await screen(page).getByLabel(`Profit you want in ${monthName}`).fill("90000");
  await screen(page).getByRole("button", { name: "Save target" }).click();
  await expect(screen(page).getByText("Profit target ₹90,000")).toBeVisible();
});

test("the target sets today's sales target and suggests ways to get there", async ({ page }) => {
  test.skip(dayOfMonth === 1, "needs an earlier day in the same month");
  const yesterday = shiftDate(today, -1);

  await newShop(page, { openingCash: 1000 });
  await addItem(page, "Veg steam momos", 60, "My cost", 24);
  await addItem(page, "Cheese momos", 90, "My cost", 42);

  // Yesterday: ₹5,000 cash sales, ₹2,000 expenses, closed with a plate count.
  await page.goto(`/day/${yesterday}`);
  await addSale(page, 5000, "Cash");
  await addExpense(page, 2000, "Raw material", "Drawer");
  await page.goto("/");
  await expect(page.getByText("All entries saved")).toBeVisible();
  await page.goto(`/close?date=${yesterday}`);
  await screen(page).getByLabel("1. Cash in drawer now").fill("4000"); // 4,000 − 1,000 + 2,000 = 5,000
  await screen(page).getByLabel("2. UPI total").fill("0");
  await screen(page).getByLabel("Veg steam momos plates").fill("34");
  await screen(page).getByLabel("Cheese momos plates").fill("12");
  await screen(page).getByRole("button", { name: "Close day and see summary" }).click();
  await expect(screen(page).getByRole("heading", { name: "Day closed" })).toBeVisible();

  await page.goto("/target");
  await screen(page).getByLabel(`Profit you want in ${monthName}`).fill("80000");
  await screen(page).getByRole("button", { name: "Save target" }).click();
  await expect(screen(page).getByText("Profit target ₹80,000")).toBeVisible();
  await expect(screen(page).getByText(/sales a day for \d+ days?/)).toBeVisible();
  await expect(screen(page).getByText(/^Sell \d+ more cheese momos$/)).toBeVisible();
  await expect(
    screen(page).getByText("Move 10 plates from veg steam momos to cheese momos"),
  ).toBeVisible();

  // Today's target, as of the start of today (rule 9 with the month up to yesterday).
  const expected = targetPlan({
    target: r(80000),
    daysInMonth: daysInMonth(today),
    daysGone: dayOfMonth - 1,
    sales: r(5000),
    expenses: r(2000),
    fixedCost: r(750) * (dayOfMonth - 1),
    openDays: 1,
    fixedPerDay: r(750),
  }).salesPerDay!;
  await page.goto("/");
  await expect(screen(page).getByText(`Target ${formatRupees(expected)}`)).toBeVisible();
  await expect(screen(page).getByText(`${formatRupees(expected)} to go`)).toBeVisible();

  // The day summary shows the day against its target.
  await addSale(page, 2000, "Cash");
  await expect(page.getByText("All entries saved")).toBeVisible();
  await page.goto("/close");
  await screen(page).getByLabel("1. Cash in drawer now").fill("6000"); // 4,000 left + 2,000
  await screen(page).getByLabel("2. UPI total").fill("0");
  await screen(page).getByRole("button", { name: "Skip today" }).click();
  await screen(page).getByRole("button", { name: "Close day and see summary" }).click();
  await expect(
    screen(page).getByText(`${formatRupees(expected - r(2000))} short of the day's target`),
  ).toBeVisible();
});
