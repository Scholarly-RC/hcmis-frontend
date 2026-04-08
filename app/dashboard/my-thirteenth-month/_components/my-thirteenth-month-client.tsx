"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  requestJson,
  type ThirteenthMonthPayout,
  toNumber,
} from "@/lib/payroll";
import { toast } from "@/lib/toast";

function parsePositiveInt(value: string | null) {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatCurrency(value: string | number | null | undefined) {
  return toNumber(value).toFixed(2);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

export function MyThirteenthMonthClient() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<ThirteenthMonthPayout[]>([]);
  const highlightedPayoutId = useMemo(
    () => parsePositiveInt(searchParams.get("payout_id")),
    [searchParams],
  );

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await requestJson<ThirteenthMonthPayout[]>(
          "/api/payroll/thirteenth-month/me",
        );
        setPayouts(data);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to load 13th month payouts.",
        );
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>My 13th Month Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Released</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5}>Loading payouts...</TableCell>
                </TableRow>
              ) : payouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    No released payouts available yet.
                  </TableCell>
                </TableRow>
              ) : (
                payouts.map((item) => (
                  <TableRow
                    key={item.id}
                    className={
                      highlightedPayoutId === item.id
                        ? "bg-primary/5 ring-1 ring-primary/40"
                        : undefined
                    }
                  >
                    <TableCell>{item.year}</TableCell>
                    <TableCell>{formatCurrency(item.gross_amount)}</TableCell>
                    <TableCell>
                      {formatCurrency(item.total_deductions)}
                    </TableCell>
                    <TableCell>{formatCurrency(item.net_amount)}</TableCell>
                    <TableCell>{formatDateTime(item.released_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
