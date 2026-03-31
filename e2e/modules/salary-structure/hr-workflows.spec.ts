import { expect, test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("HR salary structure workflow loads", async ({ page }) => {
  await loginAs(page, "hr");
  await page.goto("/hr/salary-structure");
  await expect(page.getByText("Salary Structure")).toBeVisible();
  await logout(page);
});
