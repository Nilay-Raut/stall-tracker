import { type Page, expect, test } from "@playwright/test";
import { businessDate, formatDayLabel } from "../src/lib/dates";
import { addSale, entryRow, newShop } from "./shop";

const daysAgo = (n: number) =>
  new Date(new Date(`${businessDate()}T00:00:00Z`).getTime() - n * 86_400_000)
    .toISOString()
    .slice(0, 10);

/** The screen currently shown (Next keeps recently visited screens mounted but hidden). */
const screen = (page: Page) => page.locator("main").filter({ visible: true }).first();

/** Opens the Calendar on the date's month and picks that day. */
async function pickDay(page: Page, date: string) {
  await page.goto(`/calendar?month=${date.slice(0, 7)}`);
  await screen(page)
    .getByRole("button", { name: new RegExp(`^${formatDayLabel(date)}`) })
    .click();
  await expect(
    screen(page).getByRole("heading", { name: new RegExp(formatDayLabel(date)) }),
  ).toBeVisible();
}

function dayCell(page: Page, date: string) {
  return screen(page).getByRole("button", { name: new RegExp(`^${formatDayLabel(date)}`) });
}

test("today's entries show on the calendar", async ({ page }) => {
  await newShop(page);
  await addSale(page, 500, "Cash");
  await expect(page.getByText("All entries saved")).toBeVisible();

  await pickDay(page, businessDate());
  await expect(dayCell(page, businessDate())).toHaveAccessibleName(/has entries/);
  await expect(screen(page).getByText("(today)")).toBeVisible();
  await expect(screen(page).getByText("₹500").first()).toBeVisible();
});

test("a missed day can be filled in and corrected from the calendar", async ({ page }) => {
  await newShop(page);
  const yesterday = daysAgo(1);

  await pickDay(page, yesterday);
  await expect(screen(page).getByText("No entries for this day yet.")).toBeVisible();
  await screen(page).getByRole("link", { name: "Add or edit entries" }).click();
  await expect(page).toHaveURL(new RegExp(`/day/${yesterday}$`));

  // Add an expense for yesterday.
  await screen(page).getByRole("link", { name: "+ Expense" }).click();
  await expect(
    screen(page).getByText(`This entry goes on ${formatDayLabel(yesterday)}`),
  ).toBeVisible();
  await screen(page).getByLabel("Amount").fill("300");
  await screen(page).getByRole("button", { name: "Save expense" }).click();
  await expect(page).toHaveURL(new RegExp(`/day/${yesterday}$`));
  await expect(entryRow(page, "− ₹300")).toBeVisible();

  // Correct it.
  await entryRow(page, "− ₹300").click();
  await expect(screen(page).getByRole("heading", { name: "Edit expense" })).toBeVisible();
  await screen(page).getByLabel("Amount").fill("350");
  await screen(page).getByRole("button", { name: "Save expense" }).click();
  await expect(page).toHaveURL(new RegExp(`/day/${yesterday}$`));
  await expect(entryRow(page, "− ₹350")).toBeVisible();
  await expect(
    page.getByText("All entries saved").or(page.getByText(/Entries \(1\)/)),
  ).toBeVisible();

  // The calendar has it once it reached the server.
  await expect
    .poll(async () => {
      await pickDay(page, yesterday);
      return dayCell(page, yesterday).getAttribute("aria-label");
    })
    .toMatch(/has entries/);
  await expect(screen(page).getByText("₹350").first()).toBeVisible();
});

test("a day can be marked as shop closed, and undone", async ({ page }) => {
  await newShop(page);
  const day = daysAgo(2);

  await pickDay(page, day);
  await screen(page).getByRole("button", { name: "Mark shop closed" }).click();
  await expect(
    screen(page).getByText("Shop closed. This day is left out of averages."),
  ).toBeVisible();
  await expect(dayCell(page, day)).toHaveAccessibleName(/shop closed/);

  await screen(page).getByRole("button", { name: "Shop was open" }).click();
  await expect(screen(page).getByText("No entries for this day yet.")).toBeVisible();
  await expect(dayCell(page, day)).not.toHaveAccessibleName(/shop closed/);
});

test("a day with entries cannot be marked closed, and entries reopen an off day", async ({
  page,
}) => {
  await newShop(page);
  const day = daysAgo(3);

  // Mark it off, then add a sale to it: it was open after all.
  await pickDay(page, day);
  await screen(page).getByRole("button", { name: "Mark shop closed" }).click();
  await expect(dayCell(page, day)).toHaveAccessibleName(/shop closed/);

  await page.goto(`/day/${day}`);
  await addSale(page, 250, "UPI");
  await expect(page).toHaveURL(new RegExp(`/day/${day}$`));
  await expect(entryRow(page, "+ ₹250")).toBeVisible();

  await expect
    .poll(async () => {
      await pickDay(page, day);
      return dayCell(page, day).getAttribute("aria-label");
    })
    .toMatch(/has entries/);
  await expect(screen(page).getByRole("button", { name: "Mark shop closed" })).toBeDisabled();
});
