import { readFileSync } from "node:fs";
import { type Page, expect, test } from "@playwright/test";
import { businessDate } from "../src/lib/dates";
import { addExpense, addSale, newShop } from "./shop";

// Accessibility check of every screen with axe-core (the engine behind Lighthouse's
// accessibility score), against WCAG 2.1 A and AA: labels, contrast, names of buttons
// and links, headings, ARIA use.

const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

type Violation = { id: string; impact: string; help: string; nodes: Array<{ target: string[] }> };

async function audit(page: Page, path: string): Promise<string[]> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await page.addScriptTag({ content: axeSource });
  const violations: Violation[] = await page.evaluate(async () => {
    // @ts-expect-error axe is added to the page above
    const result = await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    });
    return result.violations;
  });
  return violations.map(
    (v) =>
      `${path}: ${v.id} (${v.impact}) ${v.help} -> ${v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(" "))
        .join(", ")}`,
  );
}

test("the login screens pass the accessibility checks", async ({ page }) => {
  const problems: string[] = [];
  for (const path of ["/login", "/register", "/forgot"])
    problems.push(...(await audit(page, path)));
  expect(problems).toEqual([]);
});

test("every screen of the app passes the accessibility checks", async ({ page }) => {
  test.setTimeout(120_000);
  await newShop(page);
  await addSale(page, 500, "Cash");
  await addExpense(page, 200, "Gas", "Drawer");

  const today = businessDate();
  const problems: string[] = [];
  for (const path of [
    "/",
    "/add/sale",
    "/add/expense",
    "/add/cash-out",
    "/close/today",
    `/close?date=${today}`,
    "/calendar",
    `/day/${today}`,
    "/reports",
    "/reports/prices",
    "/reports/months",
    "/reports/spend/gas?range=month",
    "/reports/share?range=month",
    "/reports/print?range=month",
    "/settings",
    "/settings/target",
    "/settings/appearance",
    "/setup",
    "/settings/items",
    "/no-such-screen",
  ]) {
    problems.push(...(await audit(page, path)));
  }
  expect(problems).toEqual([]);
});
