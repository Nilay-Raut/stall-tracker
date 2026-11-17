import { readFileSync } from "node:fs";
import { type Page, expect, test } from "@playwright/test";
import { businessDate, shiftDate } from "../src/lib/dates";
import { addItem, newShop, visibleScreen as screen } from "./shop";

// Reports v2: top items, item page, busy hours, "What to do", bills CSV (docs/PLAN-v2.md, Phase 4).

const today = businessDate();
const from = shiftDate(today, -27);
const range = `range=custom&from=${from}&to=${today}`;

async function itemId(page: Page, name: string): Promise<string> {
  await page.goto("/settings/items");
  const href = await screen(page)
    .locator('a[href^="/settings/items/"]')
    .filter({ hasText: name })
    .first()
    .getAttribute("href");
  return href!.split("/").at(-1)!;
}

/**
 * Four weeks of bills, one a day at 7 pm: Chai ×10 (×20 on Saturdays) and Vada pav ×2.
 * Sent straight to the sync API, the way a phone sends them.
 */
async function fourWeeksOfBills(page: Page, baseURL: string, chai: string, vada: string) {
  const entries = Array.from({ length: 28 }, (_, i) => {
    const date = shiftDate(today, -i);
    const cups = new Date(`${date}T00:00:00Z`).getUTCDay() === 6 ? 20 : 10;
    const at = `${date}T13:30:00.000Z`; // 7 pm in India
    return {
      id: crypto.randomUUID(),
      businessDate: date,
      type: "sale",
      amount: cups * 10_00 + 2 * 20_00,
      paymentMode: i % 2 ? "cash" : "upi",
      category: null,
      paidFrom: null,
      purchase: null,
      lines: [
        { itemId: chai, name: "Chai", unitPrice: 10_00, quantity: cups },
        { itemId: vada, name: "Vada pav", unitPrice: 20_00, quantity: 2 },
      ],
      occurredAt: at,
      updatedAt: at,
      deleted: false,
    };
  });
  for (const batch of [entries.slice(0, 14), entries.slice(14)]) {
    const res = await page.request.post("/api/sync", {
      headers: { Origin: baseURL },
      data: { entries: batch },
    });
    const body = (await res.json()) as { results: Array<{ status: string }> };
    expect(body.results.every((r) => r.status === "saved")).toBe(true);
  }
}

test("four weeks of bills give item reports and things to do", async ({ page, baseURL }) => {
  await newShop(page);
  await addItem(page, "Chai", 10, "My cost", 8); // keeps only 20% of its price
  await addItem(page, "Vada pav", 20, "My cost", 8);
  await fourWeeksOfBills(
    page,
    baseURL!,
    await itemId(page, "Chai"),
    await itemId(page, "Vada pav"),
  );

  await page.goto(`/reports?${range}`);
  const main = screen(page);

  // Bills: one a day.
  await expect(main.getByLabel("Bills").getByText("28", { exact: true })).toBeVisible();

  // What to do: rule-based, from the last four weeks.
  await expect(main.getByRole("heading", { name: "What to do" })).toBeVisible();
  await expect(main.getByText("Make about 9 more Chai on Saturday.")).toBeVisible();
  await expect(main.getByText("Raise Chai by ₹1?")).toBeVisible();
  await expect(main.getByText("Chai and Vada pav sell together.")).toBeVisible();

  // Busy hours, profit share and pairs.
  await expect(main.getByRole("heading", { name: "Busy hours" })).toBeVisible();
  await expect(main.getByText(/^Busiest: Saturday/).first()).toBeVisible();
  await expect(main.getByRole("heading", { name: "Where the profit comes from" })).toBeVisible();
  await expect(main.getByText("Chai + Vada pav")).toBeVisible();

  // Top items, then one item's own page.
  await main.getByRole("link", { name: /Chai/ }).first().click();
  await expect(page).toHaveURL(/\/reports\/items\/chai\?/);
  await expect(screen(page).getByRole("heading", { level: 1, name: "Chai" })).toBeVisible();
  await expect(screen(page).getByText("320", { exact: true })).toBeVisible(); // 24 × 10 + 4 × 20
  await expect(screen(page).getByRole("heading", { name: "Often bought with" })).toBeVisible();
  await expect(screen(page).getByText("28 bills")).toBeVisible();

  // Bills as a spreadsheet: one row per item on a bill.
  const csv = await (await page.request.get(`/api/export/bills?${range}`)).text();
  const lines = csv.trim().split(/\r?\n/);
  expect(lines[0]).toContain("Date,Time,Bill,Item,Quantity,Price,Amount,Payment");
  expect(lines).toHaveLength(1 + 28 * 2);
  expect(csv).toContain("Vada pav,2,20,40");
});

test("Reports has a Today period, compared with the same day last week", async ({ page }) => {
  await newShop(page);
  await page.goto("/reports");
  await screen(page).getByRole("link", { name: "Today", exact: true }).click();
  await expect(page).toHaveURL(/range=today/);
  await expect(screen(page).getByText("Profit today")).toBeVisible();
});

test("the new report sections pass the accessibility checks in light and dark", async ({
  page,
  baseURL,
}) => {
  const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
  await newShop(page);
  await addItem(page, "Chai", 10, "My cost", 8);
  await addItem(page, "Vada pav", 20, "My cost", 8);
  await fourWeeksOfBills(
    page,
    baseURL!,
    await itemId(page, "Chai"),
    await itemId(page, "Vada pav"),
  );

  type Violation = { id: string; nodes: Array<{ target: string[] }> };
  type Axe = { run: (ctx: Document, opts: object) => Promise<{ violations: Violation[] }> };
  const problems: string[] = [];
  for (const theme of ["light", "dark"] as const) {
    await page.evaluate((t) => localStorage.setItem("stall:theme", t), theme);
    for (const path of [`/reports?${range}`, `/reports/items/chai?${range}`]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await page.addScriptTag({ content: axeSource });
      const found: Violation[] = await page.evaluate(async () => {
        const axe = (window as unknown as { axe: Axe }).axe;
        const result = await axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
        });
        return result.violations;
      });
      problems.push(
        ...found.map((v) => `${theme} ${path}: ${v.id} -> ${v.nodes[0]?.target.join(" ")}`),
      );
    }
  }
  expect(problems).toEqual([]);
});
