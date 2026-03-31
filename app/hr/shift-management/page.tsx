import { redirect } from "next/navigation";
import { getDashboardSession } from "@/app/dashboard/_components/dashboard-page-frame";
import { DashboardShell } from "@/components/dashboard-shell";
import { fetchBackendJsonWithAuth } from "@/lib/backend-server";

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

export default async function ShiftManagementPage() {
  const session = await getDashboardSession();

  if (!session.isHr) {
    redirect("/dashboard");
  }

  let departments: DepartmentSummary[] = [];
  let shiftTemplates: ShiftTemplateRecord[] = [];
  let initialDepartmentShiftPolicy: DepartmentShiftPolicy | null = null;
  let loadError: string | null = null;

  try {
    const [departmentResponse, shiftResponse] = await Promise.all([
      fetchBackendJsonWithAuth<DepartmentSummary[]>({
        token: session.token,
        pathname: "/departments",
        fallbackMessage: "Unable to load shift management data.",
      }),
      fetchBackendJsonWithAuth<ShiftTemplateRecord[]>({
        token: session.token,
        pathname: "/attendance/shift-templates",
        fallbackMessage: "Unable to load shift management data.",
      }),
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
          await fetchBackendJsonWithAuth<DepartmentShiftPolicy>({
            token: session.token,
            pathname: `/attendance/departments/${selectedDepartment.id}/shift-policy`,
            fallbackMessage: "Unable to load shift management data.",
          });
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
