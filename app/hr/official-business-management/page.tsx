import { redirect } from "next/navigation";
import { getDashboardSession } from "@/app/dashboard/_components/dashboard-page-frame";
import { SpecialRequestManagementClient } from "@/app/hr/special-request-management/_components/special-request-management-client";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchBackendJsonWithAuth } from "@/lib/backend-server";
import type { OfficialBusinessRequestRecord } from "@/lib/special-requests";
import type { AuthDepartment, AuthUser } from "@/types/auth";

export const metadata = {
  title: "Official Business Management",
  description: "Review, approve, and track official business requests",
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

export default async function OfficialBusinessManagementPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const session = await getDashboardSession();

  if (!session.isHr) {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};

  const status = firstValue(params.status).toUpperCase();
  const month = parseMonth(firstValue(params.month));
  const year = parsePositiveInteger(firstValue(params.year));
  const userId = firstValue(params.user_id).trim();
  const departmentId = parsePositiveInteger(firstValue(params.department_id));

  const requestSearch = new URLSearchParams({
    scope: "all",
  });

  if (userId.length > 0) {
    requestSearch.set("user_id", userId);
  }
  if (
    status === "PENDING" ||
    status === "APPROVED" ||
    status === "REJECTED" ||
    status === "CANCELLED"
  ) {
    requestSearch.set("status", status);
  }
  if (month !== null) {
    requestSearch.set("month", month.toString());
  }
  if (year !== null) {
    requestSearch.set("year", year.toString());
  }
  if (departmentId !== null) {
    requestSearch.set("department_id", departmentId.toString());
  }

  let requests: OfficialBusinessRequestRecord[] = [];
  let departments: AuthDepartment[] = [];
  let approvers: AuthUser[] = [];
  let loadError: string | null = null;

  try {
    const [requestsResponse, departmentResponse, userResponse] =
      await Promise.all([
        fetchBackendJsonWithAuth<OfficialBusinessRequestRecord[]>({
          token: session.token,
          pathname: `/special-requests/official-business?${requestSearch.toString()}`,
          fallbackMessage: "Unable to load official business data.",
        }),
        fetchBackendJsonWithAuth<AuthDepartment[]>({
          token: session.token,
          pathname: "/departments",
          fallbackMessage: "Unable to load official business data.",
        }),
        fetchBackendJsonWithAuth<AuthUser[]>({
          token: session.token,
          pathname: "/users?active_only=true&include_superusers=true",
          fallbackMessage: "Unable to load official business data.",
        }),
      ]);

    requests = requestsResponse;
    departments = departmentResponse;
    approvers = userResponse
      .filter((user) => user.is_active)
      .sort((a, b) => buildDisplayName(a).localeCompare(buildDisplayName(b)));
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Unable to load official business data.";
  }

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    new Set([
      currentYear,
      ...requests.map((request) =>
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
              <CardTitle>Unable to load official business data</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {loadError}
            </CardContent>
          </Card>
        ) : (
          <SpecialRequestManagementClient
            kind="official_business"
            title="Official Business Management"
            description="Review official business requests across teams from one workspace."
            initialRequests={requests}
            departments={departments}
            approvers={approvers}
            currentUserId={session.user.id}
            isStaff={session.isHr}
            filters={{
              userId: userId || "all",
              status:
                status === "PENDING" ||
                status === "APPROVED" ||
                status === "REJECTED" ||
                status === "CANCELLED"
                  ? status
                  : "all",
              month: month !== null ? month.toString() : "all",
              year: year !== null ? year.toString() : "all",
              departmentId:
                departmentId !== null ? departmentId.toString() : "all",
            }}
            yearOptions={yearOptions}
          />
        )}
      </div>
    </DashboardShell>
  );
}
