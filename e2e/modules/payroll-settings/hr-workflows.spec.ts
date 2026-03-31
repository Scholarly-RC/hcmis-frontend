import { expect, test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("HR payroll settings workflow loads", async ({ page }) => {
  await loginAs(page, "hr");
  await page.goto("/hr/payroll-settings");
  await expect(
    page.getByText("Payroll Settings", { exact: true }).first(),
  ).toBeVisible();
  await logout(page);
});
