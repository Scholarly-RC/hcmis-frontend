"use client";

import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Coins,
  Download,
  Loader2,
  ReceiptText,
  UserRoundSearch,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  REPORT_PATHS,
  type ReportActionKey,
} from "@/app/hr/reports/report-routes";
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

type AttendanceExceptionsReport = {
  from_date: string;
  to_date: string;
  rows: Array<{
    user: {
      id: string;
      name?: string | null;
      first_name?: string | null;
      middle_name?: string | null;
      last_name?: string | null;
      department?: { id: number; name: string } | null;
    };
    date: string;
    status: string;
    late_minutes: number;
    scheduled_minutes: number;
    absence_units: number;
    deduction_units: number;
    partial_record: boolean;
    leave: {
      id: number;
      leave_type: string;
      duration: string;
      approval_type: string | null;
    } | null;
  }>;
  totals: {
    total_exceptions: number;
    absent_days: number;
    late_days: number;
    partial_days: number;
    unpaid_leave_days: number;
    total_late_minutes: number;
    total_deduction_units: number;
  };
};

type YearlyPayrollExpenseReport = {
  selected_year: number;
  months: string[];
  total_amounts: number[];
  total_expenses: number;
};

type PayrollTotals = {
  gross_pay: number;
  total_deductions: number;
  net_salary: number;
};

type PayrollCutoff = PayrollTotals & {
  payslip_id: number;
};

