"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  CalendarDays,
  Eye,
  FileDown,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  UserRound,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  openPayslipPrintWindow,
  type PayrollPayslip,
  type PayslipSummary,
  type PayslipVariableCompensation,
  type PayslipVariableDeduction,
  requestJson,
  toNumber,
} from "@/lib/payroll";
import { toast } from "@/lib/toast";
import type { AuthUser } from "@/types/auth";

type PayslipFilters = {
  month: string;
  year: string;
  user_id: string;
};

type CreatePayslipForm = {
  user_id: string;
  month: string;
  year: string;
  period: "1ST" | "2ND";
};

type VariableAdjustmentForm = {
  category: "earning" | "deduction";
  name: string;
  amount: string;
};

const MONTH_OPTIONS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
] as const;

function currentMonth() {
  return new Date().getMonth() + 1;
}

function currentYear() {
  return new Date().getFullYear();
}

function formatMonth(value: string | number | null | undefined) {
  const month = Number(value);
  return (
    MONTH_OPTIONS.find((option) => Number(option.value) === month)?.label ?? "-"
  );
}

function buildYearOptions() {
  const year = currentYear();
  return Array.from({ length: 5 }, (_, index) => String(year - 1 + index));
}

function formatCurrency(value: string | number | null | undefined) {
  return toNumber(value).toFixed(2);
}

