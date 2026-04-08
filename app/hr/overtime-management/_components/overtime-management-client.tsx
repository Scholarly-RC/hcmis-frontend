"use client";

import { Check, ClipboardCheck, Layers3, Loader2, X } from "lucide-react";
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
  OvertimeRequestStatus,
} from "@/lib/attendance";
import { toast } from "@/lib/toast";
import type { AuthDepartment, AuthUser } from "@/types/auth";
import { cn } from "@/utils/cn";
import { debounce } from "@/utils/debounce";

type OvertimeFilterState = {
  userId: string;
  status: string;
  month: string;
  year: string;
  departmentId: string;
};

type OvertimeManagementClientProps = {
  initialTab: "requests" | "approvers";
  initialRequests: OvertimeRequestRecord[];
  overtimeApprovers: OvertimeApprover[];
  departments: AuthDepartment[];
  approvers: AuthUser[];
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
    a.userId === b.userId &&
    a.status === b.status &&
    a.month === b.month &&
    a.year === b.year &&
    a.departmentId === b.departmentId
  );
}

function buildUrl(
  pathname: string,
  state: OvertimeFilterState,
  currentSearch: string,
) {
  const search = new URLSearchParams(currentSearch);
  search.set("tab", "requests");

  if (state.userId !== "all") {
    search.set("user_id", state.userId);
  } else {
    search.delete("user_id");
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

  const query = search.toString();
  return query.length > 0 ? `${pathname}?${query}` : pathname;
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function displayUser(user: AuthUser) {
  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || user.email;
}

function roleLabel(role: string | null | undefined) {
  const normalized = role?.trim().toUpperCase();
  if (!normalized || normalized === "EMP") {
    return "Employee";
  }
  if (normalized === "DH") {
    return "Department Head";
  }
  if (normalized === "DIR") {
    return "Director";
  }
  if (normalized === "PRES") {
    return "President";
  }
  if (normalized === "HR") {
    return "HR";
  }
  return normalized;
}

function normalizeRole(role: string | null | undefined) {
  return role?.trim().toUpperCase() || "EMP";
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

  const approverRows = useMemo(() => {
    const existingByDepartment = new Map(
      approverSettings.map((item) => [item.department_id, item]),
    );
    return departments.map((department) => ({
      department,
      approver: existingByDepartment.get(department.id) ?? null,
    }));
  }, [approverSettings, departments]);

  const approverEligibleUsers = useMemo(() => {
    return approvers
      .filter((user) => user.is_active && normalizeRole(user.role) !== "EMP")
      .sort((a, b) => displayUser(a).localeCompare(displayUser(b)));
  }, [approvers]);

  const approverEligibleUsersByField = (
    fieldKey:
      | "department_approver_id"
      | "director_approver_id"
      | "president_approver_id"
      | "hr_approver_id",
    departmentId: number,
  ) => {
    return approverEligibleUsers.filter((user) => {
      const role = normalizeRole(user.role);
      if (fieldKey === "department_approver_id") {
        return role === "DH" && user.department_id === departmentId;
      }
      if (fieldKey === "director_approver_id") {
        return role === "DIR";
      }
      if (fieldKey === "president_approver_id") {
        return role === "PRES";
      }
      return role === "HR";
    });
  };

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
          Review overtime requests across teams and manage department approver
          settings from one workspace.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={tab === "requests" ? "default" : "outline"}
            onClick={() => setTabWithUrl("requests")}
          >
            <ClipboardCheck className="size-4" />
            Request Monitor
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
        <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle>Request Monitor</CardTitle>
            <CardDescription>
              Filter all overtime requests across teams.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-5">
              <SelectField
                id="user"
                label="User"
                value={formState.userId}
                onChange={(_, value) =>
                  setFormState((prev) => ({ ...prev, userId: value }))
                }
                options={[
                  { value: "all", label: "All users" },
                  ...approvers.map((user) => ({
                    value: user.id.toString(),
                    label: `${displayUser(user)} (${roleLabel(user.role)})`,
                  })),
                ]}
                placeholder="User"
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
                    label: `${department.name} (${department.code})`,
                  })),
                ]}
                placeholder="Department"
              />

              <SelectField
                id="status"
                label="Status"
                value={formState.status}
                onChange={(_, value) =>
                  setFormState((prev) => ({ ...prev, status: value }))
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

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approvers</TableHead>
                    <TableHead>Info</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No overtime requests found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((request) => {
                      const actionInProgress = actionMap[request.id];
                      const currentAssignee = request.approver_pool.find(
                        (item) => item.approver_id === currentUserId,
                      );
                      const canRespond =
                        request.status === "PENDING" &&
                        currentAssignee?.status === "PENDING";
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
                            {request.user_name ?? `User #${request.user_id}`}
                          </TableCell>
                          <TableCell>
                            {request.user_department_name ?? "-"}
                          </TableCell>
                          <TableCell>{formatDate(request.date)}</TableCell>
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
                          <TableCell>
                            <p className="text-xs text-muted-foreground">
                              Acted: {actedBy}
                            </p>
                          </TableCell>
                          <TableCell className="max-w-[18rem] whitespace-normal text-sm text-muted-foreground">
                            {request.info?.trim() || "-"}
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

      {tab === "approvers" ? (
        <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle>Approver Settings</CardTitle>
            <CardDescription>
              Set department overtime approvers for each role in the chain.
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
                    <p className="text-xs text-muted-foreground">
                      {department.code}
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
                          ...approverEligibleUsersByField(
                            field.key,
                            department.id,
                          ).map((user) => ({
                            value: user.id.toString(),
                            label: `${displayUser(user)} (${roleLabel(user.role)})`,
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
    </div>
  );
}
