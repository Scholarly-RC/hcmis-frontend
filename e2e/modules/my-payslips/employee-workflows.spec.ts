import { expect, test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("Employee payslip workflow loads", async ({ page }) => {
  await loginAs(page, "employee");
  await page.goto("/dashboard/my-payslips");
  await expect(page.getByText("My Payslips")).toBeVisible();
  await logout(page);
});
