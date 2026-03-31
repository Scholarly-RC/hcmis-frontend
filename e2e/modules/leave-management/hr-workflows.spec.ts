import { expect, test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("HR leave management workflow loads", async ({ page }) => {
  await loginAs(page, "hr");
  await page.goto("/hr/leave-management");
  await expect(
    page.getByRole("heading", { name: "Leave Management" }),
  ).toBeVisible();
  await expect(page.getByText("Request Monitor")).toBeVisible();
  await logout(page);
});
