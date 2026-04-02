"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  PencilLine,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type ComponentType, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { ConfirmationModal } from "@/components/confirmation-modal";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  AttendanceRecord,
  AttendanceSummary,
  AttendanceSummaryDay,
} from "@/lib/attendance";
import { toast } from "@/lib/toast";
import type { AuthUser } from "@/types/auth";
import { cn } from "@/utils/cn";

type DraftState =
  | {
      mode: "create";
      day: AttendanceSummaryDay;
      clockedTime: string;
      punch: "IN" | "OUT";
    }
  | {
      mode: "edit";
      day: AttendanceSummaryDay;
      record: AttendanceRecord;
      clockedTime: string;
      punch: "IN" | "OUT";
    };

const attendanceDraftSchema = z.object({
  clockedTime: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, "Choose a valid clock time."),
  punch: z.enum(["IN", "OUT"]),
});

type AttendanceDraftFormValues = z.infer<typeof attendanceDraftSchema>;

type AttendanceManagementClientProps = {
  user: AuthUser;
  summary: AttendanceSummary;
  year: number;
  monthLabel: string;
  mode: "today" | "history";
  focusDay: number | null;
  referenceDate: {
    year: number;
    month: number;
    day: number;
  };
};

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function getLocalTimeInputValue(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getCurrentLocalTimeInputValue() {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function buildTimestamp(dateKey: string, clockedTime: string) {
  return new Date(`${dateKey}T${clockedTime}:00`).toISOString();
}

function formatDateLabel(year: number, month: number, day: number) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatTimeLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getShiftRangeLabel(shift: AttendanceSummaryDay["shift"]) {
  if (!shift?.shift) {
    return "No assigned shift";
  }

  const parts = [
    shift.shift.start_time,
    shift.shift.end_time,
    shift.shift.start_time_2,
    shift.shift.end_time_2,
  ].filter(Boolean);

  return parts.length > 0
    ? `${shift.shift.description} - ${parts.join(" - ")}`
    : shift.shift.description;
}

function getSummaryStats(summary: AttendanceSummary) {
  let daysWithShifts = 0;
  let daysWithPunches = 0;
  let holidayDays = 0;
  let overtimeDays = 0;
  let totalPunches = 0;

  for (const day of summary.days) {
    if (day.shift) {
      daysWithShifts += 1;
    }
    if (day.attendance_records.length > 0) {
      daysWithPunches += 1;
      totalPunches += day.attendance_records.length;
    }
    if (day.holidays.length > 0) {
      holidayDays += 1;
    }
    if (day.overtime_approved) {
      overtimeDays += 1;
    }
  }

  return {
    daysWithShifts,
    daysWithPunches,
    holidayDays,
    overtimeDays,
    totalPunches,
    missingPunchDays: Math.max(daysWithShifts - daysWithPunches, 0),
  };
}

function buildDraftInitialValues(draft: DraftState): AttendanceDraftFormValues {
  return {
    clockedTime: draft.clockedTime,
    punch: draft.punch,
  };
}

function parseScheduledStart(
  summary: AttendanceSummary,
  day: AttendanceSummaryDay,
): Date | null {
  const startTime = day.shift?.shift?.start_time;
  if (!startTime) {
    return null;
  }

  const [hoursText, minutesText] = startTime.split(":");
  const hours = Number.parseInt(hoursText ?? "", 10);
  const minutes = Number.parseInt(minutesText ?? "", 10);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  const startDate = new Date(summary.year, summary.month - 1, day.day);
  startDate.setHours(hours, minutes, 0, 0);
  return startDate;
}

function isPastDay(
  summary: AttendanceSummary,
  day: AttendanceSummaryDay,
  referenceDate: { year: number; month: number; day: number },
) {
  const dayDate = new Date(summary.year, summary.month - 1, day.day);
  dayDate.setHours(0, 0, 0, 0);

  const reference = new Date(
    referenceDate.year,
    referenceDate.month - 1,
    referenceDate.day,
  );
  reference.setHours(0, 0, 0, 0);

  return dayDate.getTime() < reference.getTime();
}

function getDayStatus(
  summary: AttendanceSummary,
  day: AttendanceSummaryDay,
  referenceDate: { year: number; month: number; day: number },
): {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
} {
  if (day.holidays.length > 0) {
    return { label: "Holiday", variant: "secondary" };
  }

  const records = [...day.attendance_records].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp),
  );

  if (day.shift && records.length === 0) {
    return isPastDay(summary, day, referenceDate)
      ? { label: "Absent", variant: "destructive" }
      : { label: "Pending", variant: "outline" };
  }

  if (day.shift && records.length === 1) {
    return { label: "Pending correction", variant: "outline" };
  }

  const firstClockIn = records.find((record) => record.punch === "IN");
  const scheduledStart = parseScheduledStart(summary, day);
  if (firstClockIn && scheduledStart) {
    const firstClockInTime = new Date(firstClockIn.timestamp).getTime();
    if (
      Number.isFinite(firstClockInTime) &&
      firstClockInTime > scheduledStart.getTime()
    ) {
      return { label: "Late", variant: "secondary" };
    }
  }

  return records.length > 0
    ? { label: "Present", variant: "default" }
    : { label: "No shift", variant: "outline" };
}

