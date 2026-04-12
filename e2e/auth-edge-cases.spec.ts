import { expect, test } from "@playwright/test";
import { loginAs, logout } from "./helpers/auth";

test("shows validation errors for empty login submit", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("button", { name: /^sign in$/i }).click();

  await expect(page.getByText("Enter your email or username.")).toBeVisible();
  await expect(page.getByText("Enter your password.")).toBeVisible();
});

test("shows error for invalid login credentials", async ({ page }) => {
  await page.goto("/login");

  await page
    .getByLabel("Email or Username", { exact: true })
    .fill("hr@example.com");
  await page.getByLabel("Password", { exact: true }).fill("WrongPass123!");
  await page.getByRole("button", { name: /^sign in$/i }).click();

  await expect(
    page.getByText("Incorrect email/username or password."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("authenticated user visiting /login is redirected to /dashboard", async ({
  page,
}) => {
  await loginAs(page, "hr");

  await page.goto("/login");
  await page.waitForURL("**/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);

  await logout(page);
});

test("logout endpoint invalidates session for protected routes", async ({
  page,
}) => {
  await loginAs(page, "hr");

  await logout(page);

  await page.goto("/dashboard");
  await page.waitForURL("**/login");
  await expect(
    page.getByLabel("Email or Username", { exact: true }),
  ).toBeVisible();
});
