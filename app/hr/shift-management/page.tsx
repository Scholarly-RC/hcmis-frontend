import { redirect } from "next/navigation";
import { getDashboardSession } from "@/app/dashboard/_components/dashboard-page-frame";
import { DashboardShell } from "@/components/dashboard-shell";
import { fetchBackendJsonWithAuth } from "@/lib/backend-server";

import {
  ShiftManagementClient,
  type ShiftTemplateRecord,
} from "./_components/shift-management-client";

export const metadata = {
  title: "Shift Management",
  description: "Configure reusable shift templates",
};

export default async function ShiftManagementPage() {
  const session = await getDashboardSession();

  if (!session.isHr) {
    redirect("/dashboard");
  }

  let shiftTemplates: ShiftTemplateRecord[] = [];
  let loadError: string | null = null;

  try {
    shiftTemplates = await fetchBackendJsonWithAuth<ShiftTemplateRecord[]>({
      token: session.token,
      pathname: "/attendance/shift-templates",
      fallbackMessage: "Unable to load shift management data.",
    });
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
        <ShiftManagementClient shiftTemplates={shiftTemplates} />
      )}
    </DashboardShell>
  );
}
