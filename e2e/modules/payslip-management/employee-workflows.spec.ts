import { test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("Employee is blocked from payslip management workflow", async ({
  page,
}) => {
  await loginAs(page, "employee");
  await page.goto("/hr/payslips");
  await page.waitForURL("**/dashboard");
  await logout(page);
});
