import { expect, test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("HR performance workflow exposes cycle controls", async ({ page }) => {
  await loginAs(page, "hr");
  await page.goto("/performance-evaluations");
  await expect(page.getByText("Performance Evaluations")).toBeVisible();
  await expect(page.getByText("Create Evaluation Cycle")).toBeVisible();
  await logout(page);
});
