import { expect, test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("HR shift management workflow loads", async ({ page }) => {
  await loginAs(page, "hr");
  await page.goto("/hr/shift-management");
  await expect(
    page.getByRole("heading", { name: "Shift Management" }),
  ).toBeVisible();
  await expect(
    page.getByText("Shift templates", { exact: true }).first(),
  ).toBeVisible();
  await logout(page);
});
