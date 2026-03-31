"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type MyPayslipsClientProps = {
  user: AuthUser;
};

export function MyPayslipsClient({ user }: MyPayslipsClientProps) {
  const [loading, setLoading] = useState(true);
  const [payslips, setPayslips] = useState<PayrollPayslip[]>([]);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState<PayslipSummary | null>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollPayslip | null>(
    null,
  );

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await requestJson<PayrollPayslip[]>(
          `/api/payroll/payslips?user_id=${user.id}&released=true`,
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
    void load();
  }, [user.id]);

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
    const employeeLabel =
      [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
      user.email;
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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">My Payslips</h1>
        <p className="text-sm text-muted-foreground">
          Released payroll records available for your account.
        </p>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month / Year</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Rank</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5}>Loading payslips...</TableCell>
              </TableRow>
            ) : payslips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  No released payslips available.
                </TableCell>
              </TableRow>
            ) : (
              payslips.map((payslip) => (
                <TableRow key={payslip.id}>
                  <TableCell>
                    {payslip.month ?? "-"} / {payslip.year ?? "-"}
                  </TableCell>
                  <TableCell>{payslip.period ?? "-"}</TableCell>
                  <TableCell>{payslip.rank ?? "-"}</TableCell>
                  <TableCell>{toNumber(payslip.salary).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void openSummary(payslip.id)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payslip Summary</DialogTitle>
            <DialogDescription>
              Computed breakdown for this payslip.
            </DialogDescription>
          </DialogHeader>
          {summaryLoading || !summary ? (
            <p className="text-sm text-muted-foreground">Loading summary...</p>
          ) : (
            <div className="space-y-2 text-sm">
              <p>Period: {summary.period ?? "-"}</p>
              <p>Gross Pay: {toNumber(summary.gross_pay).toFixed(2)}</p>
              <p>
                Total Deductions:{" "}
                {toNumber(summary.total_deductions).toFixed(2)}
              </p>
              <p className="font-medium">
                Net Salary: {toNumber(summary.net_salary).toFixed(2)}
              </p>
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
