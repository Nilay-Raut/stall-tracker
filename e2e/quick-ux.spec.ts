import { type Page, expect, test } from "@playwright/test";
import postgres from "postgres";
import { businessDate, shiftDate } from "../src/lib/dates";
import { addExpense, addSale, amountFor, newShop } from "./shop";

const local = !process.env.E2E_BASE_URL && !!process.env.DATABASE_URL;
const entriesHeading = (page: Page, n: number) =>
  page.getByRole("heading", { name: `Today's entries (${n})` });

test("a saved sale can be undone from the bar that follows", async ({ page }) => {
  await newShop(page);
  await addSale(page, 500, "Cash");
  const bar = page.getByRole("status").filter({ hasText: "Sale saved · ₹500 Cash" });
  await expect(bar).toBeVisible();
  await bar.getByRole("button", { name: "Undo" }).click();
  await expect(entriesHeading(page, 0)).toBeVisible();
  await expect(bar).toHaveCount(0);
});

test("the last sale can be repeated with one tap", async ({ page }) => {
  await newShop(page);
  await addSale(page, 40, "UPI");
  await page.getByRole("button", { name: /Repeat last sale/ }).click();
  await expect(entriesHeading(page, 2)).toBeVisible();
  await expect(amountFor(page, "UPI today")).toContainText("₹80");
});

test("Add sale offers the amounts this shop types most", async ({ page }) => {
  await newShop(page);
  await addSale(page, 40, "Cash");
  await addSale(page, 40, "Cash");
  await expect(page.getByText("All entries saved")).toBeVisible();
  await page.reload(); // the server works out the usual amounts
  await page.getByRole("link", { name: "+ Sale" }).click();
  await page.getByRole("button", { name: "₹40", exact: true }).click();
  await expect(page.locator("output").filter({ hasText: "₹40" })).toBeVisible();
});

test("the morning check fixes the opening cash, and the drawer can be counted", async ({
  page,
}) => {
  await newShop(page, { openingCash: 1000 });
  await expect(page.getByText("Start of day: is ₹1,000 in the drawer?")).toBeVisible();
  await page.getByRole("button", { name: "No, change" }).click();
  await page.getByLabel("Cash in the drawer now (₹)").fill("1200");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText(/Start of day/)).toHaveCount(0);
  await expect(amountFor(page, "Cash in drawer now")).toContainText("₹1,200");

  await addSale(page, 300, "Cash");
  await expect(amountFor(page, "Cash in drawer now")).toContainText("₹1,500");
  await page.getByRole("button", { name: "Count the drawer now" }).click();
  await page.getByLabel("Cash counted in the drawer now (₹)").fill("1450");
  await expect(page.getByText("₹50 short. An expense or cash out may be missing.")).toBeVisible();
  await page.getByLabel("Cash counted in the drawer now (₹)").fill("1500");
  await expect(page.getByText("It matches.")).toBeVisible();

  // The close starts from the corrected opening cash too.
  await page.reload();
  await expect(page.getByText(/Start of day/)).toHaveCount(0); // asked once a day
  await expect(amountFor(page, "Cash in drawer now")).toContainText("₹1,500");
});

