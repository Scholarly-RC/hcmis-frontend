import { expect, test } from "@playwright/test";
import { loginAs, logout } from "./helpers/auth";

test("reports page runs catalog refresh", async ({ page }) => {
  await loginAs(page, "hr");

  await page.goto("/hr/reports");
  await expect(
    page.getByRole("heading", { name: "Reports and Analytics" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Refresh Catalog" }).click();
  await expect(page.locator("pre")).toContainText("catalog_modules");

  await logout(page);
});

test("app logs page loads records table", async ({ page }) => {
  await loginAs(page, "hr");

  await page.goto("/hr/app-logs");
  await expect(page.getByRole("heading", { name: "App Logs" })).toBeVisible();
  await expect(page.getByText(/Showing\s+\d+\s+log entr/i)).toBeVisible();

  await logout(page);
});

test("shared resources supports upload and delete", async ({ page }) => {
  await loginAs(page, "hr");

  await page.goto("/hr/shared-resources");
  await expect(
    page.getByRole("heading", { name: "Shared Resources Management" }),
  ).toBeVisible();

  const uniqueSuffix = `${Date.now()}`;
  const resourceName = `PW Resource ${uniqueSuffix}`;
  const fileName = `pw-resource-${uniqueSuffix}.txt`;

  await page.getByLabel("Resource name (optional)").fill(resourceName);
  await page
    .getByLabel("Description (optional)")
    .fill("Playwright upload validation file");
  await page.getByLabel("File", { exact: true }).setInputFiles({
    name: fileName,
    mimeType: "text/plain",
    buffer: Buffer.from("Playwright resource content"),
  });
  await page.getByRole("button", { name: /^upload$/i }).click();

  const row = page.locator("tr", { hasText: resourceName }).first();
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: /^delete$/i }).click();
  await expect(row).toHaveCount(0);

  await logout(page);
});
