import { expect, test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("HR user attendance management workflow loads", async ({ page }) => {
  await loginAs(page, "hr");
  await page.goto("/hr/user-attendance-management");
  await expect(
    page.getByRole("heading", { name: "User Attendance Management" }),
  ).toBeVisible();
  await expect(
    page.getByText("Filters", { exact: true }).first(),
  ).toBeVisible();
  await logout(page);
});
