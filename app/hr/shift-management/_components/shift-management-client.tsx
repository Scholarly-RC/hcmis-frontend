"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Clock3, PencilLine, Plus, Save, Trash2, X } from "lucide-react";
import { type ComponentType, useState } from "react";
import { type Control, Controller, useForm } from "react-hook-form";
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
import { cn } from "@/utils/cn";

export type ShiftTemplateRecord = {
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
        <Label
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
        </Label>
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
  shiftTemplates: ShiftTemplateRecord[];
};

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function sortShifts(items: ShiftTemplateRecord[]) {
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

function formatShiftRange(shift: ShiftTemplateRecord) {
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

function buildShiftSummary(shift: ShiftTemplateRecord) {
  const range = formatShiftRange(shift);
  return range === "No time range configured"
    ? shift.description
    : `${shift.description} · ${range}`;
}

function buildShiftFormState(
  shift: ShiftTemplateRecord | null,
): ShiftFormState {
  return {
    description: shift?.description ?? "",
    start_time: shift?.start_time ?? "",
    end_time: shift?.end_time ?? "",
    start_time_2: shift?.start_time_2 ?? "",
    end_time_2: shift?.end_time_2 ?? "",
    is_active: shift?.is_active ?? true,
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
  shift: ShiftTemplateRecord | null;
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
            {mode === "create" ? "Create Shift" : "Edit Shift"}
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
            description="Inactive shifts remain in the catalog but can be hidden from assignment screens."
          />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              <X className="size-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {mode === "create" ? (
                <Plus className="size-4" />
              ) : (
                <Save className="size-4" />
              )}
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
  shift: ShiftTemplateRecord;
  onEdit: (shift: ShiftTemplateRecord) => void;
  onDelete: (shift: ShiftTemplateRecord) => Promise<void>;
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

export function ShiftManagementClient({
  shiftTemplates,
}: ShiftManagementClientProps) {
  const [shiftCatalog, setShiftCatalog] = useState<ShiftTemplateRecord[]>(
    sortShifts(shiftTemplates),
  );
  const [isShiftEditorOpen, setIsShiftEditorOpen] = useState(false);
  const [shiftEditorMode, setShiftEditorMode] =
    useState<ShiftEditorMode>("create");
  const [editingShift, setEditingShift] = useState<ShiftTemplateRecord | null>(
    null,
  );

  async function loadShiftCatalog() {
    const nextShifts = sortShifts(
      await requestJson<ShiftTemplateRecord[]>(
        "/api/attendance/shift-templates",
      ),
    );
    setShiftCatalog(nextShifts);
    return nextShifts;
  }

  function openCreateShift() {
    setShiftEditorMode("create");
    setEditingShift(null);
    setIsShiftEditorOpen(true);
  }

  function openEditShift(shift: ShiftTemplateRecord) {
    setShiftEditorMode("edit");
    setEditingShift(shift);
    setIsShiftEditorOpen(true);
  }

  async function saveShift(payload: ShiftPayload) {
    const isEditing = shiftEditorMode === "edit" && editingShift !== null;
    await requestJson<ShiftTemplateRecord>(
      isEditing
        ? `/api/attendance/shift-templates/${editingShift.id}`
        : "/api/attendance/shift-templates",
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

  async function deleteShift(shift: ShiftTemplateRecord) {
    try {
      await requestJson<string>(`/api/attendance/shift-templates/${shift.id}`, {
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

  const activeShiftCount = shiftCatalog.filter(
    (shift) => shift.is_active,
  ).length;

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="space-y-3">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Shift Management
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Maintain reusable shift templates. Shift assignment now happens per
            user in each user profile and attendance workspace.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MiniStatCard
          label="Total Templates"
          value={shiftCatalog.length.toString()}
          helper="Shift templates in the catalog"
          icon={Clock3}
        />
        <MiniStatCard
          label="Active Templates"
          value={activeShiftCount.toString()}
          helper="Currently available for assignment"
          icon={Check}
        />
        <MiniStatCard
          label="Inactive Templates"
          value={(shiftCatalog.length - activeShiftCount).toString()}
          helper="Retained for historical records"
          icon={Clock3}
        />
      </section>

      <section>
        <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
          <CardHeader className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <CardTitle>Shift Templates</CardTitle>
                <CardDescription>
                  Create reusable shift templates and keep the list easy to
                  scan.
                </CardDescription>
              </div>
              <Button type="button" onClick={openCreateShift}>
                <Plus className="size-4" />
                Add Shift
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
