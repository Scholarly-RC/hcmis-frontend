"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarRange,
  Check,
  Clock3,
  PencilLine,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Users,
} from "lucide-react";
import {
  type ComponentType,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { type Control, Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { ConfirmationModal } from "@/components/confirmation-modal";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export type ShiftRecord = {
  id: number;
  description: string;
  start_time: string | null;
  end_time: string | null;
  start_time_2: string | null;
  end_time_2: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DepartmentSummary = {
  id: number;
  name: string;
  code: string;
  workweek: string[];
  is_active: boolean;
};

export type DepartmentSchedule = DepartmentSummary & {
  shifts: ShiftRecord[];
};

type ShiftEditorMode = "create" | "edit";

type ShiftFormState = {
  description: string;
  start_time: string;
  end_time: string;
  start_time_2: string;
  end_time_2: string;
  is_active: boolean;
};

const shiftSchema = z
  .object({
    description: z.string().trim().min(1, "Description is required."),
    start_time: z.string().trim().min(1, "Start time is required."),
    end_time: z.string().trim().min(1, "End time is required."),
    start_time_2: z.string(),
    end_time_2: z.string(),
    is_active: z.boolean(),
  })
  .superRefine((values, context) => {
    const hasStartTime2 = values.start_time_2.trim().length > 0;
    const hasEndTime2 = values.end_time_2.trim().length > 0;

    if (hasStartTime2 !== hasEndTime2) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["start_time_2"],
        message:
          "Provide both secondary time fields or leave both secondary fields blank.",
      });
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_time_2"],
        message:
          "Provide both secondary time fields or leave both secondary fields blank.",
      });
    }
  });

type ShiftFormValues = z.infer<typeof shiftSchema>;

type ShiftTextFieldProps = {
  control: Control<ShiftFormValues>;
  name: Exclude<keyof ShiftFormValues, "is_active">;
  label: string;
  type?: string;
  placeholder?: string;
  className?: string;
};

function ShiftTextField({
  control,
  name,
  label,
  type = "text",
  placeholder,
  className,
}: ShiftTextFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className={cn("space-y-2", className)}>
          <Label htmlFor={name}>{label}</Label>
          <Input
            id={name}
            name={name}
            type={type}
            value={field.value}
            onBlur={field.onBlur}
            onChange={(event) => field.onChange(event.target.value)}
            placeholder={placeholder}
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
  );
}

type ShiftCheckboxFieldProps = {
  control: Control<ShiftFormValues>;
  name: "is_active";
  label: string;
  description: string;
};

function ShiftCheckboxField({
  control,
  name,
  label,
  description,
}: ShiftCheckboxFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <label
          htmlFor={String(name)}
          className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3"
        >
          <Checkbox
            id={String(name)}
            checked={field.value}
            onCheckedChange={(checked) => field.onChange(checked === true)}
          />
          <span className="space-y-1">
            <span className="block text-sm font-medium text-foreground">
              {label}
            </span>
            <span className="block text-xs text-muted-foreground">
              {description}
            </span>
            {fieldState.error ? (
              <span className="block text-xs text-destructive" role="alert">
                {fieldState.error.message}
              </span>
            ) : null}
          </span>
        </label>
      )}
    />
  );
}

type ShiftPayload = {
  description: string;
  start_time: string;
  end_time: string;
  start_time_2?: string | null;
  end_time_2?: string | null;
  is_active: boolean;
};

type ShiftManagementClientProps = {
  departments: DepartmentSummary[];
  shifts: ShiftRecord[];
  initialDepartmentId: string;
  initialDepartmentSchedule: DepartmentSchedule | null;
};

const WORKWEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function sortShifts(items: ShiftRecord[]) {
  return [...items].sort((left, right) => {
    const leftActive = left.is_active ? 0 : 1;
    const rightActive = right.is_active ? 0 : 1;

    if (leftActive !== rightActive) {
      return leftActive - rightActive;
    }

    const leftTime = left.start_time ?? "";
    const rightTime = right.start_time ?? "";

    if (leftTime !== rightTime) {
      return leftTime.localeCompare(rightTime);
    }

    return left.description.localeCompare(right.description);
  });
}

