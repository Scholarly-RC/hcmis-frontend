import { expect, test } from "@playwright/test";
import { loginAs, logout } from "./helpers/auth";

test("attendance module is available from account modules", async ({
  page,
}) => {
  await loginAs(page, "employee");

  const accountModulesTrigger = page.getByRole("button", {
    name: /Account Modules/i,
  });
  await accountModulesTrigger.click();

  const attendanceLink = page.getByRole("link", { name: "My Attendance" });
  await expect(attendanceLink).toBeVisible();
  await attendanceLink.click();
  await expect(page).toHaveURL(/\/attendance/);
  await expect(
    page.getByRole("heading", { name: "My Attendance" }),
  ).toBeVisible();

  await logout(page);
});
