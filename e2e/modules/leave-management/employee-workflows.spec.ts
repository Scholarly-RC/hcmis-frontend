import { test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("Employee is blocked from leave management workflow", async ({ page }) => {
  await loginAs(page, "employee");
  await page.goto("/hr/leave-management");
  await page.waitForURL("**/dashboard");
  await logout(page);
});
