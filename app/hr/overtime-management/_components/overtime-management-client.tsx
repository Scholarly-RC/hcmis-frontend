"use client";

import { ArrowUpCircle, Check, ClipboardCheck, Loader2, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
import type { OvertimeRequestRecord } from "@/lib/attendance";
import { overtimeStatusClass, overtimeStatusLabel } from "@/lib/attendance";
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
  initialTab: "requests";
  initialRequests: OvertimeRequestRecord[];
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

export function OvertimeManagementClient({
  initialTab,
  initialRequests,
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
  const [tab, setTab] = useState<"requests">(initialTab);
  const [requests, setRequests] = useState(initialRequests);
  const [formState, setFormState] = useState<OvertimeFilterState>(filters);
  const [actionMap, setActionMap] = useState<
    Record<number, "approve" | "reject" | "delete" | "escalate" | undefined>
  >({});
  const debouncedReplaceRef = useRef<DebouncedReplace | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    setRequests(initialRequests);
  }, [initialRequests]);

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

  async function escalate(request: OvertimeRequestRecord) {
    setActionMap((prev) => ({ ...prev, [request.id]: "escalate" }));

    try {
      const httpResponse = await fetch(
        `/api/attendance/overtime/${request.id}/escalate`,
        {
          method: "POST",
        },
      );
      const payload = (await httpResponse.json().catch(() => null)) as
        | OvertimeRequestRecord
        | { detail?: string }
        | null;

      if (!httpResponse.ok) {
        const detail = payload && "detail" in payload ? payload.detail : null;
        toast.error(detail ?? "Unable to escalate overtime request.");
        return;
      }

      const nextRequest = payload as OvertimeRequestRecord;
      setRequests((prev) =>
        prev.map((item) =>
          item.id === request.id ? { ...item, ...nextRequest } : item,
        ),
      );
      toast.success("Overtime request escalated to backup approver.");
    } catch {
      toast.error("Unable to escalate overtime request.");
    } finally {
      setActionMap((prev) => ({ ...prev, [request.id]: undefined }));
    }
  }

  function setTabWithUrl(nextTab: "requests") {
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
          Review overtime requests across teams from one workspace.
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
                      const canEscalate =
                        isStaff &&
                        request.status === "PENDING" &&
                        request.escalated_to_backup_at === null;
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
                                overtimeStatusClass(request.status),
                              )}
                            >
                              {overtimeStatusLabel(request.status)}
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
                              {canEscalate ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-8"
                                  onClick={() => escalate(request)}
                                  disabled={actionInProgress !== undefined}
                                >
                                  {actionInProgress === "escalate" ? (
                                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                                  ) : (
                                    <ArrowUpCircle className="mr-1.5 size-3.5" />
                                  )}
                                  Escalate To Backup
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
