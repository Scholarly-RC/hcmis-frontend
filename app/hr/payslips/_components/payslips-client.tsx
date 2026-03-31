"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AuthUser } from "@/lib/auth";
import {
  openPayslipPrintWindow,
  type PayrollPayslip,
  type PayslipSummary,
  requestJson,
  toNumber,
} from "@/lib/payroll";
import { toast } from "@/lib/toast";

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

function currentMonth() {
  return new Date().getMonth() + 1;
}

function currentYear() {
  return new Date().getFullYear();
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
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summary, setSummary] = useState<PayslipSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollPayslip | null>(
    null,
  );

  const userMap = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );

  async function loadPayslips() {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (filters.month) {
        query.set("month", filters.month);
      }
      if (filters.year) {
        query.set("year", filters.year);
      }
      if (filters.user_id) {
        query.set("user_id", filters.user_id);
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
  }

  useEffect(() => {
    async function initialize() {
      const month = String(currentMonth());
      const year = String(currentYear());
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
        try {
          const query = new URLSearchParams();
          query.set("month", month);
          query.set("year", year);
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
      }
    }
    void initialize();
  }, []);

  async function createPayslip() {
    try {
      const userId = Number(createForm.user_id);
      const month = Number(createForm.month);
      const year = Number(createForm.year);
      if (!userId || month < 1 || month > 12 || year < 2000) {
        toast.error("Please enter valid payslip details.");
        return;
      }

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
      await loadPayslips();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to create payslip.",
      );
    }
  }

  async function toggleRelease(payslipId: number) {
    try {
      await requestJson<PayrollPayslip>(
        `/api/payroll/payslips/${payslipId}/release-toggle`,
        { method: "POST" },
      );
      toast.success("Payslip release status updated.");
      await loadPayslips();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to toggle release status.",
      );
    }
  }

  async function openSummary(payslipId: number) {
    try {
      setSummaryOpen(true);
      setSummaryLoading(true);
      setSelectedPayslip(
        payslips.find((item) => item.id === payslipId) ?? null,
      );
      const payload = await requestJson<PayslipSummary>(
        `/api/payroll/payslips/${payslipId}/summary`,
      );
      setSummary(payload);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load summary.",
      );
      setSummaryOpen(false);
    } finally {
      setSummaryLoading(false);
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
        monthYear: `${selectedPayslip.month ?? "-"} / ${selectedPayslip.year ?? "-"}`,
        period: selectedPayslip.period ?? "-",
        rank: selectedPayslip.rank ?? "-",
        grossPay: toNumber(summary.gross_pay).toFixed(2),
        totalDeductions: toNumber(summary.total_deductions).toFixed(2),
        netSalary: toNumber(summary.net_salary).toFixed(2),
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
      <div>
        <h1 className="text-2xl font-semibold">Payslip Management</h1>
        <p className="text-sm text-muted-foreground">
          Generate payslips, review totals, and release finalized records.
        </p>
      </div>

      <div className="grid gap-4 rounded-lg border bg-card p-4 md:grid-cols-5">
        <div className="space-y-2">
          <Label htmlFor="filter_month">Month</Label>
          <Input
            id="filter_month"
            type="number"
            min={1}
            max={12}
            value={filters.month}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                month: event.target.value,
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter_year">Year</Label>
          <Input
            id="filter_year"
            type="number"
            min={2000}
            value={filters.year}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                year: event.target.value,
              }))
            }
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="filter_user">Employee</Label>
          <select
            id="filter_user"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={filters.user_id}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                user_id: event.target.value,
              }))
            }
          >
            <option value="">All employees</option>
            {users.map((user) => {
              const label =
                [user.first_name, user.last_name]
                  .filter(Boolean)
                  .join(" ")
                  .trim() || user.email;
              return (
                <option key={user.id} value={user.id}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
        <div className="flex items-end">
          <Button className="w-full" onClick={() => void loadPayslips()}>
            Apply Filters
          </Button>
        </div>
      </div>

      <div className="grid gap-4 rounded-lg border bg-card p-4 md:grid-cols-5">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="create_user">Employee</Label>
          <select
            id="create_user"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={createForm.user_id}
            onChange={(event) =>
              setCreateForm((current) => ({
                ...current,
                user_id: event.target.value,
              }))
            }
          >
            {users.map((user) => {
              const label =
                [user.first_name, user.last_name]
                  .filter(Boolean)
                  .join(" ")
                  .trim() || user.email;
              return (
                <option key={user.id} value={user.id}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="create_month">Month</Label>
          <Input
            id="create_month"
            type="number"
            min={1}
            max={12}
            value={createForm.month}
            onChange={(event) =>
              setCreateForm((current) => ({
                ...current,
                month: event.target.value,
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="create_year">Year</Label>
          <Input
            id="create_year"
            type="number"
            min={2000}
            value={createForm.year}
            onChange={(event) =>
              setCreateForm((current) => ({
                ...current,
                year: event.target.value,
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="create_period">Period</Label>
          <select
            id="create_period"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={createForm.period}
            onChange={(event) =>
              setCreateForm((current) => ({
                ...current,
                period: event.target.value as "1ST" | "2ND",
              }))
            }
          >
            <option value="1ST">1st</option>
            <option value="2ND">2nd</option>
          </select>
        </div>
        <div className="flex items-end md:col-span-5">
          <Button onClick={() => void createPayslip()}>
            Generate / Refresh Payslip
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Month / Year</TableHead>
              <TableHead>Rank</TableHead>
              <TableHead>Salary</TableHead>
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

                return (
                  <TableRow key={payslip.id}>
                    <TableCell>{userLabel}</TableCell>
                    <TableCell>{payslip.period ?? "-"}</TableCell>
                    <TableCell>
                      {payslip.month ?? "-"} / {payslip.year ?? "-"}
                    </TableCell>
                    <TableCell>{payslip.rank ?? "-"}</TableCell>
                    <TableCell>{toNumber(payslip.salary).toFixed(2)}</TableCell>
                    <TableCell>
                      {payslip.released ? "Released" : "Draft"}
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void openSummary(payslip.id)}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant={payslip.released ? "secondary" : "default"}
                        onClick={() => void toggleRelease(payslip.id)}
                      >
                        {payslip.released ? "Unrelease" : "Release"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payslip Summary</DialogTitle>
            <DialogDescription>
              Computed earnings and deductions for the payslip.
            </DialogDescription>
          </DialogHeader>
          {summaryLoading || !summary ? (
            <p className="text-sm text-muted-foreground">Loading summary...</p>
          ) : (
            <div className="space-y-2 text-sm">
              <p>Period: {summary.period ?? "-"}</p>
              <p>
                Base Salary (per cutoff): {toNumber(summary.salary).toFixed(2)}
              </p>
              <p>Gross Pay: {toNumber(summary.gross_pay).toFixed(2)}</p>
              <p>
                Total Deductions:{" "}
                {toNumber(summary.total_deductions).toFixed(2)}
              </p>
              <p className="font-medium">
                Net Salary: {toNumber(summary.net_salary).toFixed(2)}
              </p>
              <div className="pt-2">
                <p className="font-medium">Mandatory Deductions</p>
                <p>SSS: {toNumber(summary.sss_deduction).toFixed(2)}</p>
                <p>
                  PhilHealth:{" "}
                  {toNumber(summary.philhealth_deduction).toFixed(2)}
                </p>
                <p>
                  Pag-IBIG: {toNumber(summary.pag_ibig_deduction).toFixed(2)}
                </p>
                <p>MP2: {toNumber(summary.mp2_deduction).toFixed(2)}</p>
                <p>Tax: {toNumber(summary.tax_deduction).toFixed(2)}</p>
              </div>
              <Button
                className="mt-3"
                variant="outline"
                onClick={downloadSummaryPdf}
              >
                Download PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
