import { readFileSync } from "node:fs";
import { type Page, expect, test } from "@playwright/test";
import postgres from "postgres";
import { businessDate } from "../src/lib/dates";
import { secondPhone } from "./helpers";
import { addItem, entryRow, newShop, visibleScreen as screen, waitForOfflineReady } from "./shop";

// Bills: a sale made of saved and custom items, sent on WhatsApp (docs/PLAN-v2.md, Phase 3).

/** A shop with two items, with the phone's copy of the shop up to date. */
async function shopWithItems(page: Page) {
  await newShop(page);
  await addItem(page, "Vada pav", 20, "My cost", 8);
  await addItem(page, "Chai", 10, "My cost", 4);
  await page.goto("/");
  await expect(page.getByText("All entries saved")).toBeVisible();
}

/** Opens a new sale on the Bill tab, waiting until the items are on the phone. */
async function openBill(page: Page) {
  await page.goto("/add/sale");
  await screen(page).getByRole("radio", { name: "Bill" }).click();
  await expect(screen(page).getByRole("button", { name: "Add Vada pav" })).toBeVisible();
}

const billTotal = (page: Page) => screen(page).locator("output");

test("a bill of saved and custom items is saved, listed and counted at closing", async ({
  page,
}) => {
  await shopWithItems(page);
  await openBill(page);

  await screen(page).getByRole("button", { name: "Add Vada pav" }).click();
  await screen(page).getByRole("button", { name: "Add Vada pav" }).click();
  await screen(page).getByRole("button", { name: "Add Chai" }).click();
  await expect(billTotal(page)).toHaveText("₹50");
  await expect(screen(page).getByText("Bill total · 3 items")).toBeVisible();

  // One less chai, then back again.
  await screen(page).getByRole("button", { name: "One less Chai" }).first().click();
  await expect(billTotal(page)).toHaveText("₹40");
  await screen(page).getByRole("button", { name: "Add Chai" }).click();

  // An item that is not in the list.
  await screen(page).getByRole("button", { name: "Custom item" }).click();
  const sheet = page.getByRole("dialog", { name: "Custom item" });
  await sheet.getByRole("button", { name: "Add to bill" }).click();
  await expect(sheet.getByText("Name the item.")).toBeVisible();
  await sheet.getByLabel("Item name").fill("Extra chutney");
  await sheet.getByLabel("Price for one (₹)").fill("5");
  await sheet.getByRole("button", { name: "Add to bill" }).click();
  await expect(sheet).toBeHidden();
  await expect(billTotal(page)).toHaveText("₹55");

  await screen(page).getByRole("radio", { name: "UPI" }).click();
  await screen(page).getByRole("button", { name: "Save bill" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(entryRow(page, "+ ₹55")).toContainText("Vada pav ×2, Chai, +1");
  await expect(page.getByText("All entries saved")).toBeVisible();

  // The server kept the lines: a fresh load still shows them.
  await page.reload();
  await expect(entryRow(page, "+ ₹55")).toContainText("Vada pav ×2, Chai, +1");

  // Closing: the plate counter starts from the bills.
  await page.goto("/close/today");
  await expect(
    screen(page).getByText("Filled in from today's bills.", { exact: false }),
  ).toBeVisible();
  await expect(screen(page).getByLabel("Vada pav plates")).toHaveValue("2");
  await expect(screen(page).getByLabel("Chai plates")).toHaveValue("1");
});

test("the bill opens WhatsApp with the bill typed in, and is saved", async ({ page, context }) => {
  // Never reach the real WhatsApp from a test.
  await context.route("https://wa.me/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/plain", body: "whatsapp" }),
  );
  await shopWithItems(page);
  await openBill(page);
  await screen(page).getByRole("button", { name: "Add Vada pav" }).click();
  await screen(page).getByRole("button", { name: "Add Chai" }).click();
  await screen(page).getByLabel("Customer's WhatsApp number (optional)").fill("98765 43210");

  const send = screen(page).getByRole("link", { name: "Save and send on WhatsApp" });
  const href = (await send.getAttribute("href"))!;
  expect(href.startsWith("https://wa.me/919876543210?text=")).toBe(true);
  const text = decodeURIComponent(href.split("?text=")[1]);
  expect(text).toContain("*Momo Corner*");
  expect(text).toContain("Vada pav  ₹20");
  expect(text).toContain("*Total: ₹30*");
  expect(text).toContain("Paid in cash");

  const [whatsapp] = await Promise.all([page.waitForEvent("popup"), send.click()]);
  await expect(whatsapp).toHaveURL(/^https:\/\/wa\.me\//);
  await expect(page).toHaveURL(/\/$/);
  await expect(entryRow(page, "+ ₹30")).toContainText("Vada pav, Chai");
});

test("'Bill each sale' opens the bill first, and bills work offline", async ({ page }) => {
  await shopWithItems(page);
  await page.goto("/setup");
  await screen(page).getByText("Bill each sale").click();
  await screen(page).getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("All entries saved")).toBeVisible();
  await waitForOfflineReady(page);

  await page.context().setOffline(true);
  await page.reload();
  await screen(page).getByRole("link", { name: "+ Sale" }).click();
  // No tab to pick: the bill is first.
  await expect(screen(page).getByRole("radio", { name: "Bill" })).toBeChecked();
  await screen(page).getByRole("button", { name: "Add Chai" }).click();
  await screen(page).getByRole("button", { name: "Add Chai" }).click();
  await screen(page).getByRole("button", { name: "Save bill" }).click();
  await expect(entryRow(page, "+ ₹20")).toContainText("Chai ×2");
  await expect(page.getByText(/No internet\. 1 saved on this phone/)).toBeVisible();

  await page.context().setOffline(false);
  await expect(page.getByText("All entries saved")).toBeVisible({ timeout: 20_000 });
  await page.reload();
  await expect(entryRow(page, "+ ₹20")).toContainText("Chai ×2");
});

