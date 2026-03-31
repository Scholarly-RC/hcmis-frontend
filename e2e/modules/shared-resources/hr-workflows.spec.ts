import { expect, test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("HR shared resources workflow loads", async ({ page }) => {
  await loginAs(page, "hr");
  await page.goto("/hr/shared-resources");
  await expect(
    page.getByRole("heading", { name: "Shared Resources Management" }),
  ).toBeVisible();
  await expect(page.getByText("Upload Resource")).toBeVisible();
  await logout(page);
});
