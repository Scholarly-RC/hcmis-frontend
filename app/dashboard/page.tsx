import {
  Activity,
  ArrowRight,
  BarChart3,
  ClipboardList,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
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
import type {
  AttendanceSummary,
  OvertimeRequestRecord,
} from "@/lib/attendance";
import { fetchBackendJsonWithAuth } from "@/lib/backend-server";
import type { LeaveCredit, LeaveRequestRecord } from "@/lib/leave";
import type { PayrollPayslip } from "@/lib/payroll";
import type { FeedItemRecord } from "@/lib/performance-updates";
import type {
  CertificateAttendanceRequestRecord,
  OfficialBusinessRequestRecord,
} from "@/lib/special-requests";

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

function DashboardMetricCard({ metric }: { metric: DashboardMetric }) {
  const Icon = metric.icon;

  return (
    <div className="flex h-full min-h-36 flex-col bg-background/95 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 shrink-0 text-muted-foreground" />
        <p className="text-[13px] leading-5 text-muted-foreground">
          {metric.title}
        </p>
      </div>
      <div className="mt-4 flex-1">
        <p className="max-w-[10ch] text-[2rem] font-semibold leading-none tracking-tight text-foreground sm:text-[2.25rem]">
          {metric.value}
        </p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {metric.detail}
        </p>
      </div>
    </div>
  );
}

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
      value: "0",
      detail: "No attendance record submitted today.",
    };
  }

  const orderedPunches = [...today.attendance_records].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp),
  );
  const punchTrail = orderedPunches.map((record) => record.punch).join(" / ");
  const punchWithTimes = orderedPunches
    .map((record) => {
      const localTime = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(record.timestamp));
      return `${record.punch} ${localTime}`;
    })
    .join(" • ");

  return {
    value: punchTrail,
    detail: punchWithTimes,
  };
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
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

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good Morning";
  }
  if (hour < 18) {
    return "Good Afternoon";
  }

  return "Good Evening";
}

