import { type Page, expect, test } from "@playwright/test";
import { addSale, newShop, visibleScreen as screen } from "./shop";

// Long-session check: a busy evening of entries and screen changes in one open app
// must not keep growing memory, DOM or event listeners. Slow, so it runs only on
// request: MEMORY_CHECK=1 npm run test:e2e -- memory

test.skip(!process.env.MEMORY_CHECK, "set MEMORY_CHECK=1 to run");

type Sample = { heapMb: number; nodes: number; listeners: number };

async function measure(page: Page): Promise<Sample> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");
  await cdp.send("HeapProfiler.collectGarbage");
  await cdp.send("HeapProfiler.collectGarbage");
  const { metrics } = await cdp.send("Performance.getMetrics");
  const get = (name: string) => metrics.find((m) => m.name === name)?.value ?? 0;
  await cdp.detach();
  return {
    heapMb: Math.round((get("JSHeapUsedSize") / 1024 / 1024) * 10) / 10,
    nodes: get("Nodes"),
    listeners: get("JSEventListeners"),
  };
}

async function switchTabs(page: Page) {
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const tab of ["Calendar", "Reports", "Target", "Today"]) {
    await nav.getByRole("link", { name: tab }).click();
    await expect(nav.getByRole("link", { name: tab })).toHaveAttribute("aria-current", "page");
  }
}

test("a long session does not keep growing memory", async ({ page }) => {
  test.setTimeout(15 * 60_000);
  await newShop(page);
  for (let i = 0; i < 10; i++) {
    await addSale(page, 100 + i, "Cash"); // warm up caches
    await switchTabs(page);
  }

  // Moving between screens, with nothing new to show, must stay flat.
  const start = await measure(page);
  for (let i = 0; i < 50; i++) await switchTabs(page);
  const afterTabs = await measure(page);

  // A busy evening: 80 more entries, switching screens after each.
  for (let i = 0; i < 80; i++) {
    await addSale(page, 200 + i, i % 2 ? "Cash" : "UPI");
    await switchTabs(page);
  }
  await expect(screen(page).getByText("All entries saved")).toBeVisible();
  const end = await measure(page);
  console.log("memory", JSON.stringify({ start, afterTabs, end }));

  expect(afterTabs.heapMb - start.heapMb).toBeLessThan(2);
  expect(afterTabs.listeners - start.listeners).toBeLessThan(20);
  expect(afterTabs.nodes - start.nodes).toBeLessThan(300);
  // Each entry adds one row to Today's list (about 30 elements, 3 listeners); nothing more.
  expect(end.heapMb - start.heapMb).toBeLessThan(10);
  expect(end.listeners - afterTabs.listeners).toBeLessThanOrEqual(80 * 4);
  expect(end.nodes - afterTabs.nodes).toBeLessThan(80 * 40);
});
