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
  SpecialRequestApproverAssignment,
  SpecialRequestStatus,
} from "@/lib/special-requests";
import {
  specialRequestStatusClass,
  specialRequestStatusLabel,
} from "@/lib/special-requests";
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

type CreateSpecialRequestFormValues = {
  date: string;
  info: string;
  time?: string;
  punch?: "IN" | "OUT";
};

type SpecialRequestRecord = {
  id: number;
  user_id: string;
  date: string;
  time?: string | null;
  punch?: "IN" | "OUT" | null;
  info: string | null;
  status: SpecialRequestStatus;
  approver_pool: Array<{
    approver_id: string;
    acted_at: string | null;
    approver: { first_name: string; last_name: string; email: string } | null;
  }>;
};

type SpecialRequestConfig = {
  pageTitle: string;
  pageDescription: string;
  createDialogTitle: string;
  createDialogDescription: string;
  createButtonLabel: string;
  submitSuccessMessage: string;
  cancelSuccessMessage: string;
  noApproverMessage: string;
  requestNoun: string;
  includeAttendanceDetails?: boolean;
  listPath: string;
  approverPath: string;
  createPath: string;
  cancelPathBase: string;
};

type MySpecialRequestClientProps = {
  currentUserId: string;
  config: SpecialRequestConfig;
};

function buildCreateSpecialRequestSchema(includeAttendanceDetails: boolean) {
  return z
    .object({
      date: z.string().min(1, "Date is required."),
      info: z.string().trim().min(1, "Info is required."),
      time: z.string().optional(),
      punch: z.enum(["IN", "OUT"]).optional(),
    })
    .superRefine((values, context) => {
      if (!includeAttendanceDetails) {
        return;
      }
      if (!values.time || values.time.trim().length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Time is required.",
          path: ["time"],
        });
      }
      if (values.punch !== "IN" && values.punch !== "OUT") {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Punch type is required.",
          path: ["punch"],
        });
      }
    });
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

function getCreateErrorMessage(error: unknown, requestNoun: string) {
  if (!(error instanceof Error)) {
    return `Unable to submit ${requestNoun}.`;
  }
  if (error.message.includes("active overtime request already exists")) {
    return "You already have a pending or approved overtime request for that date.";
  }
  if (error.message.includes("active leave request already exists")) {
    return "You already have a pending or approved leave request for that date.";
  }
  if (
    error.message.includes("active official business request already exists")
  ) {
    return "You already have a pending or approved official business request for that date.";
  }
  if (
    error.message.includes(
      "active certificate of attendance request already exists",
    )
  ) {
    return "You already have a pending or approved certificate of attendance request for that date.";
  }
  return error.message;
}

