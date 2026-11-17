import { crc32, deflateSync } from "node:zlib";
import { type Page, expect, test } from "@playwright/test";
import { newShop, visibleScreen as screen } from "./shop";

// Settings hub, Target under Settings, brand colour and logo (docs/PLAN-v2.md, Phase 2).

/** A plain one-colour PNG of the given size, made without any image library. */
function solidPng(size: number, [r, g, b]: [number, number, number]): Buffer {
  const chunk = (type: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const out = Buffer.alloc(12 + data.length);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(crc32(body), 8 + data.length);
    return out;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 2, 0, 0, 0], 8); // 8-bit RGB
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array(size).fill([r, g, b]).flat())]);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(Buffer.concat(Array(size).fill(row)))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const brandOnPage = (page: Page) =>
  page.evaluate(() => document.documentElement.style.getPropertyValue("--brand"));

async function openAppearance(page: Page) {
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Settings" })
    .click();
  await expect(page).toHaveURL(/\/settings$/);
  await screen(page)
    .getByRole("link", { name: /Appearance/ })
    .click();
  await expect(page).toHaveURL(/\/settings\/appearance$/);
}

test("the shop's colour is saved, shown from the first paint and cleared at logout", async ({
  page,
}) => {
  await newShop(page);
  await openAppearance(page);

  await screen(page).getByRole("radio", { name: "Purple" }).click();
  await screen(page).getByRole("button", { name: "Save colour" }).click();
  await expect(screen(page).getByText("Colour saved.")).toBeVisible();
  expect(await brandOnPage(page)).toBe("#7c3aed");

  // Applied before React loads, on every screen.
  await page.goto("/");
  expect(await brandOnPage(page)).toBe("#7c3aed");

  await page.goto("/settings");
  await screen(page).getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await brandOnPage(page)).toBe("");
  expect(await page.evaluate(() => localStorage.getItem("stall:brand"))).toBeNull();
});

test("a colour too light to read cannot be saved", async ({ page }) => {
  await newShop(page);
  await page.goto("/settings/appearance");
  await screen(page).getByLabel("Own colour").fill("#facc15");
  await expect(
    screen(page).getByText("This colour is too light to read. Pick a darker one."),
  ).toBeVisible();
  await expect(screen(page).getByRole("button", { name: "Save colour" })).toBeDisabled();
});

test("a logo can be added, shows in the app bar and can be removed", async ({ page }) => {
  await newShop(page);
  await page.goto("/settings/appearance");

  await screen(page)
    .getByLabel("Add logo")
    .setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: solidPng(300, [200, 40, 90]),
    });
  await expect(screen(page).getByText("Logo saved.")).toBeVisible();

  await page.goto("/");
  const appBarLogo = page.locator('img[src^="data:image/"]').first();
  await expect(appBarLogo).toBeVisible();

  // Stored at 256 × 256, under the size limit.
  const res = await page.request.get("/api/logo?v=1");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toMatch(/^image\/(webp|jpeg)$/);
  expect((await res.body()).length).toBeLessThanOrEqual(100 * 1024);

  await page.goto("/settings/appearance");
  await screen(page).getByRole("button", { name: "Remove" }).click();
  await expect(screen(page).getByText("Logo removed.")).toBeVisible();
  await page.goto("/");
  await expect(page.locator('img[src^="data:image/"]')).toHaveCount(0);
});

test("pictures that are too small or not pictures are refused", async ({ page, baseURL }) => {
  await newShop(page);
  await page.goto("/settings/appearance");
  await screen(page)
    .getByLabel("Add logo")
    .setInputFiles({ name: "tiny.png", mimeType: "image/png", buffer: solidPng(32, [0, 0, 0]) });
  await expect(
    screen(page).getByText("That picture is too small. Use one at least 64 × 64."),
  ).toBeVisible();

  // The server checks the bytes itself, and only takes uploads from the app's own pages.
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
  const fromApp = await page.request.put("/api/logo", {
    data: svg,
    headers: { "Content-Type": "image/png", Origin: baseURL! },
  });
  expect(fromApp.status()).toBe(400);
  const crossSite = await page.request.put("/api/logo", {
    data: solidPng(100, [1, 2, 3]),
    headers: { "Content-Type": "image/png", Origin: "https://evil.example" },
  });
  expect(crossSite.status()).toBe(403);
});

test("Target lives in Settings and the old address still works", async ({ page }) => {
  await newShop(page);
  await page.goto("/target");
  await expect(page).toHaveURL(/\/settings\/target$/);
  await expect(page.getByRole("heading", { level: 1, name: "Target" })).toBeVisible();
  // The Settings tab is the current one.
  await expect(
    page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Settings" }),
  ).toHaveAttribute("aria-current", "page");
});
