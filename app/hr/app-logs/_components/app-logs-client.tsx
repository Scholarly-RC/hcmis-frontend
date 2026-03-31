"use client";

import { Loader2, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { HrModulePageScaffold } from "@/components/hr/module-scaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AppLogRecord } from "@/lib/app-logs";
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function defaultDate() {
  return new Date().toISOString().slice(0, 10);
}

export function AppLogsClient() {
  const [selectedDate, setSelectedDate] = useState(defaultDate());
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AppLogRecord[]>([]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ selected_date: selectedDate });
      if (userId.trim().length > 0) {
        params.set("user_id", userId.trim());
      }
      const data = await requestJson<AppLogRecord[]>(
        `/api/app-logs?${params.toString()}`,
      );
      setLogs(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load app logs.",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedDate, userId]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  return (
    <HrModulePageScaffold
      title="App Logs"
      description="Inspect application activity logs for operational auditing."
      actions={
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadLogs()}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <RefreshCcw className="mr-2 size-4" />
          )}
          Refresh
        </Button>
      }
    >
      <div className="grid gap-3 rounded-2xl border border-border/70 bg-card/85 p-4 shadow-lg shadow-black/5 sm:grid-cols-2 lg:grid-cols-3">
        <label htmlFor="app-logs-date" className="space-y-1 text-sm">
          <span className="text-muted-foreground">Selected date</span>
          <Input
            id="app-logs-date"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>
        <label htmlFor="app-logs-user-id" className="space-y-1 text-sm">
          <span className="text-muted-foreground">User ID (optional)</span>
          <Input
            id="app-logs-user-id"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="e.g. 12"
          />
        </label>
        <div className="flex items-end">
          <Button
            type="button"
            onClick={() => void loadLogs()}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Apply Filters
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/85 p-4 shadow-lg shadow-black/5">
        <div className="mb-3 text-sm text-muted-foreground">
          Showing {logs.length} log entr{logs.length === 1 ? "y" : "ies"}.
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.id}</TableCell>
                  <TableCell>{log.user_id}</TableCell>
                  <TableCell className="max-w-[560px] truncate">
                    {log.details}
                  </TableCell>
                  <TableCell>{formatDateTime(log.created_at)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-sm text-muted-foreground"
                >
                  No logs found for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </HrModulePageScaffold>
  );
}
