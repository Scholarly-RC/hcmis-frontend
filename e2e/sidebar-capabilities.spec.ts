import { expect, test } from "@playwright/test";
import { loginAs, logout } from "./helpers/auth";

test("shows HR sidebar modules for HR user", async ({ page }) => {
  await loginAs(page, "hr");

  await expect(page.getByText("HR Modules")).toBeVisible();
  const userManagementLink = page.getByRole("link", {
    name: "User Management",
  });
  if (!(await userManagementLink.isVisible())) {
    await page.getByRole("button", { name: /HR Modules/i }).click();
  }
  await expect(userManagementLink).toBeVisible();
  await expect(page.getByRole("link", { name: "App Logs" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Shared Resources Management" }),
  ).toBeVisible();

  await logout(page);
});

test("hides HR modules and blocks /hr/* routes for employee", async ({
  page,
}) => {
  await loginAs(page, "employee");

  await expect(page.getByText("HR Modules")).toHaveCount(0);
  await page.goto("/hr/reports");
  await page.waitForURL("**/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);

  await logout(page);
});
