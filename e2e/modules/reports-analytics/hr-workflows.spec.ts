import { expect, test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("HR reports and analytics workflow loads", async ({ page }) => {
  await loginAs(page, "hr");
  await page.goto("/hr/reports");
  await expect(
    page.getByRole("heading", { name: "Reports and Analytics" }),
  ).toBeVisible();
  await expect(page.getByText("Report Controls")).toBeVisible();
  await logout(page);
});
