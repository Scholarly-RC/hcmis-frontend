import { redirect } from "next/navigation";
import { getDashboardSession } from "@/app/dashboard/_components/dashboard-page-frame";
import { DashboardShell } from "@/components/dashboard-shell";
import { buildBackendUrl, readBackendJson } from "@/lib/backend";

import {
  type DepartmentShiftPolicy,
  type DepartmentSummary,
  ShiftManagementClient,
  type ShiftTemplateRecord,
} from "./_components/shift-management-client";

export const metadata = {
  title: "Shift Management",
  description: "Configure shift templates and department schedules",
};

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
    throw new Error(payload?.detail ?? "Unable to load shift management data.");
  }

  if (!payload) {
    throw new Error("Unable to load shift management data.");
  }

  return payload as T;
}

export default async function ShiftManagementPage() {
  const session = await getDashboardSession();

  if (!session.isHr && !session.user.is_superuser) {
    redirect("/dashboard");
  }

  let departments: DepartmentSummary[] = [];
  let shiftTemplates: ShiftTemplateRecord[] = [];
  let initialDepartmentShiftPolicy: DepartmentShiftPolicy | null = null;
  let loadError: string | null = null;

  try {
    const [departmentResponse, shiftResponse] = await Promise.all([
      fetchBackendJson<DepartmentSummary[]>(session.token, "/departments"),
      fetchBackendJson<ShiftTemplateRecord[]>(
        session.token,
        "/attendance/shift-templates",
      ),
    ]);

    departments = departmentResponse;
    shiftTemplates = shiftResponse;

    const selectedDepartment =
      departments.find((department) => department.is_active) ??
      departments[0] ??
      null;

    if (selectedDepartment) {
      try {
        initialDepartmentShiftPolicy =
          await fetchBackendJson<DepartmentShiftPolicy>(
            session.token,
            `/attendance/departments/${selectedDepartment.id}/shift-policy`,
          );
      } catch {
        initialDepartmentShiftPolicy = null;
      }
    }
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Unable to load shift data.";
  }

  return (
    <DashboardShell
      user={session.user}
      displayName={session.displayName}
      isHr={session.isHr}
    >
      {loadError ? (
        <div className="w-full">
          <div className="rounded-2xl border border-border/70 bg-card/85 p-6 shadow-lg shadow-black/5">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
              Shift Management
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {loadError}
            </p>
          </div>
        </div>
      ) : (
        <ShiftManagementClient
          departments={departments}
          shiftTemplates={shiftTemplates}
          initialDepartmentId={
            initialDepartmentShiftPolicy?.id.toString() ??
            departments
              .find((department) => department.is_active)
              ?.id.toString() ??
            departments[0]?.id.toString() ??
            ""
          }
          initialDepartmentShiftPolicy={initialDepartmentShiftPolicy}
        />
      )}
    </DashboardShell>
  );
}
