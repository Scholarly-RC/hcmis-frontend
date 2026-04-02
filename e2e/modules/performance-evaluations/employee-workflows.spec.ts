import { expect, test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("Employee performance workflow hides staff-only controls", async ({
  page,
}) => {
  await loginAs(page, "employee");
  await page.goto("/performance-evaluations");
  await expect(page.getByText("Performance Evaluations")).toBeVisible();
  await expect(page.getByRole("button", { name: "New Cycle" })).toHaveCount(0);
  await logout(page);
});
