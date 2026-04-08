"use client";

import {
  Check,
  ClipboardCheck,
  Eraser,
  Layers3,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { SelectField } from "@/components/form-select-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import type {
  OvertimeApprover,
  OvertimeApproverUpsertPayload,
  OvertimeRequestRecord,
  OvertimeRequestScope,
  OvertimeRequestStatus,
} from "@/lib/attendance";
import { toast } from "@/lib/toast";
import { cn } from "@/utils/cn";
import { debounce } from "@/utils/debounce";

type OvertimeFilterState = {
  scope: OvertimeRequestScope;
  query: string;
  status: string;
  month: string;
  year: string;
  departmentId: string;
  approverId: string;
};

type DepartmentOption = {
  id: number;
  name: string;
};

type ApproverOption = {
  id: string;
  name: string;
};

type OvertimeManagementClientProps = {
  initialTab: "requests" | "approvers";
  initialRequests: OvertimeRequestRecord[];
  overtimeApprovers: OvertimeApprover[];
  departments: DepartmentOption[];
  approvers: ApproverOption[];
  currentUserId: string;
  isStaff: boolean;
  filters: OvertimeFilterState;
  yearOptions: number[];
};

type DebouncedReplace = {
  (state: OvertimeFilterState): void;
  cancel: () => void;
};

function isSameFilterState(a: OvertimeFilterState, b: OvertimeFilterState) {
  return (
    a.scope === b.scope &&
    a.query === b.query &&
    a.status === b.status &&
    a.month === b.month &&
    a.year === b.year &&
    a.departmentId === b.departmentId &&
    a.approverId === b.approverId
  );
}

function buildUrl(
  pathname: string,
  state: OvertimeFilterState,
  currentSearch: string,
) {
  const search = new URLSearchParams(currentSearch);

  search.set("scope", state.scope);

  if (state.query.trim().length > 0) {
    search.set("q", state.query.trim());
  } else {
    search.delete("q");
  }
  if (state.status !== "all") {
    search.set("status", state.status);
  } else {
    search.delete("status");
  }
  if (state.month !== "all") {
    search.set("month", state.month);
  } else {
    search.delete("month");
  }
  if (state.year !== "all") {
    search.set("year", state.year);
  } else {
    search.delete("year");
  }
  if (state.departmentId !== "all") {
    search.set("department_id", state.departmentId);
  } else {
    search.delete("department_id");
  }
  if (state.approverId !== "all") {
    search.set("approver_id", state.approverId);
  } else {
    search.delete("approver_id");
  }

  const query = search.toString();
  return query.length > 0 ? `${pathname}?${query}` : pathname;
}

function statusLabel(status: OvertimeRequestStatus) {
  if (status === "APP") {
    return "Approved";
  }
  if (status === "REJ") {
    return "Rejected";
  }
  return "Pending";
}

