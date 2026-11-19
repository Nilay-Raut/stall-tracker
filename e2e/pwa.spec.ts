import { createECDH, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import type { IncomingHttpHeaders } from "node:http";
import { createServer } from "node:https";
import type { AddressInfo } from "node:net";
import { type Page, expect, test } from "@playwright/test";
import postgres from "postgres";
import { businessDate } from "../src/lib/dates";
import {
  addSale,
  entryRow,
  newShop,
  typeOnKeypad,
  visibleScreen as screen,
  waitForOfflineReady,
} from "./shop";

const local = !process.env.E2E_BASE_URL && !!process.env.DATABASE_URL;

/** Waits until the service worker has stored Today for offline use. */
async function todayStored(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(async () => {
        for (const name of await caches.keys()) {
          if (!name.startsWith("pages-")) continue;
          const paths = (await (await caches.open(name)).keys()).map(
            (r) => new URL(r.url).pathname,
          );
          if (paths.includes("/") && paths.includes("/close/today")) return true;
        }
        return false;
      }),
    )
    .toBe(true);
}

test("the app can be installed: manifest and icons", async ({ request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({ name: "Stall Tracker", display: "standalone", start_url: "/" });
  expect(manifest.icons.map((i: { purpose: string }) => i.purpose)).toContain("maskable");
  for (const icon of [
    "/icon-192.png",
    "/icon-512.png",
    "/icon-maskable.png",
    "/apple-touch-icon.png",
  ]) {
    const response = await request.get(icon);
    expect(response.headers()["content-type"], icon).toBe("image/png");
  }
});

test("the app opens with no signal at all, and entries made then sync later", async ({ page }) => {
  await newShop(page);
  await addSale(page, 1200, "Cash");
  await expect(page.getByText("All entries saved")).toBeVisible();
  await waitForOfflineReady(page);
  await todayStored(page);

  // Airplane mode, then open the app again from scratch.
  await page.context().setOffline(true);
  await page.reload();
  // The shop name sits in the app bar, outside <main>; it comes from the phone's storage.
  await expect(page.getByText("Momo Corner")).toBeVisible();
  await expect(entryRow(page, "+ ₹1,200")).toBeVisible();

  await screen(page).getByRole("link", { name: "+ Sale" }).click();
  await expect(screen(page).getByText("Sale amount")).toBeVisible();
  await typeOnKeypad(page, 300);
  await screen(page).getByRole("button", { name: "Save sale" }).click();
  await expect(entryRow(page, "+ ₹300")).toBeVisible();
  await expect(page.getByText(/No internet\. 1 saved on this phone/)).toBeVisible();

  await page.context().setOffline(false);
  await expect(page.getByText("All entries saved")).toBeVisible({ timeout: 20_000 });
});

test("the day can be closed offline and the close reaches the server later", async ({ page }) => {
  await newShop(page, { openingCash: 1000 });
  await addSale(page, 2000, "Cash");
  await expect(page.getByText("All entries saved")).toBeVisible();
  await waitForOfflineReady(page);
  await todayStored(page);

  await page.context().setOffline(true);
  await page.reload();
  await screen(page).getByRole("link", { name: "Close day" }).click();
  await expect(screen(page).getByRole("heading", { name: "Close day" })).toBeVisible();
  await screen(page).getByLabel("1. Cash in drawer now").fill("3000"); // 3,000 − 1,000 = 2,000
  await screen(page).getByLabel("2. UPI total").fill("0");
  await screen(page).getByRole("button", { name: "Close day and see summary" }).click();

  // Summary from the phone's own figures: ₹2,000 − ₹750 fixed = ₹1,250.
  await expect(screen(page).getByText("Saved on this phone")).toBeVisible();
  await expect(screen(page).getByText("₹1,250").first()).toBeVisible();
  await expect(screen(page).getByText("Cash check: drawer matches your entries")).toBeVisible();

  await screen(page).getByRole("link", { name: "Done" }).click();
  await expect(screen(page).getByText(/Day closed · not sent yet/)).toBeVisible();

  // Back online: the close is sent, and the server's summary agrees.
  await page.context().setOffline(false);
  await expect(page.getByText("All entries saved")).toBeVisible({ timeout: 20_000 });
  await page.goto(`/summary/${businessDate()}`);
  await expect(screen(page).getByRole("heading", { name: "Day closed" })).toBeVisible();
  await expect(screen(page).getByText("₹1,250").first()).toBeVisible();
});

test("after closing time Today reminds to close the day", async ({ page }) => {
  await newShop(page, { openingCash: 1000 });
  await page.goto("/setup");
  await screen(page).getByLabel("Closing time", { exact: true }).fill("00:00"); // always passed
  await screen(page).getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(screen(page).getByText(/It is past closing time \(12:00 am\)/)).toBeVisible();

  await screen(page)
    .getByText(/It is past closing time/)
    .click();
  await screen(page).getByLabel("1. Cash in drawer now").fill("1000");
  await screen(page).getByLabel("2. UPI total").fill("0");
  await screen(page).getByRole("button", { name: "Close day and see summary" }).click();
  await expect(screen(page).getByRole("heading", { name: "Day closed" })).toBeVisible();
  await page.goto("/");
  await expect(screen(page).getByText("Day closed")).toBeVisible();
  await expect(screen(page).getByText(/It is past closing time/)).toHaveCount(0);
});

test("logging out deletes the pages stored on the phone", async ({ page }) => {
  await newShop(page);
  await waitForOfflineReady(page);
  await todayStored(page);

  await page.goto("/settings");
  await screen(page).getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  const left = await page.evaluate(async () =>
    (await caches.keys()).filter((name) => name.startsWith("pages-")),
  );
  for (const name of left) {
    const count = await page.evaluate(
      async (n) => (await (await caches.open(n)).keys()).length,
      name,
    );
    expect(count, name).toBe(0); // the login page itself may be stored again, but nothing else
  }
});

test("the reminder job is closed to outsiders and sends one reminder a day", async ({
  page,
  request,
}) => {
  test.skip(!local, "needs the local database to add a test subscription");

  const unauthorised = await request.post("/api/cron/reminders");
  expect(unauthorised.status()).toBe(401);

  // A fake push service on this machine records what the server sends.
  const received: IncomingHttpHeaders[] = [];
  const pushService = createServer(
    {
      cert: readFileSync(process.env.E2E_PUSH_CERT!),
      key: readFileSync(process.env.E2E_PUSH_KEY!),
    },
    (req, res) => {
      received.push(req.headers);
      req.resume();
      req.on("end", () => res.writeHead(201).end());
    },
  );
  await new Promise<void>((resolve) => pushService.listen(0, "127.0.0.1", resolve));
  const port = (pushService.address() as AddressInfo).port;

  const phone = await newShop(page);
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    // A subscription as a phone would make it: a P-256 public key and an auth secret.
    const keys = createECDH("prime256v1");
    keys.generateKeys();
    const [shop] = await sql`
      select s.id, s.owner_id from shops s join users u on u.id = s.owner_id where u.phone = ${phone}`;
    await sql`update shops set reminder_enabled = true, closing_time = '00:00' where id = ${shop.id}`;
    await sql`insert into push_subscriptions (user_id, shop_id, endpoint, p256dh, auth) values (
      ${shop.owner_id}, ${shop.id}, ${`https://127.0.0.1:${port}/push/${shop.id}`},
      ${keys.getPublicKey().toString("base64url")}, ${randomBytes(16).toString("base64url")})`;

    const headers = { "x-cron-secret": process.env.E2E_CRON_SECRET! };
    const first = await (await request.post("/api/cron/reminders", { headers })).json();
    expect(first.sent).toBeGreaterThanOrEqual(1);
    expect(received.length).toBe(1);
    expect(received[0]["content-encoding"]).toBe("aes128gcm"); // encrypted for the phone
    expect(received[0].authorization).toMatch(/^vapid /);

    // Only one closing reminder a day, and the follow-up waits an hour after it.
    await request.post("/api/cron/reminders", { headers });
    expect(received.length).toBe(1);
  } finally {
    await sql.end();
    pushService.close();
  }
});

test("Settings has the closing-time reminder switch", async ({ page }) => {
  await newShop(page);
  await page.goto("/settings");
  await expect(screen(page).getByText("Remind me at closing time")).toBeVisible();
  await expect(
    screen(page).getByRole("switch", { name: "Remind me at closing time" }),
  ).toBeVisible();
});
