"use client";

import {
  ArrowUpCircle,
  ClipboardList,
  Loader2,
  Plus,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import type {
  LeaveCredit,
  LeaveRequestRecord,
  LeaveTypePolicy,
  LeaveTypePolicyMode,
  LeaveTypePolicyUpsertPayload,
} from "@/lib/leave";
import {
  leaveStatusClass,
  leaveStatusLabel,
  leaveTypeLabel,
} from "@/lib/leave";
import { toast } from "@/lib/toast";
import type { AuthDepartment, AuthUser } from "@/types/auth";
import { cn } from "@/utils/cn";

type RequestError = {
  detail?: string;
};

type ManagementTab = "requests" | "credits" | "leave-types";

type RequestFilters = {
  userId: string;
  departmentId: string;
  status: string;
  year: string;
  month: string;
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

async function requestEmpty(
  pathname: string,
  init: RequestInit = {},
): Promise<void> {
  const headers = new Headers(init.headers);
  if (init.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(pathname, {
    ...init,
    headers,
    cache: "no-store",
  });

  const payload = (await response
    .json()
    .catch(() => null)) as RequestError | null;

  if (!response.ok) {
    throw new Error(payload?.detail ?? "Request failed.");
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function displayUser(
  user: AuthUser | null | undefined,
  fallbackId?: string | null,
) {
  if (!user) {
    return fallbackId ? `User #${fallbackId}` : "-";
  }
  const name = `${user.first_name} ${user.last_name}`.trim();
  return name.length > 0 ? name : user.email;
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

function leaveTypeModeLabel(mode: LeaveTypePolicyMode) {
  return mode === "incremental" ? "Incremental" : "Fixed";
}

type LeaveManagementClientProps = {
  initialTab?: ManagementTab;
};

export function LeaveManagementClient({
  initialTab = "requests",
}: LeaveManagementClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<ManagementTab>(initialTab);
  const [loading, setLoading] = useState(true);

  const [departments, setDepartments] = useState<AuthDepartment[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [requests, setRequests] = useState<LeaveRequestRecord[]>([]);
  const [credits, setCredits] = useState<LeaveCredit[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypePolicy[]>([]);

  const [requestFilters, setRequestFilters] = useState<RequestFilters>({
    userId: "all",
    departmentId: "all",
    status: "all",
    year: "all",
    month: "all",
  });

  const [creditLeaveTypeFilter, setCreditLeaveTypeFilter] = useState("");
  const [escalatingLeaveId, setEscalatingLeaveId] = useState<number | null>(
    null,
  );

  const [leaveTypeDialogOpen, setLeaveTypeDialogOpen] = useState(false);
  const [editingLeaveTypeId, setEditingLeaveTypeId] = useState<string | null>(
    null,
  );
  const [leaveTypeName, setLeaveTypeName] = useState("");
  const [leaveTypeMaxCredits, setLeaveTypeMaxCredits] = useState("0");
  const [leaveTypeMode, setLeaveTypeMode] =
    useState<LeaveTypePolicyMode>("fixed");
  const [leaveTypeSaving, setLeaveTypeSaving] = useState(false);
  const [leaveTypeDeletingId, setLeaveTypeDeletingId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let mounted = true;

    async function loadInitial() {
      try {
        const [
          departmentsResponse,
          usersResponse,
          requestsResponse,
          creditsResponse,
          yearsResponse,
          leaveTypesResponse,
        ] = await Promise.all([
          requestJson<AuthDepartment[]>("/api/departments"),
          requestJson<AuthUser[]>("/api/users?include_superusers=true"),
          requestJson<LeaveRequestRecord[]>("/api/leave/requests"),
          requestJson<LeaveCredit[]>("/api/leave/credits"),
          requestJson<number[]>("/api/leave/years").catch(() => []),
          requestJson<LeaveTypePolicy[]>("/api/leave/types/manage"),
        ]);

        if (!mounted) {
          return;
        }

        setDepartments(departmentsResponse);
        setUsers(usersResponse);
        setRequests(requestsResponse);
        setCredits(creditsResponse);
        setYears(yearsResponse);
        setLeaveTypes(leaveTypesResponse);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to load leave management.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadInitial();

    return () => {
      mounted = false;
    };
  }, []);

  const usersById = useMemo(() => {
    const map = new Map<string, AuthUser>();
    for (const user of users) {
      map.set(user.id, user);
    }
    return map;
  }, [users]);

  const leaveTypeNameByCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of leaveTypes) {
      map.set(item.code, item.name);
    }
    return map;
  }, [leaveTypes]);

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      if (
        requestFilters.userId !== "all" &&
        item.user_id !== requestFilters.userId
      ) {
        return false;
      }

      if (requestFilters.departmentId !== "all") {
        const departmentId = Number(requestFilters.departmentId);
        if (item.user?.department_id !== departmentId) {
          return false;
        }
      }

      if (
        requestFilters.status !== "all" &&
        item.status !== requestFilters.status
      ) {
        return false;
      }

      if (requestFilters.year !== "all") {
        const year = Number(requestFilters.year);
        if (new Date(item.leave_date).getUTCFullYear() !== year) {
          return false;
        }
      }

      if (requestFilters.month !== "all") {
        const month = Number(requestFilters.month);
        if (new Date(item.leave_date).getUTCMonth() + 1 !== month) {
          return false;
        }
      }

      return true;
    });
  }, [requests, requestFilters]);

  const creditRows = useMemo(() => {
    const creditsByUserId = new Map<string, LeaveCredit>();
    for (const credit of credits) {
      creditsByUserId.set(credit.user_id, credit);
    }

    const rows = users.map((user) => {
      const existingCredit = creditsByUserId.get(user.id);
      return (
        existingCredit ?? {
          user_id: user.id,
          credits: 0,
          used_credits: 0,
          remaining_credits: 0,
          user,
          created_at: "",
          updated_at: "",
        }
      );
    });

    for (const credit of credits) {
      if (!usersById.has(credit.user_id)) {
        rows.push(credit);
      }
    }

    return rows.sort((a, b) => {
      const userA = a.user ?? usersById.get(a.user_id) ?? null;
      const userB = b.user ?? usersById.get(b.user_id) ?? null;
      return displayUser(userA, a.user_id).localeCompare(
        displayUser(userB, b.user_id),
      );
    });
  }, [credits, users, usersById]);

  useEffect(() => {
    if (leaveTypes.length === 0) {
      if (creditLeaveTypeFilter !== "") {
        setCreditLeaveTypeFilter("");
      }
      return;
    }

    const hasSelectedType = leaveTypes.some(
      (leaveType) => leaveType.code === creditLeaveTypeFilter,
    );
    if (!hasSelectedType) {
      setCreditLeaveTypeFilter(leaveTypes[0]?.code ?? "");
    }
  }, [creditLeaveTypeFilter, leaveTypes]);

  const reloadCredits = useCallback(async () => {
    const query = new URLSearchParams();
    if (creditLeaveTypeFilter) {
      query.set("leave_type", creditLeaveTypeFilter);
    }
    const creditPath =
      query.size > 0
        ? `/api/leave/credits?${query.toString()}`
        : "/api/leave/credits";
    const data = await requestJson<LeaveCredit[]>(creditPath);
    setCredits(data);
  }, [creditLeaveTypeFilter]);

  const reloadRequests = useCallback(async () => {
    const query = new URLSearchParams();
    if (requestFilters.userId !== "all") {
      query.set("user_id", requestFilters.userId);
    }
    if (requestFilters.departmentId !== "all") {
      query.set("department_id", requestFilters.departmentId);
    }
    if (requestFilters.status !== "all") {
      query.set("status", requestFilters.status);
    }
    if (requestFilters.year !== "all") {
      query.set("year", requestFilters.year);
    }
    if (requestFilters.month !== "all") {
      query.set("month", requestFilters.month);
    }

    const requestPath =
      query.size > 0
        ? `/api/leave/requests?${query.toString()}`
        : "/api/leave/requests";

    const data = await requestJson<LeaveRequestRecord[]>(requestPath);
    setRequests(data);
  }, [requestFilters]);

  useEffect(() => {
    if (loading) {
      return;
    }

    reloadRequests().catch((error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to refresh leave requests.",
      );
    });
  }, [loading, reloadRequests]);

  useEffect(() => {
    if (loading) {
      return;
    }

    reloadCredits().catch((error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to refresh leave credits.",
      );
    });
  }, [loading, reloadCredits]);

  async function escalateToBackup(leaveId: number) {
    setEscalatingLeaveId(leaveId);
    try {
      const updated = await requestJson<LeaveRequestRecord>(
        `/api/leave/requests/${leaveId}/escalate`,
        { method: "POST" },
      );
      setRequests((prev) =>
        prev.map((item) => (item.id === leaveId ? updated : item)),
      );
      toast.success("Leave request escalated to backup approver.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to escalate leave request.",
      );
    } finally {
      setEscalatingLeaveId(null);
    }
  }

  function openCreateLeaveTypeDialog() {
    setEditingLeaveTypeId(null);
    setLeaveTypeName("");
    setLeaveTypeMaxCredits("0");
    setLeaveTypeMode("fixed");
    setLeaveTypeDialogOpen(true);
  }

  function openEditLeaveTypeDialog(leaveType: LeaveTypePolicy) {
    setEditingLeaveTypeId(leaveType.id);
    setLeaveTypeName(leaveType.name);
    setLeaveTypeMaxCredits(leaveType.max_credits.toString());
    setLeaveTypeMode(leaveType.credit_mode);
    setLeaveTypeDialogOpen(true);
  }

  async function submitLeaveTypeForm() {
    const trimmedName = leaveTypeName.trim();
    const parsedMaxCredits = Number.parseInt(leaveTypeMaxCredits, 10);

    if (!trimmedName) {
      toast.error("Leave type name is required.");
      return;
    }
    if (!Number.isFinite(parsedMaxCredits) || parsedMaxCredits < 0) {
      toast.error("Max credits must be zero or greater.");
      return;
    }

    const payload: LeaveTypePolicyUpsertPayload = {
      name: trimmedName,
      max_credits: parsedMaxCredits,
      credit_mode: leaveTypeMode,
    };

    setLeaveTypeSaving(true);
    try {
      if (editingLeaveTypeId) {
        const updated = await requestJson<LeaveTypePolicy>(
          `/api/leave/types/${editingLeaveTypeId}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
        );
        setLeaveTypes((prev) =>
          prev
            .map((item) => (item.id === updated.id ? updated : item))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        toast.success("Leave type updated.");
      } else {
        const created = await requestJson<LeaveTypePolicy>("/api/leave/types", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setLeaveTypes((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
        );
        toast.success("Leave type added.");
      }
      setLeaveTypeDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save leave type.",
      );
    } finally {
      setLeaveTypeSaving(false);
    }
  }

  async function deleteLeaveType(leaveType: LeaveTypePolicy) {
    const confirmed = window.confirm(
      `Delete leave type "${leaveType.name}"? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    setLeaveTypeDeletingId(leaveType.id);
    try {
      await requestEmpty(`/api/leave/types/${leaveType.id}`, {
        method: "DELETE",
      });
      setLeaveTypes((prev) => prev.filter((item) => item.id !== leaveType.id));
      toast.success("Leave type deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete leave type.",
      );
    } finally {
      setLeaveTypeDeletingId(null);
    }
  }

  const setTabWithUrl = useCallback(
    (nextTab: ManagementTab) => {
      setTab(nextTab);
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("tab", nextTab);
      const queryString = nextParams.toString();
      router.replace(
        queryString.length > 0 ? `${pathname}?${queryString}` : pathname,
      );
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam === "requests" ||
      tabParam === "credits" ||
      tabParam === "leave-types"
    ) {
      if (tab !== tabParam) {
        setTab(tabParam);
      }
      return;
    }

    if (tab !== "requests") {
      setTab("requests");
    }
  }, [searchParams, tab]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card/85 p-4 shadow-lg shadow-black/5 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
              Leave Management
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Manage user leave credits, leave type policies, and
              organization-wide leave requests.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/leave">
              <Users className="size-4" />
              Open Employee Leave View
            </Link>
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={tab === "requests" ? "default" : "outline"}
            onClick={() => setTabWithUrl("requests")}
          >
            <ClipboardList className="size-4" />
            Request Monitor
          </Button>
          <Button
            type="button"
            variant={tab === "credits" ? "default" : "outline"}
            onClick={() => setTabWithUrl("credits")}
          >
            <Wallet className="size-4" />
            Leave Credits
          </Button>
          <Button
            type="button"
            variant={tab === "leave-types" ? "default" : "outline"}
            onClick={() => setTabWithUrl("leave-types")}
          >
            <ClipboardList className="size-4" />
            Leave Types
          </Button>
        </div>
      </section>

      {loading ? (
        <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
          <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading leave management data...
          </CardContent>
        </Card>
      ) : null}

      {!loading && tab === "requests" ? (
        <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle>Request Monitor</CardTitle>
            <CardDescription>
              Filter all leave requests across teams.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-5">
              <SelectField
                id="filter_user"
                label="User"
                value={requestFilters.userId}
                onChange={(_, value) =>
                  setRequestFilters((prev) => ({ ...prev, userId: value }))
                }
                options={[
                  { value: "all", label: "All users" },
                  ...users.map((user) => ({
                    value: user.id.toString(),
                    label: `${displayUser(user)} (${roleLabel(user.role)})`,
                  })),
                ]}
                placeholder="User"
              />
              <SelectField
                id="filter_department"
                label="Department"
                value={requestFilters.departmentId}
                onChange={(_, value) =>
                  setRequestFilters((prev) => ({
                    ...prev,
                    departmentId: value,
                  }))
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
                id="filter_status"
                label="Status"
                value={requestFilters.status}
                onChange={(_, value) =>
                  setRequestFilters((prev) => ({ ...prev, status: value }))
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
                id="filter_year"
                label="Year"
                value={requestFilters.year}
                onChange={(_, value) =>
                  setRequestFilters((prev) => ({ ...prev, year: value }))
                }
                options={[
                  { value: "all", label: "All years" },
                  ...years.map((year) => ({
                    value: year.toString(),
                    label: year.toString(),
                  })),
                ]}
                placeholder="Year"
              />
              <SelectField
                id="filter_month"
                label="Month"
                value={requestFilters.month}
                onChange={(_, value) =>
                  setRequestFilters((prev) => ({ ...prev, month: value }))
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
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approvers</TableHead>
                    <TableHead>Info</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
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
                        ? displayUser(actedAssignment.approver)
                        : "Pending";
                      const canEscalate =
                        item.status === "PENDING" &&
                        item.second_approver_id !== null &&
                        item.escalated_to_backup_at === null;

                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            {displayUser(item.user, item.user_id)}
                          </TableCell>
                          <TableCell>
                            {item.user?.department?.name ?? "-"}
                          </TableCell>
                          <TableCell>{formatDate(item.leave_date)}</TableCell>
                          <TableCell>
                            {leaveTypeNameByCode.get(item.leave_type) ??
                              leaveTypeLabel(item.leave_type)}
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
                          <TableCell>
                            <div className="flex justify-end">
                              {canEscalate ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={escalatingLeaveId === item.id}
                                  onClick={() => escalateToBackup(item.id)}
                                >
                                  {escalatingLeaveId === item.id ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <ArrowUpCircle className="size-4" />
                                  )}
                                  Escalate To Backup
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  -
                                </span>
                              )}
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

      {!loading && tab === "credits" ? (
        <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle>Leave Credits</CardTitle>
            <CardDescription>
              Track used and remaining leave credits by leave type.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:max-w-sm">
              <SelectField
                id="filter_credit_leave_type"
                label="Leave Type"
                value={creditLeaveTypeFilter}
                onChange={(_, value) => setCreditLeaveTypeFilter(value)}
                options={leaveTypes.map((leaveType) => ({
                  value: leaveType.code,
                  label: leaveType.name,
                }))}
                placeholder="Leave Type"
              />
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Remaining</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    creditRows.map((credit) => {
                      const user =
                        credit.user ?? usersById.get(credit.user_id) ?? null;

                      return (
                        <TableRow key={credit.user_id}>
                          <TableCell>
                            {displayUser(user, credit.user_id)}
                          </TableCell>
                          <TableCell>{user?.department?.name ?? "-"}</TableCell>
                          <TableCell>{credit.used_credits}</TableCell>
                          <TableCell>{credit.remaining_credits}</TableCell>
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

      {!loading && tab === "leave-types" ? (
        <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Leave Types</CardTitle>
                <CardDescription>
                  Configure leave type policies used by leave requests.
                </CardDescription>
              </div>
              <Button type="button" onClick={openCreateLeaveTypeDialog}>
                <Plus className="size-4" />
                Add Leave Type
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Max Credits</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveTypes.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No leave types found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaveTypes.map((leaveType) => (
                      <TableRow key={leaveType.id}>
                        <TableCell>{leaveType.name}</TableCell>
                        <TableCell>{leaveType.max_credits}</TableCell>
                        <TableCell>
                          {leaveTypeModeLabel(leaveType.credit_mode)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => openEditLeaveTypeDialog(leaveType)}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={leaveTypeDeletingId === leaveType.id}
                              onClick={() => deleteLeaveType(leaveType)}
                            >
                              {leaveTypeDeletingId === leaveType.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                "Delete"
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={leaveTypeDialogOpen} onOpenChange={setLeaveTypeDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingLeaveTypeId ? "Edit Leave Type" : "Add Leave Type"}
            </DialogTitle>
            <DialogDescription>
              Provide the leave type name, max credits, and mode.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="leave_type_name">Name</Label>
              <Input
                id="leave_type_name"
                value={leaveTypeName}
                onChange={(event) => setLeaveTypeName(event.target.value)}
                placeholder="Leave Type Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leave_type_max_credits">Max Credits</Label>
              <Input
                id="leave_type_max_credits"
                type="number"
                min={0}
                value={leaveTypeMaxCredits}
                onChange={(event) => setLeaveTypeMaxCredits(event.target.value)}
              />
            </div>

            <SelectField
              id="leave_type_mode"
              label="Mode"
              value={leaveTypeMode}
              onChange={(_, value) =>
                setLeaveTypeMode(value as LeaveTypePolicyMode)
              }
              options={[
                { value: "fixed", label: "Fixed" },
                { value: "incremental", label: "Incremental" },
              ]}
              placeholder="Mode"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLeaveTypeDialogOpen(false)}
              disabled={leaveTypeSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitLeaveTypeForm}
              disabled={leaveTypeSaving}
            >
              {leaveTypeSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
