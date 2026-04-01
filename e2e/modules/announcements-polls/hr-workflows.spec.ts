import { expect, test } from "@playwright/test";
import { loginAs, logout } from "../../helpers/auth";

test("HR announcements/polls workflow has authoring controls", async ({
  page,
}) => {
  await loginAs(page, "hr");
  await page.goto("/announcements-and-polls");
  await expect(
    page.getByText("Announcements and Polls", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "New Announcement" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "New Poll" })).toBeVisible();
  await logout(page);
});
