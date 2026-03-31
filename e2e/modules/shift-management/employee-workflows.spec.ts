import { test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("Employee is blocked from shift management workflow", async ({ page }) => {
  await loginAs(page, "employee");
  await page.goto("/hr/shift-management");
  await page.waitForURL("**/dashboard");
  await logout(page);
});
