import { test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("Employee is blocked from reports and analytics workflow", async ({
  page,
}) => {
  await loginAs(page, "employee");
  await page.goto("/hr/reports");
  await page.waitForURL("**/dashboard");
  await logout(page);
});
