"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
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
  requestJson,
  toNumber,
} from "@/lib/payroll";
import { toast } from "@/lib/toast";
import type { AuthUser } from "@/types/auth";

type MyPayslipsClientProps = {
  user: AuthUser;
};

function parsePositiveInt(value: string | null) {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatCurrency(value: string | number | null | undefined) {
  return toNumber(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function MyPayslipsClient({ user }: MyPayslipsClientProps) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [payslips, setPayslips] = useState<PayrollPayslip[]>([]);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState<PayslipSummary | null>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollPayslip | null>(
    null,
  );
  const [highlightedPayslipId, setHighlightedPayslipId] = useState<
    number | null
  >(null);
  const handledDeepLinkPayslipIdRef = useRef<number | null>(null);
  const deepLinkedPayslipId = parsePositiveInt(searchParams.get("payslip_id"));

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

  const openSummary = useCallback(
    async (payslipId: number) => {
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
    },
    [payslips],
  );

  useEffect(() => {
    if (!deepLinkedPayslipId || loading) {
      return;
    }
    const exists = payslips.some((item) => item.id === deepLinkedPayslipId);
    if (!exists) {
      return;
    }
    setHighlightedPayslipId(deepLinkedPayslipId);
    requestAnimationFrame(() => {
      document
        .getElementById(`my-payslip-row-${deepLinkedPayslipId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const timer = window.setTimeout(() => {
      setHighlightedPayslipId((current) =>
        current === deepLinkedPayslipId ? null : current,
      );
    }, 4000);
    if (handledDeepLinkPayslipIdRef.current !== deepLinkedPayslipId) {
      handledDeepLinkPayslipIdRef.current = deepLinkedPayslipId;
      void openSummary(deepLinkedPayslipId);
    }
    return () => {
      window.clearTimeout(timer);
    };
  }, [deepLinkedPayslipId, loading, openSummary, payslips]);

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
        status: selectedPayslip.released ? "Released" : "Draft",
        basePay: formatCurrency(summary.salary),
        grossPay: formatCurrency(summary.gross_pay),
        totalDeductions: formatCurrency(summary.total_deductions),
        netSalary: formatCurrency(summary.net_salary),
        earnings: [
          {
            label: "Base Pay",
            amount: formatCurrency(summary.salary),
          },
          ...summary.compensations.map((item) => ({
            label: item.name,
            amount: formatCurrency(item.amount),
            note: "Fixed compensation",
          })),
          ...summary.variable_compensations.map((item) => ({
            label: item.name,
            amount: formatCurrency(item.amount),
            note: "Variable compensation",
          })),
        ],
        deductions: [
          {
            label: "SSS",
            amount: formatCurrency(summary.sss_deduction),
          },
          {
            label: "PhilHealth",
            amount: formatCurrency(summary.philhealth_deduction),
          },
          {
            label: "Pag-IBIG",
            amount: formatCurrency(summary.pag_ibig_deduction),
          },
          {
            label: "MP2",
            amount: formatCurrency(summary.mp2_deduction),
          },
          {
            label: "Tax",
            amount: formatCurrency(summary.tax_deduction),
          },
          ...summary.variable_deductions.map((item) => ({
            label: item.name,
            amount: formatCurrency(item.amount),
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
                <TableCell colSpan={5}>
                  <div className="space-y-2 py-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </TableCell>
              </TableRow>
            ) : payslips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  No released payslips available.
                </TableCell>
              </TableRow>
            ) : (
              payslips.map((payslip) => (
                <TableRow
                  id={`my-payslip-row-${payslip.id}`}
                  key={payslip.id}
                  className={
                    highlightedPayslipId === payslip.id
                      ? "bg-primary/5 ring-1 ring-primary/40"
                      : undefined
                  }
                >
                  <TableCell>
                    {payslip.month ?? "-"} / {payslip.year ?? "-"}
                  </TableCell>
                  <TableCell>{payslip.period ?? "-"}</TableCell>
                  <TableCell>{payslip.rank ?? "-"}</TableCell>
                  <TableCell>{formatCurrency(payslip.salary)}</TableCell>
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
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-8 w-32" />
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <p>Period: {summary.period ?? "-"}</p>
              <p>Gross Pay: {formatCurrency(summary.gross_pay)}</p>
              <p>
                Total Deductions: {formatCurrency(summary.total_deductions)}
              </p>
              <p className="font-medium">
                Net Salary: {formatCurrency(summary.net_salary)}
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