export function PayslipsClient() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [payslips, setPayslips] = useState<PayrollPayslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PayslipFilters>({
    month: String(currentMonth()),
    year: String(currentYear()),
    user_id: "",
  });
  const [createForm, setCreateForm] = useState<CreatePayslipForm>({
    user_id: "",
    month: String(currentMonth()),
    year: String(currentYear()),
    period: "1ST",
  });
  const [creatingPayslip, setCreatingPayslip] = useState(false);
  const [togglingPayslipId, setTogglingPayslipId] = useState<number | null>(
    null,
  );
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summary, setSummary] = useState<PayslipSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollPayslip | null>(
    null,
  );
  const [adjustmentForm, setAdjustmentForm] = useState<VariableAdjustmentForm>({
    category: "earning",
    name: "",
    amount: "",
  });
  const [savingAdjustment, setSavingAdjustment] = useState(false);
  const [removingAdjustmentKey, setRemovingAdjustmentKey] = useState<
    string | null
  >(null);

  const yearOptions = useMemo(() => buildYearOptions(), []);

  const userMap = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );

  const releasedCount = payslips.filter((item) => item.released).length;
  const draftCount = payslips.length - releasedCount;
  const selectedUser = selectedPayslip
    ? (selectedPayslip.user ?? userMap.get(selectedPayslip.user_id) ?? null)
    : null;
  const employeeLabel = selectedUser
    ? [selectedUser.first_name, selectedUser.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || selectedUser.email
    : "-";
  const payrollMonthLabel = selectedPayslip
    ? `${formatMonth(selectedPayslip.month)} ${selectedPayslip.year ?? "-"}`
    : "-";
  const canEditAdjustments = Boolean(
    selectedPayslip && !selectedPayslip.released,
  );

  const loadPayslips = useCallback(async (activeFilters: PayslipFilters) => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (activeFilters.month) {
        query.set("month", activeFilters.month);
      }
      if (activeFilters.year) {
        query.set("year", activeFilters.year);
      }
      if (activeFilters.user_id) {
        query.set("user_id", activeFilters.user_id);
      }
      const queryString = query.toString();
      const data = await requestJson<PayrollPayslip[]>(
        `/api/payroll/payslips${queryString ? `?${queryString}` : ""}`,
      );
      setPayslips(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load payslips.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function initialize() {
      try {
        const userList = await requestJson<AuthUser[]>(
          "/api/users?active_only=true",
        );
        setUsers(userList);
        if (userList.length > 0) {
          setCreateForm((current) => ({
            ...current,
            user_id: current.user_id || String(userList[0].id),
          }));
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Unable to load users.",
        );
      } finally {
        await loadPayslips({
          month: String(currentMonth()),
          year: String(currentYear()),
          user_id: "",
        });
      }
    }

    void initialize();
  }, [loadPayslips]);

  async function createPayslip() {
    try {
      const userId = createForm.user_id.trim();
      const month = Number(createForm.month);
      const year = Number(createForm.year);

      if (!userId || month < 1 || month > 12 || year < 2000) {
        toast.error("Please complete the employee, month, year, and period.");
        return;
      }

      setCreatingPayslip(true);
      await requestJson<PayrollPayslip>("/api/payroll/payslips", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          month,
          year,
          period: createForm.period,
        }),
      });
      toast.success("Payslip created or refreshed.");
      await loadPayslips(filters);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to create payslip.",
      );
    } finally {
      setCreatingPayslip(false);
    }
  }

  async function toggleRelease(payslipId: number) {
    try {
      setTogglingPayslipId(payslipId);
      await requestJson<PayrollPayslip>(
        `/api/payroll/payslips/${payslipId}/release-toggle`,
        { method: "POST" },
      );
      toast.success("Payslip release status updated.");
      await loadPayslips(filters);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update payslip status.",
      );
    } finally {
      setTogglingPayslipId(null);
    }
  }

  async function openSummary(payslipId: number) {
    try {
      setSummaryOpen(true);
      setSummaryLoading(true);
      setAdjustmentForm({
        category: "earning",
        name: "",
        amount: "",
      });
      setSelectedPayslip(
        payslips.find((item) => item.id === payslipId) ?? null,
      );
      await loadSummary(payslipId);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load payslip breakdown.",
      );
      setSummaryOpen(false);
    } finally {
      setSummaryLoading(false);
    }
  }

  const loadSummary = useCallback(async (payslipId: number) => {
    const payload = await requestJson<PayslipSummary>(
      `/api/payroll/payslips/${payslipId}/summary`,
    );
    setSummary(payload);
  }, []);

  async function addVariableAdjustment() {
    if (!selectedPayslip) {
      return;
    }

    const name = adjustmentForm.name.trim();
    const amount = Number(adjustmentForm.amount);
    if (!name || Number.isNaN(amount) || amount < 0) {
      toast.error("Enter an adjustment name and a valid amount.");
      return;
    }

    try {
      setSavingAdjustment(true);
      const endpoint =
        adjustmentForm.category === "earning"
          ? `/api/payroll/payslips/${selectedPayslip.id}/variable-compensations`
          : `/api/payroll/payslips/${selectedPayslip.id}/variable-deductions`;
      await requestJson<PayslipVariableCompensation | PayslipVariableDeduction>(
        endpoint,
        {
          method: "POST",
          body: JSON.stringify({
            name,
            amount,
          }),
        },
      );
      setAdjustmentForm((current) => ({
        ...current,
        name: "",
        amount: "",
      }));
      await loadSummary(selectedPayslip.id);
      toast.success(
        adjustmentForm.category === "earning"
          ? "Variable earning added."
          : "Variable deduction added.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save variable adjustment.",
      );
    } finally {
      setSavingAdjustment(false);
    }
  }

  async function removeVariableAdjustment(
    category: "earning" | "deduction",
    itemId: number,
  ) {
    if (!selectedPayslip) {
      return;
    }

    const adjustmentKey = `${category}-${itemId}`;
    try {
      setRemovingAdjustmentKey(adjustmentKey);
      const endpoint =
        category === "earning"
          ? `/api/payroll/payslips/variable-compensations/${itemId}`
          : `/api/payroll/payslips/variable-deductions/${itemId}`;
      await requestJson<void>(endpoint, { method: "DELETE" });
      await loadSummary(selectedPayslip.id);
      toast.success(
        category === "earning"
          ? "Variable earning removed."
          : "Variable deduction removed.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to remove variable adjustment.",
      );
    } finally {
      setRemovingAdjustmentKey(null);
    }
  }

  function downloadSummaryPdf() {
    if (!summary || !selectedPayslip) {
      return;
    }

    const user =
      selectedPayslip.user ?? userMap.get(selectedPayslip.user_id) ?? null;
    const employeeLabel = user
      ? [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
        user.email
      : `User #${selectedPayslip.user_id}`;

    try {
      openPayslipPrintWindow({
        employeeLabel,
        monthYear: `${formatMonth(selectedPayslip.month)} ${selectedPayslip.year ?? "-"}`,
        period: selectedPayslip.period ?? "-",
        rank: selectedPayslip.rank ?? "-",
        status: selectedPayslip.released ? "Released" : "Draft",
        basePay: toNumber(summary.salary).toFixed(2),
        grossPay: toNumber(summary.gross_pay).toFixed(2),
        totalDeductions: toNumber(summary.total_deductions).toFixed(2),
        netSalary: toNumber(summary.net_salary).toFixed(2),
        earnings: [
          {
            label: "Base Pay",
            amount: toNumber(summary.salary).toFixed(2),
          },
          ...summary.compensations.map((item) => ({
            label: item.name,
            amount: toNumber(item.amount).toFixed(2),
            note: "Fixed compensation",
          })),
          ...summary.variable_compensations.map((item) => ({
            label: item.name,
            amount: toNumber(item.amount).toFixed(2),
            note: "Variable compensation",
          })),
        ],
        deductions: [
          {
            label: "SSS",
            amount: toNumber(summary.sss_deduction).toFixed(2),
          },
          {
            label: "PhilHealth",
            amount: toNumber(summary.philhealth_deduction).toFixed(2),
          },
          {
            label: "Pag-IBIG",
            amount: toNumber(summary.pag_ibig_deduction).toFixed(2),
          },
          {
            label: "MP2",
            amount: toNumber(summary.mp2_deduction).toFixed(2),
          },
          {
            label: "Tax",
            amount: toNumber(summary.tax_deduction).toFixed(2),
          },
          ...summary.variable_deductions.map((item) => ({
            label: item.name,
            amount: toNumber(item.amount).toFixed(2),
            note: "Variable deduction",
          })),
        ],
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to open print preview.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/70">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <Badge
                variant="secondary"
                className="w-fit rounded-full px-3 py-1"
              >
                Guided Payroll Processing
              </Badge>
              <CardTitle className="text-2xl">Payslip Management</CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-6">
                Create, review, and release payslips using a simple workflow:
                choose a period, generate the payslip, review the breakdown, and
                release it when ready.
              </CardDescription>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Payslips Loaded
                </p>
                <p className="mt-1 text-2xl font-semibold">{payslips.length}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Released
                </p>
                <p className="mt-1 text-2xl font-semibold">{releasedCount}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Draft
                </p>
                <p className="mt-1 text-2xl font-semibold">{draftCount}</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-xl">Find Payslips</CardTitle>
          <CardDescription>
            Start by choosing the month, year, and employee you want to view.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4 xl:grid-cols-5">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="filter_month">Month</Label>
            <Select
              value={filters.month}
              onValueChange={(value) =>
                setFilters((current) => ({ ...current, month: value }))
              }
            >
              <SelectTrigger id="filter_month" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="filter_year">Year</Label>
            <Select
              value={filters.year}
              onValueChange={(value) =>
                setFilters((current) => ({ ...current, year: value }))
              }
            >
              <SelectTrigger id="filter_year" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-2 md:col-span-2">
            <Label htmlFor="filter_user">Employee</Label>
            <Select
              value={filters.user_id || "__all__"}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  user_id: value === "__all__" ? "" : value,
                }))
              }
            >
              <SelectTrigger id="filter_user" className="w-full">
                <SelectValue placeholder="All employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All employees</SelectItem>
                {users.map((user) => {
                  const label =
                    [user.first_name, user.last_name]
                      .filter(Boolean)
                      .join(" ")
                      .trim() || user.email;
                  return (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="flex min-w-0 items-end gap-2">
            <Button
              className="flex-1"
              onClick={() => void loadPayslips(filters)}
            >
              <RefreshCw className="size-4" />
              Load Payslips
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-xl">Create Or Refresh A Payslip</CardTitle>
          <CardDescription>
            Choose one employee and one payroll cutoff. If the payslip already
            exists, the system refreshes it with the latest values.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="min-w-0 space-y-2 xl:col-span-2">
            <Label htmlFor="create_user">Employee</Label>
            <Select
              value={createForm.user_id}
              onValueChange={(value) =>
                setCreateForm((current) => ({ ...current, user_id: value }))
              }
            >
              <SelectTrigger id="create_user" className="w-full">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => {
                  const label =
                    [user.first_name, user.last_name]
                      .filter(Boolean)
                      .join(" ")
                      .trim() || user.email;
                  return (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="create_month">Month</Label>
            <Select
              value={createForm.month}
              onValueChange={(value) =>
                setCreateForm((current) => ({ ...current, month: value }))
              }
            >
              <SelectTrigger id="create_month" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="create_year">Year</Label>
            <Select
              value={createForm.year}
              onValueChange={(value) =>
                setCreateForm((current) => ({ ...current, year: value }))
              }
            >
              <SelectTrigger id="create_year" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="create_period">Payroll Cutoff</Label>
            <Select
              value={createForm.period}
              onValueChange={(value: "1ST" | "2ND") =>
                setCreateForm((current) => ({ ...current, period: value }))
              }
            >
              <SelectTrigger id="create_period" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1ST">First Cutoff</SelectItem>
                <SelectItem value="2ND">Second Cutoff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="xl:col-span-5">
            <Button
              onClick={() => void createPayslip()}
              disabled={creatingPayslip}
            >
              <Calculator className="size-4" />
              {creatingPayslip ? "Processing..." : "Create Or Refresh Payslip"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-xl">Payslip List</CardTitle>
          <CardDescription>
            Review each payslip, open the full breakdown, and release it only
            after checking the totals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Payroll Cutoff</TableHead>
                  <TableHead>Payroll Period</TableHead>
                  <TableHead>Position Rank</TableHead>
                  <TableHead>Base Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7}>Loading payslips...</TableCell>
                  </TableRow>
                ) : payslips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      No payslips found for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  payslips.map((payslip) => {
                    const user =
                      payslip.user ?? userMap.get(payslip.user_id) ?? null;
                    const userLabel = user
                      ? [user.first_name, user.last_name]
                          .filter(Boolean)
                          .join(" ")
                          .trim() || user.email
                      : `User #${payslip.user_id}`;

                    const isToggling = togglingPayslipId === payslip.id;

                    return (
                      <TableRow key={payslip.id}>
                        <TableCell className="font-medium">
                          {userLabel}
                        </TableCell>
                        <TableCell>
                          {payslip.period === "1ST"
                            ? "First Cutoff"
                            : payslip.period === "2ND"
                              ? "Second Cutoff"
                              : "-"}
                        </TableCell>
                        <TableCell>
                          {formatMonth(payslip.month)} {payslip.year ?? "-"}
                        </TableCell>
                        <TableCell>{payslip.rank ?? "-"}</TableCell>
                        <TableCell>
                          {toNumber(payslip.salary).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={payslip.released ? "default" : "secondary"}
                            className="rounded-full px-3 py-1"
                          >
                            {payslip.released ? "Released" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void openSummary(payslip.id)}
                            >
                              <Eye className="size-4" />
                              View Breakdown
                            </Button>
                            <Button
                              size="sm"
                              variant={
                                payslip.released ? "secondary" : "default"
                              }
                              onClick={() => void toggleRelease(payslip.id)}
                              disabled={isToggling}
                            >
                              <Send className="size-4" />
                              {isToggling
                                ? "Updating..."
                                : payslip.released
                                  ? "Mark As Draft"
                                  : "Release Payslip"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] flex-col overflow-hidden p-0 sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100vw-3rem)] sm:!max-w-5xl lg:!max-w-6xl">
          <DialogHeader className="shrink-0 border-b border-border/60 bg-background px-4 py-4 sm:px-6 sm:py-5">
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="size-5" />
              Payslip Breakdown
            </DialogTitle>
            <DialogDescription className="pr-8 text-sm leading-6">
              Review the computed earnings, deductions, and take-home pay.
              Manual variable earnings and deductions can be managed directly
              here before releasing the payslip.
            </DialogDescription>
          </DialogHeader>
          {summaryLoading || !summary ? (
            <div className="flex-1 overflow-y-auto">
              <p className="px-4 py-8 text-sm text-muted-foreground sm:px-6">
                Loading breakdown...
              </p>
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30 px-4 py-5 sm:px-6 sm:py-6">
                <div className="mx-auto max-w-3xl space-y-4">
                  <section className="rounded-3xl border border-border/60 bg-background p-4 shadow-sm sm:p-5">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      <span className="rounded-full border border-border/70 bg-background px-3 py-1">
                        {summary.period ?? "-"} Cutoff
                      </span>
                      <span>{payrollMonthLabel}</span>
                      <Badge
                        variant={
                          selectedPayslip?.released ? "default" : "secondary"
                        }
                        className="rounded-full px-3 py-1"
                      >
                        {selectedPayslip?.released ? "Released" : "Draft"}
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-1">
                      <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                        {employeeLabel}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedUser?.email ?? "Employee record"}
                      </p>
                    </div>

                    <div className="mt-5 rounded-2xl border border-emerald-200/60 bg-emerald-50/80 px-4 py-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        Net Pay
                      </p>
                      <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                        {formatCurrency(summary.net_salary)}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-border/60 bg-background p-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Wallet className="size-4" />
                          <p className="text-xs font-medium uppercase tracking-[0.18em]">
                            Base Pay
                          </p>
                        </div>
                        <p className="mt-3 text-2xl font-semibold tracking-tight">
                          {formatCurrency(summary.salary)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/60 bg-background p-4">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                          <ArrowUpRight className="size-4" />
                          <p className="text-xs font-medium uppercase tracking-[0.18em]">
                            Gross Pay
                          </p>
                        </div>
                        <p className="mt-3 text-2xl font-semibold tracking-tight">
                          {formatCurrency(summary.gross_pay)}
                        </p>
                      </div>
                      <div className="col-span-2 rounded-2xl border border-border/60 bg-background p-4">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                          <ArrowDownRight className="size-4" />
                          <p className="text-xs font-medium uppercase tracking-[0.18em]">
                            Total Deductions
                          </p>
                        </div>
                        <p className="mt-3 text-2xl font-semibold tracking-tight">
                          {formatCurrency(summary.total_deductions)}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-3xl border border-border/60 bg-background p-4 shadow-sm sm:p-5">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CalendarDays className="size-4 text-muted-foreground" />
                      Payslip Context
                    </div>
                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-2xl bg-muted/40 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Payroll Month
                        </p>
                        <p className="mt-1 font-medium">{payrollMonthLabel}</p>
                      </div>
                      <div className="rounded-2xl bg-muted/40 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Cutoff
                        </p>
                        <p className="mt-1 font-medium">
                          {summary.period ?? "-"}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-3xl border border-border/60 bg-background p-4 shadow-sm sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">
                          Variable Adjustments
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Add manual earnings or deductions directly to this
                          payslip. The breakdown updates immediately after each
                          change.
                        </p>
                      </div>
                      <Badge
                        variant={canEditAdjustments ? "secondary" : "outline"}
                        className="rounded-full px-3 py-1"
                      >
                        {canEditAdjustments ? "Editable" : "Locked"}
                      </Badge>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-[160px_minmax(0,1fr)_180px_auto]">
                      <div className="space-y-2">
                        <Label htmlFor="adjustment_category">Type</Label>
                        <Select
                          value={adjustmentForm.category}
                          onValueChange={(value: "earning" | "deduction") =>
                            setAdjustmentForm((current) => ({
                              ...current,
                              category: value,
                            }))
                          }
                          disabled={!canEditAdjustments || savingAdjustment}
                        >
                          <SelectTrigger
                            id="adjustment_category"
                            className="w-full"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="earning">Earning</SelectItem>
                            <SelectItem value="deduction">Deduction</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adjustment_name">Name</Label>
                        <Input
                          id="adjustment_name"
                          className="h-10"
                          value={adjustmentForm.name}
                          onChange={(event) =>
                            setAdjustmentForm((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                          disabled={!canEditAdjustments || savingAdjustment}
                          placeholder="Adjustment name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adjustment_amount">Amount</Label>
                        <Input
                          id="adjustment_amount"
                          className="h-10"
                          type="number"
                          min="0"
                          step="0.01"
                          value={adjustmentForm.amount}
                          onChange={(event) =>
                            setAdjustmentForm((current) => ({
                              ...current,
                              amount: event.target.value,
                            }))
                          }
                          disabled={!canEditAdjustments || savingAdjustment}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={() => void addVariableAdjustment()}
                          disabled={!canEditAdjustments || savingAdjustment}
                          className="w-full md:w-auto"
                        >
                          <Plus className="size-4" />
                          {savingAdjustment ? "Saving..." : "Add"}
                        </Button>
                      </div>
                    </div>

                    {!canEditAdjustments ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Released payslips are locked from direct adjustment in
                        this screen.
                      </p>
                    ) : null}
                  </section>

                  <section className="rounded-3xl border border-border/60 bg-background p-4 shadow-sm sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">Earnings</p>
                        <p className="text-sm text-muted-foreground">
                          Base pay plus fixed and variable compensation.
                        </p>
                      </div>
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        +{formatCurrency(summary.gross_pay)}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3">
                        <span>Base Pay</span>
                        <span className="font-medium">
                          {formatCurrency(summary.salary)}
                        </span>
                      </div>

                      {summary.compensations.map((item) => (
                        <div
                          key={`fixed-${item.id}`}
                          className="flex items-center justify-between gap-4 rounded-2xl px-4 py-3 ring-1 ring-border/60"
                        >
                          <div className="min-w-0">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Fixed compensation
                            </p>
                          </div>
                          <span className="shrink-0 font-medium">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}

                      {summary.variable_compensations.map((item) => (
                        <div
                          key={`variable-comp-${item.id}`}
                          className="flex items-center justify-between gap-4 rounded-2xl px-4 py-3 ring-1 ring-border/60"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Variable compensation
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="shrink-0 font-medium">
                              {formatCurrency(item.amount)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                void removeVariableAdjustment(
                                  "earning",
                                  item.id,
                                )
                              }
                              disabled={
                                !canEditAdjustments ||
                                removingAdjustmentKey === `earning-${item.id}`
                              }
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {summary.compensations.length === 0 &&
                      summary.variable_compensations.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border/80 px-4 py-6 text-center text-sm text-muted-foreground">
                          No additional compensation items for this payslip.
                        </div>
                      ) : null}
                    </div>
                  </section>

                  <section className="rounded-3xl border border-border/60 bg-background p-4 shadow-sm sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">Deductions</p>
                        <p className="text-sm text-muted-foreground">
                          Statutory deductions and manual deductions applied to
                          this cutoff.
                        </p>
                      </div>
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                        -{formatCurrency(summary.total_deductions)}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3 text-sm">
                      {[
                        ["SSS", summary.sss_deduction],
                        ["PhilHealth", summary.philhealth_deduction],
                        ["Pag-IBIG", summary.pag_ibig_deduction],
                        ["MP2", summary.mp2_deduction],
                        ["Tax", summary.tax_deduction],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3"
                        >
                          <span>{label}</span>
                          <span className="font-medium">
                            {formatCurrency(value)}
                          </span>
                        </div>
                      ))}

                      {summary.variable_deductions.map((item) => (
                        <div
                          key={`variable-ded-${item.id}`}
                          className="flex items-center justify-between gap-4 rounded-2xl px-4 py-3 ring-1 ring-border/60"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Variable deduction
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="shrink-0 font-medium">
                              {formatCurrency(item.amount)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                void removeVariableAdjustment(
                                  "deduction",
                                  item.id,
                                )
                              }
                              disabled={
                                !canEditAdjustments ||
                                removingAdjustmentKey === `deduction-${item.id}`
                              }
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
              <div className="shrink-0 border-t border-border/60 bg-background px-4 py-3 sm:px-6">
                <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UserRound className="size-4" />
                    Export this breakdown as a printable payslip snapshot.
                  </div>
                  <Button variant="outline" onClick={downloadSummaryPdf}>
                    <FileDown className="size-4" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
