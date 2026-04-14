"use client";

import {
  CalendarDays,
  Copy,
  Loader2,
  Save,
  Trash2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type KeyboardEvent, useEffect, useState } from "react";

import type { ShiftTemplateRecord } from "@/app/hr/shift-management/_components/shift-management-client";
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
import { toast } from "@/lib/toast";
import type { AuthUser } from "@/types/auth";

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

type RowStatus = "idle" | "saving" | "error";

function AssignmentRow({
  summary,
  dayNumber,
  currentAssignment,
  selectedTemplateId,
  rowStatus,
  isMutating,
  isFocused,
  templates,
  onFocusRow,
  onTemplateSelect,
  onRemove,
}: {
  summary: AttendanceSummary;
  dayNumber: number;
  currentAssignment: AttendanceSummary["days"][number]["shift"];
  selectedTemplateId: string;
  rowStatus: RowStatus;
  isMutating: boolean;
  isFocused: boolean;
  templates: ShiftTemplateRecord[];
  onFocusRow: (dayNumber: number) => void;
  onTemplateSelect: (dayNumber: number, templateId: string) => void;
  onRemove: (dayNumber: number) => void;
}) {
  function statusPill() {
    if (rowStatus === "saving") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Saving
        </span>
      );
    }

    if (rowStatus === "error") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-red-600/30 bg-red-500/10 px-2 py-0.5 text-[11px] text-red-700 dark:text-red-300">
          <XCircle className="size-3" />
          Failed
        </span>
      );
    }

    return null;
  }

  return (
    <div
      data-day-row={dayNumber}
      className={`grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-3 lg:grid-cols-[14rem_1fr_10rem] lg:items-center ${isFocused ? "ring-1 ring-ring/70" : ""}`}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">
            {formatMonthDayLabel(summary, dayNumber)}
          </p>
          {statusPill()}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDateKey(summary.year, summary.month, dayNumber)}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Shift template</p>
        {templates.length ? (
          <div className="flex flex-wrap gap-2">
            {templates.map((shift) => {
              const isSelected = selectedTemplateId === shift.id.toString();
              return (
                <Button
                  key={shift.id}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  className="h-8 rounded-full px-3"
                  data-shift-chip="true"
                  onClick={() =>
                    onTemplateSelect(dayNumber, shift.id.toString())
                  }
                  onFocus={() => onFocusRow(dayNumber)}
                  disabled={isMutating}
                >
                  {shift.description}
                </Button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No shift templates available.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => onRemove(dayNumber)}
          disabled={isMutating || !currentAssignment?.id}
        >
          <Trash2 className="size-4" />
          Remove
        </Button>
      </div>
    </div>
  );
}

export function ShiftAssignmentManager({
  user,
  summary,
  shiftTemplates,
}: {
  user: AuthUser;
  summary: AttendanceSummary;
  shiftTemplates: ShiftTemplateRecord[];
}) {
  const router = useRouter();
  const [isCopyingPreviousMonth, setIsCopyingPreviousMonth] = useState(false);
  const [isGeneratingMonth, setIsGeneratingMonth] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [defaultShiftTemplateId, setDefaultShiftTemplateId] = useState<string>(
    shiftTemplates[0]?.id.toString() ?? "",
  );
  const [pendingTemplateByDay, setPendingTemplateByDay] = useState<
    Record<number, string>
  >({});
  const [rowStatusByDay, setRowStatusByDay] = useState<
    Record<number, RowStatus>
  >({});
  const [focusedDay, setFocusedDay] = useState<number | null>(null);

  const allowedTemplates = shiftTemplates;

  useEffect(() => {
    setDefaultShiftTemplateId(shiftTemplates[0]?.id.toString() ?? "");
  }, [shiftTemplates]);

  function getCurrentAssignment(dayNumber: number) {
    return summary.days.find((day) => day.day === dayNumber)?.shift ?? null;
  }

  function getSelectedTemplateForDay(dayNumber: number) {
    const pending = pendingTemplateByDay[dayNumber];
    if (pending) {
      return pending;
    }
    return getCurrentAssignment(dayNumber)?.shift_id?.toString() ?? "";
  }

  function getChangedDays() {
    return Object.keys(pendingTemplateByDay)
      .map(Number)
      .filter((dayNumber) => {
        const selected = pendingTemplateByDay[dayNumber];
        const current =
          getCurrentAssignment(dayNumber)?.shift_id?.toString() ?? "";
        return selected !== current;
      });
  }

  function focusDayRow(dayNumber: number) {
    setFocusedDay(dayNumber);
    const chip = document.querySelector<HTMLElement>(
      `[data-day-row="${dayNumber}"] [data-shift-chip="true"]`,
    );
    chip?.focus();
  }

  function handleTemplateSelect(dayNumber: number, templateId: string) {
    const current = getCurrentAssignment(dayNumber)?.shift_id?.toString() ?? "";

    setPendingTemplateByDay((previous) => {
      if (templateId === current) {
        const next = { ...previous };
        delete next[dayNumber];
        return next;
      }

      return {
        ...previous,
        [dayNumber]: templateId,
      };
    });

    setRowStatusByDay((previous) => ({
      ...previous,
      [dayNumber]: "idle",
    }));
  }

  async function persistDayAssignment(dayNumber: number, templateId: string) {
    const currentAssignment = getCurrentAssignment(dayNumber);

    setRowStatusByDay((previous) => ({
      ...previous,
      [dayNumber]: "saving",
    }));

    try {
      if (currentAssignment?.id) {
        if (currentAssignment.shift_id.toString() === templateId) {
          setRowStatusByDay((previous) => ({
            ...previous,
            [dayNumber]: "idle",
          }));
          return true;
        }

        const response = await fetch(
          `/api/attendance/shift-assignments/${currentAssignment.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              shift_id: Number(templateId),
            }),
          },
        );

        const payload = (await response.json().catch(() => null)) as {
          detail?: string;
        } | null;

        if (!response.ok) {
          toast.error(
            payload?.detail ?? `Unable to update shift for day ${dayNumber}.`,
          );
          setRowStatusByDay((previous) => ({
            ...previous,
            [dayNumber]: "error",
          }));
          return false;
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
            shift_id: Number(templateId),
          }),
        });

        const payload = (await response.json().catch(() => null)) as {
          detail?: string;
        } | null;

        if (!response.ok) {
          toast.error(
            payload?.detail ?? `Unable to assign shift for day ${dayNumber}.`,
          );
          setRowStatusByDay((previous) => ({
            ...previous,
            [dayNumber]: "error",
          }));
          return false;
        }
      }

      setPendingTemplateByDay((previous) => {
        const next = { ...previous };
        delete next[dayNumber];
        return next;
      });

      setRowStatusByDay((previous) => ({
        ...previous,
        [dayNumber]: "idle",
      }));

      return true;
    } catch {
      toast.error(`Unable to save shift for day ${dayNumber}.`);
      setRowStatusByDay((previous) => ({
        ...previous,
        [dayNumber]: "error",
      }));
      return false;
    }
  }

  async function handleSaveAllChanges() {
    const changedDays = getChangedDays();
    if (!changedDays.length) {
      return;
    }

    setIsSavingAll(true);

    let successCount = 0;
    let failureCount = 0;

    for (const dayNumber of changedDays) {
      const templateId = pendingTemplateByDay[dayNumber];
      if (!templateId) {
        continue;
      }
      const ok = await persistDayAssignment(dayNumber, templateId);
      if (ok) {
        successCount += 1;
      } else {
        failureCount += 1;
      }
    }

    setIsSavingAll(false);

    if (successCount > 0) {
      toast.success(
        `Saved ${successCount} day${successCount > 1 ? "s" : ""}${failureCount ? `, ${failureCount} failed` : ""}.`,
      );
      router.refresh();
      return;
    }

    if (failureCount > 0) {
      toast.error(
        `Unable to save ${failureCount} change${failureCount > 1 ? "s" : ""}.`,
      );
    }
  }

  function handleDiscardAllChanges() {
    setPendingTemplateByDay({});
    setRowStatusByDay({});
  }

  async function handleRemoveAssignment(dayNumber: number) {
    const currentAssignment = getCurrentAssignment(dayNumber);
    if (!currentAssignment?.id) {
      return;
    }

    setRowStatusByDay((previous) => ({
      ...previous,
      [dayNumber]: "saving",
    }));

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
        setRowStatusByDay((previous) => ({
          ...previous,
          [dayNumber]: "error",
        }));
        return;
      }

      setPendingTemplateByDay((previous) => {
        const next = { ...previous };
        delete next[dayNumber];
        return next;
      });
      setRowStatusByDay((previous) => ({
        ...previous,
        [dayNumber]: "idle",
      }));

      toast.success("Shift assignment removed.");
      router.refresh();
    } catch {
      toast.error("Unable to remove shift assignment.");
      setRowStatusByDay((previous) => ({
        ...previous,
        [dayNumber]: "error",
      }));
    }
  }

  function handleRowsKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      void handleSaveAllChanges();
      return;
    }

    if (event.altKey || event.metaKey || event.ctrlKey) {
      return;
    }

    if (!focusedDay) {
      return;
    }

    const dayNumbers = summary.days.map((day) => day.day);
    const focusedIndex = dayNumbers.indexOf(focusedDay);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next =
        dayNumbers[Math.min(dayNumbers.length - 1, focusedIndex + 1)];
      if (next) {
        focusDayRow(next);
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const next = dayNumbers[Math.max(0, focusedIndex - 1)];
      if (next) {
        focusDayRow(next);
      }
      return;
    }
  }

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
    if (shiftTemplates.length === 0) {
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

  const changedDays = getChangedDays();

  return (
    <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Employee Shift Assignments</CardTitle>
            <CardDescription>
              Click shift chips to queue changes, then save all at once.
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
                disabled={shiftTemplates.length === 0}
              >
                <SelectTrigger
                  id="month-template-select"
                  className="h-10 w-full min-w-52"
                >
                  <SelectValue
                    placeholder={
                      shiftTemplates.length ? "Choose template" : "No templates"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {shiftTemplates.map((shift) => (
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
              <Copy className="size-4" />
              {isCopyingPreviousMonth ? "Copying..." : "Copy Previous Month"}
            </Button>
            <Button
              type="button"
              className="h-10"
              onClick={() => void handleGenerateMonth()}
              disabled={isGeneratingMonth || shiftTemplates.length === 0}
            >
              <CalendarDays className="size-4" />
              {isGeneratingMonth ? "Generating..." : "Generate Month"}
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
              <CalendarDays className="size-5" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3" onKeyDown={handleRowsKeyDown}>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">
              {summary.year}-{pad(summary.month)}
            </span>
            <span>
              Shortcuts:{" "}
              <span className="font-medium text-foreground">↑/↓</span> move row,{" "}
              <span className="font-medium text-foreground">Ctrl/Cmd+S</span>{" "}
              save all.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {changedDays.length} pending
            </span>
            <Button
              type="button"
              variant="outline"
              className="h-9"
              onClick={handleDiscardAllChanges}
              disabled={isSavingAll || changedDays.length === 0}
            >
              <Trash2 className="size-4" />
              Discard All
            </Button>
            <Button
              type="button"
              className="h-9"
              onClick={() => void handleSaveAllChanges()}
              disabled={
                isSavingAll ||
                changedDays.length === 0 ||
                allowedTemplates.length === 0
              }
            >
              <Save className="size-4" />
              {isSavingAll ? "Saving..." : "Save All Changed Rows"}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {summary.days.map((day) => (
            <AssignmentRow
              key={day.day}
              summary={summary}
              dayNumber={day.day}
              currentAssignment={day.shift}
              selectedTemplateId={getSelectedTemplateForDay(day.day)}
              rowStatus={rowStatusByDay[day.day] ?? "idle"}
              isMutating={isSavingAll}
              isFocused={focusedDay === day.day}
              templates={allowedTemplates}
              onFocusRow={setFocusedDay}
              onTemplateSelect={handleTemplateSelect}
              onRemove={(dayNumber) => void handleRemoveAssignment(dayNumber)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
