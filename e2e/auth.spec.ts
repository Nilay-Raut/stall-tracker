import { expect, test } from "@playwright/test";
import {
  PASSWORD,
  PIN,
  completeSetup,
  expectNoSidewaysScroll,
  formAlert,
  logIn,
  randomPhone,
  registerUser,
  secondPhone,
} from "./helpers";

test("logged-out visitors are sent to the login screen", async ({ page }) => {
  for (const path of ["/", "/calendar", "/setup"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  }
});

test("register checks the form, then creates the account", async ({ page }) => {
  const phone = randomPhone();
  await page.goto("/register");

  await page.getByLabel("Mobile number").fill("12345");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByLabel("Password again").fill("different");
  await page.getByLabel("Recovery PIN (6 digits)").fill("123456");
  await page.getByLabel("Recovery PIN again").fill("123456");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText("Enter a 10-digit mobile number.")).toBeVisible();
  await expect(page.getByText("Use at least 8 characters.")).toBeVisible();
  await expect(page.getByText("This PIN is too easy to guess.")).toBeVisible();

  await registerUser(page, phone);

  // Until setup is saved, the tabs send the user back to setup.
  await page.goto("/");
  await expect(page).toHaveURL(/\/setup$/);
});

test("the same number cannot register twice", async ({ page, browser }) => {
  const phone = randomPhone();
  await registerUser(page, phone);

  const other = await secondPhone(browser);
  await other.goto("/register");
  await other.getByLabel("Mobile number").fill(phone);
  await other.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await other.getByLabel("Password again").fill(PASSWORD);
  await other.getByLabel("Recovery PIN (6 digits)").fill(PIN);
  await other.getByLabel("Recovery PIN again").fill(PIN);
  await other.getByRole("button", { name: "Create account" }).click();
  await expect(other.getByText("This number is already registered.")).toBeVisible();
});

test("setup saves the shop and fixed costs", async ({ page }) => {
  await registerUser(page, randomPhone());

  await page.getByLabel("Shop name").fill("Momo Corner");
  await page.getByLabel("Cost 1 name").fill("Rent");
  await page.locator("#cost-0-amount").fill("9000");
  await page.getByLabel("Cost 2 name").fill("Salary (monthly helper)");
  await page.locator("#cost-1-amount").fill("12000");
  await page.getByLabel("Cost 3 name").fill("Electricity");
  await page.locator("#cost-2-amount").fill("1500");
  await expect(page.getByText("₹22,500 a month")).toBeVisible();

  await page.getByRole("button", { name: "Save and start" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Momo Corner")).toBeVisible();

  // Settings shows what was saved.
  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByLabel("Shop name")).toHaveValue("Momo Corner");
  await expect(page.locator("#cost-1-amount")).toHaveValue("12000");
  await expect(page.getByText("₹22,500 a month")).toBeVisible();
});

test("log out, then log in again", async ({ page }) => {
  const phone = randomPhone();
  await registerUser(page, phone);
  await completeSetup(page, "Chai Point");

  await page.goto("/setup");
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);

  await logIn(page, phone, PASSWORD);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Chai Point")).toBeVisible();
});

test("wrong logins get one message, and 5 lock the number", async ({ page }) => {
  const phone = randomPhone();
  await registerUser(page, phone);
  await page.context().clearCookies();

  // An unregistered number gets exactly the same message as a wrong password.
  await logIn(page, randomPhone(), PASSWORD);
  await expect(formAlert(page)).toHaveText("Mobile number or password is wrong.");

  for (let i = 0; i < 5; i++) {
    await logIn(page, phone, "wrong-password");
    await expect(formAlert(page)).toHaveText("Mobile number or password is wrong.");
  }
  // Locked now, even with the right password.
  await logIn(page, phone, PASSWORD);
  await expect(formAlert(page)).toContainText("Too many wrong tries.");
});

test("forgot password resets with the recovery PIN", async ({ page }) => {
  const phone = randomPhone();
  const newPassword = "new-password-99";
  await registerUser(page, phone);
  await completeSetup(page, "Vada Pav Stall");
  await page.context().clearCookies();

  await page.goto("/forgot");
  await page.getByLabel("Mobile number").fill(phone);
  await page.getByLabel("Recovery PIN").fill("000111");
  await page.getByLabel("New password", { exact: true }).fill(newPassword);
  await page.getByLabel("New password again").fill(newPassword);
  await page.getByRole("button", { name: "Set new password" }).click();
  await expect(formAlert(page)).toHaveText("Mobile number or recovery PIN is wrong.");

  await page.getByLabel("Recovery PIN").fill(PIN);
  await page.getByLabel("New password", { exact: true }).fill(newPassword);
  await page.getByLabel("New password again").fill(newPassword);
  await page.getByRole("button", { name: "Set new password" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Vada Pav Stall")).toBeVisible();

  // The old password no longer works; the new one does.
  await page.context().clearCookies();
  await logIn(page, phone, PASSWORD);
  await expect(formAlert(page)).toHaveText("Mobile number or password is wrong.");
  await logIn(page, phone, newPassword);
  await expect(page).toHaveURL(/\/$/);
});

test("a password reset logs out other devices", async ({ page, browser }) => {
  const phone = randomPhone();
  await registerUser(page, phone);
  await completeSetup(page, "Juice Bar");

  const other = await secondPhone(browser);
  await other.goto("/forgot");
  await other.getByLabel("Mobile number").fill(phone);
  await other.getByLabel("Recovery PIN").fill(PIN);
  await other.getByLabel("New password", { exact: true }).fill("another-pass-77");
  await other.getByLabel("New password again").fill("another-pass-77");
  await other.getByRole("button", { name: "Set new password" }).click();
  await expect(other).toHaveURL(/\/$/);

  // The first device's session is gone.
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("no screen is wider than the phone", async ({ page }) => {
  for (const path of ["/login", "/register", "/forgot"]) {
    await page.goto(path);
    await expectNoSidewaysScroll(page);
  }
  await registerUser(page, randomPhone());
  await expectNoSidewaysScroll(page); // setup
  await completeSetup(page, "Wide Check");
  for (const path of [
    "/",
    "/calendar",
    "/reports",
    "/target",
    "/setup",
    "/add/sale",
    "/add/expense",
    "/add/cash-out",
  ]) {
    await page.goto(path);
    await expectNoSidewaysScroll(page);
  }
});
