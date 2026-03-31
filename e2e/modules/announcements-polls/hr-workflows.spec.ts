import { expect, test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("HR announcements/polls workflow has authoring controls", async ({
  page,
}) => {
  await loginAs(page, "hr");
  await page.goto("/dashboard/announcements-and-polls");
  await expect(
    page.getByText("Announcements and Polls", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("Create Announcement")).toBeVisible();
  await expect(page.getByText("Create Poll")).toBeVisible();
  await logout(page);
});
