import { type Page, expect, test } from "@playwright/test";
import { businessDate, shiftDate } from "../src/lib/dates";
import { addCashOut, addExpense, addSale, newShop, visibleScreen as screen } from "./shop";

// Phase 11: where the money goes, compared with before, owner's take, spending details,
// month by month, and the CSV / print exports.

const today = businessDate();
const week = `range=week`;

/** Adds a sale for an earlier day (from that day's screen). */
async function addOldSale(page: Page, date: string, rupees: number) {
  await page.goto(`/add/sale?date=${date}`);
  for (const digit of String(rupees)) {
    await screen(page).getByRole("button", { name: digit, exact: true }).click();
  }
  await screen(page).getByRole("radio", { name: "Cash" }).click();
  await screen(page).getByRole("button", { name: "Save sale" }).click();
  await expect(page).not.toHaveURL(/\/add\//);
}

test("reports show where every ₹100 went, the change from before and the owner's take", async ({
  page,
}) => {
  await newShop(page);
  await addSale(page, 10000, "Cash");
  await addExpense(page, 3000, "Raw material", "Drawer");
  await addExpense(page, 500, "Gas", "Drawer");
  await addCashOut(page, 2000);
  await addOldSale(page, shiftDate(today, -8), 4000); // in the week before
  await page.goto("/");
  await expect(page.getByText("All entries saved")).toBeVisible();

  await page.goto(`/reports?${week}`);
  const main = screen(page);
  // Week: sales 10,000; raw 3,000; gas 500; fixed 7 × 750 = 5,250; profit 1,250.
  await expect(main.getByText("Of every ₹100 of sales")).toBeVisible();
  await expect(main.getByText(/^₹30 of every ₹100/)).toBeVisible(); // raw material
  await expect(main.getByText(/^₹5 of every ₹100/)).toBeVisible(); // gas
  await expect(main.getByText(/^₹53 of every ₹100/)).toBeVisible(); // fixed 52.5
  await expect(main.getByText(/^₹12 of every ₹100/)).toBeVisible(); // profit 12.5

  // The week before: one sale of 4,000 and 5,250 fixed costs.
  await expect(main.getByRole("heading", { name: "Compared with before" })).toBeVisible();
  await expect(main.getByText("₹6,000 more (150%)")).toBeVisible();
  await expect(main.getByText("₹10,000 now, ₹4,000 before")).toBeVisible();

  await expect(main.getByText("Cash you took out")).toBeVisible();
  await expect(
    main.getByText("You took out ₹750 more than the stall earned.", { exact: false }),
  ).toBeVisible();

  // Tap a spending row: the expenses behind it.
  await main.getByRole("link", { name: /Raw material/ }).click();
  await expect(page).toHaveURL(/\/reports\/spend\/raw_material\?range=week/);
  await expect(screen(page).getByRole("heading", { name: "Raw material" })).toBeVisible();
  await expect(screen(page).getByText("1 expense")).toBeVisible();
  await expect(screen(page).getByText("₹3,000").first()).toBeVisible();
  await screen(page).getByRole("link", { name: "‹ Reports" }).click();
  await expect(page).toHaveURL(/\/reports\?range=week/);
});

test("month by month lists this month and opens its report", async ({ page }) => {
  await newShop(page);
  await addSale(page, 2500, "UPI");
  await page.goto("/reports/months");
  const row = screen(page).getByRole("link", { name: /so far/ });
  await expect(row).toBeVisible();
  await expect(row).toContainText("Sales ₹2,500");
  await row.click();
  await expect(page).toHaveURL(new RegExp(`range=custom&from=${today.slice(0, 7)}-01&to=${today}`));
});

test("the period can be downloaded as CSV and printed, by the owner only", async ({
  page,
  browser,
}) => {
  await newShop(page);
  await addSale(page, 1200, "Cash");
  await addExpense(page, 300, "Packaging", "Own pocket");
  await page.goto("/");
  await expect(page.getByText("All entries saved")).toBeVisible();

  const days = await page.request.get(`/api/export/days?range=custom&from=${today}&to=${today}`);
  expect(days.status()).toBe(200);
  expect(days.headers()["content-type"]).toContain("text/csv");
  expect(days.headers()["content-disposition"]).toContain(`stall-days-${today}-to-${today}.csv`);
  const lines = (await days.text()).trim().split("\r\n");
  expect(lines[1]).toBe(`${today},Open,1200,1200,0,300,750,150,0`);
  expect(lines.at(-1)).toBe("Total,,1200,1200,0,300,750,150,0");

  const entries = await (await page.request.get(`/api/export/entries?range=month`)).text();
  expect(entries).toContain("Sale,1200,Cash");
  expect(entries).toContain("Expense,300,,Packaging,Own pocket");

  // The Share screen offers both files and the print page.
  await page.goto(`/reports/share?range=month`);
  await expect(screen(page).getByRole("button", { name: "One row per day (CSV)" })).toBeVisible();
  await screen(page).getByRole("link", { name: "Print or save as PDF" }).click();
  await expect(page.getByRole("heading", { name: "Momo Corner" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Print or save as PDF" })).toBeVisible();

  // Someone not logged in gets nothing.
  const stranger = await browser.newContext();
  const refused = await stranger.request.get(
    new URL("/api/export/days?range=month", page.url()).toString(),
  );
  expect(refused.status()).toBe(401);
  await stranger.close();
});