function buildEmployeeDashboard(input: {
  leaveCredit: LeaveCredit | null;
  leaveRequests: LeaveRequestRecord[] | null;
  attendanceSummary: AttendanceSummary | null;
  overtimeRequests: OvertimeRequestRecord[] | null;
  officialBusinessRequests: OfficialBusinessRequestRecord[] | null;
  certificateAttendanceRequests: CertificateAttendanceRequestRecord[] | null;
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
  const pendingOvertime = (input.overtimeRequests ?? []).filter(
    (request) => request.status === "PENDING",
  );
  const pendingOfficialBusiness = (input.officialBusinessRequests ?? []).filter(
    (request) => request.status === "PENDING",
  );
  const pendingCertificateAttendance = (
    input.certificateAttendanceRequests ?? []
  ).filter((request) => request.status === "PENDING");
  const pendingRequestItems = [
    ...requests
      .filter((request) => request.status === "PENDING")
      .map((request) => ({
        createdAt: request.created_at,
        label: `Leave - ${formatShortDate(request.leave_date)}`,
      })),
    ...pendingOvertime.map((request) => ({
      createdAt: request.created_at,
      label: `Overtime - ${formatShortDate(request.date)}`,
    })),
    ...pendingOfficialBusiness.map((request) => ({
      createdAt: request.created_at,
      label: `Official Business - ${formatShortDate(request.date)}`,
    })),
    ...pendingCertificateAttendance.map((request) => ({
      createdAt: request.created_at,
      label: `Certificate Attendance - ${formatShortDate(request.date)}`,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pendingRequestsTotal = pendingRequestItems.length;
  const pendingRequestsPreview =
    pendingRequestItems.length > 0
      ? pendingRequestItems
          .slice(0, 3)
          .map((item) => item.label)
          .join(" | ")
      : "No pending requests.";
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
      title: "Pending Requests",
      value: pendingRequestsTotal.toString(),
      detail:
        pendingRequestsTotal > 3
          ? `${pendingRequestsPreview} | +${pendingRequestsTotal - 3} more`
          : pendingRequestsPreview,
      icon: ClipboardList,
    },
    {
      title: "Today's Attendance",
      value: attendanceToday.value,
      detail: attendanceToday.detail,
      icon: Activity,
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
      label: "Open Request Inbox",
      description: "Review leave and overtime requests from one queue.",
      href: "/requests/inbox",
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
      href: "/requests/inbox",
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
        tryFetch<OvertimeRequestRecord[]>(
          session.token,
          "/attendance/overtime?scope=mine&status=PENDING",
          "Unable to load overtime requests.",
        ),
        tryFetch<OfficialBusinessRequestRecord[]>(
          session.token,
          "/special-requests/official-business?scope=mine&status=PENDING",
          "Unable to load official business requests.",
        ),
        tryFetch<CertificateAttendanceRequestRecord[]>(
          session.token,
          "/special-requests/certificate-attendance?scope=mine&status=PENDING",
          "Unable to load certificate attendance requests.",
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
          "/attendance/overtime?scope=approvals&status=PENDING",
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
        overtimeRequests: employeeData?.[3] ?? null,
        officialBusinessRequests: employeeData?.[4] ?? null,
        certificateAttendanceRequests: employeeData?.[5] ?? null,
        payslips: employeeData?.[6] ?? null,
        currentDay,
      });

  return (
    <DashboardShell
      user={session.user}
      displayName={session.displayName}
      isHr={session.isHr}
    >
      {session.isHr ? (
        <div className="flex w-full flex-col gap-8">
          <section className="grid gap-6 xl:grid-cols-[1.65fr_.85fr]">
            <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
              <CardHeader className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    <ShieldCheck className="mr-1 size-3.5" />
                    HR Operations Desk
                  </Badge>
                </div>
                <div className="space-y-2">
                  <CardTitle className="font-heading text-3xl tracking-tight">
                    {getGreeting()}, {session.displayName || "HR Team"}
                  </CardTitle>
                  <CardDescription className="max-w-3xl text-sm leading-6">
                    Focus this view on decisions, blockers, and module access.
                    HR users should land on operational queues first, not the
                    same summary surface employees use.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-px overflow-hidden rounded-3xl border border-border/70 bg-border/60 sm:grid-cols-2 xl:grid-cols-4">
                  {dashboard.metrics.map((metric) => (
                    <div key={metric.title} className="h-full">
                      <DashboardMetricCard metric={metric} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
              <CardHeader className="space-y-2">
                <CardTitle>Exceptions Requiring Attention</CardTitle>
                <CardDescription>
                  Approval queues and payroll blockers that should move first.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.tasks.length > 0 ? (
                  dashboard.tasks.map((task) => (
                    <Link
                      key={task.label}
                      href={task.href}
                      className="block rounded-2xl border border-border/70 bg-background/70 p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {task.label}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {task.detail}
                          </p>
                        </div>
                        <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm leading-6 text-muted-foreground">
                    No urgent approval or payroll issues are currently detected.
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section>
            <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
              <CardHeader className="space-y-2">
                <CardTitle>Recommended HR Actions</CardTitle>
                <CardDescription>
                  High-value actions for the current cycle.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.actions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="block rounded-2xl border border-border/70 bg-background/70 p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {action.label}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </section>

          <section>
            <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
              <CardHeader className="space-y-2">
                <CardTitle>Published Employee Updates</CardTitle>
                <CardDescription>
                  Announcements and polls currently visible to the broader
                  workspace.
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
                    No recent employee-facing updates are available.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </section>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-8">
          <section className="grid gap-6 xl:grid-cols-[1.65fr_.85fr]">
            <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
              <CardHeader className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    <Sparkles className="mr-1 size-3.5" />
                    My Workspace
                  </Badge>
                  {session.user.department?.name ? (
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                      {session.user.department.name}
                    </Badge>
                  ) : null}
                  {session.user.role ? (
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                      {session.user.role}
                    </Badge>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <CardTitle className="font-heading text-[2rem] leading-tight tracking-tight sm:text-[2.25rem]">
                    {getGreeting()}, {session.displayName || "there"}
                  </CardTitle>
                  <CardDescription className="max-w-2xl text-sm leading-6">
                    This view is centered on your day: attendance, leave,
                    payroll, and the next actions tied to your own account.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-px overflow-hidden rounded-3xl border border-border/70 bg-border/60 sm:grid-cols-2 xl:grid-cols-3">
                  {dashboard.metrics.map((metric) => (
                    <div key={metric.title} className="h-full">
                      <DashboardMetricCard metric={metric} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
              <CardHeader className="space-y-2">
                <CardTitle>Needs Follow-Up</CardTitle>
                <CardDescription>
                  Personal items that likely need your attention next.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.tasks.length > 0 ? (
                  dashboard.tasks.map((task) => (
                    <Link
                      key={task.label}
                      href={task.href}
                      className="block rounded-2xl border border-border/70 bg-background/70 p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {task.label}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {task.detail}
                          </p>
                        </div>
                        <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm leading-6 text-muted-foreground">
                    No urgent follow-up is currently detected on your account.
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
            <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
              <CardHeader className="space-y-2">
                <CardTitle>What You Can Do Today</CardTitle>
                <CardDescription>
                  Personal workflow shortcuts instead of generic admin actions.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {dashboard.actions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="rounded-2xl border border-border/70 bg-background/70 p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {action.label}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
              <CardHeader className="space-y-2">
                <CardTitle>Workspace Pulse</CardTitle>
                <CardDescription>
                  Current updates that may affect your daily work.
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
      )}
    </DashboardShell>
  );
}
