import { CalendarDays } from "lucide-react";
import { redirect } from "next/navigation";

import { getDashboardSession } from "@/app/dashboard/_components/dashboard-page-frame";
import { HolidayManagementClient } from "@/app/hr/holiday-management/_components/holiday-management-client";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AttendanceHoliday } from "@/lib/attendance";
import { fetchBackendJsonWithAuth } from "@/lib/backend-server";

export const metadata = {
  title: "Holiday Management",
  description: "Register and maintain attendance holidays for HR operations.",
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

function parseYear(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 1900 ? parsed : fallback;
}

export default async function HolidayManagementPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const session = await getDashboardSession();

  if (!session.isHr) {
    redirect("/dashboard");
  }

  const currentYear = new Date().getFullYear();
  const params = (await searchParams) ?? {};
  const year = parseYear(firstValue(params.year), currentYear);

  let holidays: AttendanceHoliday[] = [];
  let loadError: string | null = null;

  try {
    holidays = await fetchBackendJsonWithAuth<AttendanceHoliday[]>({
      token: session.token,
      pathname: `/attendance/holidays?year=${year}`,
      fallbackMessage: "Unable to load holidays.",
    });
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Unable to load holidays.";
  }

  return (
    <DashboardShell
      user={session.user}
      displayName={session.displayName}
      isHr={session.isHr}
    >
      <div className="flex w-full flex-col gap-6">
        <section>
          <div className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-lg shadow-black/5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground">
                <CalendarDays className="size-5" />
              </div>
              <div className="space-y-2">
                <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
                  Holiday Management
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  Manually register recurring and year-specific holidays used by
                  attendance review and downstream payroll logic.
                </p>
              </div>
            </div>
          </div>
        </section>

        {loadError ? (
          <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle>Unable To Load Holiday Data</CardTitle>
              <CardDescription>{loadError}</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <HolidayManagementClient
            initialYear={year}
            initialHolidays={holidays}
          />
        )}
      </div>
    </DashboardShell>
  );
}
