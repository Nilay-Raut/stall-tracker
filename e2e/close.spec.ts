import { type Page, expect, test } from "@playwright/test";
import postgres from "postgres";
import { businessDate } from "../src/lib/dates";
import { addCashOut, addExpense, addSale, newShop } from "./shop";

const yesterday = () =>
  new Date(new Date(`${businessDate()}T00:00:00Z`).getTime() - 86_400_000)
    .toISOString()
    .slice(0, 10);

/** The wireframe's day: 4 sales, 3 expenses, 1 cash out. */
async function enterWireframeDay(page: Page) {
  await addSale(page, 1900, "Cash");
  await addSale(page, 1200, "Cash");
  await addSale(page, 1150, "UPI");
  await addSale(page, 1330, "UPI");
  await addExpense(page, 1195, "Raw material", "Drawer");
  await addExpense(page, 180, "Packaging", "Drawer");
  await addExpense(page, 900, "Gas", "Own pocket");
  await addCashOut(page, 500);
  await expect(page.getByText("All entries saved")).toBeVisible();
}

/** The screen currently shown (Next keeps recently visited screens mounted but hidden). */
function screen(page: Page) {
  return page.locator("main").filter({ visible: true });
}

/** The value next to a label in a list of rows. */
function rowValue(page: Page, label: string | RegExp) {
  return page
    .locator("div", { has: page.getByText(label) })
    .filter({ visible: true }) // skip screens Next keeps mounted but hidden
    .last();
}

test("closing the wireframe's day gives the wireframe's summary", async ({ page }) => {
  const phone = await newShop(page, { openingCash: 1000 });
  await enterWireframeDay(page);

  await page.getByRole("link", { name: "Close day" }).click();
  await expect(page.getByRole("heading", { name: "Close day" })).toBeVisible();
  await expect(rowValue(page, /^Opening cash/)).toContainText("− ₹1,000");
  await expect(rowValue(page, "Expenses paid from drawer")).toContainText("+ ₹1,375");
  await expect(rowValue(page, "Cash taken out")).toContainText("+ ₹500");

  await page.getByLabel("1. Cash in drawer now").fill("2275");
  await expect(rowValue(page, "Cash sales today")).toContainText("₹3,150");
  await expect(screen(page).getByText("₹50 more cash than you recorded")).toBeVisible();
  await expect(
    screen(page).getByText("You entered ₹3,100 in cash sales. The drawer shows ₹3,150."),
  ).toBeVisible();

  await page.getByLabel("2. UPI total").fill("2480");
  await expect(screen(page).getByText("Matches your 2 UPI entries.")).toBeVisible();
  await page.getByLabel("3. Food wasted today (optional)").fill("140");
  await page.getByRole("button", { name: "Close day and see summary" }).click();

  // Summary (wireframe screen 6)
  await expect(page).toHaveURL(new RegExp(`/summary/${businessDate()}$`));
  await expect(page.getByRole("heading", { name: "Day closed" })).toBeVisible();
  await expect(screen(page).getByText("₹2,605").first()).toBeVisible();
  await expect(screen(page).getByText("Break-even crossed")).toBeVisible();
  await expect(screen(page).getByText("You needed ₹3,025 to cover today's costs.")).toBeVisible();
  await expect(screen(page).getByText("Cash ₹3,150 · UPI ₹2,480")).toBeVisible();
  await expect(rowValue(page, "Cash check: more in drawer than recorded")).toContainText("+ ₹50");
  await expect(rowValue(page, "Cash taken out by owner")).toContainText("₹500");
  await expect(rowValue(page, "Food wasted")).toContainText("₹140");
  await expect(rowValue(page, "Cash left for tomorrow")).toContainText("₹2,275");

  // Today now says the day is closed.
  await page.getByRole("link", { name: "Done" }).click();
  await expect(screen(page).getByText("Day closed")).toBeVisible();
  await expect(screen(page).getByText("Profit ₹2,605")).toBeVisible();

  // An expense added after closing is counted: the drawer had paid for it, so
  // cash sales rise by the same amount and profit stays ₹2,605.
  await addExpense(page, 100, "Other", "Drawer");
  await expect(screen(page).getByText("All entries saved")).toBeVisible();
  if (!process.env.E2E_BASE_URL && process.env.DATABASE_URL) {
    const sql = postgres(process.env.DATABASE_URL, { max: 1 });
    try {
      await expect
        .poll(async () => {
          const [day] = await sql`
            select d.status, d.cash_sales, d.sales_total, d.expense_total, d.profit
            from days d join shops s on s.id = d.shop_id join users u on u.id = s.owner_id
            where u.phone = ${phone} and d.business_date = ${businessDate()}`;
          return day;
        })
        .toMatchObject({
          status: "closed",
          cash_sales: 325000, // 2,275 − 1,000 + 1,475 + 500
          sales_total: 573000,
          expense_total: 237500,
          profit: 260500,
        });
    } finally {
      await sql.end();
    }
  }

  // Edit day opens the form with the closing figures filled in.
  await page.getByRole("link", { name: "Day summary" }).click();
  await page.getByRole("link", { name: "Edit day" }).click();
  await expect(page.getByRole("heading", { name: "Edit closed day" })).toBeVisible();
  await expect(page.getByLabel("1. Cash in drawer now")).toHaveValue("2275");
  await expect(page.getByLabel("2. UPI total")).toHaveValue("2480");
});

test("the next day opens with the cash left the night before", async ({ page }) => {
  await newShop(page, { openingCash: 1000 });

  await page.goto(`/close?date=${yesterday()}`);
  await expect(rowValue(page, /^Opening cash/)).toContainText("− ₹1,000");
  await page.getByLabel("1. Cash in drawer now").fill("1800");
  await page.getByLabel("2. UPI total").fill("0");
  await page.getByRole("button", { name: "Close day and see summary" }).click();
  await expect(page).toHaveURL(new RegExp(`/summary/${yesterday()}$`));
  await expect(rowValue(page, "Cash left for tomorrow")).toContainText("₹1,800");

  await page.goto("/close");
  await expect(rowValue(page, /^Opening cash/)).toContainText("− ₹1,800");
});

test("a drawer with less than the opening cash is refused", async ({ page }) => {
  await newShop(page, { openingCash: 1000 });
  await page.getByRole("link", { name: "Close day" }).click();

  await page.getByLabel("1. Cash in drawer now").fill("600");
  await expect(page.getByText("The drawer has less than you started with")).toBeVisible();
  await page.getByLabel("2. UPI total").fill("0");
  await page.getByRole("button", { name: "Close day and see summary" }).click();
  await expect(
    page.getByText(/The drawer has less than you started with\. Check the amounts/),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/close/);
});

test("a day that is not closed has no summary yet", async ({ page }) => {
  await newShop(page);
  await page.goto(`/summary/${businessDate()}`);
  await expect(page).toHaveURL(/\/close\?date=/);
  await expect(page.getByRole("heading", { name: "Close day" })).toBeVisible();
});
