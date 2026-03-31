import { test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("Employee is blocked from app logs workflow", async ({ page }) => {
  await loginAs(page, "employee");
  await page.goto("/hr/app-logs");
  await page.waitForURL("**/dashboard");
  await logout(page);
});
