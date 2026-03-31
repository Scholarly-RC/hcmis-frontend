import { expect, test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("HR user management workflow loads", async ({ page }) => {
  await loginAs(page, "hr");
  await page.goto("/hr/users");
  await expect(
    page.getByRole("heading", { name: "User Management" }),
  ).toBeVisible();
  await logout(page);
});
