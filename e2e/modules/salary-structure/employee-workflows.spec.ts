import { test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("Employee is blocked from salary structure workflow", async ({ page }) => {
  await loginAs(page, "employee");
  await page.goto("/hr/salary-structure");
  await page.waitForURL("**/dashboard");
  await logout(page);
});
