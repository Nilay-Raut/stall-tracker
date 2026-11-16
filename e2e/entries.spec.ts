import { expect, test } from "@playwright/test";
import postgres from "postgres";
import { businessDate } from "../src/lib/dates";
import { PASSWORD, logIn, secondPhone } from "./helpers";
import {
  addCashOut,
  addExpense,
  addSale,
  amountFor,
  entryRow,
  newShop,
  typeOnKeypad,
  waitForOfflineReady,
} from "./shop";

// ---------- tests ----------

test("Today matches the wireframe when its entries are typed in", async ({ page }) => {
  const phone = await newShop(page);

  await addSale(page, 1900, "Cash");
  await addSale(page, 1200, "Cash");
  await addSale(page, 1150, "UPI");
  await addSale(page, 1330, "UPI");
  await addExpense(page, 1195, "Raw material", "Drawer");
  await addExpense(page, 180, "Packaging", "Drawer");
  await addExpense(page, 900, "Gas", "Own pocket");
  await addCashOut(page, 500);

  await expect(page.getByText("₹5,580", { exact: true })).toBeVisible(); // sales so far
  await expect(page.getByText("Break-even ₹3,025")).toBeVisible();
  await expect(page.getByText("Break-even crossed")).toBeVisible();
  await expect(amountFor(page, "Expenses")).toContainText("₹2,275");
  await expect(amountFor(page, "Fixed costs")).toContainText("₹750");
  await expect(amountFor(page, "Profit so far")).toContainText("₹2,555");
  await expect(page.getByRole("heading", { name: "Today's entries (8)" })).toBeVisible();
  await expect(page.getByText("− ₹500")).toBeVisible(); // cash out shown as money out
  await expect(page.getByText("All entries saved")).toBeVisible();

  // The server's day row agrees (only when testing against the local database).
  if (!process.env.E2E_BASE_URL && process.env.DATABASE_URL) {
    const sql = postgres(process.env.DATABASE_URL, { max: 1 });
    try {
      // Poll: the last change may still be on its way to the server.
      await expect
        .poll(async () => {
          const [day] = await sql`
            select d.sales_total, d.expense_total, d.fixed_cost, d.profit,
                   d.cash_out_total, d.entry_count
            from days d join shops s on s.id = d.shop_id join users u on u.id = s.owner_id
            where u.phone = ${phone} and d.business_date = ${businessDate()}`;
          return day;
        })
        .toMatchObject({
          sales_total: 558000,
          expense_total: 227500,
          fixed_cost: 75000,
          profit: 255500,
          cash_out_total: 50000,
          entry_count: 8,
        });
    } finally {
      await sql.end();
    }
  }
});

test("an entry can be edited and deleted", async ({ page }) => {
  await newShop(page);
  await addSale(page, 100, "Cash");
  await expect(entryRow(page, "+ ₹100")).toBeVisible();

  await page.getByRole("link", { name: /Sale/ }).filter({ hasText: "+ ₹100" }).click();
  await expect(page.getByRole("heading", { name: "Edit sale" })).toBeVisible();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Delete last digit" }).click();
  await typeOnKeypad(page, 250);
  await page.getByRole("radio", { name: "UPI" }).click();
  await page.getByRole("button", { name: "Save sale" }).click();
  await expect(entryRow(page, "+ ₹250")).toBeVisible();
  await expect(entryRow(page, "UPI")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Today's entries (1)" })).toBeVisible();

  await page.getByRole("link", { name: /Sale/ }).filter({ hasText: "+ ₹250" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete entry" }).click();
  await expect(page.getByRole("heading", { name: "Today's entries (0)" })).toBeVisible();
  await expect(page.getByText("All entries saved")).toBeVisible();
});

test("entries added offline reach the server exactly once", async ({ page, browser }) => {
  // Next fetches the "+ Sale" screen's data in advance (prefetch); offline it can only
  // open a screen it has fetched. Wait for that rather than for a quiet network.
  const salePrefetched = page.waitForResponse(
    (r) => r.url().includes("/add/sale") && r.request().headers()["rsc"] === "1",
    { timeout: 30_000 },
  );
  const phone = await newShop(page);
  // Lose the connection without ever having opened "+ Sale": the service worker
  // has stored the app's files, so the screen still opens.
  await waitForOfflineReady(page);
  await salePrefetched;
  await page.context().setOffline(true);
  await addSale(page, 700, "Cash");
  await expect(entryRow(page, "+ ₹700")).toBeVisible();
  await expect(page.getByText(/No internet\. 1 saved on this phone/)).toBeVisible();
  await expect(page.getByText("not sent yet")).toBeVisible();

  await page.context().setOffline(false);
  await expect(page.getByText("All entries saved")).toBeVisible({ timeout: 20_000 });

  // A second phone, logged in to the same shop, sees exactly one entry from the server.
  const other = await secondPhone(browser);
  await logIn(other, phone, PASSWORD);
  await expect(other.getByRole("heading", { name: "Today's entries (1)" })).toBeVisible();
  await expect(entryRow(other, "+ ₹700")).toBeVisible();
});

test("after logout, the next person on the phone sees none of the entries", async ({ page }) => {
  await newShop(page);
  await addSale(page, 4321, "Cash");
  await expect(page.getByText("All entries saved")).toBeVisible();

  await page.getByRole("link", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await newShop(page); // a different person registers on the same phone
  await expect(page.getByRole("heading", { name: "Today's entries (0)" })).toBeVisible();
  await expect(page.getByText("₹4,321")).toHaveCount(0);
});

test("Totals only mode hides + Sale", async ({ page }) => {
  await newShop(page, { totalsOnly: true });
  await expect(page.getByRole("link", { name: "+ Expense" })).toBeVisible();
  await expect(page.getByRole("link", { name: "+ Sale" })).toHaveCount(0);
});

test("the sync endpoint refuses outsiders", async ({ playwright, baseURL }) => {
  const api = await playwright.request.newContext({
    baseURL,
    extraHTTPHeaders: process.env.E2E_ORIGIN_SECRET
      ? { "X-Origin-Verify": process.env.E2E_ORIGIN_SECRET }
      : undefined,
  });
  const body = { entries: [{}] };
  const origin = new URL(baseURL!).origin;

  const crossSite = await api.post("/api/sync", {
    data: body,
    headers: { Origin: "https://evil.example" },
  });
  expect(crossSite.status()).toBe(403);

  const notLoggedIn = await api.post("/api/sync", { data: body, headers: { Origin: origin } });
  expect(notLoggedIn.status()).toBe(401);
  await api.dispose();
});
