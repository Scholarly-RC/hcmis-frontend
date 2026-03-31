import { expect, test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("HR can access profile workflow", async ({ page }) => {
  await loginAs(page, "hr");
  await page.goto("/profile");
  await expect(page.getByText("Profile details")).toBeVisible();
  await logout(page);
});
