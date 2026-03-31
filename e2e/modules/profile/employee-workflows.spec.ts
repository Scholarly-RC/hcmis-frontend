import { expect, test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("Employee can access profile workflow", async ({ page }) => {
  await loginAs(page, "employee");
  await page.goto("/profile");
  await expect(page.getByText("Profile details")).toBeVisible();
  await logout(page);
});
