import { expect, test } from "@playwright/test";
import { loginAs, logout } from "./helpers/auth";

test("HR user can access reports and app logs proxy endpoints", async ({
  page,
}) => {
  await loginAs(page, "hr");

  const reportsResponse = await page
    .context()
    .request.get("/api/reports/catalog");
  expect(reportsResponse.status()).toBe(200);

  const appLogsResponse = await page
    .context()
    .request.get(
      `/api/app-logs?selected_date=${new Date().toISOString().slice(0, 10)}`,
    );
  expect(appLogsResponse.status()).toBe(200);

  const sharedResourcesResponse = await page
    .context()
    .request.get("/api/performance/shared-resources");
  expect(sharedResourcesResponse.status()).toBe(200);

  await logout(page);
});

test("employee user is blocked from HR proxy endpoints", async ({ page }) => {
  await loginAs(page, "employee");

  const appLogsResponse = await page
    .context()
    .request.get(
      `/api/app-logs?selected_date=${new Date().toISOString().slice(0, 10)}`,
    );
  expect(appLogsResponse.status()).toBe(403);

  const sharedResourcesResponse = await page
    .context()
    .request.get("/api/performance/shared-resources");
  expect(sharedResourcesResponse.status()).toBe(200);

  await logout(page);
});