function statusClass(status: OvertimeRequestStatus) {
  if (status === "APP") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status === "REJ") {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-amber-100 text-amber-700";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
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

export function OvertimeManagementClient({
  initialTab,
  initialRequests,
  overtimeApprovers,
  departments,
  approvers,
  currentUserId,
  isStaff,
  filters,
  yearOptions,
}: OvertimeManagementClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"requests" | "approvers">(initialTab);
  const [requests, setRequests] = useState(initialRequests);
  const [approverSettings, setApproverSettings] = useState(overtimeApprovers);
  const [formState, setFormState] = useState<OvertimeFilterState>(filters);
  const [actionMap, setActionMap] = useState<
    Record<number, "approve" | "reject" | "delete" | undefined>
  >({});
  const [approverSavingDepartmentId, setApproverSavingDepartmentId] = useState<
    number | null
  >(null);
  const debouncedReplaceRef = useRef<DebouncedReplace | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    setRequests(initialRequests);
  }, [initialRequests]);

  useEffect(() => {
    setApproverSettings(overtimeApprovers);
  }, [overtimeApprovers]);

  useEffect(() => {
    setFormState((prev) => (isSameFilterState(prev, filters) ? prev : filters));
  }, [filters]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  if (!debouncedReplaceRef.current) {
    debouncedReplaceRef.current = debounce((nextState: OvertimeFilterState) => {
      const nextUrl = buildUrl(pathname, nextState, window.location.search);
      const currentUrl = `${pathname}${window.location.search}`;
      if (nextUrl === currentUrl) {
        return;
      }
      router.replace(nextUrl);
    }, 300);
  }

  useEffect(() => {
    const debouncedReplace = debouncedReplaceRef.current;
    return () => {
      debouncedReplace?.cancel();
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    debouncedReplaceRef.current?.(formState);
  }, [formState]);

  const stats = useMemo(() => {
    const pending = requests.filter((item) => item.status === "PEND").length;
    const approved = requests.filter((item) => item.status === "APP").length;
    const rejected = requests.filter((item) => item.status === "REJ").length;

    return {
      pending,
      approved,
      rejected,
      total: requests.length,
    };
  }, [requests]);

  const approverRows = useMemo(() => {
    const existingByDepartment = new Map(
      approverSettings.map((item) => [item.department_id, item]),
    );
    return departments.map((department) => ({
      department,
      approver: existingByDepartment.get(department.id) ?? null,
    }));
  }, [approverSettings, departments]);

  async function saveApprover(
    departmentId: number,
    payload: OvertimeApproverUpsertPayload,
  ) {
    setApproverSavingDepartmentId(departmentId);

    try {
      const response = await fetch(
        `/api/attendance/overtime-approvers/${departmentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      const result = (await response.json().catch(() => null)) as
        | OvertimeApprover
        | { detail?: string }
        | null;

      if (!response.ok) {
        const detail = result && "detail" in result ? result.detail : null;
        toast.error(detail ?? "Unable to update overtime approvers.");
        return;
      }

      const nextApprover = result as OvertimeApprover;
      setApproverSettings((prev) => {
        const next = prev.filter((item) => item.department_id !== departmentId);
        next.push(nextApprover);
        next.sort((a, b) => {
          const aName = a.department?.name ?? "";
          const bName = b.department?.name ?? "";
          return aName.localeCompare(bName);
        });
        return next;
      });
      toast.success("Overtime approver settings updated.");
    } catch {
      toast.error("Unable to update overtime approvers.");
    } finally {
      setApproverSavingDepartmentId(null);
    }
  }

  async function respond(
    request: OvertimeRequestRecord,
    response: "APPROVE" | "REJECT",
  ) {
    const action = response === "APPROVE" ? "approve" : "reject";
    setActionMap((prev) => ({ ...prev, [request.id]: action }));

    try {
      const httpResponse = await fetch(
        `/api/attendance/overtime/${request.id}/respond`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ response }),
        },
      );
      const payload = (await httpResponse.json().catch(() => null)) as
        | OvertimeRequestRecord
        | { detail?: string }
        | null;

      if (!httpResponse.ok) {
        const detail = payload && "detail" in payload ? payload.detail : null;
        toast.error(detail ?? "Unable to update overtime request.");
        return;
      }

      const nextRequest = payload as OvertimeRequestRecord;
      setRequests((prev) =>
        prev.map((item) =>
          item.id === request.id ? { ...item, ...nextRequest } : item,
        ),
      );
      toast.success(
        response === "APPROVE"
          ? "Overtime request approved."
          : "Overtime request rejected.",
      );
    } catch {
      toast.error("Unable to update overtime request.");
    } finally {
      setActionMap((prev) => ({ ...prev, [request.id]: undefined }));
    }
  }

  async function remove(request: OvertimeRequestRecord) {
    setActionMap((prev) => ({ ...prev, [request.id]: "delete" }));

    try {
      const httpResponse = await fetch(
        `/api/attendance/overtime/${request.id}`,
        {
          method: "DELETE",
        },
      );
      const payload = (await httpResponse.json().catch(() => null)) as {
        detail?: string;
      } | null;

      if (!httpResponse.ok) {
        toast.error(payload?.detail ?? "Unable to delete overtime request.");
        return;
      }

      setRequests((prev) => prev.filter((item) => item.id !== request.id));
      toast.success("Overtime request deleted.");
    } catch {
      toast.error("Unable to delete overtime request.");
    } finally {
      setActionMap((prev) => ({ ...prev, [request.id]: undefined }));
    }
  }

  function setTabWithUrl(nextTab: "requests" | "approvers") {
    setTab(nextTab);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", nextTab);
    const queryString = nextParams.toString();
    router.replace(
      queryString.length > 0 ? `${pathname}?${queryString}` : pathname,
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card/85 p-4 shadow-lg shadow-black/5 sm:p-5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Overtime Management
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Review pending overtime requests, respond inline, and quickly narrow
          results using compact filters.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={tab === "requests" ? "default" : "outline"}
            onClick={() => setTabWithUrl("requests")}
          >
            <ClipboardCheck className="size-4" />
            Requests
          </Button>
          {isStaff ? (
            <Button
              type="button"
              variant={tab === "approvers" ? "default" : "outline"}
              onClick={() => setTabWithUrl("approvers")}
            >
              <Layers3 className="size-4" />
              Approver Settings
            </Button>
          ) : null}
        </div>
      </section>

      {tab === "requests" ? (
        <>
          <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Search and refine overtime requests without leaving this page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-4">
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="q" className="text-sm font-medium">
                    Search
                  </Label>
                  <Input
                    id="q"
                    value={formState.query}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        query: event.target.value,
                      }))
                    }
                    placeholder="Requestor name or email"
                  />
                </div>

                <SelectField
                  id="status"
                  label="Status"
                  value={formState.status}
                  onChange={(_, value) =>
                    setFormState((prev) => ({ ...prev, status: value }))
                  }
                  options={[
                    { value: "all", label: "All statuses" },
                    { value: "PEND", label: "Pending" },
                    { value: "APP", label: "Approved" },
                    { value: "REJ", label: "Rejected" },
                  ]}
                  placeholder="Status"
                />

                <SelectField
                  id="month"
                  label="Month"
                  value={formState.month}
                  onChange={(_, value) =>
                    setFormState((prev) => ({ ...prev, month: value }))
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
              </div>

              <div className="grid gap-4 lg:grid-cols-4">
                <SelectField
                  id="year"
                  label="Year"
                  value={formState.year}
                  onChange={(_, value) =>
                    setFormState((prev) => ({ ...prev, year: value }))
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
                  id="department"
                  label="Department"
                  value={formState.departmentId}
                  onChange={(_, value) =>
                    setFormState((prev) => ({ ...prev, departmentId: value }))
                  }
                  options={[
                    { value: "all", label: "All departments" },
                    ...departments.map((department) => ({
                      value: department.id.toString(),
                      label: department.name,
                    })),
                  ]}
                  placeholder="Department"
                />

                <SelectField
                  id="approver"
                  label="Approver"
                  value={formState.approverId}
                  onChange={(_, value) =>
                    setFormState((prev) => ({ ...prev, approverId: value }))
                  }
                  options={[
                    { value: "all", label: "All approvers" },
                    ...approvers.map((approver) => ({
                      value: approver.id.toString(),
                      label: approver.name,
                    })),
                  ]}
                  placeholder="Approver"
                />

                <div className="flex items-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10"
                    onClick={() =>
                      setFormState((prev) => ({
                        ...prev,
                        query: "",
                        status: "all",
                        month: "all",
                        year: "all",
                        departmentId: "all",
                        approverId: "all",
                      }))
                    }
                  >
                    <Eraser className="size-4" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-semibold">{stats.pending}</p>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-semibold">{stats.approved}</p>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-semibold">{stats.rejected}</p>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {tab === "approvers" ? (
        <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle>Approver Settings</CardTitle>
            <CardDescription>
              Set department overtime approvers using the same role slots as the
              leave workflow. The system assigns the request approver
              automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {approverRows.map(({ department, approver }) => {
              const currentValue: OvertimeApproverUpsertPayload = {
                department_approver_id:
                  approver?.department_approver_id ?? null,
                director_approver_id: approver?.director_approver_id ?? null,
                president_approver_id: approver?.president_approver_id ?? null,
                hr_approver_id: approver?.hr_approver_id ?? null,
              };

              return (
                <div
                  key={department.id}
                  className="rounded-xl border border-border/70 bg-background/70 p-4"
                >
                  <div className="mb-3">
                    <p className="font-medium text-foreground">
                      {department.name}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      {
                        id: "department_approver",
                        label: "Department Approver",
                        key: "department_approver_id" as const,
                      },
                      {
                        id: "director_approver",
                        label: "Director Approver",
                        key: "director_approver_id" as const,
                      },
                      {
                        id: "president_approver",
                        label: "President Approver",
                        key: "president_approver_id" as const,
                      },
                      {
                        id: "hr_approver",
                        label: "HR Approver",
                        key: "hr_approver_id" as const,
                      },
                    ].map((field) => (
                      <SelectField
                        key={`${department.id}-${field.id}`}
                        id={`${department.id}-${field.id}`}
                        label={field.label}
                        value={
                          currentValue[field.key] === null
                            ? "none"
                            : String(currentValue[field.key])
                        }
                        onChange={(_, value) => {
                          const nextPayload: OvertimeApproverUpsertPayload = {
                            ...currentValue,
                            [field.key]: value === "none" ? null : value,
                          };
                          void saveApprover(department.id, nextPayload);
                        }}
                        options={[
                          { value: "none", label: "Not set" },
                          ...approvers.map((user) => ({
                            value: user.id.toString(),
                            label: user.name,
                          })),
                        ]}
                        placeholder={field.label}
                      />
                    ))}
                  </div>

                  {approverSavingDepartmentId === department.id ? (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving approver settings...
                    </div>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {tab === "requests" ? (
        <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requestor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Approver</TableHead>
                    <TableHead>Info</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No overtime requests match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((request) => {
                      const actionInProgress = actionMap[request.id];
                      const currentAssignee = request.approver_pool.find(
                        (item) => item.approver_id === currentUserId,
                      );
                      const canRespond =
                        request.status === "PEND" &&
                        currentAssignee?.status === "PEND";
                      const actedByAssignment = request.approver_pool.find(
                        (item) => item.acted_at !== null,
                      );
                      const actedBy = actedByAssignment?.approver
                        ? `${actedByAssignment.approver.first_name} ${actedByAssignment.approver.last_name}`.trim() ||
                          actedByAssignment.approver.email
                        : (request.approver_name ??
                          `User #${request.approver_id}`);

                      return (
                        <TableRow key={request.id}>
                          <TableCell>
                            <p className="font-medium text-foreground">
                              {request.user_name ?? `User #${request.user_id}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {request.user_department_name ?? "No department"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {request.user_email ?? ""}
                            </p>
                          </TableCell>
                          <TableCell>{formatDate(request.date)}</TableCell>
                          <TableCell>
                            <p>{actedBy}</p>
                            <p className="text-xs text-muted-foreground">
                              Pool: {request.approver_pool.length}
                            </p>
                          </TableCell>
                          <TableCell className="max-w-[280px]">
                            <p className="line-clamp-2 text-sm text-muted-foreground">
                              {request.info?.trim() || "No details provided."}
                            </p>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                                statusClass(request.status),
                              )}
                            >
                              {statusLabel(request.status)}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDateTime(request.updated_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              {canRespond ? (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="h-8"
                                    onClick={() => respond(request, "APPROVE")}
                                    disabled={actionInProgress !== undefined}
                                  >
                                    {actionInProgress === "approve" ? (
                                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                                    ) : (
                                      <Check className="mr-1.5 size-3.5" />
                                    )}
                                    Approve
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-8"
                                    onClick={() => respond(request, "REJECT")}
                                    disabled={actionInProgress !== undefined}
                                  >
                                    {actionInProgress === "reject" ? (
                                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                                    ) : (
                                      <X className="mr-1.5 size-3.5" />
                                    )}
                                    Reject
                                  </Button>
                                </>
                              ) : null}

                              {isStaff ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 text-destructive hover:text-destructive"
                                  onClick={() => remove(request)}
                                  disabled={actionInProgress !== undefined}
                                >
                                  {actionInProgress === "delete" ? (
                                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="mr-1.5 size-3.5" />
                                  )}
                                  Delete
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
