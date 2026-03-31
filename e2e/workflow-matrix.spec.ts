import { expect, test } from "@playwright/test";
import { loginAs, logout } from "./helpers/auth";

const hrWorkflowPages: Array<{ route: string; marker: string | RegExp }> = [
  { route: "/hr/users", marker: "User Management" },
  { route: "/hr/shift-management", marker: "Shift Management" },
  {
    route: "/hr/user-attendance-management",
    marker: "User Attendance Management",
  },
  { route: "/hr/overtime-management", marker: "Overtime Management" },
  { route: "/hr/leave-management", marker: "Leave Management" },
  { route: "/hr/salary-structure", marker: "Salary Structure" },
  { route: "/hr/payslips", marker: "Payslip Management" },
  { route: "/hr/payroll-settings", marker: "Payroll Settings" },
  { route: "/hr/reports", marker: "Reports and Analytics" },
  { route: "/hr/app-logs", marker: "App Logs" },
  { route: "/hr/shared-resources", marker: "Shared Resources Management" },
  {
    route: "/dashboard/performance-evaluations",
    marker: "Performance Evaluations",
  },
  {
    route: "/dashboard/announcements-and-polls",
    marker: "Announcements and Polls",
  },
];

const employeeWorkflowPages: Array<{ route: string; marker: string | RegExp }> =
  [
    { route: "/dashboard/leave", marker: "My Leave" },
    { route: "/dashboard/my-payslips", marker: "My Payslips" },
    {
      route: "/dashboard/performance-evaluations",
      marker: "Performance Evaluations",
    },
    {
      route: "/dashboard/announcements-and-polls",
      marker: "Announcements and Polls",
    },
    { route: "/profile", marker: "Profile details" },
  ];

test("HR workflow pages are reachable with core workflow markers", async ({
  page,
}) => {
  await loginAs(page, "hr");

  for (const item of hrWorkflowPages) {
    await page.goto(item.route);
    await expect(page).toHaveURL(new RegExp(`${item.route}`));
    await expect(
      page.getByText(item.marker, { exact: true }).first(),
    ).toBeVisible();
  }

  await logout(page);
});

test("employee workflow pages are reachable with core workflow markers", async ({
  page,
}) => {
  await loginAs(page, "employee");

  for (const item of employeeWorkflowPages) {
    await page.goto(item.route);
    await expect(page).toHaveURL(new RegExp(`${item.route}`));
    await expect(
      page.getByText(item.marker, { exact: true }).first(),
    ).toBeVisible();
  }

  await logout(page);
});

test("attendance management workflow supports tab transitions", async ({
  page,
}) => {
  await loginAs(page, "hr");

  await page.goto("/hr/user-attendance-management");
  await expect(
    page.getByRole("heading", { name: "User Attendance Management" }),
  ).toBeVisible();

  await page.goto("/hr/user-attendance-management?tab=monthly");
  await expect(page).toHaveURL(/tab=monthly/);

  await page.goto("/hr/user-attendance-management?tab=shifts");
  await expect(page).toHaveURL(/tab=shifts/);
  await expect(page.getByText("Employee Shift Assignments")).toBeVisible();

  await logout(page);
});

test("performance evaluations shows staff cycle controls and hides them for employee", async ({
  page,
}) => {
  await loginAs(page, "hr");

  await page.goto("/dashboard/performance-evaluations");
  await expect(page.getByText("Performance Evaluations")).toBeVisible();
  await expect(page.getByText("Create Evaluation Cycle")).toBeVisible();
  await logout(page);

  await loginAs(page, "employee");
  await page.goto("/dashboard/performance-evaluations");
  await expect(page.getByText("Performance Evaluations")).toBeVisible();
  await expect(page.getByText("Create Evaluation Cycle")).toHaveCount(0);
  await logout(page);
});

test("announcements and polls workflow supports creating drafts", async ({
  page,
}) => {
  await loginAs(page, "hr");

  await page.goto("/dashboard/announcements-and-polls");
  await expect(
    page.getByText("Announcements and Polls", { exact: true }).first(),
  ).toBeVisible();

  const suffix = `${Date.now()}`;
  const announcementTitle = `PW Announcement ${suffix}`;
  const pollQuestion = `PW Poll ${suffix}?`;

  await page.getByPlaceholder("Title", { exact: true }).fill(announcementTitle);
  await page
    .getByPlaceholder("Announcement content", { exact: true })
    .fill("Announcement draft body from Playwright.");
  await page.getByRole("button", { name: "Save Draft" }).first().click();
  await expect(page.getByText("Announcement draft created.")).toBeVisible();

  await page
    .getByPlaceholder("Poll question", { exact: true })
    .fill(pollQuestion);
  await page.getByPlaceholder("Choice 1", { exact: true }).fill("Option A");
  await page.getByPlaceholder("Choice 2", { exact: true }).fill("Option B");
  await page.getByRole("button", { name: "Save Draft" }).nth(1).click();
  await expect(page.getByText("Poll draft created.")).toBeVisible();

  await logout(page);
});

test("employee announcements and polls view has no staff authoring controls", async ({
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
