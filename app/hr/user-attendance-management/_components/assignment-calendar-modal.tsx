"use client";

import { CalendarDays, Loader2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MONTH_NAMES } from "@/constants/date";
import type { EmployeeShiftAssignmentRecord } from "@/lib/attendance";
import type { AuthUser } from "@/types/auth";

type DepartmentOption = {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
};

type AssignmentCalendarModalProps = {
  initialYear: number;
  initialMonth: number;
};

const MAX_VISIBLE_ASSIGNMENTS_PER_DAY = 3;

function normalizeErrorMessage(detail: unknown) {
  if (typeof detail === "string" && detail.trim().length > 0) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((entry) => {
        if (typeof entry === "string") {
          return entry;
        }

        if (
          entry &&
          typeof entry === "object" &&
          "msg" in entry &&
          typeof entry.msg === "string"
        ) {
          return entry.msg;
        }

        return null;
      })
      .filter((message): message is string => Boolean(message));

    if (messages.length > 0) {
      return messages.join("; ");
    }
  }

  if (detail && typeof detail === "object") {
    if ("msg" in detail && typeof detail.msg === "string") {
      return detail.msg;
    }
  }

  return "Request failed.";
}

async function requestJson<T>(pathname: string, init: RequestInit = {}) {
  const response = await fetch(pathname, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as {
    detail?: unknown;
  } | null;

  if (!response.ok) {
    throw new Error(normalizeErrorMessage(payload?.detail));
  }

  return payload as T;
}

function buildUserName(user: AuthUser | null) {
  if (!user) {
    return "Unknown user";
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return fullName.trim().length > 0 ? fullName : user.email;
}

function formatShiftRange(record: EmployeeShiftAssignmentRecord) {
  const shift = record.shift;
  if (!shift) {
    return "No shift";
  }

  const parts = [
    shift.start_time,
    shift.end_time,
    shift.start_time_2,
    shift.end_time_2,
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.slice(0, 5));

  if (parts.length === 0) {
    return shift.description;
  }

  return `${shift.description} - ${parts.join(" - ")}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function firstWeekdayOffset(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

export function AssignmentCalendarModal({
  initialYear,
  initialMonth,
}: AssignmentCalendarModalProps) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(initialYear.toString());
  const [month, setMonth] = useState(initialMonth.toString());
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [assignments, setAssignments] = useState<
    EmployeeShiftAssignmentRecord[]
  >([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDayForDetails, setSelectedDayForDetails] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setYear(initialYear.toString());
    setMonth(initialMonth.toString());
  }, [initialMonth, initialYear, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadDepartments() {
      setIsLoadingDepartments(true);
      setErrorMessage(null);
      try {
        const response =
          await requestJson<DepartmentOption[]>("/api/departments");
        if (cancelled) {
          return;
        }

        const sortedDepartments = [...response].sort((left, right) =>
          left.name.localeCompare(right.name),
        );
        setDepartments(sortedDepartments);
        const firstActiveDepartment =
          sortedDepartments.find((department) => department.is_active) ??
          sortedDepartments[0] ??
          null;
        setSelectedDepartmentId(firstActiveDepartment?.id.toString() ?? "");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load departments.",
        );
      } finally {
        if (!cancelled) {
          setIsLoadingDepartments(false);
        }
      }
    }

    void loadDepartments();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || selectedDepartmentId.length === 0) {
      setUsers([]);
      setSelectedUserId("all");
      return;
    }

    let cancelled = false;

    async function loadUsers() {
      setIsLoadingUsers(true);
      setErrorMessage(null);
      try {
        const query = new URLSearchParams({
          department_id: selectedDepartmentId,
          active_only: "true",
          exclude_hr: "true",
        });
        const response = await requestJson<AuthUser[]>(
          `/api/users?${query.toString()}`,
        );
        if (cancelled) {
          return;
        }

        const sortedUsers = [...response].sort((left, right) =>
          buildUserName(left).localeCompare(buildUserName(right)),
        );
        setUsers(sortedUsers);
        setSelectedUserId((previous) =>
          previous === "all" ||
          sortedUsers.some((user) => user.id.toString() === previous)
            ? previous
            : "all",
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        setUsers([]);
        setSelectedUserId("all");
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load users.",
        );
      } finally {
        if (!cancelled) {
          setIsLoadingUsers(false);
        }
      }
    }

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [open, selectedDepartmentId]);

  useEffect(() => {
    if (!open || selectedDepartmentId.length === 0) {
      setAssignments([]);
      return;
    }

    const parsedYear = Number.parseInt(year, 10);
    const parsedMonth = Number.parseInt(month, 10);
    if (
      !Number.isFinite(parsedYear) ||
      parsedYear < 2020 ||
      !Number.isFinite(parsedMonth) ||
      parsedMonth < 1 ||
      parsedMonth > 12
    ) {
      setAssignments([]);
      return;
    }

    let cancelled = false;

    async function loadAssignments() {
      setIsLoadingAssignments(true);
      setErrorMessage(null);
      try {
        const query = new URLSearchParams({
          department_id: selectedDepartmentId,
          year: parsedYear.toString(),
          month: parsedMonth.toString(),
        });
        const response = await requestJson<EmployeeShiftAssignmentRecord[]>(
          `/api/attendance/shift-assignments?${query.toString()}`,
        );
        if (cancelled) {
          return;
        }

        setAssignments(response);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setAssignments([]);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load shift assignments.",
        );
      } finally {
        if (!cancelled) {
          setIsLoadingAssignments(false);
        }
      }
    }

    void loadAssignments();

    return () => {
      cancelled = true;
    };
  }, [month, open, selectedDepartmentId, year]);

  const visibleAssignments = useMemo(() => {
    if (selectedUserId === "all") {
      return assignments;
    }
    return assignments.filter(
      (assignment) => assignment.user_id === selectedUserId,
    );
  }, [assignments, selectedUserId]);

  const assignmentsByDay = useMemo(() => {
    const grouped = new Map<number, EmployeeShiftAssignmentRecord[]>();

    for (const assignment of visibleAssignments) {
      const dayNumber = new Date(assignment.date).getDate();
      const current = grouped.get(dayNumber) ?? [];
      current.push(assignment);
      grouped.set(dayNumber, current);
    }

    for (const dayAssignments of grouped.values()) {
      dayAssignments.sort((left, right) =>
        buildUserName(left.user).localeCompare(buildUserName(right.user)),
      );
    }

    return grouped;
  }, [visibleAssignments]);

  const parsedYear = Number.parseInt(year, 10);
  const parsedMonth = Number.parseInt(month, 10);
  const canRenderCalendar =
    Number.isFinite(parsedYear) &&
    parsedYear >= 2020 &&
    Number.isFinite(parsedMonth) &&
    parsedMonth >= 1 &&
    parsedMonth <= 12;
  const totalDays = canRenderCalendar
    ? daysInMonth(parsedYear, parsedMonth)
    : 0;
  const leadingBlankDays = canRenderCalendar
    ? firstWeekdayOffset(parsedYear, parsedMonth)
    : 0;

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const isCurrentCalendarMonth =
    canRenderCalendar &&
    parsedYear === today.getFullYear() &&
    parsedMonth === today.getMonth() + 1;
  const selectedDayAssignments =
    selectedDayForDetails === null
      ? []
      : (assignmentsByDay.get(selectedDayForDetails) ?? []);
  const selectedDayLabel =
    selectedDayForDetails === null
      ? ""
      : `${MONTH_NAMES[parsedMonth - 1]} ${selectedDayForDetails}, ${parsedYear}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="h-9">
          <CalendarDays className="size-4" />
          Full Calendar
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[95vh] w-[calc(100vw-1rem)] !max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border-border/70 bg-background p-0">
        <div className="flex h-full flex-col">
          <DialogHeader className="space-y-3 border-b border-border/70 bg-muted/20 px-6 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Users className="size-5" />
                Assignment Calendar
              </DialogTitle>
              <Badge variant="secondary" className="font-medium">
                {canRenderCalendar
                  ? `${MONTH_NAMES[parsedMonth - 1]} ${parsedYear}`
                  : "Invalid date"}
              </Badge>
            </div>
            <DialogDescription className="text-sm">
              See who is assigned per day, then narrow by department and users.
            </DialogDescription>
          </DialogHeader>

          <div className="border-b border-border/70 bg-card/40 px-6 py-4">
            <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
              <div className="space-y-3 rounded-xl border border-border/70 bg-background p-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="calendar-department">Department</Label>
                    <Select
                      value={selectedDepartmentId}
                      onValueChange={setSelectedDepartmentId}
                      disabled={
                        isLoadingDepartments || departments.length === 0
                      }
                    >
                      <SelectTrigger
                        id="calendar-department"
                        className="h-10 w-full"
                      >
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((department) => (
                          <SelectItem
                            key={department.id}
                            value={department.id.toString()}
                          >
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="calendar-month">Month</Label>
                    <Select value={month} onValueChange={setMonth}>
                      <SelectTrigger
                        id="calendar-month"
                        className="h-10 w-full"
                      >
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTH_NAMES.map((label, index) => (
                          <SelectItem
                            key={label}
                            value={(index + 1).toString()}
                          >
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="calendar-year">Year</Label>
                    <Input
                      id="calendar-year"
                      className="h-10 w-full"
                      value={year}
                      onChange={(event) => setYear(event.target.value)}
                      type="number"
                      min={2020}
                    />
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  {isLoadingDepartments ||
                  isLoadingUsers ||
                  isLoadingAssignments ? (
                    <span className="inline-flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1">
                      <Loader2 className="size-3 animate-spin" />
                      Loading data...
                    </span>
                  ) : (
                    <span className="rounded-md bg-muted/40 px-2 py-1 font-medium">
                      {visibleAssignments.length} assignment
                      {visibleAssignments.length === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-border/70 bg-background p-3">
                <Label htmlFor="calendar-user-filter">Filter by user</Label>
                {isLoadingUsers ? (
                  <p className="text-sm text-muted-foreground">
                    Loading users...
                  </p>
                ) : users.length > 0 ? (
                  <Select
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                  >
                    <SelectTrigger
                      id="calendar-user-filter"
                      className="h-10 w-full"
                    >
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All users</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {buildUserName(user)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No active users in this department.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 pb-6">
            {errorMessage ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : !canRenderCalendar ? (
              <div className="rounded-xl border border-border/70 p-3 text-sm text-muted-foreground">
                Enter a valid month and year to view assignments.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[980px] space-y-3">
                  <div className="grid grid-cols-7 gap-2">
                    {weekdayLabels.map((weekday) => (
                      <div
                        key={weekday}
                        className="rounded-lg border border-border/60 bg-muted/30 px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {weekday}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: leadingBlankDays }).map(
                      (_, index) => (
                        <div
                          key={`blank-${index + 1}`}
                          className="min-h-24 rounded-xl border border-dashed border-border/40 bg-muted/10 p-2"
                        />
                      ),
                    )}

                    {Array.from({ length: totalDays }).map((_, index) => {
                      const dayNumber = index + 1;
                      const dayAssignments =
                        assignmentsByDay.get(dayNumber) ?? [];
                      const isWeekend = (() => {
                        const dayValue = new Date(
                          parsedYear,
                          parsedMonth - 1,
                          dayNumber,
                        ).getDay();
                        return dayValue === 0 || dayValue === 6;
                      })();
                      const isToday =
                        isCurrentCalendarMonth && dayNumber === today.getDate();

                      return (
                        <div
                          key={`day-${dayNumber}`}
                          className={`min-h-24 space-y-1.5 rounded-xl border p-2 transition-colors ${
                            isToday
                              ? "border-primary/50 bg-primary/5"
                              : isWeekend
                                ? "border-border/70 bg-muted/15"
                                : "border-border/70 bg-background hover:bg-muted/10"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p
                              className={`text-sm font-semibold ${isToday ? "text-primary" : "text-foreground"}`}
                            >
                              {dayNumber}
                            </p>
                            <span className="rounded-sm bg-muted/40 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                              {dayAssignments.length} user
                              {dayAssignments.length === 1 ? "" : "s"}
                            </span>
                          </div>

                          {dayAssignments.length > 0 ? (
                            <div className="space-y-1.5">
                              {dayAssignments
                                .slice(0, MAX_VISIBLE_ASSIGNMENTS_PER_DAY)
                                .map((assignment) => (
                                  <div
                                    key={assignment.id}
                                    className="rounded-md border border-border/60 bg-card px-2 py-1.5"
                                  >
                                    <p className="line-clamp-1 text-xs font-medium text-foreground">
                                      {buildUserName(assignment.user)}
                                    </p>
                                    <p className="line-clamp-1 text-[10px] text-muted-foreground">
                                      {formatShiftRange(assignment)}
                                    </p>
                                  </div>
                                ))}
                              {dayAssignments.length >
                              MAX_VISIBLE_ASSIGNMENTS_PER_DAY ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-[11px] text-muted-foreground"
                                  onClick={() =>
                                    setSelectedDayForDetails(dayNumber)
                                  }
                                >
                                  +
                                  {dayAssignments.length -
                                    MAX_VISIBLE_ASSIGNMENTS_PER_DAY}{" "}
                                  more
                                </Button>
                              ) : null}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              No assigned users
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      <Dialog
        open={selectedDayForDetails !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDayForDetails(null);
          }
        }}
      >
        <DialogContent className="!max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assignments for {selectedDayLabel}</DialogTitle>
            <DialogDescription>
              {selectedDayAssignments.length} assignment
              {selectedDayAssignments.length === 1 ? "" : "s"}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {selectedDayAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-lg border border-border/70 bg-card px-3 py-2"
              >
                <p className="text-sm font-medium text-foreground">
                  {buildUserName(assignment.user)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatShiftRange(assignment)}
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
