"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, Loader2, Plus, Send } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import type {
  OvertimeApproverAssignment,
  OvertimeRequestRecord,
  OvertimeRequestStatus,
} from "@/lib/attendance";
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

type MyOvertimeClientProps = {
  currentUserId: string;
};

const createOvertimeRequestSchema = z.object({
  date: z.string().min(1, "Date is required."),
  info: z.string().trim().min(1, "Info is required."),
});

type CreateOvertimeRequestFormValues = z.infer<
  typeof createOvertimeRequestSchema
>;

type OvertimeCreatePayload = {
  user_id: string;
  date: string;
  info: string;
};

function getOvertimeCreateErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Unable to submit overtime request.";
  }
  if (error.message.includes("active overtime request already exists")) {
    return "You already have a pending or approved overtime request for that date.";
  }
  if (error.message.includes("active leave request already exists")) {
    return "You already have a pending or approved leave request for that date.";
  }
  return error.message;
}

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

function parseYearValue(value: string) {
  if (value === "all") {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseMonthValue(value: string) {
  if (value === "all") {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 12 ? parsed : null;
}

function statusLabel(status: OvertimeRequestStatus) {
  if (status === "APPROVED") {
    return "Approved";
  }
  if (status === "REJECTED") {
    return "Rejected";
  }
  if (status === "CANCELLED") {
    return "Cancelled";
  }
  return "Pending";
}

function statusClass(status: OvertimeRequestStatus) {
  if (status === "APPROVED") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status === "REJECTED") {
    return "bg-rose-100 text-rose-700";
  }
  if (status === "CANCELLED") {
    return "bg-slate-200 text-slate-700";
  }
  return "bg-amber-100 text-amber-700";
}

function filterRequests(
  requests: OvertimeRequestRecord[],
  filters: FilterState,
) {
  const selectedYear = parseYearValue(filters.year);
  const selectedMonth = parseMonthValue(filters.month);

  return requests.filter((item) => {
    const date = new Date(item.date);
    if (selectedYear !== null && date.getUTCFullYear() !== selectedYear) {
      return false;
    }
    if (selectedMonth !== null && date.getUTCMonth() + 1 !== selectedMonth) {
      return false;
    }
    if (filters.status !== "all" && item.status !== filters.status) {
      return false;
    }
    return true;
  });
}

function parseFilterMonth(value: string | null) {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 12
    ? String(parsed)
    : null;
}

function parseFilterYear(value: string | null) {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : null;
}

function parseFilterStatus(value: string | null) {
  if (
    value === "PENDING" ||
    value === "APPROVED" ||
    value === "REJECTED" ||
    value === "CANCELLED"
  ) {
    return value;
  }
  return null;
}

export function MyOvertimeClient({ currentUserId }: MyOvertimeClientProps) {
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<OvertimeRequestRecord[]>([]);
  const [assignedApprover, setAssignedApprover] =
    useState<OvertimeApproverAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    year: "all",
    month: "all",
    status: "all",
  });

  useEffect(() => {
    const month = parseFilterMonth(searchParams.get("month"));
    const year = parseFilterYear(searchParams.get("year"));
    const status = parseFilterStatus(searchParams.get("status"));
    if (!month && !year && !status) {
      return;
    }
    setFilters((current) => {
      const next: FilterState = {
        ...current,
        month: month ?? current.month,
        year: year ?? current.year,
        status: status ?? current.status,
      };
      if (
        next.month === current.month &&
        next.year === current.year &&
        next.status === current.status
      ) {
        return current;
      }
      return next;
    });
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateOvertimeRequestFormValues>({
    resolver: zodResolver(createOvertimeRequestSchema),
    defaultValues: {
      date: "",
      info: "",
    },
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [requestsResponse, approverResponse] = await Promise.all([
          requestJson<OvertimeRequestRecord[]>(
            "/api/attendance/overtime?scope=mine",
          ),
          requestJson<OvertimeApproverAssignment>(
            "/api/attendance/overtime-approvers/me",
          ),
        ]);

        if (!mounted) {
          return;
        }

        setRequests(requestsResponse);
        setAssignedApprover(approverResponse);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to load overtime data.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedDate = watch("date");
  const infoValue = watch("info");

  const isSubmitDisabled =
    (assignedApprover?.approver_ids.length ?? 0) === 0 ||
    !selectedDate ||
    !infoValue?.trim() ||
    isSubmitting;

  const yearOptions = useMemo(() => {
    const values = new Set<number>();
    for (const request of requests) {
      const year = new Date(request.date).getUTCFullYear();
      if (Number.isFinite(year)) {
        values.add(year);
      }
    }
    return Array.from(values).sort((a, b) => b - a);
  }, [requests]);

  const filteredRequests = useMemo(
    () => filterRequests(requests, filters),
    [requests, filters],
  );

  async function handleCreateRequest(values: CreateOvertimeRequestFormValues) {
    try {
      if ((assignedApprover?.approver_ids.length ?? 0) === 0) {
        toast.error("No overtime approver is configured for your account.");
        return;
      }

      const payload: OvertimeCreatePayload = {
        user_id: currentUserId,
        date: values.date,
        info: values.info.trim(),
      };

      const created = await requestJson<OvertimeRequestRecord>(
        "/api/attendance/overtime",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      setRequests((prev) => [created, ...prev]);
      reset({
        date: "",
        info: "",
      });
      setIsCreateDialogOpen(false);
      toast.success("Overtime request submitted.");
    } catch (error) {
      toast.error(getOvertimeCreateErrorMessage(error));
    }
  }

  async function handleCancelRequest(overtimeId: number) {
    setDeletingId(overtimeId);
    try {
      const cancelled = await requestJson<OvertimeRequestRecord>(
        `/api/attendance/overtime/${overtimeId}/cancel`,
        {
          method: "PATCH",
        },
      );
      setRequests((prev) =>
        prev.map((item) => (item.id === overtimeId ? cancelled : item)),
      );
      toast.success("Overtime request cancelled.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to cancel overtime request.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function canCancelRequest(request: OvertimeRequestRecord) {
    return request.status === "PENDING";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card/85 p-4 shadow-lg shadow-black/5 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
              My Overtime
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Submit overtime requests and track decision status in one place.
            </p>
          </div>
        </div>
      </section>

      <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>My Requests</CardTitle>
              <CardDescription>
                Filter overtime records by month, year, and current status.
              </CardDescription>
            </div>

            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={(open) => {
                setIsCreateDialogOpen(open);
                if (!open) {
                  reset({
                    date: "",
                    info: "",
                  });
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  type="button"
                  disabled={(assignedApprover?.approver_ids.length ?? 0) === 0}
                >
                  <Plus className="size-4" />
                  Create Overtime Request
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Submit Overtime Request</DialogTitle>
                  <DialogDescription>
                    Select a date and add context. The approver is assigned
                    automatically using the overtime approver pool.
                  </DialogDescription>
                </DialogHeader>

                <form
                  onSubmit={handleSubmit(handleCreateRequest)}
                  className="grid gap-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="overtime-date">Date</Label>
                    <Input
                      id="overtime-date"
                      type="date"
                      className="h-10"
                      {...register("date")}
                    />
                    {errors.date ? (
                      <p className="text-xs text-destructive">
                        {errors.date.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="overtime-info">Reason</Label>
                    <Textarea
                      id="overtime-info"
                      rows={4}
                      {...register("info")}
                      placeholder="Describe why overtime is needed."
                    />
                    {errors.info ? (
                      <p className="text-xs text-destructive">
                        {errors.info.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitDisabled}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="size-4" />
                          Submit
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(assignedApprover?.approver_ids.length ?? 0) === 0 ? (
            <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
              No eligible overtime approvers are configured for your role and
              department. Please contact HR.
            </p>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-4">
            <SelectField
              id="year"
              label="Year"
              value={filters.year}
              onChange={(_, value) =>
                setFilters((prev) => ({ ...prev, year: value }))
              }
              options={[
                { value: "all", label: "All years" },
                ...yearOptions.map((yearOption) => ({
                  value: yearOption.toString(),
                  label: yearOption.toString(),
                })),
              ]}
              placeholder="Year"
            />
            <SelectField
              id="month"
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
              id="status"
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
                { value: "CANCELLED", label: "Cancelled" },
              ]}
              placeholder="Status"
            />
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading overtime requests...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approvals</TableHead>
                    <TableHead>Info</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No overtime requests found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequests.map((request) => {
                      const actedAssignment = request.approver_pool.find(
                        (assignment) => assignment.acted_at !== null,
                      );
                      const actedByLabel = actedAssignment?.approver
                        ? `${actedAssignment.approver.first_name} ${actedAssignment.approver.last_name}`.trim()
                        : "Pending";

                      return (
                        <TableRow key={request.id}>
                          <TableCell>{formatDate(request.date)}</TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "border-0 font-medium",
                                statusClass(request.status),
                              )}
                            >
                              {statusLabel(request.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs text-muted-foreground">
                              Acted: {actedByLabel}
                            </p>
                          </TableCell>
                          <TableCell className="max-w-[18rem] whitespace-normal text-sm text-muted-foreground">
                            {request.info?.trim() || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {canCancelRequest(request) ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={deletingId === request.id}
                                onClick={() => handleCancelRequest(request.id)}
                              >
                                {deletingId === request.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Ban className="mr-2 h-4 w-4" />
                                )}
                                Cancel
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                No actions
                              </span>
                            )}
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
