"use client";

import { CalendarDays, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { DepartmentShiftPolicy } from "@/app/hr/shift-management/_components/shift-management-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AttendanceSummary } from "@/lib/attendance";
import type { AuthUser } from "@/lib/auth";
import { toast } from "@/lib/toast";

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function formatMonthDayLabel(summary: AttendanceSummary, dayNumber: number) {
  const day = summary.days.find((entry) => entry.day === dayNumber);
  if (!day) {
    return `Day ${dayNumber}`;
  }

  return `${day.day_name} ${day.day}`;
}

function getAssignmentLabel(
  currentAssignment: NonNullable<
    AttendanceSummary["days"][number]["shift"]
  > | null,
) {
  if (!currentAssignment?.shift) {
    return "No assignment";
  }

  return currentAssignment.shift.description;
}

function AssignmentRow({
  user,
  summary,
  dayNumber,
  departmentShiftPolicy,
  currentAssignment,
}: {
  user: AuthUser;
  summary: AttendanceSummary;
  dayNumber: number;
  departmentShiftPolicy: DepartmentShiftPolicy | null;
  currentAssignment: AttendanceSummary["days"][number]["shift"];
}) {
  const router = useRouter();
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    currentAssignment?.shift_id?.toString() ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedTemplateId(currentAssignment?.shift_id?.toString() ?? "");
  }, [currentAssignment?.shift_id]);

  async function handleSaveAssignment() {
    if (!selectedTemplateId || !departmentShiftPolicy) {
      return;
    }

    setIsSaving(true);

    try {
      if (currentAssignment?.id) {
        if (currentAssignment.shift_id.toString() === selectedTemplateId) {
          toast.success(
            "Shift assignment already matches the selected template.",
          );
          setIsSaving(false);
          return;
        }

        const response = await fetch(
          `/api/attendance/shift-assignments/${currentAssignment.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              shift_id: Number(selectedTemplateId),
            }),
          },
        );

        const payload = (await response.json().catch(() => null)) as {
          detail?: string;
        } | null;

        if (!response.ok) {
          toast.error(payload?.detail ?? "Unable to update shift assignment.");
          setIsSaving(false);
          return;
        }
      } else {
        const response = await fetch("/api/attendance/shift-assignments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: formatDateKey(summary.year, summary.month, dayNumber),
            user_id: user.id,
            shift_id: Number(selectedTemplateId),
          }),
        });

        const payload = (await response.json().catch(() => null)) as {
          detail?: string;
        } | null;

        if (!response.ok) {
          toast.error(payload?.detail ?? "Unable to save shift assignment.");
          setIsSaving(false);
          return;
        }
      }

      toast.success("Shift assignment saved.");
      router.refresh();
    } catch {
      toast.error("Unable to save shift assignment.");
      setIsSaving(false);
    }
  }

  async function handleRemoveAssignment() {
    if (!currentAssignment?.id) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/attendance/shift-assignments/${currentAssignment.id}`,
        {
          method: "DELETE",
        },
      );

      const payload = (await response.json().catch(() => null)) as {
        detail?: string;
      } | null;

      if (!response.ok) {
        toast.error(payload?.detail ?? "Unable to remove shift assignment.");
        setIsSaving(false);
        return;
      }

      toast.success("Shift assignment removed.");
      router.refresh();
    } catch {
      toast.error("Unable to remove shift assignment.");
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-4 rounded-2xl border border-border/70 bg-background/70 p-4 lg:grid-cols-[14rem_1fr_16rem] lg:items-center">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {formatMonthDayLabel(summary, dayNumber)}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDateKey(summary.year, summary.month, dayNumber)}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`assignment-template-${dayNumber}`}>
          Shift template
        </Label>
        <Select
          value={selectedTemplateId}
          onValueChange={setSelectedTemplateId}
          disabled={
            !departmentShiftPolicy || departmentShiftPolicy.shifts.length === 0
          }
        >
          <SelectTrigger id={`assignment-template-${dayNumber}`}>
            <SelectValue
              placeholder={
                departmentShiftPolicy?.shifts.length
                  ? "Select a shift template"
                  : "No allowed templates"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {(departmentShiftPolicy?.shifts ?? []).map((shift) => (
              <SelectItem key={shift.id} value={shift.id.toString()}>
                {shift.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
        <Button
          type="button"
          onClick={() => void handleSaveAssignment()}
          disabled={
            isSaving ||
            !selectedTemplateId ||
            !departmentShiftPolicy ||
            departmentShiftPolicy.shifts.length === 0
          }
        >
          <Save className="size-4" />
          {isSaving ? "Saving..." : currentAssignment?.id ? "Update" : "Assign"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleRemoveAssignment()}
          disabled={isSaving || !currentAssignment?.id}
        >
          <Trash2 className="size-4" />
          Remove
        </Button>
      </div>

      <div className="text-sm text-muted-foreground lg:col-span-3">
        <span className="font-medium text-foreground">
          {getAssignmentLabel(currentAssignment)}
        </span>
        {departmentShiftPolicy?.shifts.length ? (
          <span className="ml-2">
            Allowed templates for this department are ready.
          </span>
        ) : (
          <span className="ml-2">
            This department has no allowed shift templates yet.
          </span>
        )}
      </div>
    </div>
  );
}

export function ShiftAssignmentManager({
  user,
  summary,
  departmentShiftPolicy,
}: {
  user: AuthUser;
  summary: AttendanceSummary;
  departmentShiftPolicy: DepartmentShiftPolicy | null;
}) {
  const router = useRouter();
  const [isCopyingPreviousMonth, setIsCopyingPreviousMonth] = useState(false);
  const [isGeneratingMonth, setIsGeneratingMonth] = useState(false);
  const [defaultShiftTemplateId, setDefaultShiftTemplateId] = useState<string>(
    departmentShiftPolicy?.shifts[0]?.id.toString() ?? "",
  );

  useEffect(() => {
    setDefaultShiftTemplateId(
      departmentShiftPolicy?.shifts[0]?.id.toString() ?? "",
    );
  }, [departmentShiftPolicy?.shifts]);

  async function handleCopyPreviousMonth() {
    setIsCopyingPreviousMonth(true);

    try {
      const response = await fetch(
        "/api/attendance/shift-assignments/copy-previous-month",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            year: summary.year,
            month: summary.month,
          }),
        },
      );

      const payload = (await response.json().catch(() => null)) as {
        detail?: string;
        copied_count?: number;
      } | null;

      if (!response.ok) {
        toast.error(payload?.detail ?? "Unable to copy previous month.");
        setIsCopyingPreviousMonth(false);
        return;
      }

      toast.success(
        `Copied ${payload?.copied_count ?? 0} shift assignments from the previous month.`,
      );
      router.refresh();
    } catch {
      toast.error("Unable to copy previous month.");
      setIsCopyingPreviousMonth(false);
    }
  }

  async function handleGenerateMonth() {
    if (!departmentShiftPolicy) {
      return;
    }

    setIsGeneratingMonth(true);

    try {
      const response = await fetch(
        "/api/attendance/shift-assignments/generate-month",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            year: summary.year,
            month: summary.month,
            ...(defaultShiftTemplateId
              ? { shift_id: Number(defaultShiftTemplateId) }
              : {}),
          }),
        },
      );

      const payload = (await response.json().catch(() => null)) as {
        detail?: string;
        generated_count?: number;
        skipped_count?: number;
      } | null;

      if (!response.ok) {
        toast.error(payload?.detail ?? "Unable to generate month.");
        setIsGeneratingMonth(false);
        return;
      }

      toast.success(
        `Generated ${payload?.generated_count ?? 0} assignments and skipped ${payload?.skipped_count ?? 0}.`,
      );
      router.refresh();
    } catch {
      toast.error("Unable to generate month.");
      setIsGeneratingMonth(false);
    }
  }

  return (
    <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Employee Shift Assignments</CardTitle>
            <CardDescription>
              Assign or replace the employee&apos;s shifts for the selected
              month directly from the day rows below.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-52 space-y-2">
              <Label
                htmlFor="month-template-select"
                className="text-xs leading-none"
              >
                Default template
              </Label>
              <Select
                value={defaultShiftTemplateId}
                onValueChange={setDefaultShiftTemplateId}
                disabled={
                  !departmentShiftPolicy ||
                  departmentShiftPolicy.shifts.length === 0
                }
              >
                <SelectTrigger
                  id="month-template-select"
                  className="h-10 min-w-52"
                >
                  <SelectValue
                    placeholder={
                      departmentShiftPolicy?.shifts.length
                        ? "Choose template"
                        : "No templates"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(departmentShiftPolicy?.shifts ?? []).map((shift) => (
                    <SelectItem key={shift.id} value={shift.id.toString()}>
                      {shift.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={() => void handleCopyPreviousMonth()}
              disabled={isCopyingPreviousMonth}
            >
              {isCopyingPreviousMonth ? "Copying..." : "Copy previous month"}
            </Button>
            <Button
              type="button"
              className="h-10"
              onClick={() => void handleGenerateMonth()}
              disabled={
                isGeneratingMonth ||
                !departmentShiftPolicy ||
                departmentShiftPolicy.shifts.length === 0
              }
            >
              {isGeneratingMonth ? "Generating..." : "Generate month"}
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
              <CalendarDays className="size-5" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {summary.year}-{pad(summary.month)}
          </span>
          <span>
            Use the rows below to assign or update multiple days quickly.
          </span>
        </div>

        <div className="space-y-3">
          {summary.days.map((day) => (
            <AssignmentRow
              key={day.day}
              user={user}
              summary={summary}
              dayNumber={day.day}
              departmentShiftPolicy={departmentShiftPolicy}
              currentAssignment={day.shift}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
