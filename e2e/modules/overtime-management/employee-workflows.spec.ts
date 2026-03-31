import { test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("Employee is blocked from overtime management workflow", async ({
  page,
}) => {
  await loginAs(page, "employee");
  await page.goto("/hr/overtime-management");
  await page.waitForURL("**/dashboard");
  await logout(page);
});
