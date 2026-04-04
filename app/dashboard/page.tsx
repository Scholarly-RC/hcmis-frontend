import { Activity, BarChart3, ClipboardList, Wallet } from "lucide-react";
import Link from "next/link";
import { getDashboardSession } from "@/app/dashboard/_components/dashboard-page-frame";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AttendanceSummary } from "@/lib/attendance";
import { fetchBackendJsonWithAuth } from "@/lib/backend-server";
import type { LeaveCredit, LeaveRequestRecord } from "@/lib/leave";
import type { PayrollPayslip } from "@/lib/payroll";
import type { FeedItemRecord } from "@/lib/performance-updates";

export const metadata = {
  title: "Dashboard",
  description: "Role-based overview of HCMIS workflows",
};

type DashboardMetric = {
  title: string;
  value: string;
  detail: string;
  icon: typeof Activity;
};

type DashboardAction = {
  label: string;
  description: string;
  href: string;
};

type DashboardTask = {
  label: string;
  detail: string;
  href: string;
};

async function tryFetch<T>(token: string, pathname: string, fallback: string) {
  try {
    return await fetchBackendJsonWithAuth<T>({
      token,
      pathname,
      fallbackMessage: fallback,
    });
  } catch {
    return null;
  }
}

function toMonthLabel(month: number | null, year: number | null) {
  if (!month || !year) {
    return "N/A";
  }
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function summarizeEmployeeDay(summary: AttendanceSummary | null, day: number) {
  const today = summary?.days.find((item) => item.day === day);
  if (!today) {
    return {
      value: "No schedule",
      detail: "No attendance schedule for today.",
    };
  }

  const punches = today.attendance_records.length;
  if (punches === 0) {
    return {
      value: "No punch yet",
      detail: "No attendance record submitted today.",
    };
  }

  return {
    value: `${punches} punch${punches === 1 ? "" : "es"}`,
    detail: "Attendance logs recorded today.",
  };
}

function buildFeedSummary(item: FeedItemRecord) {
  if (item.item_type === "announcement" && item.announcement) {
    return {
      label: item.announcement.title,
      detail: item.announcement.summary ?? "Company announcement",
      badge: "Announcement",
    };
  }

  if (item.item_type === "poll" && item.poll) {
    return {
      label: item.poll.question,
      detail: item.poll.description ?? "Team poll update",
      badge: "Poll",
    };
  }

  return {
    label: "Update",
    detail: "Recent activity update.",
    badge: "Info",
  };
}

function buildEmployeeDashboard(input: {
  leaveCredit: LeaveCredit | null;
  leaveRequests: LeaveRequestRecord[] | null;
  attendanceSummary: AttendanceSummary | null;
  payslips: PayrollPayslip[] | null;
  currentDay: number;
}): {
  metrics: DashboardMetric[];
  actions: DashboardAction[];
  tasks: DashboardTask[];
} {
  const requests = input.leaveRequests ?? [];
  const pendingLeaves = requests.filter(
    (request) => request.status === "PENDING",
  ).length;
  const approvedLeaves = requests.filter(
    (request) => request.status === "APPROVED",
  ).length;
  const attendanceToday = summarizeEmployeeDay(
    input.attendanceSummary,
    input.currentDay,
  );
  const latestPayslip = (input.payslips ?? [])[0] ?? null;

  const metrics: DashboardMetric[] = [
    {
      title: "Leave Balance",
      value: input.leaveCredit
        ? `${input.leaveCredit.remaining_credits}`
        : "--",
      detail: input.leaveCredit
        ? `${input.leaveCredit.used_credits} used credits`
        : "Leave credits unavailable",
      icon: Wallet,
    },
    {
      title: "Pending Leave Requests",
      value: pendingLeaves.toString(),
      detail: `${approvedLeaves} approved in current selection`,
      icon: ClipboardList,
    },
    {
      title: "Today's Attendance",
      value: attendanceToday.value,
      detail: attendanceToday.detail,
      icon: Activity,
    },
    {
      title: "Latest Payslip",
      value: latestPayslip?.released ? "Released" : "Not released",
      detail: latestPayslip
        ? `${toMonthLabel(latestPayslip.month, latestPayslip.year)} ${latestPayslip.period ?? ""}`.trim()
        : "No payslip record available",
      icon: BarChart3,
    },
  ];

  const actions: DashboardAction[] = [
    {
      label: "Submit or track leave",
      description: "Open leave requests, balances, and status updates.",
      href: "/leave",
    },
    {
      label: "Submit overtime request",
      description: "Create overtime requests and track approval decisions.",
      href: "/overtime",
    },
    {
      label: "View my payslips",
      description: "Check released payroll records and monthly slips.",
      href: "/my-payslips",
    },
    {
      label: "Review performance",
      description: "Open performance evaluation and participation tasks.",
      href: "/performance-evaluations",
    },
  ];

  const tasks: DashboardTask[] = [];
  if (pendingLeaves > 0) {
    tasks.push({
      label: "Pending leave follow-up",
      detail: `${pendingLeaves} leave request${pendingLeaves === 1 ? "" : "s"} awaiting approval.`,
      href: "/leave",
    });
  }
  if (latestPayslip && !latestPayslip.released) {
    tasks.push({
      label: "Payslip not yet released",
      detail: `Latest cutoff ${toMonthLabel(latestPayslip.month, latestPayslip.year)} is pending release.`,
      href: "/my-payslips",
    });
  }

  return { metrics, actions, tasks };
}

function buildHrDashboard(input: {
  reviewQueue: LeaveRequestRecord[] | null;
  pendingOvertimeCount: number;
  usersCount: number;
  unreleasedPayslipsCount: number;
}): {
  metrics: DashboardMetric[];
  actions: DashboardAction[];
  tasks: DashboardTask[];
} {
  const pendingLeaveApprovals = (input.reviewQueue ?? []).filter(
    (request) => request.status === "PENDING",
  ).length;

  const metrics: DashboardMetric[] = [
    {
      title: "Leave Approvals Queue",
      value: pendingLeaveApprovals.toString(),
      detail: "Pending leave requests assigned for review",
      icon: ClipboardList,
    },
    {
      title: "Overtime Approvals",
      value: input.pendingOvertimeCount.toString(),
      detail: "Pending overtime responses",
      icon: Activity,
    },
    {
      title: "Unreleased Payslips",
      value: input.unreleasedPayslipsCount.toString(),
      detail: "Payroll records still pending release",
      icon: Wallet,
    },
    {
      title: "Active Employees",
      value: input.usersCount.toString(),
      detail: "Currently active user accounts",
      icon: BarChart3,
    },
  ];

  const actions: DashboardAction[] = [
    {
      label: "Review leave inbox",
      description: "Prioritize pending leave requests and decisions.",
      href: "/leave/inbox",
    },
    {
      label: "Process overtime approvals",
      description: "Resolve overtime requests that need HR action.",
      href: "/hr/overtime-management",
    },
    {
      label: "Release payslips",
      description: "Continue payroll processing and release workflow.",
      href: "/hr/payslips",
    },
  ];

  const tasks: DashboardTask[] = [];
  if (pendingLeaveApprovals > 0) {
    tasks.push({
      label: "Leave approvals pending",
      detail: `${pendingLeaveApprovals} leave request${pendingLeaveApprovals === 1 ? "" : "s"} need review.`,
      href: "/leave/inbox",
    });
  }
  if (input.pendingOvertimeCount > 0) {
    tasks.push({
      label: "Overtime responses pending",
      detail: `${input.pendingOvertimeCount} overtime request${input.pendingOvertimeCount === 1 ? "" : "s"} awaiting response.`,
      href: "/hr/overtime-management",
    });
  }
  if (input.unreleasedPayslipsCount > 0) {
    tasks.push({
      label: "Payslips to release",
      detail: `${input.unreleasedPayslipsCount} payslip record${input.unreleasedPayslipsCount === 1 ? "" : "s"} are unreleased.`,
      href: "/hr/payslips",
    });
  }

  return { metrics, actions, tasks };
}

export default async function DashboardPage() {
  const session = await getDashboardSession();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const feed = await tryFetch<FeedItemRecord[]>(
    session.token,
    "/performance/feed",
    "Unable to load updates feed.",
  );

  const employeeData = session.isHr
    ? null
    : await Promise.all([
        tryFetch<LeaveCredit>(
          session.token,
          "/leave/credits/me",
          "Unable to load leave credit.",
        ),
        tryFetch<LeaveRequestRecord[]>(
          session.token,
          `/leave/requests/me?year=${currentYear}`,
          "Unable to load leave requests.",
        ),
        tryFetch<AttendanceSummary>(
          session.token,
          `/attendance/me/${currentYear}/${currentMonth}`,
          "Unable to load attendance summary.",
        ),
        tryFetch<PayrollPayslip[]>(
          session.token,
          `/payroll/payslips?user_id=${session.user.id}&released=true`,
          "Unable to load payslips.",
        ),
      ]);

  const hrData = session.isHr
    ? await Promise.all([
        tryFetch<LeaveRequestRecord[]>(
          session.token,
          "/leave/requests/review?status=PENDING",
          "Unable to load review queue.",
        ),
        tryFetch<Array<{ id: number }>>(
          session.token,
          "/attendance/overtime?scope=approvals&status=PEND",
          "Unable to load overtime queue.",
        ),
        tryFetch<Array<{ id: number }>>(
          session.token,
          "/users?active_only=true",
          "Unable to load active users.",
        ),
        tryFetch<Array<{ id: number }>>(
          session.token,
          "/payroll/payslips?released=false",
          "Unable to load unreleased payslips.",
        ),
      ])
    : null;

  const dashboard = session.isHr
    ? buildHrDashboard({
        reviewQueue: hrData?.[0] ?? null,
        pendingOvertimeCount: hrData?.[1]?.length ?? 0,
        usersCount: hrData?.[2]?.length ?? 0,
        unreleasedPayslipsCount: hrData?.[3]?.length ?? 0,
      })
    : buildEmployeeDashboard({
        leaveCredit: employeeData?.[0] ?? null,
        leaveRequests: employeeData?.[1] ?? null,
        attendanceSummary: employeeData?.[2] ?? null,
        payslips: employeeData?.[3] ?? null,
        currentDay,
      });

  return (
    <DashboardShell
      user={session.user}
      displayName={session.displayName}
      isHr={session.isHr}
    >
      <div className="flex w-full flex-col gap-8">
        <section className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            {session.isHr ? "HR Workspace Overview" : "My Workspace Overview"}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {session.isHr
              ? "Monitor approval queues, payroll progress, and team operations."
              : "Track your leave, attendance, payslips, and required actions."}
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboard.metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card
                key={metric.title}
                className="border-border/70 bg-card/85 shadow-lg shadow-black/5"
              >
                <CardContent className="flex items-start justify-between gap-4 pt-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {metric.title}
                    </p>
                    <div className="text-3xl font-semibold tracking-tight">
                      {metric.value}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {metric.detail}
                    </p>
                  </div>
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-muted text-foreground">
                    <Icon className="size-5" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
            <CardHeader className="space-y-2">
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                {session.isHr
                  ? "Top HR tasks for this cycle."
                  : "Most common tasks for your account."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.actions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="block rounded-2xl border border-border/70 bg-background/70 p-4 transition-colors hover:bg-muted/50"
                >
                  <p className="font-medium text-foreground">{action.label}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {action.description}
                  </p>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
            <CardHeader className="space-y-2">
              <CardTitle>Required Actions</CardTitle>
              <CardDescription>
                Items that likely need attention next.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.tasks.length > 0 ? (
                dashboard.tasks.map((task, index) => (
                  <div key={task.label}>
                    <Link
                      href={task.href}
                      className="block rounded-2xl border border-border/70 bg-background/70 p-4 transition-colors hover:bg-muted/50"
                    >
                      <p className="font-medium text-foreground">
                        {task.label}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {task.detail}
                      </p>
                    </Link>
                    {index < dashboard.tasks.length - 1 ? (
                      <Separator className="mt-3" />
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm leading-6 text-muted-foreground">
                  No urgent action is currently detected.
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
            <CardHeader className="space-y-2">
              <CardTitle>Recent Updates</CardTitle>
              <CardDescription>
                Latest announcements and polls from the workspace feed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(feed ?? []).slice(0, 4).map((item, index) => {
                const summary = buildFeedSummary(item);
                return (
                  <div key={`${item.item_type}-${index}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-foreground">
                        {summary.label}
                      </p>
                      <Badge variant="secondary">{summary.badge}</Badge>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {summary.detail}
                    </p>
                    {index < Math.min((feed ?? []).length, 4) - 1 ? (
                      <Separator className="mt-3" />
                    ) : null}
                  </div>
                );
              })}
              {(feed ?? []).length === 0 ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  No recent feed updates available.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardShell>
  );
}