function formatTime(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.length === 5 ? `${value}:00` : value;
  const parsed = new Date(`1970-01-01T${normalized}`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function formatShiftRange(shift: ShiftRecord) {
  const parts = [
    shift.start_time,
    shift.end_time,
    shift.start_time_2,
    shift.end_time_2,
  ]
    .map(formatTime)
    .filter((part): part is string => Boolean(part));

  if (parts.length === 0) {
    return "No time range configured";
  }

  return parts.join(" - ");
}

function buildShiftSummary(shift: ShiftRecord) {
  const range = formatShiftRange(shift);
  return range === "No time range configured"
    ? shift.description
    : `${shift.description} · ${range}`;
}

function buildShiftFormState(shift: ShiftRecord | null): ShiftFormState {
  return {
    description: shift?.description ?? "",
    start_time: shift?.start_time ?? "",
    end_time: shift?.end_time ?? "",
    start_time_2: shift?.start_time_2 ?? "",
    end_time_2: shift?.end_time_2 ?? "",
    is_active: shift?.is_active ?? true,
  };
}

function syncScheduleShifts(
  schedule: DepartmentSchedule,
  shiftCatalog: ShiftRecord[],
) {
  const shiftById = new Map(shiftCatalog.map((shift) => [shift.id, shift]));

  return {
    ...schedule,
    shifts: schedule.shifts
      .map((shift) => shiftById.get(shift.id) ?? shift)
      .filter((shift) => shiftById.has(shift.id)),
  };
}

async function requestJson<T>(
  pathname: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(pathname, {
    ...init,
    headers,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      (payload as { detail?: string } | null)?.detail ?? "Request failed.",
      response.status,
    );
  }

  return payload as T;
}

function MiniStatCard({
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

function ShiftEditorDialog({
  open,
  mode,
  shift,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  mode: ShiftEditorMode;
  shift: ShiftRecord | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: ShiftPayload) => Promise<void>;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftSchema),
    defaultValues: buildShiftFormState(shift),
    mode: "onSubmit",
  });

  async function handleFormSubmit(values: ShiftFormValues) {
    setSubmitError(null);

    try {
      await onSubmit({
        description: values.description.trim(),
        start_time: values.start_time.trim(),
        end_time: values.end_time.trim(),
        ...(values.start_time_2.trim() && values.end_time_2.trim()
          ? {
              start_time_2: values.start_time_2.trim(),
              end_time_2: values.end_time_2.trim(),
            }
          : {
              start_time_2: null,
              end_time_2: null,
            }),
        is_active: values.is_active,
      });
      onOpenChange(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to save shift.",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-3xl w-[min(96vw,48rem)]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create shift" : "Edit shift"}
          </DialogTitle>
          <DialogDescription>
            Keep the core shift template lean. Use a second time range only when
            the day truly needs one.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
          {submitError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <ShiftTextField
              control={control}
              name="description"
              label="Description"
              placeholder="Morning shift"
              className="md:col-span-2"
            />

            <ShiftTextField
              control={control}
              name="start_time"
              label="Start time"
              type="time"
            />

            <ShiftTextField
              control={control}
              name="end_time"
              label="End time"
              type="time"
            />

            <ShiftTextField
              control={control}
              name="start_time_2"
              label="Second start time"
              type="time"
            />

            <ShiftTextField
              control={control}
              name="end_time_2"
              label="Second end time"
              type="time"
            />
          </div>

          <ShiftCheckboxField
            control={control}
            name="is_active"
            label="Active shift"
            description="Inactive shifts remain in the catalog but can be hidden from department schedules."
          />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                  ? "Create"
                  : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ShiftCard({
  shift,
  onEdit,
  onDelete,
}: {
  shift: ShiftRecord;
  onEdit: (shift: ShiftRecord) => void;
  onDelete: (shift: ShiftRecord) => Promise<void>;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4 transition-colors hover:bg-background">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-foreground">
              {shift.description}
            </p>
            <Badge variant={shift.is_active ? "secondary" : "outline"}>
              {shift.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {buildShiftSummary(shift)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEdit(shift)}
          >
            <PencilLine className="size-4" />
            Edit
          </Button>
          <ConfirmationModal
            trigger={
              <Button type="button" variant="destructive" size="sm">
                <Trash2 className="size-4" />
                Delete
              </Button>
            }
            title={`Delete ${shift.description}?`}
            description="This removes the shift from the catalog. If the shift is in use, the server will block the delete."
            confirmLabel="Delete"
            onConfirm={() => onDelete(shift)}
          />
        </div>
      </div>
    </div>
  );
}

function DepartmentWorkweekToggle({
  day,
  checked,
  onCheckedChange,
}: {
  day: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const id = `workweek-${day.toLowerCase()}`;

  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors",
        checked
          ? "border-primary/30 bg-primary/5"
          : "border-border/70 bg-background/70 hover:bg-muted/60",
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(next) => onCheckedChange(next === true)}
      />
      <span className="text-sm font-medium text-foreground">{day}</span>
    </label>
  );
}

export function ShiftManagementClient({
  departments,
  shifts,
  initialDepartmentId,
  initialDepartmentSchedule,
}: ShiftManagementClientProps) {
  const [shiftCatalog, setShiftCatalog] = useState<ShiftRecord[]>(
    sortShifts(shifts),
  );
  const [selectedDepartmentId, setSelectedDepartmentId] =
    useState(initialDepartmentId);
  const [selectedSchedule, setSelectedSchedule] =
    useState<DepartmentSchedule | null>(initialDepartmentSchedule);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [isShiftEditorOpen, setIsShiftEditorOpen] = useState(false);
  const [shiftEditorMode, setShiftEditorMode] =
    useState<ShiftEditorMode>("create");
  const [editingShift, setEditingShift] = useState<ShiftRecord | null>(null);

  const initialScheduleRequested = useRef(false);

  useEffect(() => {
    setShiftCatalog(sortShifts(shifts));
  }, [shifts]);

  function getDepartmentLabel(department: DepartmentSummary) {
    return `${department.name} (${department.code})`;
  }

  const departmentOptions = departments.map((department) => ({
    value: department.id.toString(),
    label: getDepartmentLabel(department),
  }));

  function shiftSync(nextShifts: ShiftRecord[]) {
    setSelectedSchedule((current) =>
      current ? syncScheduleShifts(current, nextShifts) : current,
    );
  }

  async function loadShiftCatalog() {
    const nextShifts = sortShifts(
      await requestJson<ShiftRecord[]>("/api/attendance/shifts"),
    );
    setShiftCatalog(nextShifts);
    shiftSync(nextShifts);
    return nextShifts;
  }

  const loadDepartmentSchedule = useCallback(async (departmentId: string) => {
    if (!departmentId) {
      setSelectedSchedule(null);
      setScheduleError(null);
      return;
    }

    setIsLoadingSchedule(true);
    setScheduleError(null);
    setSelectedSchedule(null);

    try {
      const nextSchedule = await requestJson<DepartmentSchedule>(
        `/api/attendance/departments/${departmentId}/schedule`,
      );
      setSelectedSchedule(nextSchedule);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load the selected department schedule.";
      setScheduleError(message);
      toast.error(message);
    } finally {
      setIsLoadingSchedule(false);
    }
  }, []);

  useEffect(() => {
    if (
      !initialScheduleRequested.current &&
      selectedDepartmentId &&
      initialDepartmentSchedule === null
    ) {
      initialScheduleRequested.current = true;
      void loadDepartmentSchedule(selectedDepartmentId);
    }
  }, [initialDepartmentSchedule, selectedDepartmentId, loadDepartmentSchedule]);

  function openCreateShift() {
    setShiftEditorMode("create");
    setEditingShift(null);
    setIsShiftEditorOpen(true);
  }

  function openEditShift(shift: ShiftRecord) {
    setShiftEditorMode("edit");
    setEditingShift(shift);
    setIsShiftEditorOpen(true);
  }

  async function saveShift(payload: ShiftPayload) {
    const isEditing = shiftEditorMode === "edit" && editingShift !== null;
    await requestJson<ShiftRecord>(
      isEditing
        ? `/api/attendance/shifts/${editingShift.id}`
        : "/api/attendance/shifts",
      {
        method: isEditing ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      },
    );

    await loadShiftCatalog();
    toast.success(
      isEditing ? "Shift updated successfully." : "Shift created successfully.",
    );
  }

  async function deleteShift(shift: ShiftRecord) {
    try {
      await requestJson<string>(`/api/attendance/shifts/${shift.id}`, {
        method: "DELETE",
      });

      await loadShiftCatalog();
      toast.success("Shift removed successfully.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to delete shift.";
      toast.error(message);
      throw error;
    }
  }

  async function saveDepartmentSchedule() {
    if (!selectedSchedule || !selectedDepartmentId) {
      return;
    }

    setIsSavingSchedule(true);
    setScheduleError(null);

    try {
      const nextSchedule = await requestJson<DepartmentSchedule>(
        `/api/attendance/departments/${selectedDepartmentId}/schedule`,
        {
          method: "PATCH",
          body: JSON.stringify({
            workweek: selectedSchedule.workweek,
            shift_ids: selectedSchedule.shifts.map((shift) => shift.id),
          }),
        },
      );

      setSelectedSchedule(nextSchedule);
      toast.success("Department schedule saved.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save the selected department schedule.";
      setScheduleError(message);
      toast.error(message);
    } finally {
      setIsSavingSchedule(false);
    }
  }

  function updateSelectedSchedule(
    updater: (current: DepartmentSchedule) => DepartmentSchedule,
  ) {
    setSelectedSchedule((current) => (current ? updater(current) : current));
  }

  function toggleWorkweekDay(day: string, checked: boolean) {
    updateSelectedSchedule((current) => ({
      ...current,
      workweek: checked
        ? Array.from(new Set([...current.workweek, day]))
        : current.workweek.filter((entry) => entry !== day),
    }));
  }

  function toggleShift(shift: ShiftRecord, checked: boolean) {
    updateSelectedSchedule((current) => ({
      ...current,
      shifts: checked
        ? [...current.shifts.filter((entry) => entry.id !== shift.id), shift]
        : current.shifts.filter((entry) => entry.id !== shift.id),
    }));
  }

  function handleDepartmentChange(value: string) {
    setSelectedDepartmentId(value);
    void loadDepartmentSchedule(value);
  }

  const selectedDepartment =
    departments.find(
      (department) => department.id.toString() === selectedDepartmentId,
    ) ?? null;
  const activeShiftCount = shiftCatalog.filter(
    (shift) => shift.is_active,
  ).length;
  const selectedDepartmentShiftCount = selectedSchedule?.shifts.length ?? 0;
  const selectedWorkweekCount = selectedSchedule?.workweek.length ?? 0;

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="space-y-3">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Shift Management
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Keep the shift catalog compact, then assign the right set of shifts
            and workweek days to each department from one place.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStatCard
          label="Total shifts"
          value={shiftCatalog.length.toString()}
          helper="Shift templates in the catalog"
          icon={Clock3}
        />
        <MiniStatCard
          label="Active shifts"
          value={activeShiftCount.toString()}
          helper="Currently available to assign"
          icon={Check}
        />
        <MiniStatCard
          label="Selected department shifts"
          value={selectedDepartmentShiftCount.toString()}
          helper="Shifts applied to the current department"
          icon={Users}
        />
        <MiniStatCard
          label="Workweek days"
          value={selectedWorkweekCount.toString()}
          helper="Days enabled for this department"
          icon={CalendarRange}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
          <CardHeader className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <CardTitle>Shift catalog</CardTitle>
                <CardDescription>
                  Create reusable shift templates and keep the list easy to
                  scan.
                </CardDescription>
              </div>
              <Button type="button" onClick={openCreateShift}>
                <Plus className="size-4" />
                Add shift
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {shiftCatalog.length > 0 ? (
              shiftCatalog.map((shift) => (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  onEdit={openEditShift}
                  onDelete={deleteShift}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
                <p className="text-sm font-medium text-foreground">
                  No shifts have been created yet.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add the first shift template to start assigning schedules.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
          <CardHeader className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <CardTitle>Department schedule</CardTitle>
                <CardDescription>
                  Choose a department, then adjust its workweek and assigned
                  shifts together.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  selectedDepartmentId
                    ? void loadDepartmentSchedule(selectedDepartmentId)
                    : undefined
                }
                disabled={isLoadingSchedule}
              >
                <RefreshCw
                  className={cn("size-4", isLoadingSchedule && "animate-spin")}
                />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {departments.length > 0 ? (
              <div className="space-y-4">
                <SelectField
                  id="department-select"
                  label="Department"
                  value={selectedDepartmentId}
                  onChange={(_, value) => handleDepartmentChange(value)}
                  options={departmentOptions}
                  placeholder="Select a department"
                />

                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-foreground">
                        {selectedDepartment
                          ? getDepartmentLabel(selectedDepartment)
                          : "No department selected"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedSchedule
                          ? "Workweek and shift coverage are ready to edit."
                          : "Loading the selected department schedule."}
                      </p>
                    </div>
                    <Badge
                      variant={
                        selectedDepartment?.is_active ? "secondary" : "outline"
                      }
                    >
                      {selectedDepartment?.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                {scheduleError ? (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {scheduleError}
                  </div>
                ) : null}

                {isLoadingSchedule ? (
                  <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                    Loading the selected department schedule...
                  </div>
                ) : selectedSchedule ? (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">
                          Workweek
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Pick the operating days for the department.
                        </p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {WORKWEEK_DAYS.map((day) => (
                          <DepartmentWorkweekToggle
                            key={day}
                            day={day}
                            checked={selectedSchedule.workweek.includes(day)}
                            onCheckedChange={(checked) =>
                              toggleWorkweekDay(day, checked)
                            }
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">
                          Assigned shifts
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Select the shifts that should apply to this
                          department.
                        </p>
                      </div>

                      {shiftCatalog.length > 0 ? (
                        <div className="space-y-2">
                          {shiftCatalog.map((shift) => {
                            const checked = selectedSchedule.shifts.some(
                              (item) => item.id === shift.id,
                            );

                            return (
                              <label
                                htmlFor={`shift-${shift.id}`}
                                key={shift.id}
                                className={cn(
                                  "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition-colors",
                                  checked
                                    ? "border-primary/30 bg-primary/5"
                                    : "border-border/70 bg-background/70 hover:bg-muted/60",
                                )}
                              >
                                <Checkbox
                                  id={`shift-${shift.id}`}
                                  checked={checked}
                                  onCheckedChange={(next) =>
                                    toggleShift(shift, next === true)
                                  }
                                />
                                <span className="space-y-1">
                                  <span className="block text-sm font-medium text-foreground">
                                    {shift.description}
                                  </span>
                                  <span className="block text-xs text-muted-foreground">
                                    {buildShiftSummary(shift)}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                          Create at least one shift before assigning
                          departments.
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                      <p className="text-sm text-muted-foreground">
                        Changes are saved per department, not per calendar
                        month.
                      </p>
                      <Button
                        type="button"
                        onClick={() => void saveDepartmentSchedule()}
                        disabled={isSavingSchedule || !selectedSchedule}
                      >
                        <Save className="size-4" />
                        {isSavingSchedule ? "Saving..." : "Save schedule"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
                    <p className="text-sm font-medium text-foreground">
                      No schedule loaded.
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Choose a department to configure its workweek and shifts.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
                <p className="text-sm font-medium text-foreground">
                  No departments available.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add departments before configuring shift assignments.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {isShiftEditorOpen ? (
        <ShiftEditorDialog
          key={`${shiftEditorMode}-${editingShift?.id ?? "new"}`}
          open={isShiftEditorOpen}
          mode={shiftEditorMode}
          shift={editingShift}
          onOpenChange={setIsShiftEditorOpen}
          onSubmit={saveShift}
        />
      ) : null}
    </div>
  );
}
