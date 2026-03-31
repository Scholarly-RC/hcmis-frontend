import { expect, test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("HR overtime management workflow loads", async ({ page }) => {
  await loginAs(page, "hr");
  await page.goto("/hr/overtime-management");
  await expect(
    page.getByRole("heading", { name: "Overtime Management" }),
  ).toBeVisible();
  await expect(
    page.getByText("Filters", { exact: true }).first(),
  ).toBeVisible();
  await logout(page);
});
