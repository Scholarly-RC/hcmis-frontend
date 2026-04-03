import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardSession } from "@/app/dashboard/_components/dashboard-page-frame";
import { AttendanceManagementClient } from "@/app/dashboard/user-attendance-management/_components/attendance-management-client";
import type { DepartmentShiftPolicy } from "@/app/hr/shift-management/_components/shift-management-client";
import { AssignmentCalendarModal } from "@/app/hr/user-attendance-management/_components/assignment-calendar-modal";
import { AttendanceFilters } from "@/app/hr/user-attendance-management/_components/attendance-filters";
import { ShiftAssignmentManager } from "@/app/hr/user-attendance-management/_components/shift-assignment-manager";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MONTH_NAMES } from "@/constants/date";
import type { AttendanceSummary } from "@/lib/attendance";
import { fetchBackendJsonWithAuth } from "@/lib/backend-server";
import type { AuthUser } from "@/types/auth";
import { cn } from "@/utils/cn";

export const metadata = {
  title: "User Attendance Management",
  description: "Review and adjust employee attendance records for HR",
};

type SearchParams =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function parsePositiveInteger(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseMonth(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 12
    ? parsed
    : fallback;
}

function getMonthLabel(month: number) {
  return MONTH_NAMES[month - 1] ?? `Month ${month}`;
}

function buildDisplayName(user: AuthUser) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
}

function buildUserLabel(user: AuthUser) {
  const name = buildDisplayName(user) || user.email;
  const department = user.department
    ? `${user.department.name} Department`
    : "No department";
  const role = user.role?.trim() || "Employee";

  return `${name} - ${department} - ${role}`;
}

type AttendanceTab = "today" | "monthly" | "shifts";

function parseTab(value: string): AttendanceTab {
  if (value === "monthly" || value === "shifts") {
    return value;
  }
  if (value === "history") {
    return "monthly";
  }
  return "today";
}

export default async function UserAttendanceManagementPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const session = await getDashboardSession();

  if (!session.isHr) {
    redirect("/dashboard");
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentDay = currentDate.getDate();
  const params = (await searchParams) ?? {};

  const query = firstValue(params.q).trim();
  const requestedUserIdParam = firstValue(params.user);
  const requestedUserId = Number.parseInt(firstValue(params.user), 10);
  const year = parsePositiveInteger(firstValue(params.year), currentYear);
  const month = parseMonth(firstValue(params.month), currentMonth);
  const activeTab = parseTab(firstValue(params.tab));
  const focusDay =
    year === currentYear && month === currentMonth ? currentDay : null;

  let users: AuthUser[] = [];
  let summary: AttendanceSummary | null = null;
  let selectedUser: AuthUser | null = null;
  let departmentShiftPolicy: DepartmentShiftPolicy | null = null;
  let loadError: string | null = null;

  try {
    const queryString = new URLSearchParams({
      active_only: "true",
      exclude_hr: "true",
    });

    if (query.length > 0) {
      queryString.set("q", query);
    }

    users = await fetchBackendJsonWithAuth<AuthUser[]>({
      token: session.token,
      pathname: `/users?${queryString.toString()}`,
      fallbackMessage: "Unable to load attendance data.",
    });

    selectedUser =
      users.find((user) => user.id === requestedUserId) ?? users[0] ?? null;

    if (selectedUser) {
      const [summaryResponse, shiftPolicyResponse] = await Promise.all([
        fetchBackendJsonWithAuth<AttendanceSummary>({
          token: session.token,
          pathname: `/attendance/users/${selectedUser.id}/${year}/${month}`,
          fallbackMessage: "Unable to load attendance data.",
        }),
        selectedUser.department_id
          ? fetchBackendJsonWithAuth<DepartmentShiftPolicy>({
              token: session.token,
              pathname: `/attendance/departments/${selectedUser.department_id}/shift-policy`,
              fallbackMessage: "Unable to load attendance data.",
            }).catch(() => null)
          : Promise.resolve(null),
      ]);

      summary = summaryResponse;
      departmentShiftPolicy = shiftPolicyResponse;
    }
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Unable to load attendance data.";
  }

  const displayName = session.displayName;
  const employeeOptions = users.map((user) => ({
    id: user.id,
    label: buildUserLabel(user),
  }));
  const availableTabs: { key: AttendanceTab; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "monthly", label: "Monthly" },
    { key: "shifts", label: "Shift Assignments" },
  ];

  function buildTabHref(tab: AttendanceTab) {
    const search = new URLSearchParams();
    if (query.length > 0) {
      search.set("q", query);
    }
    if (selectedUser?.id) {
      search.set("user", selectedUser.id.toString());
    }
    search.set("year", year.toString());
    search.set("month", month.toString());
    search.set("tab", tab);
    return `/hr/user-attendance-management?${search.toString()}`;
  }

  return (
    <DashboardShell
      user={session.user}
      displayName={displayName}
      isHr={session.isHr}
    >
      <div className="flex w-full flex-col gap-6">
        <section className="space-y-3">
          <div className="rounded-2xl border border-border/70 bg-card/85 p-4 shadow-lg shadow-black/5 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
                  User Attendance Management
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  Review daily punches, resolve corrections, and manage monthly
                  attendance workflows with fewer on-screen actions.
                </p>
              </div>
              <AssignmentCalendarModal
                initialYear={year}
                initialMonth={month}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {availableTabs.map((tab) => (
                <Button
                  key={tab.key}
                  asChild
                  type="button"
                  variant={activeTab === tab.key ? "default" : "outline"}
                  className={cn(
                    "h-9",
                    activeTab === tab.key ? "shadow-sm" : "bg-background",
                  )}
                >
                  <Link href={buildTabHref(tab.key)}>{tab.label}</Link>
                </Button>
              ))}
            </div>
          </div>

          <AttendanceFilters
            key={`${query}|${requestedUserIdParam}|${year}|${month}`}
            query={query}
            userId={selectedUser?.id?.toString() ?? ""}
            year={year}
            month={month}
            tab={activeTab}
            employees={employeeOptions}
          />
        </section>

        {loadError ? (
          <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle>Unable to load attendance data</CardTitle>
              <CardDescription>{loadError}</CardDescription>
            </CardHeader>
          </Card>
        ) : selectedUser && summary ? (
          <>
            {activeTab === "shifts" ? (
              <ShiftAssignmentManager
                key={`assign-${selectedUser.id}-${summary.year}-${summary.month}`}
                user={selectedUser}
                summary={summary}
                departmentShiftPolicy={departmentShiftPolicy}
              />
            ) : null}
            {activeTab !== "shifts" ? (
              <AttendanceManagementClient
                key={`${selectedUser.id}-${summary.year}-${summary.month}-${activeTab}`}
                user={selectedUser}
                summary={summary}
                monthLabel={getMonthLabel(month)}
                year={year}
                mode={activeTab === "today" ? "today" : "history"}
                focusDay={focusDay}
                referenceDate={{
                  year: currentYear,
                  month: currentMonth,
                  day: currentDay,
                }}
              />
            ) : null}
          </>
        ) : (
          <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle>No employee selected</CardTitle>
              <CardDescription>
                Use the filters above to choose an employee and load the monthly
                attendance view.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              HR-only attendance management is limited to active non-HR users.
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
