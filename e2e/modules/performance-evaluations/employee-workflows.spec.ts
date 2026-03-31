import { expect, test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("Employee performance workflow hides staff-only controls", async ({ page }) => {
  await loginAs(page, "employee");
  await page.goto("/dashboard/performance-evaluations");
  await expect(page.getByText("Performance Evaluations")).toBeVisible();
  await expect(page.getByText("Create Evaluation Cycle")).toHaveCount(0);
  await logout(page);
});
