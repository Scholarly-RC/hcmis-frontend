import { expect, test } from "@playwright/test";
import { loginAs, logout } from "./helpers/auth";

test("coming-soon account modules are disabled and non-clickable", async ({
  page,
}) => {
  await loginAs(page, "employee");

  const accountModulesTrigger = page.getByRole("button", {
    name: /Account Modules/i,
  });
  await accountModulesTrigger.click();

  const attendanceSoonItem = page.locator('div[aria-disabled="true"]', {
    hasText: "Attendance",
  });
  await expect(attendanceSoonItem).toBeVisible();
  await expect(attendanceSoonItem.getByText("Soon")).toBeVisible();
  await expect(page.getByRole("link", { name: "Attendance" })).toHaveCount(0);

  await logout(page);
});
