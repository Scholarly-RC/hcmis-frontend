import { expect, test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("HR can open dashboard home", async ({ page }) => {
  await loginAs(page, "hr");
  await page.goto("/dashboard");
  await expect(page.getByText("Quick Actions")).toBeVisible();
  await logout(page);
});
