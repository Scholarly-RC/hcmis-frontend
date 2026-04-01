import { expect, test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("HR leave workflow loads", async ({ page }) => {
  await loginAs(page, "hr");
  await page.goto("/leave");
  await expect(page.getByText("My Leave")).toBeVisible();
  await logout(page);
});
