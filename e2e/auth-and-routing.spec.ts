import { expect, test } from "@playwright/test";
import { loginAs, logout } from "./helpers/auth";

test("redirects unauthenticated dashboard access to login", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await page.waitForURL("**/login");
  await expect(
    page.getByLabel("Email or Username", { exact: true }),
  ).toBeVisible();
});

test("allows HR user to sign in and open dashboard", async ({ page }) => {
  await loginAs(page, "hr");
  await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Required Actions")).toBeVisible();

  await logout(page);
});
