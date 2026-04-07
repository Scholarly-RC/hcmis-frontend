"use client";

import {
  ArrowRight,
  CalendarDays,
  Coins,
  Loader2,
  UserRoundSearch,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HrModulePageScaffold } from "@/components/hr/module-scaffold";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/lib/toast";
import { cn } from "@/utils/cn";

type RequestError = {
  detail?: string;
};

type ReportActionKey =
  | "staffing"
  | "payroll-expense"
  | "user-demographics"
  | "resignation";

type DailyStaffingReport = {
  selected_date: string;
  department_labels: string[];
  department_counts: number[];
  schedules: Array<{
    department: {
      id: string;
      name: string;
    };
    user: {
      id: string;
      name?: string | null;
      first_name?: string | null;
      middle_name?: string | null;
      last_name?: string | null;
    };
    shift: {
      id: number;
      description: string | null;
      start_time: string | null;
      end_time: string | null;
    };
    date: string;
  }>;
};

type YearlyPayrollExpenseReport = {
  selected_year: number;
  months: string[];
  total_amounts: number[];
  total_expenses: number;
};

type GenderDemographicsReport = {
  as_of_date: string;
  gender_groups: string[];
  gender_group_counts: number[];
};

type ResignationReport = {
  from_date: string;
  to_date: string;
  rows: Array<{
    user: {
      id: string;
      name?: string | null;
      first_name?: string | null;
      middle_name?: string | null;
      last_name?: string | null;
      department?: {
        id: string;
        name: string;
      } | null;
    };
    resignation_date: string | null;
  }>;
};

type ReportResult =
  | DailyStaffingReport
  | YearlyPayrollExpenseReport
  | GenderDemographicsReport
  | ResignationReport;

