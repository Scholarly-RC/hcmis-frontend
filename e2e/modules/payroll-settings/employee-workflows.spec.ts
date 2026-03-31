import { test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("Employee is blocked from payroll settings workflow", async ({ page }) => {
  await loginAs(page, "employee");
  await page.goto("/hr/payroll-settings");
  await page.waitForURL("**/dashboard");
  await logout(page);
});
