"use client";

import { ArrowLeft, Check, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SelectField } from "@/components/form-select-field";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type LeaveRequestRecord,
  leaveStatusClass,
  leaveTypeLabel,
} from "@/lib/leave";
import { toast } from "@/lib/toast";
import { cn } from "@/utils/cn";

type RequestError = {
  detail?: string;
};

type FilterState = {
  year: string;
  month: string;
  status: string;
};

async function requestJson<T>(
  pathname: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(pathname, {
    ...init,
    headers,
    cache: "no-store",
  });

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function parseNumeric(value: string) {
  if (value === "all") {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePositiveInt(value: string | null) {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function LeaveInboxClient() {
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<LeaveRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    year: "all",
    month: "all",
    status: "PENDING",
  });
  const [actionState, setActionState] = useState<
    Record<number, "approve" | "reject" | undefined>
  >({});
  const [highlightedLeaveId, setHighlightedLeaveId] = useState<number | null>(
    null,
  );
  const deepLinkedLeaveId = parsePositiveInt(searchParams.get("leave_id"));

  useEffect(() => {
    if (!deepLinkedLeaveId) {
      return;
    }
    setFilters((current) => ({
      ...current,
      status: "all",
    }));
  }, [deepLinkedLeaveId]);

  useEffect(() => {
    let mounted = true;

    async function loadRequests(state: FilterState) {
      const search = new URLSearchParams();
      if (state.year !== "all") {
        search.set("year", state.year);
      }
      if (state.month !== "all") {
        search.set("month", state.month);
      }
      if (state.status !== "all") {
        search.set("status", state.status);
      }

      const query = search.toString();
      const pathname =
        query.length > 0
          ? `/api/leave/requests/review?${query}`
          : "/api/leave/requests/review";

      const response = await requestJson<LeaveRequestRecord[]>(pathname);
      if (mounted) {
        setRequests(response);
      }
    }

    loadRequests(filters)
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to load review inbox.",
        );
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [filters]);

  const yearOptions = useMemo(() => {
    const values = new Set<number>();
    for (const request of requests) {
      const year = new Date(request.leave_date).getUTCFullYear();
      if (Number.isFinite(year)) {
        values.add(year);
      }
    }
    return Array.from(values).sort((a, b) => b - a);
  }, [requests]);

  const filteredRows = useMemo(() => {
    const selectedYear = parseNumeric(filters.year);
    const selectedMonth = parseNumeric(filters.month);

    return requests.filter((request) => {
      const date = new Date(request.leave_date);
      if (selectedYear !== null && date.getUTCFullYear() !== selectedYear) {
        return false;
      }
      if (selectedMonth !== null && date.getUTCMonth() + 1 !== selectedMonth) {
        return false;
      }
      return true;
    });
  }, [requests, filters]);

  useEffect(() => {
    if (!deepLinkedLeaveId) {
      return;
    }
    const exists = filteredRows.some((item) => item.id === deepLinkedLeaveId);
    if (!exists) {
      return;
    }
    setHighlightedLeaveId(deepLinkedLeaveId);
    requestAnimationFrame(() => {
      document
        .getElementById(`leave-inbox-row-${deepLinkedLeaveId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const timer = window.setTimeout(() => {
      setHighlightedLeaveId((current) =>
        current === deepLinkedLeaveId ? null : current,
      );
    }, 4000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [deepLinkedLeaveId, filteredRows]);

  async function respond(leaveId: number, response: "APPROVE" | "REJECT") {
    setActionState((prev) => ({
      ...prev,
      [leaveId]: response === "APPROVE" ? "approve" : "reject",
    }));

    try {
      const updated = await requestJson<LeaveRequestRecord>(
        `/api/leave/requests/${leaveId}/review`,
        {
          method: "PATCH",
          body: JSON.stringify({ response }),
        },
      );

      setRequests((prev) =>
        prev.map((item) =>
          item.id === leaveId ? { ...item, ...updated } : item,
        ),
      );
      toast.success(
        response === "APPROVE"
          ? "Leave request approved."
          : "Leave request rejected.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to submit review.",
      );
    } finally {
      setActionState((prev) => ({ ...prev, [leaveId]: undefined }));
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card/85 p-4 shadow-lg shadow-black/5 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
              Leave Review Inbox
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Approve or reject leave requests routed to your approval chain.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/leave">
              <ArrowLeft className="size-4" />
              Back to My Leave
            </Link>
          </Button>
        </div>
      </section>

      <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Narrow requests by period and status.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <SelectField
            id="review_year"
            label="Year"
            value={filters.year}
            onChange={(_, value) =>
              setFilters((prev) => ({ ...prev, year: value }))
            }
            options={[
              { value: "all", label: "All years" },
              ...yearOptions.map((year) => ({
                value: year.toString(),
                label: year.toString(),
              })),
            ]}
            placeholder="Year"
          />
          <SelectField
            id="review_month"
            label="Month"
            value={filters.month}
            onChange={(_, value) =>
              setFilters((prev) => ({ ...prev, month: value }))
            }
            options={[
              { value: "all", label: "All months" },
              ...Array.from({ length: 12 }, (_, index) => ({
                value: (index + 1).toString(),
                label: new Date(2000, index, 1).toLocaleString("en-US", {
                  month: "long",
                }),
              })),
            ]}
            placeholder="Month"
          />
          <SelectField
            id="review_status"
            label="Status"
            value={filters.status}
            onChange={(_, value) =>
              setFilters((prev) => ({ ...prev, status: value }))
            }
            options={[
              { value: "all", label: "All statuses" },
              { value: "PENDING", label: "Pending" },
              { value: "APPROVED", label: "Approved" },
              { value: "REJECTED", label: "Rejected" },
            ]}
            placeholder="Status"
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
        <CardHeader>
          <CardTitle>Requests</CardTitle>
          <CardDescription>
            Requests where you are in the eligible approver pool.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading review inbox...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approvals</TableHead>
                    <TableHead>Info</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No review requests found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((item) => {
                      const approving = actionState[item.id] === "approve";
                      const rejecting = actionState[item.id] === "reject";
                      const canRespond = item.status === "PENDING";
                      const actedAssignment = item.approver_pool.find(
                        (assignment) => assignment.acted_at !== null,
                      );
                      const actedByLabel = actedAssignment?.approver
                        ? `${actedAssignment.approver.first_name} ${actedAssignment.approver.last_name}`.trim()
                        : "Pending";

                      return (
                        <TableRow
                          id={`leave-inbox-row-${item.id}`}
                          key={item.id}
                          className={cn(
                            highlightedLeaveId === item.id &&
                              "bg-primary/5 ring-1 ring-primary/40",
                          )}
                        >
                          <TableCell>
                            {item.user
                              ? `${item.user.first_name} ${item.user.last_name}`
                              : `User #${item.user_id}`}
                          </TableCell>
                          <TableCell>{formatDate(item.leave_date)}</TableCell>
                          <TableCell>
                            {leaveTypeLabel(item.leave_type)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "border-0 font-medium",
                                leaveStatusClass(item.status),
                              )}
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs text-muted-foreground">
                              Eligible: {item.approver_pool.length}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Acted: {actedByLabel}
                            </p>
                          </TableCell>
                          <TableCell className="max-w-[18rem] whitespace-normal text-sm text-muted-foreground">
                            {item.info || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                disabled={!canRespond || approving || rejecting}
                                onClick={() => respond(item.id, "APPROVE")}
                              >
                                {approving ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="mr-2 h-4 w-4" />
                                )}
                                Approve
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                disabled={!canRespond || approving || rejecting}
                                onClick={() => respond(item.id, "REJECT")}
                              >
                                {rejecting ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="mr-2 h-4 w-4" />
                                )}
                                Reject
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
