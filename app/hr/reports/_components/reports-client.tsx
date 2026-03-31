"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { HrModulePageScaffold } from "@/components/hr/module-scaffold";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ReportCatalogEntry } from "@/lib/reports";
import { toast } from "@/lib/toast";

type RequestError = {
  detail?: string;
};

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

export function ReportsClient() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [selectedDate, setSelectedDate] = useState(defaultDate());
  const [fromDate, setFromDate] = useState(defaultDate());
  const [toDate, setToDate] = useState(defaultDate());
  const [catalog, setCatalog] = useState<ReportCatalogEntry[] | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [running, setRunning] = useState<string | null>(null);

  const actions = useMemo(
    () => [
      {
        key: "catalog",
        label: "Refresh Catalog",
        run: async () => {
          const data = await requestJson<ReportCatalogEntry[]>(
            "/api/reports/catalog",
          );
          setCatalog(data);
          setResult({ catalog_modules: data.length, data });
        },
      },
      {
        key: "staffing",
        label: "Daily Staffing",
        run: async () => {
          const data = await requestJson<Record<string, unknown>>(
            `/api/reports/attendance/daily-staffing?selected_date=${encodeURIComponent(selectedDate)}`,
          );
          setResult(data);
        },
      },
      {
        key: "payroll-expense",
        label: "Yearly Payroll Expense",
        run: async () => {
          const data = await requestJson<Record<string, unknown>>(
            `/api/reports/payroll/yearly-expense?selected_year=${encodeURIComponent(selectedYear)}`,
          );
          setResult(data);
        },
      },
      {
        key: "user-demographics",
        label: "User Demographics (Gender)",
        run: async () => {
          const data = await requestJson<Record<string, unknown>>(
            `/api/reports/users/demographics/gender?as_of_date=${encodeURIComponent(selectedDate)}`,
          );
          setResult(data);
        },
      },
      {
        key: "resignation",
        label: "Resignation Report",
        run: async () => {
          const data = await requestJson<Record<string, unknown>>(
            `/api/reports/users/resignations?from_date=${encodeURIComponent(fromDate)}&to_date=${encodeURIComponent(toDate)}`,
          );
          setResult(data);
        },
      },
    ],
    [fromDate, selectedDate, selectedYear, toDate],
  );

  async function runAction(action: (typeof actions)[number]) {
    setRunning(action.key);
    try {
      await action.run();
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
      description="Generate HR and operational reports directly from backend data."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle>Report Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label
              htmlFor="reports-selected-year"
              className="space-y-1 text-sm"
            >
              <span className="text-muted-foreground">Selected year</span>
              <Input
                id="reports-selected-year"
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
              />
            </label>
            <label
              htmlFor="reports-selected-date"
              className="space-y-1 text-sm"
            >
              <span className="text-muted-foreground">Selected date</span>
              <Input
                id="reports-selected-date"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </label>
            <label htmlFor="reports-from-date" className="space-y-1 text-sm">
              <span className="text-muted-foreground">From date</span>
              <Input
                id="reports-from-date"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </label>
            <label htmlFor="reports-to-date" className="space-y-1 text-sm">
              <span className="text-muted-foreground">To date</span>
              <Input
                id="reports-to-date"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </label>

            <div className="grid gap-2 pt-2">
              {actions.map((action) => (
                <Button
                  key={action.key}
                  type="button"
                  variant="outline"
                  onClick={() => void runAction(action)}
                  disabled={running !== null}
                  className="justify-start"
                >
                  {running === action.key ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle>Report Output</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Catalog modules: {catalog?.length ?? 0}. Run any report action to
              refresh output.
            </p>
            <pre className="max-h-[520px] overflow-auto rounded-xl border border-border/70 bg-muted/25 p-3 text-xs leading-6">
              {result
                ? JSON.stringify(result, null, 2)
                : "No report output yet."}
            </pre>
          </CardContent>
        </Card>
      </div>
    </HrModulePageScaffold>
  );
}
