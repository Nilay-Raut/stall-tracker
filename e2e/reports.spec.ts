import { type Page, expect, test } from "@playwright/test";
import { shiftMonth } from "../src/lib/calendar";
import { businessDate } from "../src/lib/dates";
import { formatRupees } from "../src/lib/money";
import { addExpense, addItem, addSale, newShop, visibleScreen as screen } from "./shop";

const dayOfMonth = () => Number(businessDate().slice(8));

/** Adds an expense with material details (optionally for an earlier day). */
async function addPurchase(
  page: Page,
  o: {
    amount: number;
    material: string;
    supplier: string;
    quantity: number;
    unit?: string;
    date?: string;
  },
) {
  await page.goto(o.date ? `/add/expense?date=${o.date}` : "/add/expense");
  await screen(page).getByLabel("Amount").fill(String(o.amount));
  await screen(page).getByLabel("Material", { exact: true }).fill(o.material);
  await screen(page).getByLabel("Supplier").fill(o.supplier);
  await screen(page).getByLabel("Quantity").fill(String(o.quantity));
  if (o.unit) await screen(page).getByLabel("Unit").fill(o.unit);
  await screen(page).getByRole("button", { name: "Save expense" }).click();
  await expect(page).not.toHaveURL(/\/add\//);
}

/** The last rate the phone knows for a material (from Today's data), or null. */
async function knownRate(page: Page, material: string): Promise<number | null> {
  await page.goto("/");
  await expect(page.getByText("All entries saved")).toBeVisible();
  await page.waitForTimeout(300); // let Today store the server's data on the phone
  return page.evaluate(
    (name) =>
      new Promise<number | null>((resolve) => {
        const open = indexedDB.open("stall-tracker");
        open.onsuccess = () => {
          const get = open.result.transaction("meta").objectStore("meta").get("snapshot");
          get.onsuccess = () =>
            resolve(
              (get.result?.materials ?? []).find((m: { name: string }) => m.name === name)
                ?.lastRate ?? null,
            );
        };
      }),
    material,
  );
}

/** Opens Today and waits until every entry has reached the server. */
async function allSynced(page: Page) {
  await page.goto("/");
  await expect(page.getByText("All entries saved")).toBeVisible();
}

test("purchases show the rate, compare with the last one, and fill Supplier prices", async ({
  page,
}) => {
  await newShop(page);
  const lastMonth = `${shiftMonth(businessDate().slice(0, 7), -1)}-15`;

  await addPurchase(page, {
    amount: 584,
    material: "Oil",
    supplier: "Gupta Traders",
    quantity: 4,
    unit: "litre",
    date: lastMonth,
  });
  await addPurchase(page, {
    amount: 1490,
    material: "Oil",
    supplier: "City Wholesale",
    quantity: 10,
    unit: "litre",
  });
  // Today brings the latest purchase hints to the phone once the purchase is on the server.
  await expect.poll(() => knownRate(page, "Oil"), { timeout: 20_000 }).toBe(14900);

  // A known material fills in its unit, and the rate is compared with last time.
  await page.goto("/add/expense");
  await screen(page).getByLabel("Amount").fill("775");
  await screen(page).getByLabel("Material", { exact: true }).fill("oil");
  await expect(screen(page).getByLabel("Unit")).toHaveValue("litre");
  await screen(page).getByLabel("Supplier").fill("Gupta Traders");
  await screen(page).getByLabel("Quantity").fill("5");
  await expect(screen(page).getByText("Rate ₹155 a litre")).toBeVisible();
  await expect(
    screen(page).getByText("₹6 more than your last purchase (₹149, City Wholesale)."),
  ).toBeVisible();
  await screen(page).getByRole("button", { name: "Save expense" }).click();
  await allSynced(page);

  // Supplier prices
  await page.goto("/reports/prices");
  await expect(screen(page).getByText("Oil, latest rate")).toBeVisible();
  await expect(screen(page).getByText("₹155").first()).toBeVisible();
  await expect(screen(page).getByText(/This rise costs about ₹[\d,.]+ more a month/)).toBeVisible();
  const cheaper = screen(page)
    .locator("div", { hasText: /^City Wholesale/ })
    .last();
  await expect(cheaper).toContainText("Cheaper");
  await expect(cheaper).toContainText("₹149");
  await expect(
    screen(page).getByText(/Buying only from City Wholesale saves ₹6 a litre/),
  ).toBeVisible();
  await expect(screen(page).getByText("5 litre · ₹775 · Gupta Traders")).toBeVisible();

  // Reports mention the rise.
  await page.goto("/reports");
  await expect(screen(page).getByText("Oil costs more.")).toBeVisible();
  await expect(screen(page).getByText(/Oil went from ₹146 to ₹155 a litre since/)).toBeVisible();
});

test("reports add up the period with fixed costs for every day", async ({ page }) => {
  await newShop(page, { openingCash: 1000 });
  await addItem(page, "Veg steam momos", 60, "My cost", 24);
  await page.goto("/");
  await addSale(page, 5000, "Cash");
  await addSale(page, 1000, "UPI");
  await addExpense(page, 500, "Raw material", "Drawer");
  await addExpense(page, 200, "Gas", "Drawer");
  await expect(page.getByText("All entries saved")).toBeVisible();

  // Close with a plate count, for the item sections.
  await page.goto("/close");
  await screen(page).getByLabel("1. Cash in drawer now").fill("5300"); // 5,300 − 1,000 + 700 = 5,000
  await screen(page).getByLabel("2. UPI total").fill("1000");
  await screen(page).getByLabel("Veg steam momos plates").fill("50");
  await screen(page).getByRole("button", { name: "Close day and see summary" }).click();
  await expect(screen(page).getByRole("heading", { name: "Day closed" })).toBeVisible();

  await page.goto("/reports");
  const fixed = 750 * dayOfMonth();
  const money = (rupees: number) => formatRupees(rupees * 100);
  await expect(screen(page).getByText("Profit this month")).toBeVisible();
  await expect(
    screen(page).getByText(`Sales ₹6,000 − Expenses ₹700 − Fixed ${money(fixed)}`),
  ).toBeVisible();
  await expect(
    screen(page)
      .getByText(money(6000 - 700 - fixed))
      .first(),
  ).toBeVisible();

  await expect(screen(page).getByRole("heading", { name: "Where the money goes" })).toBeVisible();
  // The row is tappable (opens the spending details), hence the "›".
  await expect(screen(page).locator("div", { hasText: /^Raw material ›₹500$/ })).toBeVisible();
  await expect(screen(page).getByText("Cash ₹5,000")).toBeVisible();
  await expect(screen(page).getByText("UPI ₹1,000")).toBeVisible();
  // Top items (v2): plate counts count on days without bills (rule 19).
  const top = screen(page).getByRole("list").filter({ hasText: "Veg steam momos" }).first();
  await expect(top).toContainText("₹3,000"); // 50 × ₹60 sales
  await screen(page).getByRole("radio", { name: "Profit" }).click();
  await expect(top).toContainText("₹1,800"); // 50 × ₹36 profit

  await screen(page).getByRole("link", { name: "Week" }).click();
  await expect(screen(page).getByText("Profit, last 7 days")).toBeVisible();
  await expect(screen(page).getByText(/^Sales ₹6,000 − Expenses ₹700/)).toBeVisible();

  await page.goto(`/reports?range=custom&from=${businessDate()}&to=${businessDate()}`);
  await expect(screen(page).getByText("Sales ₹6,000 − Expenses ₹700 − Fixed ₹750")).toBeVisible();
});