type PayrollSummaryReport = {
  selected_month: number;
  selected_year: number;
  employee_count: number;
  rows: Array<{
    user: {
      id: string;
      employee_number?: string | null;
      name?: string | null;
      first_name?: string | null;
      middle_name?: string | null;
      last_name?: string | null;
      department?: {
        id: number;
        name: string;
      } | null;
    };
    first_cutoff: PayrollCutoff | null;
    second_cutoff: PayrollCutoff | null;
    monthly_total: PayrollTotals;
  }>;
  totals: {
    first_cutoff: PayrollTotals;
    second_cutoff: PayrollTotals;
    monthly_total: PayrollTotals;
  };
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
  | AttendanceExceptionsReport
  | YearlyPayrollExpenseReport
  | PayrollSummaryReport
  | GenderDemographicsReport
  | ResignationReport;

function isPayrollSummaryReport(
  result: ReportResult | null,
): result is PayrollSummaryReport {
  return Boolean(
    result &&
      "selected_month" in result &&
      "employee_count" in result &&
      "totals" in result,
  );
}

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
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
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

function formatMonthYear(month: number, year: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function formatPayrollValue(
  summary: PayrollCutoff | null,
  key: keyof PayrollTotals,
) {
  return summary ? formatCurrency(summary[key]) : "—";
}

function payrollCsvValue(
  summary: PayrollCutoff | null,
  key: keyof PayrollTotals,
) {
  return summary ? summary[key].toFixed(2) : "";
}

function csvEscape(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadPayrollSummaryCsv(report: PayrollSummaryReport) {
  const csvRows: Array<Array<string | number | null>> = [
    [
      "Employee Number",
      "Employee",
      "Department",
      "1ST Gross",
      "1ST Deductions",
      "1ST Net",
      "2ND Gross",
      "2ND Deductions",
      "2ND Net",
      "Monthly Gross",
      "Monthly Deductions",
      "Monthly Net",
    ],
    ...report.rows.map((row) => [
      row.user.employee_number ?? "",
      formatPersonName(row.user),
      row.user.department?.name ?? "Unassigned",
      payrollCsvValue(row.first_cutoff, "gross_pay"),
      payrollCsvValue(row.first_cutoff, "total_deductions"),
      payrollCsvValue(row.first_cutoff, "net_salary"),
      payrollCsvValue(row.second_cutoff, "gross_pay"),
      payrollCsvValue(row.second_cutoff, "total_deductions"),
      payrollCsvValue(row.second_cutoff, "net_salary"),
      row.monthly_total.gross_pay.toFixed(2),
      row.monthly_total.total_deductions.toFixed(2),
      row.monthly_total.net_salary.toFixed(2),
    ]),
    [
      "Report Total",
      "",
      "",
      report.totals.first_cutoff.gross_pay.toFixed(2),
      report.totals.first_cutoff.total_deductions.toFixed(2),
      report.totals.first_cutoff.net_salary.toFixed(2),
      report.totals.second_cutoff.gross_pay.toFixed(2),
      report.totals.second_cutoff.total_deductions.toFixed(2),
      report.totals.second_cutoff.net_salary.toFixed(2),
      report.totals.monthly_total.gross_pay.toFixed(2),
      report.totals.monthly_total.total_deductions.toFixed(2),
      report.totals.monthly_total.net_salary.toFixed(2),
    ],
  ];
  const csv = `${csvRows
    .map((row) => row.map(csvEscape).join(","))
    .join("\r\n")}\r\n`;
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const month = String(report.selected_month).padStart(2, "0");

  link.href = url;
  link.download = `payroll-summary-${report.selected_year}-${month}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
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
  selectedMonth,
  selectedDate,
  selectedYear,
  fromDate,
  toDate,
}: {
  selectedMonth: string;
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
        <p>Payroll Month: {selectedMonth}</p>
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

function AttendanceExceptionsReportView({
  result,
}: {
  result: AttendanceExceptionsReport;
}) {
  const statusLabel: Record<string, string> = {
    ABSENT: "Absent",
    LATE: "Late",
    PARTIAL_RECORD: "Needs review",
    ON_UNPAID_LEAVE: "Unpaid leave",
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Exceptions"
          value={String(result.totals.total_exceptions)}
          hint={`Between ${formatDateLabel(result.from_date)} and ${formatDateLabel(result.to_date)}.`}
        />
        <MetricCard
          label="Absences"
          value={String(result.totals.absent_days)}
          hint="Past scheduled days without a complete record."
        />
        <MetricCard
          label="Late minutes"
          value={String(result.totals.total_late_minutes)}
          hint={`${result.totals.late_days} day(s) beyond shift grace.`}
        />
        <MetricCard
          label="Deduction units"
          value={result.totals.total_deduction_units.toFixed(2)}
          hint="Preview of automatic payroll deduction days."
        />
      </div>

      <Card className="border-border/70 bg-background/70 shadow-none">
        <CardHeader>
          <CardTitle>Attendance Exceptions</CardTitle>
          <CardDescription>
            Late, absent, unpaid-leave, and partial-punch records requiring HR
            attention.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Late</TableHead>
                  <TableHead>Deduction units</TableHead>
                  <TableHead>Leave</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.length > 0 ? (
                  result.rows.map((row) => (
                    <TableRow key={`${row.user.id}-${row.date}`}>
                      <TableCell className="font-medium">
                        {formatPersonName(row.user)}
                      </TableCell>
                      <TableCell>
                        {row.user.department?.name ?? "Unassigned"}
                      </TableCell>
                      <TableCell>{formatDateLabel(row.date)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            row.status === "ABSENT" ||
                            row.status === "ON_UNPAID_LEAVE"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {statusLabel[row.status] ?? row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.late_minutes} min</TableCell>
                      <TableCell>{row.deduction_units.toFixed(2)}</TableCell>
                      <TableCell>
                        {row.leave
                          ? `${row.leave.leave_type} · ${row.leave.duration}`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No attendance exceptions found for the selected range.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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

function PayrollSummaryReportView({
  result,
}: {
  result: PayrollSummaryReport;
}) {
  const monthLabel = formatMonthYear(
    result.selected_month,
    result.selected_year,
  );
  const monthlyTotal = result.totals.monthly_total;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Employees"
          value={String(result.employee_count)}
          hint={`Released payroll rows for ${monthLabel}.`}
        />
        <MetricCard
          label="Gross Pay"
          value={formatCurrency(monthlyTotal.gross_pay)}
          hint="Combined 1ST and 2ND cutoff gross pay."
        />
        <MetricCard
          label="Deductions"
          value={formatCurrency(monthlyTotal.total_deductions)}
          hint="Combined released payroll deductions."
        />
        <MetricCard
          label="Net Payroll"
          value={formatCurrency(monthlyTotal.net_salary)}
          hint="Total released net pay for the month."
        />
      </div>

      <Card className="border-border/70 bg-background/70 shadow-none">
        <CardHeader>
          <CardTitle>Monthly Payroll Register</CardTitle>
          <CardDescription>
            Released regular payslips by employee and payroll cutoff for{" "}
            {monthLabel}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <Table className="min-w-[1424px] table-fixed">
              <colgroup>
                <col style={{ width: "14rem" }} />
                <col style={{ width: "10rem" }} />
                <col style={{ width: "7rem" }} />
                <col style={{ width: "8rem" }} />
                <col style={{ width: "7rem" }} />
                <col style={{ width: "7rem" }} />
                <col style={{ width: "8rem" }} />
                <col style={{ width: "7rem" }} />
                <col style={{ width: "8rem" }} />
                <col style={{ width: "9rem" }} />
                <col style={{ width: "8rem" }} />
              </colgroup>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead rowSpan={2} className="w-[14rem] align-bottom">
                    Employee
                  </TableHead>
                  <TableHead rowSpan={2} className="w-[10rem] align-bottom">
                    Department
                  </TableHead>
                  <TableHead
                    colSpan={3}
                    className="border-l-2 border-r-2 border-border/70 text-center"
                  >
                    1ST Cutoff
                  </TableHead>
                  <TableHead
                    colSpan={3}
                    className="border-l-2 border-r-2 border-border/70 text-center"
                  >
                    2ND Cutoff
                  </TableHead>
                  <TableHead
                    colSpan={3}
                    className="border-l-2 border-r-2 border-border/70 text-center"
                  >
                    Monthly Total
                  </TableHead>
                </TableRow>
                <TableRow className="bg-muted/30">
                  <TableHead className="min-w-[7rem] border-l-2 border-border/70 text-left">
                    Gross
                  </TableHead>
                  <TableHead className="min-w-[8rem] text-left">
                    Deductions
                  </TableHead>
                  <TableHead className="min-w-[7rem] border-r-2 border-border/70 text-left">
                    Net
                  </TableHead>
                  <TableHead className="min-w-[7rem] border-l-2 border-border/70 text-left">
                    Gross
                  </TableHead>
                  <TableHead className="min-w-[8rem] text-left">
                    Deductions
                  </TableHead>
                  <TableHead className="min-w-[7rem] border-r-2 border-border/70 text-left">
                    Net
                  </TableHead>
                  <TableHead className="min-w-[8rem] border-l-2 border-border/70 text-left">
                    Gross
                  </TableHead>
                  <TableHead className="min-w-[9rem] text-left">
                    Deductions
                  </TableHead>
                  <TableHead className="min-w-[8rem] border-r-2 border-border/70 text-left">
                    Net
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.length > 0 ? (
                  <>
                    {result.rows.map((row) => (
                      <TableRow key={row.user.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{formatPersonName(row.user)}</p>
                            {row.user.employee_number ? (
                              <p className="text-xs text-muted-foreground">
                                {row.user.employee_number}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          {row.user.department?.name ?? "Unassigned"}
                        </TableCell>
                        <TableCell className="border-l-2 border-border/70 text-left tabular-nums">
                          {formatPayrollValue(row.first_cutoff, "gross_pay")}
                        </TableCell>
                        <TableCell className="text-left tabular-nums">
                          {formatPayrollValue(
                            row.first_cutoff,
                            "total_deductions",
                          )}
                        </TableCell>
                        <TableCell className="border-r-2 border-border/70 text-left tabular-nums">
                          {formatPayrollValue(row.first_cutoff, "net_salary")}
                        </TableCell>
                        <TableCell className="border-l-2 border-border/70 text-left tabular-nums">
                          {formatPayrollValue(row.second_cutoff, "gross_pay")}
                        </TableCell>
                        <TableCell className="text-left tabular-nums">
                          {formatPayrollValue(
                            row.second_cutoff,
                            "total_deductions",
                          )}
                        </TableCell>
                        <TableCell className="border-r-2 border-border/70 text-left tabular-nums">
                          {formatPayrollValue(row.second_cutoff, "net_salary")}
                        </TableCell>
                        <TableCell className="border-l-2 border-border/70 text-left tabular-nums">
                          {formatCurrency(row.monthly_total.gross_pay)}
                        </TableCell>
                        <TableCell className="text-left tabular-nums">
                          {formatCurrency(row.monthly_total.total_deductions)}
                        </TableCell>
                        <TableCell className="border-r-2 border-border/70 text-left font-semibold tabular-nums">
                          {formatCurrency(row.monthly_total.net_salary)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell colSpan={2}>Report Total</TableCell>
                      <TableCell className="border-l-2 border-border/70 text-left tabular-nums">
                        {formatCurrency(result.totals.first_cutoff.gross_pay)}
                      </TableCell>
                      <TableCell className="text-left tabular-nums">
                        {formatCurrency(
                          result.totals.first_cutoff.total_deductions,
                        )}
                      </TableCell>
                      <TableCell className="border-r-2 border-border/70 text-left tabular-nums">
                        {formatCurrency(result.totals.first_cutoff.net_salary)}
                      </TableCell>
                      <TableCell className="border-l-2 border-border/70 text-left tabular-nums">
                        {formatCurrency(result.totals.second_cutoff.gross_pay)}
                      </TableCell>
                      <TableCell className="text-left tabular-nums">
                        {formatCurrency(
                          result.totals.second_cutoff.total_deductions,
                        )}
                      </TableCell>
                      <TableCell className="border-r-2 border-border/70 text-left tabular-nums">
                        {formatCurrency(result.totals.second_cutoff.net_salary)}
                      </TableCell>
                      <TableCell className="border-l-2 border-border/70 text-left tabular-nums">
                        {formatCurrency(monthlyTotal.gross_pay)}
                      </TableCell>
                      <TableCell className="text-left tabular-nums">
                        {formatCurrency(monthlyTotal.total_deductions)}
                      </TableCell>
                      <TableCell className="border-r-2 border-border/70 text-left tabular-nums">
                        {formatCurrency(monthlyTotal.net_salary)}
                      </TableCell>
                    </TableRow>
                  </>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No released payroll data found for the selected month.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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
  selectedMonth,
  selectedDate,
  selectedYear,
  fromDate,
  toDate,
}: {
  result: ReportResult | null;
  reportKey: ReportActionKey | null;
  selectedMonth: string;
  selectedDate: string;
  selectedYear: string;
  fromDate: string;
  toDate: string;
}) {
  if (!result || !reportKey) {
    return (
      <EmptyReportState
        selectedDate={selectedDate}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        fromDate={fromDate}
        toDate={toDate}
      />
    );
  }

  switch (reportKey) {
    case "staffing":
      return <DailyStaffingReportView result={result as DailyStaffingReport} />;
    case "attendance-exceptions":
      return (
        <AttendanceExceptionsReportView
          result={result as AttendanceExceptionsReport}
        />
      );
    case "payroll-expense":
      return (
        <PayrollExpenseReportView
          result={result as YearlyPayrollExpenseReport}
        />
      );
    case "payroll-summary":
      return (
        <PayrollSummaryReportView result={result as PayrollSummaryReport} />
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

export function ReportsClient({
  canViewPayrollSummary,
  initialReportKey = null,
}: {
  canViewPayrollSummary: boolean;
  initialReportKey?: ReportActionKey | null;
}) {
  const router = useRouter();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    String(now.getMonth() + 1),
  );
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [selectedDate, setSelectedDate] = useState(defaultDate());
  const [fromDate, setFromDate] = useState(defaultDate());
  const [toDate, setToDate] = useState(defaultDate());
  const [result, setResult] = useState<ReportResult | null>(null);
  const [running, setRunning] = useState<ReportActionKey | null>(null);
  const [activeReportKey, setActiveReportKey] =
    useState<ReportActionKey | null>(initialReportKey);

  const actions = useMemo(
    () => [
      {
        key: "staffing" as const,
        href: REPORT_PATHS.staffing,
        label: "Daily Staffing",
        description: "Attendance snapshot for the selected operating day.",
        icon: CalendarDays,
        run: async () => {
          const data = await requestJson<DailyStaffingReport>(
            `/api/reports/attendance/daily-staffing?selected_date=${encodeURIComponent(selectedDate)}`,
          );
          setResult(data);
        },
      },
      ...(canViewPayrollSummary
        ? [
            {
              key: "attendance-exceptions" as const,
              href: REPORT_PATHS["attendance-exceptions"],
              label: "Attendance Exceptions",
              description:
                "Review absences, late punches, unpaid leave, and partial records.",
              icon: AlertTriangle,
              run: async () => {
                const data = await requestJson<AttendanceExceptionsReport>(
                  `/api/reports/attendance/exceptions?from_date=${encodeURIComponent(fromDate)}&to_date=${encodeURIComponent(toDate)}`,
                );
                setResult(data);
              },
            },
          ]
        : []),
      {
        key: "payroll-expense" as const,
        href: REPORT_PATHS["payroll-expense"],
        label: "Yearly Payroll Expense",
        description: "Annual payroll cost summary for the selected year.",
        icon: Coins,
        run: async () => {
          const data = await requestJson<YearlyPayrollExpenseReport>(
            `/api/reports/payroll/yearly-expense?selected_year=${encodeURIComponent(selectedYear)}`,
          );
          setResult(data);
        },
      },
      ...(canViewPayrollSummary
        ? [
            {
              key: "payroll-summary" as const,
              href: REPORT_PATHS["payroll-summary"],
              label: "Payroll Summary",
              description:
                "Monthly released payroll register by employee and cutoff.",
              icon: ReceiptText,
              run: async () => {
                const data = await requestJson<PayrollSummaryReport>(
                  `/api/reports/payroll/summary?selected_month=${encodeURIComponent(selectedMonth)}&selected_year=${encodeURIComponent(selectedYear)}`,
                );
                setResult(data);
              },
            },
          ]
        : []),
      {
        key: "user-demographics" as const,
        href: REPORT_PATHS["user-demographics"],
        label: "User Demographics (Gender)",
        description: "Headcount mix by gender as of the selected date.",
        icon: Users,
        run: async () => {
          const data = await requestJson<GenderDemographicsReport>(
            `/api/reports/users/demographics/gender?as_of_date=${encodeURIComponent(selectedDate)}`,
          );
          setResult(data);
        },
      },
      {
        key: "resignation" as const,
        href: REPORT_PATHS.resignation,
        label: "Resignation Report",
        description: "Separated employees within the chosen date range.",
        icon: UserRoundSearch,
        run: async () => {
          const data = await requestJson<ResignationReport>(
            `/api/reports/users/resignations?from_date=${encodeURIComponent(fromDate)}&to_date=${encodeURIComponent(toDate)}`,
          );
          setResult(data);
        },
      },
    ],
    [
      canViewPayrollSummary,
      fromDate,
      selectedDate,
      selectedMonth,
      selectedYear,
      toDate,
    ],
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

  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const runActionRef = useRef(runAction);
  runActionRef.current = runAction;

  useEffect(() => {
    if (!initialReportKey) {
      return;
    }

    const action = actionsRef.current.find(
      (item) => item.key === initialReportKey,
    );
    if (action) {
      void runActionRef.current(action);
    }
  }, [initialReportKey]);

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
            {activeReportKey ? (
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Time Scope</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {activeReportKey === "payroll-summary" ? (
                    <>
                      <Label
                        htmlFor="reports-selected-month"
                        className="flex flex-col items-start gap-2 text-left text-sm"
                      >
                        <span className="text-left text-muted-foreground">
                          Payroll Month
                        </span>
                        <Input
                          id="reports-selected-month"
                          type="number"
                          min={1}
                          max={12}
                          value={selectedMonth}
                          onChange={(event) =>
                            setSelectedMonth(event.target.value)
                          }
                          className="w-full bg-background/80"
                        />
                      </Label>
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
                          onChange={(event) =>
                            setSelectedYear(event.target.value)
                          }
                          className="w-full bg-background/80"
                        />
                      </Label>
                    </>
                  ) : null}
                  {activeReportKey === "payroll-expense" ? (
                    <Label
                      htmlFor="reports-selected-year"
                      className="flex flex-col items-start gap-2 text-left text-sm sm:col-span-2"
                    >
                      <span className="text-left text-muted-foreground">
                        Selected Year
                      </span>
                      <Input
                        id="reports-selected-year"
                        value={selectedYear}
                        onChange={(event) =>
                          setSelectedYear(event.target.value)
                        }
                        className="w-full bg-background/80"
                      />
                    </Label>
                  ) : null}
                  {activeReportKey === "staffing" ||
                  activeReportKey === "user-demographics" ? (
                    <Label
                      htmlFor="reports-selected-date"
                      className="flex flex-col items-start gap-2 text-left text-sm sm:col-span-2"
                    >
                      <span className="text-left text-muted-foreground">
                        Selected Date
                      </span>
                      <Input
                        id="reports-selected-date"
                        type="date"
                        value={selectedDate}
                        onChange={(event) =>
                          setSelectedDate(event.target.value)
                        }
                        className="w-full bg-background/80"
                      />
                    </Label>
                  ) : null}
                  {activeReportKey === "resignation" ||
                  activeReportKey === "attendance-exceptions" ? (
                    <>
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
                    </>
                  ) : null}
                </div>
                <div className="mt-4 space-y-2">
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => {
                      if (activeAction) {
                        void runAction(activeAction);
                      }
                    }}
                    disabled={running !== null || activeAction === null}
                  >
                    {running === activeReportKey ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    Apply Filters
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {activeAction
                      ? `Refreshes ${activeAction.label} using the current filter values.`
                      : "Run a report first, then apply filter changes here."}
                  </p>
                </div>
              </div>
            ) : null}

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
                  onClick={() => router.push(action.href)}
                  disabled={running !== null}
                  className={cn(
                    "h-auto w-full justify-start whitespace-normal rounded-2xl border-border/70 bg-background/80 px-4 py-4 text-left shadow-none hover:bg-muted/40",
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
                      <span>{action.label}</span>
                      <p className="mt-1 text-sm font-normal text-muted-foreground">
                        {action.description}
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
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full px-3 py-1">
                      {activeAction.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {activeAction.description}
                    </span>
                  </div>
                  {activeReportKey === "payroll-summary" &&
                  isPayrollSummaryReport(result) ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => downloadPayrollSummaryCsv(result)}
                      disabled={running !== null}
                    >
                      <Download className="size-4" />
                      Download CSV
                    </Button>
                  ) : null}
                </div>
              </>
            ) : null}
          </CardHeader>
          <CardContent className="flex h-full flex-col gap-4">
            <ReportOutput
              result={result}
              reportKey={activeReportKey}
              selectedMonth={selectedMonth}
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
