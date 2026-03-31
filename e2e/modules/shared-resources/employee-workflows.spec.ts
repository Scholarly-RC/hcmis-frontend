import { test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("Employee is blocked from shared resources HR page workflow", async ({
  page,
}) => {
  await loginAs(page, "employee");
  await page.goto("/hr/shared-resources");
  await page.waitForURL("**/dashboard");
  await logout(page);
});
