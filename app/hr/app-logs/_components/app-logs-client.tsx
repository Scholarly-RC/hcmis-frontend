"use client";

import { ChevronLeft, ChevronRight, Loader2, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HrModulePageScaffold } from "@/components/hr/module-scaffold";
import { Button } from "@/components/ui/button";
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
import type { AppLogPage, AppLogRecord } from "@/lib/app-logs";
import { toast } from "@/lib/toast";
import type { AuthUser } from "@/types/auth";
import { type DebouncedFunction, debounce } from "@/utils/debounce";

type RequestError = {
  detail?: string;
};

const PAGE_SIZE = 20;

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

function buildDisplayName(user: AuthUser) {
  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || user.email;
}

export function AppLogsClient() {
  const [selectedDate, setSelectedDate] = useState("");
  const [userId, setUserId] = useState("all");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AppLogRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const debouncedLoadLogsRef = useRef<DebouncedFunction<
    [input: { selectedDate: string; userId: string; page: number }]
  > | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const data = await requestJson<AuthUser[]>(
        "/api/users?active_only=true&include_superusers=true",
      );
      setUsers(
        data
          .filter((user) => user.is_active)
          .sort((a, b) =>
            buildDisplayName(a).localeCompare(buildDisplayName(b)),
          ),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load users.",
      );
    }
  }, []);

  const usersById = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );

  const loadLogs = useCallback(
    async (input: { selectedDate: string; userId: string; page: number }) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (input.selectedDate.trim().length > 0) {
          params.set("selected_date", input.selectedDate.trim());
        }
        if (input.userId !== "all") {
          params.set("user_id", input.userId);
        }
        params.set("page", String(input.page));
        params.set("page_size", String(PAGE_SIZE));
        const data = await requestJson<AppLogPage>(
          `/api/app-logs?${params.toString()}`,
        );
        setLogs(data.items);
        setTotal(data.total);
        setTotalPages(Math.max(data.total_pages, 1));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Unable to load app logs.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  if (!debouncedLoadLogsRef.current) {
    debouncedLoadLogsRef.current = debounce((input) => {
      void loadLogs(input);
    }, 300);
  }

  useEffect(() => {
    const debouncedLoadLogs = debouncedLoadLogsRef.current;
    debouncedLoadLogs?.({ selectedDate, userId, page });
  }, [selectedDate, userId, page]);

  useEffect(() => {
    const debouncedLoadLogs = debouncedLoadLogsRef.current;
    return () => {
      debouncedLoadLogs?.cancel();
    };
  }, []);

  const startEntry = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endEntry = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total);

  return (
    <HrModulePageScaffold
      title="App Logs"
      description="Inspect application activity logs for operational auditing."
      actions={
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadLogs({ selectedDate, userId, page })}
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
        <div className="space-y-1 text-sm">
          <Label
            htmlFor="app-logs-user-filter"
            className="text-muted-foreground"
          >
            User
          </Label>
          <Select
            value={userId}
            onValueChange={(value) => {
              setUserId(value);
              setPage(1);
            }}
          >
            <SelectTrigger id="app-logs-user-filter" className="w-full">
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {buildDisplayName(user)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 text-sm">
          <Label htmlFor="app-logs-date" className="text-muted-foreground">
            Date (optional)
          </Label>
          <Input
            id="app-logs-date"
            type="date"
            value={selectedDate}
            onChange={(event) => {
              setSelectedDate(event.target.value);
              setPage(1);
            }}
            className="h-10"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/85 p-4 shadow-lg shadow-black/5">
        <div className="mb-3 text-sm text-muted-foreground">
          Showing {startEntry}-{endEntry} of {total} log entr
          {total === 1 ? "y" : "ies"}.
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User Email</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.id}</TableCell>
                  <TableCell>
                    {usersById.get(log.user_id)?.email ?? log.user_id}
                  </TableCell>
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
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            disabled={loading || page <= 1}
          >
            <ChevronLeft className="mr-1 size-4" />
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((current) =>
                Math.min(current + 1, Math.max(totalPages, 1)),
              )
            }
            disabled={loading || page >= totalPages}
          >
            Next
            <ChevronRight className="ml-1 size-4" />
          </Button>
        </div>
      </div>
    </HrModulePageScaffold>
  );
}
