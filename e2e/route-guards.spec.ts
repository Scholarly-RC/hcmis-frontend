import { expect, test } from "@playwright/test";
import { loginAs, logout } from "./helpers/auth";

const hrRoutes = [
  "/hr/users",
  "/hr/shift-management",
  "/hr/user-attendance-management",
  "/hr/overtime-management",
  "/hr/leave-management",
  "/hr/payslips",
  "/hr/payroll-settings",
  "/hr/salary-structure",
  "/hr/reports",
  "/hr/app-logs",
  "/hr/shared-resources",
] as const;

test("employee is redirected away from all primary HR routes", async ({
  page,
}) => {
  await loginAs(page, "employee");

  for (const route of hrRoutes) {
    await page.goto(route);
    await page.waitForURL("**/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);
  }

  await logout(page);
});

test("HR user can open all primary HR routes", async ({ page }) => {
  await loginAs(page, "hr");

  for (const route of hrRoutes) {
    await page.goto(route);
    await expect(page).toHaveURL(new RegExp(`${route}$`));
  }

  await logout(page);
});
