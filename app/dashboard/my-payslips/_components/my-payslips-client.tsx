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
