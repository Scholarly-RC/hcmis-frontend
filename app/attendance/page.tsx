import Link from "next/link";
import { AttendancePeriodControls } from "@/app/attendance/_components/attendance-period-controls";
import { getDashboardSession } from "@/app/dashboard/_components/dashboard-page-frame";
import { AttendanceManagementClient } from "@/app/dashboard/user-attendance-management/_components/attendance-management-client";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MONTH_NAMES } from "@/constants/date";
import type { AttendanceSummary } from "@/lib/attendance";
import { fetchBackendJsonWithAuth } from "@/lib/backend-server";
import { cn } from "@/utils/cn";

export const metadata = {
  title: "My Attendance",
  description: "Review your attendance timeline and punch summary",
};

type SearchParams =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>;

type AttendanceTab = "today" | "monthly";

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

function parseTab(value: string): AttendanceTab {
  if (value === "monthly") {
    return value;
  }
  return "today";
}

function getMonthLabel(month: number) {
  return MONTH_NAMES[month - 1] ?? `Month ${month}`;
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const session = await getDashboardSession();
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentDay = currentDate.getDate();

  const params = (await searchParams) ?? {};
  const year = parsePositiveInteger(firstValue(params.year), currentYear);
  const month = parseMonth(firstValue(params.month), currentMonth);
  const activeTab = parseTab(firstValue(params.tab));
  const focusDay =
    year === currentYear && month === currentMonth ? currentDay : null;

  let summary: AttendanceSummary | null = null;
  let loadError: string | null = null;

  try {
    summary = await fetchBackendJsonWithAuth<AttendanceSummary>({
      token: session.token,
      pathname: `/attendance/me/${year}/${month}`,
      fallbackMessage: "Unable to load attendance data.",
    });
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Unable to load attendance data.";
  }

  const availableTabs: { key: AttendanceTab; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "monthly", label: "Monthly" },
  ];

  function buildTabHref(tab: AttendanceTab) {
    const query = new URLSearchParams({
      year: year.toString(),
      month: month.toString(),
      tab,
    });
    return `/attendance?${query.toString()}`;
  }

  return (
    <DashboardShell
      user={session.user}
      displayName={session.displayName}
      isHr={session.isHr}
    >
      <div className="flex w-full flex-col gap-6">
        <section className="rounded-2xl border border-border/70 bg-card/85 p-4 shadow-lg shadow-black/5 sm:p-5">
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
              My Attendance
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Review your daily punches, schedule alignment, and attendance
              summary.
            </p>
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
        </section>
        <AttendancePeriodControls year={year} month={month} tab={activeTab} />

        {loadError ? (
          <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle>Unable to load attendance data</CardTitle>
              <CardDescription>{loadError}</CardDescription>
            </CardHeader>
          </Card>
        ) : summary ? (
          <AttendanceManagementClient
            key={`${summary.year}-${summary.month}-${activeTab}`}
            user={session.user}
            summary={summary}
            monthLabel={getMonthLabel(month)}
            year={year}
            mode={activeTab === "today" ? "today" : "history"}
            focusDay={focusDay}
            readOnly
            referenceDate={{
              year: currentYear,
              month: currentMonth,
              day: currentDay,
            }}
          />
        ) : (
          <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle>Unable to load attendance data</CardTitle>
              <CardDescription>Try reloading the page.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