function getDaysForMode(
  summary: AttendanceSummary,
  mode: "today" | "history",
  focusDay: number | null,
): AttendanceSummaryDay[] {
  if (mode === "history") {
    return summary.days;
  }

  if (focusDay !== null) {
    const day = summary.days.find((item) => item.day === focusDay);
    if (day) {
      return [day];
    }
  }

  const firstWithPunches = summary.days.find(
    (day) => day.attendance_records.length > 0,
  );
  return firstWithPunches ? [firstWithPunches] : summary.days.slice(0, 1);
}

function AttendanceDraftForm({
  draft,
  summary,
  userId,
  onClose,
  setIsSaving,
}: {
  draft: DraftState;
  summary: AttendanceSummary;
  userId: number;
  onClose: () => void;
  setIsSaving: (value: boolean) => void;
}) {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<AttendanceDraftFormValues>({
    resolver: zodResolver(attendanceDraftSchema),
    defaultValues: buildDraftInitialValues(draft),
    mode: "onSubmit",
  });

  async function handleFormSubmit(values: AttendanceDraftFormValues) {
    setIsSaving(true);
    const dateKey = formatDateKey(summary.year, summary.month, draft.day.day);
    const body =
      draft.mode === "create"
        ? {
            user_id: userId,
            timestamp: buildTimestamp(dateKey, values.clockedTime),
            punch: values.punch,
          }
        : {
            timestamp: buildTimestamp(dateKey, values.clockedTime),
            punch: values.punch,
          };

    try {
      const response = await fetch(
        draft.mode === "create"
          ? "/api/attendance/records"
          : `/api/attendance/records/${draft.record.id}`,
        {
          method: draft.mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      const payload = (await response.json().catch(() => null)) as {
        detail?: string;
      } | null;

      if (!response.ok) {
        toast.error(payload?.detail ?? "Unable to save attendance record.");
        setIsSaving(false);
        return;
      }

      toast.success(
        draft.mode === "create"
          ? "Attendance record added."
          : "Attendance record updated.",
      );

      onClose();
      router.refresh();
    } catch {
      toast.error("Unable to save attendance record.");
      setIsSaving(false);
    }
  }

  return (
    <DialogContent className="w-[calc(100vw-2rem)] !max-w-[30rem] p-0">
      <div className="space-y-0">
        <div className="border-b border-border/70 p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {draft.mode === "create"
                ? "Add attendance punch"
                : "Edit attendance punch"}
            </DialogTitle>
            <DialogDescription>
              {formatDateLabel(summary.year, summary.month, draft.day.day)}
              {" - "}
              {draft.day.day_name}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form
          className="space-y-5 p-6"
          onSubmit={handleSubmit(handleFormSubmit)}
        >
          <Controller
            control={control}
            name="clockedTime"
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label htmlFor="clocked_time">Clock time</Label>
                <Input
                  id="clocked_time"
                  type="time"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={(event) => field.onChange(event.target.value)}
                  required
                  aria-invalid={fieldState.invalid ? "true" : "false"}
                />
                {fieldState.error ? (
                  <p className="text-xs text-destructive" role="alert">
                    {fieldState.error.message}
                  </p>
                ) : null}
              </div>
            )}
          />

          <Controller
            control={control}
            name="punch"
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label>Punch type</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Select punch type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN">Clock in</SelectItem>
                    <SelectItem value="OUT">Clock out</SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.error ? (
                  <p className="text-xs text-destructive" role="alert">
                    {fieldState.error.message}
                  </p>
                ) : null}
              </div>
            )}
          />

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </DialogContent>
  );
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
      <CardContent className="flex items-start justify-between gap-4 pt-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="text-3xl font-semibold tracking-tight">{value}</div>
          <p className="text-sm text-muted-foreground">{helper}</p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-2xl bg-muted text-foreground">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function MiniBadge({
  children,
  variant = "secondary",
}: {
  children: string;
  variant?: "default" | "secondary" | "outline" | "destructive";
}) {
  return <Badge variant={variant}>{children}</Badge>;
}