export function MySpecialRequestClient({
  currentUserId,
  config,
}: MySpecialRequestClientProps) {
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<SpecialRequestRecord[]>([]);
  const [assignedApprover, setAssignedApprover] =
    useState<SpecialRequestApproverAssignment | null>(null);
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
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateSpecialRequestFormValues>({
    resolver: zodResolver(
      buildCreateSpecialRequestSchema(config.includeAttendanceDetails === true),
    ),
    defaultValues: {
      date: "",
      info: "",
      time: "",
      punch: "IN",
    },
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [requestsResponse, approverResponse] = await Promise.all([
          requestJson<SpecialRequestRecord[]>(config.listPath),
          requestJson<SpecialRequestApproverAssignment>(config.approverPath),
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
            : `Unable to load ${config.requestNoun}.`,
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [config.approverPath, config.listPath, config.requestNoun]);

  const selectedDate = watch("date");
  const infoValue = watch("info");
  const selectedTime = watch("time");
  const selectedPunch = watch("punch");

  const isSubmitDisabled =
    (assignedApprover?.approver_ids.length ?? 0) === 0 ||
    !selectedDate ||
    !infoValue?.trim() ||
    (config.includeAttendanceDetails === true &&
      (!selectedTime || (selectedPunch !== "IN" && selectedPunch !== "OUT"))) ||
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

  const filteredRequests = useMemo(() => {
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
  }, [filters, requests]);

  async function handleCreateRequest(values: CreateSpecialRequestFormValues) {
    try {
      if ((assignedApprover?.approver_ids.length ?? 0) === 0) {
        toast.error(config.noApproverMessage);
        return;
      }

      const created = await requestJson<SpecialRequestRecord>(
        config.createPath,
        {
          method: "POST",
          body: JSON.stringify({
            user_id: currentUserId,
            date: values.date,
            info: values.info.trim(),
            ...(config.includeAttendanceDetails === true
              ? {
                  time: values.time ?? "",
                  punch: values.punch ?? "IN",
                }
              : {}),
          }),
        },
      );

      setRequests((prev) => [created, ...prev]);
      reset({
        date: "",
        info: "",
        time: "",
        punch: "IN",
      });
      setIsCreateDialogOpen(false);
      toast.success(config.submitSuccessMessage);
    } catch (error) {
      toast.error(getCreateErrorMessage(error, config.requestNoun));
    }
  }

  async function handleCancelRequest(requestId: number) {
    setDeletingId(requestId);
    try {
      const cancelled = await requestJson<SpecialRequestRecord>(
        `${config.cancelPathBase}/${requestId}/cancel`,
        {
          method: "PATCH",
        },
      );
      setRequests((prev) =>
        prev.map((item) => (item.id === requestId ? cancelled : item)),
      );
      toast.success(config.cancelSuccessMessage);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Unable to cancel ${config.requestNoun}.`,
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card/85 p-4 shadow-lg shadow-black/5 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
              {config.pageTitle}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              {config.pageDescription}
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
                Filter requests by month, year, and current status.
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
                    time: "",
                    punch: "IN",
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
                  {config.createButtonLabel}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{config.createDialogTitle}</DialogTitle>
                  <DialogDescription>
                    {config.createDialogDescription}
                  </DialogDescription>
                </DialogHeader>

                <form
                  onSubmit={handleSubmit(handleCreateRequest)}
                  className="grid gap-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="special-request-date">Date</Label>
                    <Input
                      id="special-request-date"
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
                    <Label htmlFor="special-request-info">Reason</Label>
                    <Textarea
                      id="special-request-info"
                      rows={4}
                      {...register("info")}
                      placeholder="Provide request details."
                    />
                    {errors.info ? (
                      <p className="text-xs text-destructive">
                        {errors.info.message}
                      </p>
                    ) : null}
                  </div>

                  {config.includeAttendanceDetails === true ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input type="hidden" {...register("punch")} />
                      <div className="space-y-2">
                        <Label htmlFor="special-request-time">Time</Label>
                        <Input
                          id="special-request-time"
                          type="time"
                          className="h-10"
                          {...register("time")}
                        />
                        {errors.time ? (
                          <p className="text-xs text-destructive">
                            {errors.time.message}
                          </p>
                        ) : null}
                      </div>
                      <SelectField
                        id="special-request-punch"
                        label="Punch Type"
                        value={selectedPunch ?? "IN"}
                        onChange={(_, value) =>
                          setValue(
                            "punch",
                            value === "IN" || value === "OUT" ? value : "IN",
                            { shouldDirty: true, shouldValidate: true },
                          )
                        }
                        options={[
                          { value: "IN", label: "IN" },
                          { value: "OUT", label: "OUT" },
                        ]}
                        placeholder="Select punch type"
                      />
                      {errors.punch ? (
                        <p className="text-xs text-destructive sm:col-span-2">
                          {errors.punch.message}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

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
              {config.noApproverMessage}
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
              Loading requests...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    {config.includeAttendanceDetails === true ? (
                      <>
                        <TableHead>Time</TableHead>
                        <TableHead>Punch</TableHead>
                      </>
                    ) : null}
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
                        colSpan={
                          config.includeAttendanceDetails === true ? 7 : 5
                        }
                        className="py-8 text-center text-muted-foreground"
                      >
                        No requests found.
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
                          {config.includeAttendanceDetails === true ? (
                            <>
                              <TableCell>{request.time ?? "-"}</TableCell>
                              <TableCell>{request.punch ?? "-"}</TableCell>
                            </>
                          ) : null}
                          <TableCell>
                            <Badge
                              className={cn(
                                "border-0 font-medium",
                                specialRequestStatusClass(request.status),
                              )}
                            >
                              {specialRequestStatusLabel(request.status)}
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
                            {request.status === "PENDING" &&
                            request.user_id === currentUserId ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={deletingId === request.id}
                                onClick={() =>
                                  void handleCancelRequest(request.id)
                                }
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
