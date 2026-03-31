import { expect, test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("Employee announcements/polls workflow hides authoring controls", async ({
  page,
}) => {
  await loginAs(page, "employee");
  await page.goto("/dashboard/announcements-and-polls");
  await expect(
    page.getByText("Announcements and Polls", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("Create Announcement")).toHaveCount(0);
  await expect(page.getByText("Create Poll")).toHaveCount(0);
  await logout(page);
});
