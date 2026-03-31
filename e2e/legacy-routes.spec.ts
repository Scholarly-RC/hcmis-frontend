import { expect, test } from "@playwright/test";
import { loginAs, logout } from "./helpers/auth";

test("deprecated dashboard/hr/users route is no longer available", async ({
  page,
}) => {
  await loginAs(page, "hr");

  await page.goto("/dashboard/hr/users");
  await expect(page.getByText("This page could not be found.")).toBeVisible();

  await logout(page);
});

test("deprecated dashboard/user-attendance-management route is gone", async ({
  page,
}) => {
  await loginAs(page, "hr");

  await page.goto("/dashboard/user-attendance-management");
  await expect(page.getByText("This page could not be found.")).toBeVisible();

  await logout(page);
});