async function requestJson<T>(pathname: string) {
  const response = await fetch(pathname, { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as
    | T
    | RequestError
    | null;

  if (!response.ok) {
    throw new Error(
      (payload as RequestError | null)?.detail ?? "Request failed.",
    );
  }
  return payload as T;
}

function defaultDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatPersonName(user: {
  name?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
}) {
  if (user.name && user.name.trim().length > 0) {
    return user.name;
  }

  const parts = [user.first_name, user.middle_name, user.last_name]
    .map((part) => part?.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : "Unnamed Employee";
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatMonthLabel(value: string | null) {
  if (!value) {
    return "Unknown";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatShiftWindow(start: string | null, end: string | null) {
  if (!start || !end) {
    return "Schedule Unavailable";
  }
  return `${start.slice(0, 5)} - ${end.slice(0, 5)}`;
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 font-heading text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

function EmptyReportState({
  selectedDate,
  selectedYear,
  fromDate,
  toDate,
}: {
  selectedDate: string;
  selectedYear: string;
  fromDate: string;
  toDate: string;
}) {
  return (
    <div className="flex min-h-[34rem] flex-1 flex-col justify-between rounded-2xl border border-dashed border-border/70 bg-background/60 p-5">
      <div className="space-y-3">
        <Badge variant="outline" className="rounded-full px-3 py-1">
          Awaiting Report
        </Badge>
        <div className="space-y-2">
          <h3 className="font-heading text-xl font-semibold tracking-tight">
            Choose A Report To Generate
          </h3>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            This workspace now renders charts, summary metrics, and detail
            tables instead of raw JSON. Pick one report from the left to see the
            data in a format HR staff can actually review.
          </p>
        </div>
      </div>

      <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
        <p>Selected Date: {selectedDate}</p>
        <p>Selected Year: {selectedYear}</p>
        <p>From Date: {fromDate}</p>
        <p>To Date: {toDate}</p>
      </div>
    </div>
  );
}

function DailyStaffingReportView({ result }: { result: DailyStaffingReport }) {
  const chartData = result.department_labels.map((label, index) => ({
    department: label,
    headcount: result.department_counts[index] ?? 0,
  }));
  const totalStaff = result.department_counts.reduce(
    (sum, count) => sum + count,
    0,
  );
  const busiestDepartment =
    chartData.reduce<{ department: string; headcount: number } | null>(
      (current, item) =>
        current === null || item.headcount > current.headcount ? item : current,
      null,
    ) ?? null;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Staff Scheduled"
          value={String(totalStaff)}
          hint={`For ${formatDateLabel(result.selected_date)}.`}
        />
        <MetricCard
          label="Departments Active"
          value={String(chartData.filter((item) => item.headcount > 0).length)}
          hint="Departments with at least one scheduled employee."
        />
        <MetricCard
          label="Busiest Department"
          value={busiestDepartment?.department ?? "None"}
          hint={`Peak staffing: ${busiestDepartment?.headcount ?? 0} employee(s).`}
        />
      </div>

      <Card className="border-border/70 bg-background/70 shadow-none">
        <CardHeader>
          <CardTitle>Department Staffing</CardTitle>
          <CardDescription>
            Scheduled employees by department for the selected day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 12 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="department" tickLine={false} axisLine={false} />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip />
                <Bar
                  dataKey="headcount"
                  radius={[10, 10, 0, 0]}
                  fill="var(--primary)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-background/70 shadow-none">
        <CardHeader>
          <CardTitle>Schedule Detail</CardTitle>
          <CardDescription>
            Employee-level staffing assignments for the selected date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.schedules.length > 0 ? (
                result.schedules.map((item) => (
                  <TableRow
                    key={`${item.user.id}-${item.shift.id}-${item.date}`}
                  >
                    <TableCell className="font-medium">
                      {formatPersonName(item.user)}
                    </TableCell>
                    <TableCell>{item.department.name}</TableCell>
                    <TableCell className="whitespace-normal">
                      <div className="space-y-1">
                        <p>{item.shift.description ?? "Shift"}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatShiftWindow(
                            item.shift.start_time,
                            item.shift.end_time,
                          )}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatDateLabel(item.date)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No schedules found for the selected date.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function PayrollExpenseReportView({
  result,
}: {
  result: YearlyPayrollExpenseReport;
}) {
  const chartData = result.months.map((month, index) => ({
    month,
    amount: result.total_amounts[index] ?? 0,
  }));
  const averageMonthlyExpense =
    chartData.length > 0 ? result.total_expenses / chartData.length : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Total Expense"
          value={formatCurrency(result.total_expenses)}
          hint={`Released payroll for ${result.selected_year}.`}
        />
        <MetricCard
          label="Months Reported"
          value={String(chartData.length)}
          hint="Months with released payslip totals."
        />
        <MetricCard
          label="Average Month"
          value={formatCurrency(averageMonthlyExpense)}
          hint="Average expense across reported months."
        />
      </div>

      <Card className="border-border/70 bg-background/70 shadow-none">
        <CardHeader>
          <CardTitle>Monthly Payroll Trend</CardTitle>
          <CardDescription>
            Total released payroll expense by month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 16, left: 0, bottom: 12 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) => formatCurrency(value)}
                  width={96}
                />
                <Tooltip
                  formatter={(value) =>
                    typeof value === "number" ? formatCurrency(value) : value
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  name="Payroll Expense"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-background/70 shadow-none">
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
          <CardDescription>
            Month-by-month payroll totals for the selected year.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Expense</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chartData.length > 0 ? (
                chartData.map((row) => (
                  <TableRow key={row.month}>
                    <TableCell className="font-medium">{row.month}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No payroll data found for the selected year.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function GenderDemographicsReportView({
  result,
}: {
  result: GenderDemographicsReport;
}) {
  const palette = ["var(--primary)", "var(--chart-2, #64748b)"];
  const chartData = result.gender_groups.map((group, index) => ({
    group,
    count: result.gender_group_counts[index] ?? 0,
  }));
  const totalPeople = chartData.reduce((sum, item) => sum + item.count, 0);
  const leadingGroup =
    chartData.reduce<{ group: string; count: number } | null>(
      (current, item) =>
        current === null || item.count > current.count ? item : current,
      null,
    ) ?? null;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Employee Count"
          value={String(totalPeople)}
          hint={`As of ${formatDateLabel(result.as_of_date)}.`}
        />
        <MetricCard
          label="Largest Group"
          value={leadingGroup?.group ?? "None"}
          hint={`${leadingGroup?.count ?? 0} employee(s) in the largest segment.`}
        />
        <MetricCard
          label="Distribution"
          value={`${chartData.length} Groups`}
          hint="Binary demographic split from current payload."
        />
      </div>

      <Card className="border-border/70 bg-background/70 shadow-none">
        <CardHeader>
          <CardTitle>Gender Distribution</CardTitle>
          <CardDescription>
            Current employee count split by recorded gender.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="group"
                  innerRadius={64}
                  outerRadius={92}
                  paddingAngle={3}
                >
                  {chartData.map((item, index) => (
                    <Cell
                      key={item.group}
                      fill={palette[index % palette.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chartData.map((row) => (
                <TableRow key={row.group}>
                  <TableCell className="font-medium">{row.group}</TableCell>
                  <TableCell className="text-right">{row.count}</TableCell>
                  <TableCell className="text-right">
                    {totalPeople > 0
                      ? `${Math.round((row.count / totalPeople) * 100)}%`
                      : "0%"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ResignationReportView({ result }: { result: ResignationReport }) {
  const monthlyCounts = result.rows.reduce<Record<string, number>>(
    (acc, row) => {
      const key = formatMonthLabel(row.resignation_date);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {},
  );
  const chartData = Object.entries(monthlyCounts).map(([month, count]) => ({
    month,
    count,
  }));
  const latestResignation = result.rows.at(-1)?.resignation_date ?? null;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Resignations"
          value={String(result.rows.length)}
          hint={`Between ${formatDateLabel(result.from_date)} and ${formatDateLabel(result.to_date)}.`}
        />
        <MetricCard
          label="Months With Activity"
          value={String(chartData.length)}
          hint="Months containing at least one resignation."
        />
        <MetricCard
          label="Latest Resignation"
          value={
            latestResignation ? formatDateLabel(latestResignation) : "None"
          }
          hint="Most recent resignation in the selected range."
        />
      </div>

      <Card className="border-border/70 bg-background/70 shadow-none">
        <CardHeader>
          <CardTitle>Resignation Trend</CardTitle>
          <CardDescription>
            Count of resigned employees grouped by month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 12 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip />
                <Bar
                  dataKey="count"
                  radius={[10, 10, 0, 0]}
                  fill="var(--primary)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-background/70 shadow-none">
        <CardHeader>
          <CardTitle>Resignation List</CardTitle>
          <CardDescription>
            Employee records included in the selected date range.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Resignation Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.rows.length > 0 ? (
                result.rows.map((row) => (
                  <TableRow
                    key={`${row.user.id}-${row.resignation_date ?? "na"}`}
                  >
                    <TableCell className="font-medium">
                      {formatPersonName(row.user)}
                    </TableCell>
                    <TableCell>
                      {row.user.department?.name ?? "Unassigned"}
                    </TableCell>
                    <TableCell>
                      {row.resignation_date
                        ? formatDateLabel(row.resignation_date)
                        : "Unknown"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No resignations found for the selected date range.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportOutput({
  result,
  reportKey,
  selectedDate,
  selectedYear,
  fromDate,
  toDate,
}: {
  result: ReportResult | null;
  reportKey: ReportActionKey | null;
  selectedDate: string;
  selectedYear: string;
  fromDate: string;
  toDate: string;
}) {
  if (!result || !reportKey) {
    return (
      <EmptyReportState
        selectedDate={selectedDate}
        selectedYear={selectedYear}
        fromDate={fromDate}
        toDate={toDate}
      />
    );
  }

  switch (reportKey) {
    case "staffing":
      return <DailyStaffingReportView result={result as DailyStaffingReport} />;
    case "payroll-expense":
      return (
        <PayrollExpenseReportView
          result={result as YearlyPayrollExpenseReport}
        />
      );
    case "user-demographics":
      return (
        <GenderDemographicsReportView
          result={result as GenderDemographicsReport}
        />
      );
    case "resignation":
      return <ResignationReportView result={result as ResignationReport} />;
  }
}

export function ReportsClient() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [selectedDate, setSelectedDate] = useState(defaultDate());
  const [fromDate, setFromDate] = useState(defaultDate());
  const [toDate, setToDate] = useState(defaultDate());
  const [result, setResult] = useState<ReportResult | null>(null);
  const [running, setRunning] = useState<ReportActionKey | null>(null);
  const [activeReportKey, setActiveReportKey] =
    useState<ReportActionKey | null>(null);

  const actions = useMemo(
    () => [
      {
        key: "staffing" as const,
        label: "Daily Staffing",
        description: "Attendance snapshot for the selected operating day.",
        icon: CalendarDays,
        accent: "Daily",
        controls: "Selected Date",
        run: async () => {
          const data = await requestJson<DailyStaffingReport>(
            `/api/reports/attendance/daily-staffing?selected_date=${encodeURIComponent(selectedDate)}`,
          );
          setResult(data);
        },
      },
      {
        key: "payroll-expense" as const,
        label: "Yearly Payroll Expense",
        description: "Annual payroll cost summary for the selected year.",
        icon: Coins,
        accent: "Finance",
        controls: "Selected Year",
        run: async () => {
          const data = await requestJson<YearlyPayrollExpenseReport>(
            `/api/reports/payroll/yearly-expense?selected_year=${encodeURIComponent(selectedYear)}`,
          );
          setResult(data);
        },
      },
      {
        key: "user-demographics" as const,
        label: "User Demographics (Gender)",
        description: "Headcount mix by gender as of the selected date.",
        icon: Users,
        accent: "People",
        controls: "Selected Date",
        run: async () => {
          const data = await requestJson<GenderDemographicsReport>(
            `/api/reports/users/demographics/gender?as_of_date=${encodeURIComponent(selectedDate)}`,
          );
          setResult(data);
        },
      },
      {
        key: "resignation" as const,
        label: "Resignation Report",
        description: "Separated employees within the chosen date range.",
        icon: UserRoundSearch,
        accent: "Attrition",
        controls: "From Date, To Date",
        run: async () => {
          const data = await requestJson<ResignationReport>(
            `/api/reports/users/resignations?from_date=${encodeURIComponent(fromDate)}&to_date=${encodeURIComponent(toDate)}`,
          );
          setResult(data);
        },
      },
    ],
    [fromDate, selectedDate, selectedYear, toDate],
  );

  const activeAction =
    actions.find((action) => action.key === activeReportKey) ?? null;

  async function runAction(action: (typeof actions)[number]) {
    setRunning(action.key);
    try {
      await action.run();
      setActiveReportKey(action.key);
      toast.success(`${action.label} completed.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to run report.",
      );
    } finally {
      setRunning(null);
    }
  }

  return (
    <HrModulePageScaffold
      title="Reports and Analytics"
      description="Run backend-backed HR reports as charts and operational tables instead of raw payloads."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(22rem,28rem)_minmax(0,1fr)]">
        <Card className="border-border/70 bg-card/90 shadow-lg shadow-black/5">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Report Controls</CardTitle>
                <CardDescription>
                  Define the reporting window, then run a specific dataset.
                </CardDescription>
              </div>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {actions.length} Reports
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium">Time Scope</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Label
                  htmlFor="reports-selected-year"
                  className="flex flex-col items-start gap-2 text-left text-sm"
                >
                  <span className="text-left text-muted-foreground">
                    Selected Year
                  </span>
                  <Input
                    id="reports-selected-year"
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(event.target.value)}
                    className="w-full bg-background/80"
                  />
                </Label>
                <Label
                  htmlFor="reports-selected-date"
                  className="flex flex-col items-start gap-2 text-left text-sm"
                >
                  <span className="text-left text-muted-foreground">
                    Selected Date
                  </span>
                  <Input
                    id="reports-selected-date"
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="w-full bg-background/80"
                  />
                </Label>
                <Label
                  htmlFor="reports-from-date"
                  className="flex flex-col items-start gap-2 text-left text-sm"
                >
                  <span className="text-left text-muted-foreground">
                    From Date
                  </span>
                  <Input
                    id="reports-from-date"
                    type="date"
                    value={fromDate}
                    onChange={(event) => setFromDate(event.target.value)}
                    className="w-full bg-background/80"
                  />
                </Label>
                <Label
                  htmlFor="reports-to-date"
                  className="flex flex-col items-start gap-2 text-left text-sm"
                >
                  <span className="text-left text-muted-foreground">
                    To Date
                  </span>
                  <Input
                    id="reports-to-date"
                    type="date"
                    value={toDate}
                    onChange={(event) => setToDate(event.target.value)}
                    className="w-full bg-background/80"
                  />
                </Label>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Available Reports</p>
                <p className="text-sm text-muted-foreground">
                  Run a report to visualize the result as KPIs, charts, and
                  detail tables.
                </p>
              </div>
              {actions.map((action) => (
                <Button
                  key={action.key}
                  type="button"
                  variant="outline"
                  onClick={() => void runAction(action)}
                  disabled={running !== null}
                  className={cn(
                    "h-auto w-full justify-start rounded-2xl border-border/70 bg-background/80 px-4 py-4 text-left shadow-none hover:bg-muted/40",
                    activeReportKey === action.key &&
                      "border-primary/40 bg-primary/5",
                    running === action.key && "border-primary/50",
                  )}
                >
                  <div className="flex w-full items-start gap-3">
                    <div className="mt-0.5 rounded-xl border border-border/70 bg-muted/40 p-2">
                      {running === action.key ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <action.icon className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{action.label}</span>
                        <Badge variant="outline" className="rounded-full">
                          {action.accent}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm font-normal text-muted-foreground">
                        {action.description}
                      </p>
                      <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        Uses {action.controls}
                      </p>
                    </div>
                    <ArrowRight className="mt-1 size-4 text-muted-foreground" />
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[40rem] border-border/70 bg-card/90 shadow-lg shadow-black/5">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Report Workspace</CardTitle>
                <CardDescription>
                  Review the latest report as decision-ready visuals and detail
                  rows.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {running ? "Running" : "Idle"}
                </Badge>
              </div>
            </div>

            {activeAction ? (
              <>
                <Separator />
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full px-3 py-1">
                    {activeAction.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {activeAction.description}
                  </span>
                </div>
              </>
            ) : null}
          </CardHeader>
          <CardContent className="flex h-full flex-col gap-4">
            <ReportOutput
              result={result}
              reportKey={activeReportKey}
              selectedDate={selectedDate}
              selectedYear={selectedYear}
              fromDate={fromDate}
              toDate={toDate}
            />
          </CardContent>
        </Card>
      </div>
    </HrModulePageScaffold>
  );
}
