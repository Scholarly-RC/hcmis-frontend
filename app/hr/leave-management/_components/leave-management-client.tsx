"use client";

import { Loader2, RotateCcw } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  LeaveApprover,
  LeaveApproverUpsertPayload,
  LeaveCredit,
  LeaveCreditUpsertPayload,
  LeaveRequestRecord,
} from "@/lib/leave";
import { leaveStatusClass, leaveTypeLabel } from "@/lib/leave";
import { toast } from "@/lib/toast";
import type { AuthDepartment, AuthUser } from "@/types/auth";
import { cn } from "@/utils/cn";

type RequestError = {
  detail?: string;
};

type ManagementTab = "requests" | "approvers" | "credits";

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
  const [approvers, setApprovers] = useState<LeaveApprover[]>([]);
  const [credits, setCredits] = useState<LeaveCredit[]>([]);
  const [years, setYears] = useState<number[]>([]);

  const [requestFilters, setRequestFilters] = useState<RequestFilters>({
    userId: "all",
    departmentId: "all",
    status: "all",
    year: "all",
    month: "all",
  });

  const [approverSavingDepartmentId, setApproverSavingDepartmentId] = useState<
    number | null
  >(null);
  const [creditSavingUserId, setCreditSavingUserId] = useState<string | null>(
    null,
  );
  const [creditResettingUserId, setCreditResettingUserId] = useState<
    string | null
  >(null);

  useEffect(() => {
    let mounted = true;

    async function loadInitial() {
      try {
        const [
          departmentsResponse,
          usersResponse,
          requestsResponse,
          approversResponse,
          creditsResponse,
          yearsResponse,
        ] = await Promise.all([
          requestJson<AuthDepartment[]>("/api/departments"),
          requestJson<AuthUser[]>("/api/users?include_superusers=true"),
          requestJson<LeaveRequestRecord[]>("/api/leave/requests"),
          requestJson<LeaveApprover[]>("/api/leave/approvers"),
          requestJson<LeaveCredit[]>("/api/leave/credits"),
          requestJson<number[]>("/api/leave/years").catch(() => []),
        ]);

        if (!mounted) {
          return;
        }

        setDepartments(departmentsResponse);
        setUsers(usersResponse);
        setRequests(requestsResponse);
        setApprovers(approversResponse);
        setCredits(creditsResponse);
        setYears(yearsResponse);
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

  const approverRows = useMemo(() => {
    const existingByDepartment = new Map<number, LeaveApprover>();
    for (const item of approvers) {
      existingByDepartment.set(item.department_id, item);
    }

    return departments.map((department) => ({
      department,
      approver: existingByDepartment.get(department.id) ?? null,
    }));
  }, [departments, approvers]);

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

    const pathname =
      query.size > 0
        ? `/api/leave/requests?${query.toString()}`
        : "/api/leave/requests";

    const data = await requestJson<LeaveRequestRecord[]>(pathname);
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

  async function saveApprover(
    departmentId: number,
    payload: LeaveApproverUpsertPayload,
  ) {
    setApproverSavingDepartmentId(departmentId);
    try {
      const updated = await requestJson<LeaveApprover>(
        `/api/leave/approvers/${departmentId}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
      );
      setApprovers((prev) => {
        const next = prev.filter((item) => item.department_id !== departmentId);
        return [...next, updated].sort(
          (a, b) => a.department_id - b.department_id,
        );
      });
      toast.success("Approver settings updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update approvers.",
      );
    } finally {
      setApproverSavingDepartmentId(null);
    }
  }

  async function saveCredit(userId: string, creditsValue: number) {
    if (!Number.isFinite(creditsValue) || creditsValue < 0) {
      toast.error("Credits must be zero or greater.");
      return;
    }

    setCreditSavingUserId(userId);
    try {
      const payload: LeaveCreditUpsertPayload = {
        credits: Math.floor(creditsValue),
      };
      const updated = await requestJson<LeaveCredit>(
        `/api/leave/credits/${userId}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
      );

      setCredits((prev) => {
        const next = prev.filter((item) => item.user_id !== userId);
        return [...next, updated].sort((a, b) =>
          a.user_id.localeCompare(b.user_id),
        );
      });
      toast.success("Leave credit updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update credit.",
      );
    } finally {
      setCreditSavingUserId(null);
    }
  }

  async function resetCredit(userId: string) {
    setCreditResettingUserId(userId);
    try {
      const updated = await requestJson<LeaveCredit>(
        `/api/leave/credits/${userId}/reset`,
        {
          method: "POST",
        },
      );
      setCredits((prev) =>
        prev.map((item) => (item.user_id === userId ? updated : item)),
      );
      toast.success("Used leave credits reset.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to reset credits.",
      );
    } finally {
      setCreditResettingUserId(null);
    }
  }

  const approverEligibleUsers = useMemo(() => {
    return users
      .filter((user) => user.is_active)
      .sort((a, b) => displayUser(a).localeCompare(displayUser(b)));
  }, [users]);

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
      tabParam === "approvers" ||
      tabParam === "credits"
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
              Configure approval routing, manage user leave credits, and monitor
              organization-wide leave requests.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/leave">Open Employee Leave View</Link>
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={tab === "requests" ? "default" : "outline"}
            onClick={() => setTabWithUrl("requests")}
          >
            Request Monitor
          </Button>
          <Button
            type="button"
            variant={tab === "approvers" ? "default" : "outline"}
            onClick={() => setTabWithUrl("approvers")}
          >
            Approver Settings
          </Button>
          <Button
            type="button"
            variant={tab === "credits" ? "default" : "outline"}
            onClick={() => setTabWithUrl("credits")}
          >
            Leave Credits
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No leave requests found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequests.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {displayUser(item.user, item.user_id)}
                        </TableCell>
                        <TableCell>
                          {item.user?.department?.name ?? "-"}
                        </TableCell>
                        <TableCell>{formatDate(item.leave_date)}</TableCell>
                        <TableCell>{leaveTypeLabel(item.leave_type)}</TableCell>
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
                            1st:{" "}
                            {displayUser(
                              item.first_approver,
                              item.first_approver_id,
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            2nd:{" "}
                            {displayUser(
                              item.second_approver,
                              item.second_approver_id,
                            )}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-[18rem] whitespace-normal text-sm text-muted-foreground">
                          {item.info || "-"}
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

      {!loading && tab === "approvers" ? (
        <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle>Approver Settings</CardTitle>
            <CardDescription>
              Set department leave approvers for each role in the chain.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {approverRows.map(({ department, approver }) => {
              const currentValue: LeaveApproverUpsertPayload = {
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
                          const nextPayload: LeaveApproverUpsertPayload = {
                            ...currentValue,
                            [field.key]: value === "none" ? null : value,
                          };
                          void saveApprover(department.id, nextPayload);
                        }}
                        options={[
                          { value: "none", label: "Not set" },
                          ...approverEligibleUsers.map((user) => ({
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

      {!loading && tab === "credits" ? (
        <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle>Leave Credits</CardTitle>
            <CardDescription>
              Set and reset employee leave credits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Total Credits</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
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
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              defaultValue={credit.credits}
                              disabled={creditSavingUserId === credit.user_id}
                              onBlur={(event) => {
                                const nextValue = Number.parseInt(
                                  event.target.value,
                                  10,
                                );
                                if (nextValue === credit.credits) {
                                  return;
                                }
                                void saveCredit(credit.user_id, nextValue);
                              }}
                              className="h-8 w-24"
                            />
                          </TableCell>
                          <TableCell>{credit.used_credits}</TableCell>
                          <TableCell>{credit.remaining_credits}</TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={
                                  creditResettingUserId === credit.user_id
                                }
                                onClick={() => resetCredit(credit.user_id)}
                              >
                                {creditResettingUserId === credit.user_id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                )}
                                Reset Used
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
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