test("the server refuses a bill whose amount is not its total", async ({ page, baseURL }) => {
  await newShop(page);
  const now = new Date().toISOString();
  const res = await page.request.post("/api/sync", {
    headers: { Origin: baseURL! },
    data: {
      entries: [
        {
          id: crypto.randomUUID(),
          businessDate: businessDate(),
          type: "sale",
          amount: 99_00, // the lines add up to ₹20
          paymentMode: "cash",
          category: null,
          paidFrom: null,
          purchase: null,
          lines: [{ itemId: null, name: "Chai", unitPrice: 10_00, quantity: 2 }],
          occurredAt: now,
          updatedAt: now,
          deleted: false,
        },
      ],
    },
  });
  expect(res.ok()).toBe(true);
  const body = (await res.json()) as { results: Array<{ status: string }> };
  expect(body.results[0].status).toBe("rejected");
});

test("an existing bill opens as a bill and can be changed", async ({ page }) => {
  await shopWithItems(page);
  await openBill(page);
  await screen(page).getByRole("button", { name: "Add Vada pav" }).click();
  await screen(page).getByRole("button", { name: "Save bill" }).click();
  await expect(entryRow(page, "+ ₹20")).toBeVisible();

  await entryRow(page, "+ ₹20").click();
  await expect(screen(page).getByRole("radio", { name: "Bill" })).toBeChecked();
  await expect(billTotal(page)).toHaveText("₹20");
  await screen(page).getByRole("button", { name: "One more Vada pav" }).click();
  await screen(page).getByRole("button", { name: "Save bill" }).click();
  await expect(entryRow(page, "+ ₹40")).toContainText("Vada pav ×2");
});

test("a filled-in bill passes the accessibility checks in light and dark", async ({ page }) => {
  const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
  await shopWithItems(page);
  const problems: string[] = [];
  for (const theme of ["light", "dark"] as const) {
    await page.evaluate((t) => localStorage.setItem("stall:theme", t), theme);
    await openBill(page);
    await screen(page).getByRole("button", { name: "Add Vada pav" }).click();
    await screen(page).getByRole("button", { name: "Add Chai" }).click();
    await page.addScriptTag({ content: axeSource });
    type Violation = { id: string; nodes: Array<{ target: string[] }> };
    type Axe = {
      run: (ctx: Document, opts: object) => Promise<{ violations: Violation[] }>;
    };
    const found: Violation[] = await page.evaluate(async () => {
      const axe = (window as unknown as { axe: Axe }).axe; // added to the page above
      const result = await axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
      });
      return result.violations;
    });
    problems.push(...found.map((v) => `${theme}: ${v.id} -> ${v.nodes[0]?.target.join(" ")}`));
  }
  expect(problems).toEqual([]);
});

test("a bill can never point at another shop's item", async ({ page, browser, baseURL }) => {
  test.skip(!!process.env.E2E_BASE_URL || !process.env.DATABASE_URL, "needs the local database");

  // Shop A has an item; shop B learns its id somehow and puts it on a bill.
  await newShop(page);
  await addItem(page, "Secret recipe", 50, "My cost", 10);
  await page.goto("/settings/items");
  const href = await screen(page)
    .locator('a[href^="/settings/items/"]')
    .filter({ hasText: "Secret recipe" })
    .first()
    .getAttribute("href");
  const foreignItem = href!.split("/").at(-1)!;

  const other = await secondPhone(browser);
  await newShop(other);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const res = await other.request.post("/api/sync", {
    headers: { Origin: baseURL! },
    data: {
      entries: [
        {
          id,
          businessDate: businessDate(),
          type: "sale",
          amount: 50_00,
          paymentMode: "cash",
          category: null,
          paidFrom: null,
          purchase: null,
          lines: [{ itemId: foreignItem, name: "Chai", unitPrice: 50_00, quantity: 1 }],
          occurredAt: now,
          updatedAt: now,
          deleted: false,
        },
      ],
    },
  });
  expect(((await res.json()) as { results: Array<{ status: string }> }).results[0].status).toBe(
    "saved",
  );

  // Kept as a custom line: no link to shop A's item, and none of its cost.
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    const rows =
      await sql`select item_id, cost_at_time, name from sale_lines where entry_id = ${id}`;
    expect(rows).toEqual([{ item_id: null, cost_at_time: null, name: "Chai" }]);
  } finally {
    await sql.end();
  }
});
