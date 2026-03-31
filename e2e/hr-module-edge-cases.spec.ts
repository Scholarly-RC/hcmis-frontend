import { expect, test } from "@playwright/test";
import { loginAs, logout } from "./helpers/auth";

test("reports page can run multiple report actions", async ({ page }) => {
  await loginAs(page, "hr");

  await page.goto("/hr/reports");
  await expect(
    page.getByRole("heading", { name: "Reports and Analytics" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Daily Staffing" }).click();
  await expect(page.locator("pre")).not.toContainText("No report output yet.");

  await page.getByRole("button", { name: "Yearly Payroll Expense" }).click();
  await expect(page.locator("pre")).toContainText("selected_year");

  await logout(page);
});

test("app logs filters can produce empty-state rows", async ({ page }) => {
  await loginAs(page, "hr");

  await page.goto("/hr/app-logs");
  await page.getByLabel("User ID (optional)", { exact: true }).fill("999999");
  await page.getByRole("button", { name: "Apply Filters" }).click();

  await expect(
    page.getByText("No logs found for the selected filters."),
  ).toBeVisible();

  await logout(page);
});

test("shared resources requires file before upload", async ({ page }) => {
  await loginAs(page, "hr");

  await page.goto("/hr/shared-resources");
  await page.getByRole("button", { name: /^upload$/i }).click();

  await expect(page.getByText("Please select a file to upload.")).toBeVisible();

  await logout(page);
});

test("shared resources search can show empty results", async ({ page }) => {
  await loginAs(page, "hr");

  await page.goto("/hr/shared-resources");
  await page
    .getByPlaceholder("Search resources", { exact: true })
    .fill(`no-match-${Date.now()}`);
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page.getByText("No resources found.")).toBeVisible();

  await logout(page);
});
