import { redirect } from "next/navigation";

import { getDashboardSession } from "@/app/dashboard/_components/dashboard-page-frame";
import { AttendanceManagementClient } from "@/app/dashboard/user-attendance-management/_components/attendance-management-client";
import { AttendanceFilters } from "@/app/hr/user-attendance-management/_components/attendance-filters";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AttendanceSummary } from "@/lib/attendance";
import type { AuthUser } from "@/lib/auth";
import { buildBackendUrl, readBackendJson } from "@/lib/backend";

export const metadata = {
  title: "User Attendance Management",
  description: "Review and adjust employee attendance records for HR",
};

type SearchParams =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

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

async function fetchBackendJson<T>(
  token: string,
  pathname: string,
): Promise<T> {
  const response = await fetch(buildBackendUrl(pathname), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const payload = await readBackendJson<Partial<T> & { detail?: string }>(
    response,
  );

  if (!response.ok) {
    throw new Error(payload?.detail ?? "Unable to load attendance data.");
  }

  if (!payload) {
    throw new Error("Unable to load attendance data.");
  }

  return payload as T;
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
  const params = (await searchParams) ?? {};

  const query = firstValue(params.q).trim();
  const requestedUserIdParam = firstValue(params.user);
  const requestedUserId = Number.parseInt(firstValue(params.user), 10);
  const year = parsePositiveInteger(firstValue(params.year), currentYear);
  const month = parseMonth(firstValue(params.month), currentMonth);

  let users: AuthUser[] = [];
  let summary: AttendanceSummary | null = null;
  let selectedUser: AuthUser | null = null;
  let loadError: string | null = null;

  try {
    const queryString = new URLSearchParams({
      active_only: "true",
      exclude_hr: "true",
    });

    if (query.length > 0) {
      queryString.set("q", query);
    }

    users = await fetchBackendJson<AuthUser[]>(
      session.token,
      `/users?${queryString.toString()}`,
    );

    selectedUser =
      users.find((user) => user.id === requestedUserId) ?? users[0] ?? null;

    if (selectedUser) {
      summary = await fetchBackendJson<AttendanceSummary>(
        session.token,
        `/attendance/users/${selectedUser.id}/${year}/${month}`,
      );
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

  return (
    <DashboardShell
      user={session.user}
      displayName={displayName}
      isHr={session.isHr}
    >
      <div className="flex w-full flex-col gap-6">
        <section className="space-y-3">
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
              User Attendance Management
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Review monthly attendance, inspect daily punches, and correct
              clock-in or clock-out records for employees.
            </p>
          </div>

          <AttendanceFilters
            key={`${query}|${requestedUserIdParam}|${year}|${month}`}
            query={query}
            userId={selectedUser?.id?.toString() ?? ""}
            year={year}
            month={month}
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
          <AttendanceManagementClient
            key={`${selectedUser.id}-${summary.year}-${summary.month}`}
            user={selectedUser}
            summary={summary}
            monthLabel={getMonthLabel(month)}
            year={year}
          />
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
