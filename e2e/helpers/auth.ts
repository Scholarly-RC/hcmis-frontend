import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? "TestPass123!";

const TEST_USERS = {
  hr: process.env.PLAYWRIGHT_HR_EMAIL ?? "hr@example.com",
  employee: process.env.PLAYWRIGHT_EMPLOYEE_EMAIL ?? "employee@example.com",
} as const;

export type TestUserRole = keyof typeof TEST_USERS;

export async function loginAs(page: Page, role: TestUserRole) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(TEST_USERS[role]);
  await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();

  await page.waitForURL("**/dashboard", { timeout: 15_000 });
  await expect(page).toHaveURL(/\/dashboard$/);
}

export async function logout(page: Page) {
  try {
    await page.request.get("/api/auth/logout", {
      failOnStatusCode: false,
      maxRedirects: 0,
    });
  } catch {
    // Ignore transient network resets from parallel test teardown.
  } finally {
    await page.context().clearCookies();
  }
}
