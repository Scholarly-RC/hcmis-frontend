import { expect, test } from "@playwright/test";
import { loginAs, logout } from "./helpers/auth";

test("proxy endpoints require authentication when session is missing", async ({
  page,
}) => {
  const appLogsResponse = await page.request.get(
    `/api/app-logs?selected_date=${new Date().toISOString().slice(0, 10)}`,
  );
  expect(appLogsResponse.status()).toBe(401);

  const reportsResponse = await page.request.get("/api/reports/catalog");
  expect(reportsResponse.status()).toBe(401);

  const sharedResourcesUpload = await page.request.post(
    "/api/performance/shared-resources/upload",
    {
      multipart: {
        uploaded_file: {
          name: "unauth.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("unauthenticated upload"),
        },
      },
    },
  );
  expect(sharedResourcesUpload.status()).toBe(401);
});

test("employee cannot access app logs page", async ({ page }) => {
  await loginAs(page, "employee");

  await page.goto("/hr/app-logs");
  await page.waitForURL("**/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);

  await logout(page);
});
