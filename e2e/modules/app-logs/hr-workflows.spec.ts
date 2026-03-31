import { expect, test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("HR app logs workflow loads", async ({ page }) => {
  await loginAs(page, "hr");
  await page.goto("/hr/app-logs");
  await expect(page.getByRole("heading", { name: "App Logs" })).toBeVisible();
  await expect(page.getByText(/Showing\s+\d+\s+log entr/i)).toBeVisible();
  await logout(page);
});
