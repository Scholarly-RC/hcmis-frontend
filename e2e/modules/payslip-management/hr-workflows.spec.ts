import { expect, test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("HR payslip management workflow loads", async ({ page }) => {
  await loginAs(page, "hr");
  await page.goto("/hr/payslips");
  await expect(
    page.getByRole("heading", { name: "Payslip Management" }),
  ).toBeVisible();
  await logout(page);
});