test("holding an entry deletes it, and swiping goes to yesterday", async ({ page }) => {
  await newShop(page);
  await addExpense(page, 120, "Gas", "Drawer");
  await expect(entriesHeading(page, 1)).toBeVisible();
  // The Undo bar floats over the list for a few seconds after a save.
  await expect(page.getByRole("status").filter({ hasText: "Expense saved" })).toHaveCount(0, {
    timeout: 10_000,
  });

  page.once("dialog", (dialog) => void dialog.accept());
  const row = page.getByRole("link").filter({ hasText: "Gas" });
  // The list is below the fold, and the tab bar floats over the bottom: centre the row.
  await row.evaluate((el) => el.scrollIntoView({ block: "center" }));
  const box = (await row.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(800);
  await page.mouse.up();
  await expect(entriesHeading(page, 0)).toBeVisible();
  await expect(page).toHaveURL(/\/$/); // the hold did not open the entry
  await expect(page.getByRole("status").filter({ hasText: "Entry deleted" })).toBeVisible();

  // Finger moves to the right: the day before.
  await page.evaluate(() => {
    const touch = (x: number) =>
      new Touch({ identifier: 1, target: document.body, clientX: x, clientY: 300 });
    const fire = (type: string, touches: Touch[], changed: Touch[]) =>
      document.body.dispatchEvent(
        new TouchEvent(type, { touches, changedTouches: changed, bubbles: true }),
      );
    fire("touchstart", [touch(40)], [touch(40)]);
    fire("touchend", [], [touch(300)]);
  });
  await expect(page).toHaveURL(new RegExp(`/day/${shiftDate(businessDate(), -1)}$`));
});

test("text can be made bigger on this phone", async ({ page }) => {
  await newShop(page);
  await page.goto("/settings/appearance");
  await page
    .getByRole("radiogroup", { name: "Text size (this phone)" })
    .getByRole("radio", { name: "Extra large" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-text", "xl");
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-text", "xl"); // set before paint
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("a sale and an expense can be spoken", async ({ page }) => {
  // A stand-in recogniser that "hears" whatever the test puts in window.__say.
  await page.addInitScript(() => {
    class FakeRecognition {
      lang = "";
      interimResults = false;
      maxAlternatives = 1;
      onresult: ((e: unknown) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start() {
        setTimeout(() => {
          const said = (window as unknown as { __say: string }).__say;
          this.onresult?.({ results: [[{ transcript: said }]] });
          this.onend?.();
        }, 50);
      }
      abort() {
        this.onend?.();
      }
    }
    // Chrome has both names; the app uses whichever exists.
    const w = window as unknown as Record<string, unknown>;
    w.SpeechRecognition = FakeRecognition;
    w.webkitSpeechRecognition = FakeRecognition;
  });
  await newShop(page);

  await page.getByRole("link", { name: "+ Sale" }).click();
  await page.evaluate(() => ((window as unknown as { __say: string }).__say = "60 UPI"));
  await page.getByRole("button", { name: "Say it" }).click();
  await expect(page.getByText("Heard: “60 UPI”")).toBeVisible();
  await expect(page.locator("output").filter({ hasText: "₹60" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "UPI" })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "Save sale" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole("link", { name: "+ Expense" }).click();
  await page.evaluate(
    () => ((window as unknown as { __say: string }).__say = "gas 900 from pocket"),
  );
  await page.getByRole("button", { name: "Say it" }).click();
  await expect(page.getByLabel("Amount")).toHaveValue("900");
  const category = page.getByRole("radiogroup", { name: "Category" });
  await expect(category.getByRole("radio", { name: "Gas" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  const paidFrom = page.getByRole("radiogroup", { name: "Paid from" });
  await expect(paidFrom.getByRole("radio", { name: "Own pocket" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
});

test("a closed day can be shared on WhatsApp", async ({ page }) => {
  await newShop(page, { openingCash: 1000 });
  await addSale(page, 500, "Cash");
  await page.getByRole("link", { name: "Close day" }).click();
  await page.getByLabel("1. Cash in drawer now").fill("1500");
  await page.getByLabel("2. UPI total").fill("0");
  await page.getByRole("button", { name: "Close day and see summary" }).click();
  await expect(page.getByRole("heading", { name: "Day closed" })).toBeVisible();
  await page.goto(`/summary/${businessDate()}`);
  const share = page.getByRole("link", { name: "Share on WhatsApp" });
  const href = decodeURIComponent((await share.getAttribute("href")) ?? "");
  expect(href).toMatch(/^https:\/\/wa\.me\/\?text=/);
  expect(href).toContain("*Momo Corner*");
  expect(href).toContain("Sales ₹500 (Cash ₹500 · UPI ₹0)");
  expect(href).toContain("*Loss ₹250*"); // 500 − 750 fixed cost
});

test("Today says when a material is usually bought by now", async ({ page }) => {
  test.skip(!local, "needs the local database to add past purchases");
  const phone = await newShop(page);
  const today = businessDate();
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    const [shop] = await sql`
      select s.id from shops s join users u on u.id = s.owner_id where u.phone = ${phone}`;
    const [material] = await sql`
      insert into materials (shop_id, name, name_key, unit) values (${shop.id}, 'Oil', 'oil', 'litre')
      returning id`;
    // Every 4 days, the last 5 days ago.
    for (const back of [17, 13, 9, 5]) {
      const date = shiftDate(today, -back);
      const [entry] = await sql`
        insert into entries (id, shop_id, business_date, type, amount, category, paid_from,
                             occurred_at, client_updated_at)
        values (gen_random_uuid(), ${shop.id}, ${date}, 'expense', 90000, 'raw_material', 'drawer',
                now(), now())
        returning id`;
      await sql`
        insert into purchases (entry_id, shop_id, material_id, quantity_milli, unit, rate)
        values (${entry.id}, ${shop.id}, ${material.id}, 5000, 'litre', 18000)`;
    }
  } finally {
    await sql.end();
  }

  await page.reload();
  await expect(page.getByRole("heading", { name: "Time to buy?" })).toBeVisible();
  await expect(
    page.getByText("you usually buy it every 4 days. It has been 5 days."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Hide for today" }).click();
  await expect(page.getByRole("heading", { name: "Time to buy?" })).toHaveCount(0);
});
