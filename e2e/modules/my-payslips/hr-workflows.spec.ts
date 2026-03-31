import { expect, test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("HR can still access personal payslip workflow", async ({ page }) => {
  await loginAs(page, "hr");
  await page.goto("/dashboard/my-payslips");
  await expect(page.getByText("My Payslips")).toBeVisible();
  await logout(page);
});
