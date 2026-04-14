"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, ClipboardList, Loader2, Plus } from "lucide-react";
import Link from "next/link";
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
  LeaveRequestCreatePayload,
  LeaveRequestRecord,
  LeaveTypeOption,
} from "@/lib/leave";
import {
  leaveStatusClass,
  leaveStatusLabel,
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

function getLeaveCreateErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Unable to submit leave request.";
  }
  if (error.message.includes("active leave request already exists")) {
    return "You already have a pending or approved leave request for that date.";
  }
  if (error.message.includes("active overtime request already exists")) {
    return "You already have a pending or approved overtime request for that date.";
  }
  return error.message;
}

const createLeaveRequestSchema = z.object({
  leave_date: z.string().min(1, "Date is required."),
  leave_type: z.string().min(1, "Type is required."),
  info: z.string().trim().min(1, "Info is required."),
});

type CreateLeaveRequestFormValues = z.infer<typeof createLeaveRequestSchema>;

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

function parsePositiveInt(value: string | null) {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function filterRequests(requests: LeaveRequestRecord[], filters: FilterState) {
  const selectedYear = parseYearValue(filters.year);
  const selectedMonth = parseMonthValue(filters.month);

  return requests.filter((item) => {
    const date = new Date(item.leave_date);
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

export function MyLeaveClient() {
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<LeaveRequestRecord[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    year: "all",
    month: "all",
    status: "all",
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [highlightedLeaveId, setHighlightedLeaveId] = useState<number | null>(
    null,
  );
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateLeaveRequestFormValues>({
    resolver: zodResolver(createLeaveRequestSchema),
    defaultValues: {
      leave_date: "",
      leave_type: "",
      info: "",
    },
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [typesResponse, requestsResponse] = await Promise.all([
          requestJson<LeaveTypeOption[]>("/api/leave/types"),
          requestJson<LeaveRequestRecord[]>("/api/leave/requests/me"),
        ]);

        if (!mounted) {
          return;
        }

        setLeaveTypes(typesResponse);
        setRequests(requestsResponse);
        const defaultLeaveType = typesResponse[0]?.value ?? "";
        if (defaultLeaveType) {
          setValue("leave_type", defaultLeaveType, {
            shouldDirty: false,
            shouldValidate: true,
          });
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Unable to load leave data.",
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
  }, [setValue]);

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

  const filteredRequests = useMemo(
    () => filterRequests(requests, filters),
    [requests, filters],
  );
  const deepLinkedLeaveId = parsePositiveInt(searchParams.get("leave_id"));

  useEffect(() => {
    if (!deepLinkedLeaveId) {
      return;
    }
    const exists = filteredRequests.some(
      (item) => item.id === deepLinkedLeaveId,
    );
    if (!exists) {
      return;
    }
    setHighlightedLeaveId(deepLinkedLeaveId);
    requestAnimationFrame(() => {
      document
        .getElementById(`leave-row-${deepLinkedLeaveId}`)
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
  }, [deepLinkedLeaveId, filteredRequests]);

  const selectedLeaveType = watch("leave_type");
  const selectedLeaveDate = watch("leave_date");
  const leaveInfoValue = watch("info");
  const isCreateFormIncomplete =
    !selectedLeaveDate || !leaveInfoValue || !leaveInfoValue.trim();

  async function handleCreateRequest(values: CreateLeaveRequestFormValues) {
    try {
      const payload: LeaveRequestCreatePayload = {
        leave_date: values.leave_date,
        leave_type:
          values.leave_type as LeaveRequestCreatePayload["leave_type"],
        info: values.info.trim(),
      };

      const created = await requestJson<LeaveRequestRecord>(
        "/api/leave/requests/me",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      setRequests((prev) => [created, ...prev]);
      reset({ leave_date: "", leave_type: values.leave_type, info: "" });
      setIsCreateDialogOpen(false);
      toast.success("Leave request submitted.");
    } catch (error) {
      toast.error(getLeaveCreateErrorMessage(error));
    }
  }

  async function handleCancelRequest(leaveId: number) {
    setDeletingId(leaveId);
    try {
      const cancelled = await requestJson<LeaveRequestRecord>(
        `/api/leave/requests/${leaveId}/cancel`,
        {
          method: "PATCH",
        },
      );
      setRequests((prev) =>
        prev.map((item) => (item.id === leaveId ? cancelled : item)),
      );
      toast.success("Leave request cancelled.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to cancel leave request.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function canCancelRequest(item: LeaveRequestRecord) {
    return item.status === "PENDING";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card/85 p-4 shadow-lg shadow-black/5 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
              My Leave
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Submit leave requests and track approvals.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/requests/inbox">
              <ClipboardList className="size-4" />
              Open Request Inbox
            </Link>
          </Button>
        </div>
      </section>

      <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>My Requests</CardTitle>
              <CardDescription>
                Filter and review your leave submissions.
              </CardDescription>
            </div>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button type="button">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Leave Request
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Leave Request</DialogTitle>
                  <DialogDescription>Create a leave request.</DialogDescription>
                </DialogHeader>
                <form
                  className="space-y-4"
                  onSubmit={handleSubmit(handleCreateRequest)}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="leave_date">Date</Label>
                      <Input
                        id="leave_date"
                        type="date"
                        className="h-10"
                        aria-invalid={errors.leave_date ? "true" : "false"}
                        disabled={isSubmitting}
                        {...register("leave_date")}
                      />
                      {errors.leave_date ? (
                        <p className="text-xs text-destructive">
                          {errors.leave_date.message}
                        </p>
                      ) : null}
                    </div>
                    <SelectField
                      id="leave_type"
                      label="Type"
                      value={selectedLeaveType}
                      onChange={(_, value) =>
                        setValue("leave_type", value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      options={leaveTypes.map((item) => ({
                        value: item.value,
                        label: item.label,
                      }))}
                      placeholder="Select type"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leave_info">Info</Label>
                    <Textarea
                      id="leave_info"
                      aria-invalid={errors.info ? "true" : "false"}
                      disabled={isSubmitting}
                      placeholder="Reason or details"
                      {...register("info")}
                    />
                    {errors.info ? (
                      <p className="text-xs text-destructive">
                        {errors.info.message}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSubmitting || isCreateFormIncomplete}
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Submit Request
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField
              id="filter_year"
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
              id="filter_month"
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
              id="filter_status"
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
              Loading leave requests...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
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
                        colSpan={6}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No leave requests found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequests.map((item) => {
                      const actedAssignment = item.approver_pool.find(
                        (assignment) => assignment.acted_at !== null,
                      );
                      const actedByLabel = actedAssignment?.approver
                        ? `${actedAssignment.approver.first_name} ${actedAssignment.approver.last_name}`.trim()
                        : "Pending";
                      return (
                        <TableRow
                          id={`leave-row-${item.id}`}
                          key={item.id}
                          className={cn(
                            highlightedLeaveId === item.id &&
                              "bg-primary/5 ring-1 ring-primary/40",
                          )}
                        >
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
                              {leaveStatusLabel(item.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs text-muted-foreground">
                              Acted: {actedByLabel}
                            </p>
                          </TableCell>
                          <TableCell className="max-w-[18rem] whitespace-normal text-sm text-muted-foreground">
                            {item.info || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {canCancelRequest(item) ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={deletingId === item.id}
                                onClick={() => handleCancelRequest(item.id)}
                              >
                                {deletingId === item.id ? (
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
