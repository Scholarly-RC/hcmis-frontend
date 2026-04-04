import { redirect } from "next/navigation";
import { getDashboardSession } from "@/app/dashboard/_components/dashboard-page-frame";
import { OvertimeManagementClient } from "@/app/hr/overtime-management/_components/overtime-management-client";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  OvertimeRequestRecord,
  OvertimeRequestScope,
} from "@/lib/attendance";
import { fetchBackendJsonWithAuth } from "@/lib/backend-server";
import type { AuthUser } from "@/types/auth";

export const metadata = {
  title: "Overtime Management",
  description: "Review, approve, and track overtime requests",
};

type SearchParams =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>;

type DepartmentOption = {
  id: number;
  name: string;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function parseScope(value: string): OvertimeRequestScope {
  if (value === "all" || value === "mine") {
    return value;
  }
  return "approvals";
}

function parsePositiveInteger(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseMonth(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 12 ? parsed : null;
}

function buildDisplayName(user: AuthUser) {
  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || user.email;
}

export default async function OvertimeManagementPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const session = await getDashboardSession();

  if (!session.isHr) {
    redirect("/dashboard");
  }

  const isStaff = session.isHr;
  const params = (await searchParams) ?? {};

  const scope = parseScope(firstValue(params.scope));
  const query = firstValue(params.q).trim();
  const status = firstValue(params.status).toUpperCase();
  const month = parseMonth(firstValue(params.month));
  const year = parsePositiveInteger(firstValue(params.year));
  const departmentId = parsePositiveInteger(firstValue(params.department_id));
  const approverId = firstValue(params.approver_id).trim();

  const overtimeSearch = new URLSearchParams({
    scope,
  });

  if (query.length > 0) {
    overtimeSearch.set("q", query);
  }
  if (status === "PEND" || status === "APP" || status === "REJ") {
    overtimeSearch.set("status", status);
  }
  if (month !== null) {
    overtimeSearch.set("month", month.toString());
  }
  if (year !== null) {
    overtimeSearch.set("year", year.toString());
  }
  if (departmentId !== null) {
    overtimeSearch.set("department_id", departmentId.toString());
  }
  if (approverId.length > 0) {
    overtimeSearch.set("approver_id", approverId);
  }

  let overtimeRequests: OvertimeRequestRecord[] = [];
  let departments: DepartmentOption[] = [];
  let approvers: { id: string; name: string }[] = [];
  let loadError: string | null = null;

  try {
    const [overtimeResponse, departmentResponse, userResponse] =
      await Promise.all([
        fetchBackendJsonWithAuth<OvertimeRequestRecord[]>({
          token: session.token,
          pathname: `/attendance/overtime?${overtimeSearch.toString()}`,
          fallbackMessage: "Unable to load overtime data.",
        }),
        fetchBackendJsonWithAuth<DepartmentOption[]>({
          token: session.token,
          pathname: "/departments",
          fallbackMessage: "Unable to load overtime data.",
        }),
        fetchBackendJsonWithAuth<AuthUser[]>({
          token: session.token,
          pathname: "/users?active_only=true&include_superusers=true",
          fallbackMessage: "Unable to load overtime data.",
        }),
      ]);

    overtimeRequests = overtimeResponse;
    departments = departmentResponse;
    approvers = userResponse
      .filter((user) => user.is_active)
      .map((user) => ({
        id: user.id,
        name: buildDisplayName(user),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Unable to load overtime data.";
  }

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    new Set([
      currentYear,
      ...overtimeRequests.map((request) =>
        Number.parseInt(request.date.slice(0, 4), 10),
      ),
    ]),
  )
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a);

  return (
    <DashboardShell
      user={session.user}
      displayName={session.displayName}
      isHr={session.isHr}
    >
      <div className="w-full">
        {loadError ? (
          <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle>Unable to load overtime data</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {loadError}
            </CardContent>
          </Card>
        ) : (
          <OvertimeManagementClient
            initialRequests={overtimeRequests}
            departments={departments}
            approvers={approvers}
            currentUserId={session.user.id}
            isStaff={isStaff}
            filters={{
              scope,
              query,
              status:
                status === "PEND" || status === "APP" || status === "REJ"
                  ? status
                  : "all",
              month: month !== null ? month.toString() : "all",
              year: year !== null ? year.toString() : "all",
              departmentId:
                departmentId !== null ? departmentId.toString() : "all",
              approverId: approverId || "all",
            }}
            yearOptions={yearOptions}
          />
        )}
      </div>
    </DashboardShell>
  );
}
