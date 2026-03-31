import { expect, test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("Employee leave workflow loads", async ({ page }) => {
  await loginAs(page, "employee");
  await page.goto("/dashboard/leave");
  await expect(page.getByText("My Leave")).toBeVisible();
  await expect(page.getByText("Create Leave Request")).toBeVisible();
  await logout(page);
});