export function AttendanceManagementClient({
  user,
  summary,
  year,
  monthLabel,
  mode,
  focusDay,
  referenceDate,
}: AttendanceManagementClientProps) {
  const router = useRouter();
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(
    null,
  );
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const stats = getSummaryStats(summary);
  const filteredDays = getDaysForMode(summary, mode, focusDay);
  const selectedDay =
    selectedDayNumber === null
      ? null
      : (filteredDays.find((day) => day.day === selectedDayNumber) ?? null);

  useEffect(() => {
    if (filteredDays.length === 0) {
      setSelectedDayNumber(null);
      return;
    }
    const hasSelectedDay = filteredDays.some(
      (day) => day.day === selectedDayNumber,
    );
    if (!hasSelectedDay) {
      setSelectedDayNumber(filteredDays[0].day);
    }
  }, [filteredDays, selectedDayNumber]);

  function openDay(day: AttendanceSummaryDay) {
    setSelectedDayNumber(day.day);
    setDraft(null);
  }

  function startCreate(day: AttendanceSummaryDay) {
    setDraft({
      mode: "create",
      day,
      clockedTime: getCurrentLocalTimeInputValue(),
      punch: "IN",
    });
  }

  function startEdit(day: AttendanceSummaryDay, record: AttendanceRecord) {
    setDraft({
      mode: "edit",
      day,
      record,
      clockedTime: getLocalTimeInputValue(record.timestamp),
      punch: record.punch,
    });
  }

  async function deleteRecord(recordId: number) {
    if (isSaving) {
      return;
    }
    setIsSaving(true);

    try {
      const response = await fetch(`/api/attendance/records/${recordId}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as {
        detail?: string;
      } | null;

      if (!response.ok) {
        toast.error(payload?.detail ?? "Unable to delete attendance record.");
        setIsSaving(false);
        return;
      }

      toast.success("Attendance record deleted.");
      router.refresh();
    } catch {
      setIsSaving(false);
      toast.error("Unable to delete attendance record.");
      return;
    }

    setIsSaving(false);
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Scheduled days"
          value={stats.daysWithShifts.toString()}
          helper="Days with an assigned shift"
          icon={CalendarDays}
        />
        <StatCard
          label="Punch days"
          value={stats.daysWithPunches.toString()}
          helper={`${stats.missingPunchDays} scheduled days still need punches`}
          icon={Clock3}
        />
        <StatCard
          label="Holiday days"
          value={stats.holidayDays.toString()}
          helper="Days flagged with a holiday"
          icon={CheckCircle2}
        />
        <StatCard
          label="Approved overtime"
          value={stats.overtimeDays.toString()}
          helper="Days with approved overtime"
          icon={Plus}
        />
        <StatCard
          label="Total punches"
          value={stats.totalPunches.toString()}
          helper="All IN and OUT entries"
          icon={Users}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle>
              {mode === "today" ? "Today view" : "Monthly attendance"}
            </CardTitle>
            <CardDescription>
              {user.department
                ? `${user.department.name} - ${monthLabel} ${year}`
                : `${monthLabel} ${year}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-border/70">
              <div className="max-h-[38rem] overflow-auto">
                <Table className="min-w-full">
                  <TableHeader className="sticky top-0 z-20 bg-muted/95 backdrop-blur">
                    <TableRow className="text-left text-xs uppercase tracking-[0.18em] text-muted-foreground hover:bg-transparent">
                      <TableHead className="sticky left-0 z-30 bg-muted/95 px-4 py-3">
                        Day
                      </TableHead>
                      <TableHead className="px-4 py-3">Shift</TableHead>
                      <TableHead className="px-4 py-3">Punches</TableHead>
                      <TableHead className="px-4 py-3">Status</TableHead>
                      <TableHead className="px-4 py-3 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/70 bg-background">
                    {filteredDays.length > 0 ? (
                      filteredDays.map((day) => {
                        const status = getDayStatus(
                          summary,
                          day,
                          referenceDate,
                        );
                        return (
                          <TableRow
                            key={day.day}
                            className={cn(
                              "cursor-pointer border-l-2 border-transparent transition-colors",
                              mode === "history" &&
                                selectedDayNumber === day.day
                                ? "border-l-primary bg-muted/70 hover:bg-muted/70"
                                : "hover:bg-muted/50",
                            )}
                            onClick={() => openDay(day)}
                          >
                            <TableCell className="sticky left-0 z-10 bg-background px-4 py-4 align-top">
                              <div className="space-y-1">
                                <p className="text-base font-semibold text-foreground">
                                  {day.day}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {day.day_name}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-4 align-top">
                              <p className="max-w-[16rem] text-sm font-medium text-foreground">
                                {day.shift?.shift?.description ?? "No shift"}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                {getShiftRangeLabel(day.shift)}
                              </p>
                            </TableCell>
                            <TableCell className="px-4 py-4 align-top">
                              <div className="space-y-2">
                                {day.attendance_records.length > 0 ? (
                                  day.attendance_records.map((record) => (
                                    <div
                                      key={record.id}
                                      className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-sm"
                                    >
                                      <span className="font-medium">
                                        {record.punch}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {formatTimeLabel(record.timestamp)}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    No punch records
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-4 align-top">
                              <MiniBadge variant={status.variant}>
                                {status.label}
                              </MiniBadge>
                            </TableCell>
                            <TableCell className="px-4 py-4 align-top text-right">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openDay(day);
                                }}
                              >
                                View details
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="px-4 py-8 text-center text-sm text-muted-foreground"
                        >
                          No rows for this view.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5 xl:sticky xl:top-4 xl:h-fit">
          <CardHeader>
            <CardTitle>Selected day</CardTitle>
            <CardDescription>
              {selectedDay
                ? `${formatDateLabel(summary.year, summary.month, selectedDay.day)}`
                : "Select a row to review details and manage punches."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDay ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {selectedDay.shift ? (
                    <MiniBadge variant="secondary">Shift assigned</MiniBadge>
                  ) : (
                    <MiniBadge variant="outline">No shift</MiniBadge>
                  )}
                  {selectedDay.holidays.length > 0 ? (
                    <MiniBadge variant="secondary">Holiday</MiniBadge>
                  ) : null}
                  {selectedDay.overtime_approved ? (
                    <MiniBadge>Overtime approved</MiniBadge>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-border/70 bg-background p-4">
                  <p className="text-sm text-muted-foreground">Shift</p>
                  <p className="mt-1 font-medium text-foreground">
                    {selectedDay.shift?.shift?.description ?? "No shift"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {getShiftRangeLabel(selectedDay.shift)}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Punch history
                      </p>
                      <p className="mt-1 font-medium text-foreground">
                        {selectedDay.attendance_records.length} records
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => startCreate(selectedDay)}
                    >
                      <Plus className="size-4" />
                      Add punch
                    </Button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {selectedDay.attendance_records.length > 0 ? (
                      selectedDay.attendance_records.map((record) => (
                        <div
                          key={record.id}
                          className="rounded-2xl border border-border/70 bg-muted/40 p-4"
                        >
                          <div className="flex flex-col gap-3">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                {record.punch}
                              </p>
                              <p className="text-lg font-semibold text-foreground">
                                {formatTimeLabel(record.timestamp)}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => startEdit(selectedDay, record)}
                              >
                                <PencilLine className="size-4" />
                                Edit
                              </Button>
                              <ConfirmationModal
                                trigger={
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    disabled={isSaving}
                                  >
                                    <Trash2 className="size-4" />
                                    Delete
                                  </Button>
                                }
                                title={`Delete ${record.punch} punch?`}
                                description={`This will remove the ${record.punch.toLowerCase()} record at ${formatTimeLabel(record.timestamp)}.`}
                                confirmLabel="Delete"
                                onConfirm={() => deleteRecord(record.id)}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
                        No punches have been recorded for this day yet.
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                Choose a day from the table to open the detail panel.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <Dialog
        open={draft !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDraft(null);
            setIsSaving(false);
          }
        }}
      >
        {draft ? (
          <AttendanceDraftForm
            key={`${draft.mode}-${draft.day.day}-${draft.mode === "edit" ? draft.record.id : "new"}`}
            draft={draft}
            summary={summary}
            userId={user.id}
            onClose={() => {
              setDraft(null);
              setIsSaving(false);
            }}
            setIsSaving={setIsSaving}
          />
        ) : null}
      </Dialog>
    </div>
  );
}
