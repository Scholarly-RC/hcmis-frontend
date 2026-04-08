"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  Loader2,
  PencilLine,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  AttendanceHoliday,
  AttendanceHolidayPayload,
} from "@/lib/attendance";
import { requestJson } from "@/lib/payroll";
import { toast } from "@/lib/toast";
import { cn } from "@/utils/cn";

type HolidayManagementClientProps = {
  initialYear: number;
  initialHolidays: AttendanceHoliday[];
};

type HolidayEditorMode = "create" | "edit";

const holidaySchema = z.object({
  name: z.string().trim().min(1, "Holiday name is required."),
  month: z.coerce
    .number()
    .int()
    .min(1, "Use a valid month.")
    .max(12, "Use a valid month."),
  day: z.coerce
    .number()
    .int()
    .min(1, "Use a valid day.")
    .max(31, "Use a valid day."),
  yearMode: z.enum(["recurring", "specific"]),
  year: z.coerce
    .number()
    .int()
    .min(1900, "Use a year from 1900 onward.")
    .max(9999, "Use a valid year."),
});

type HolidayFormValues = z.infer<typeof holidaySchema>;

function buildHolidayFormValues(
  holiday: AttendanceHoliday | null,
  fallbackYear: number,
): HolidayFormValues {
  return {
    name: holiday?.name ?? "",
    month: holiday?.month ?? 1,
    day: holiday?.day ?? 1,
    yearMode: holiday?.year === null ? "recurring" : "specific",
    year: holiday?.year ?? fallbackYear,
  };
}

function toHolidayPayload(values: HolidayFormValues): AttendanceHolidayPayload {
  return {
    name: values.name.trim(),
    month: values.month,
    day: values.day,
    year: values.yearMode === "recurring" ? null : values.year,
  };
}

function sortHolidays(items: AttendanceHoliday[]) {
  return [...items].sort((left, right) => {
    const leftSpecificity = left.year === null ? 0 : 1;
    const rightSpecificity = right.year === null ? 0 : 1;

    if (leftSpecificity !== rightSpecificity) {
      return leftSpecificity - rightSpecificity;
    }

    if ((left.year ?? 0) !== (right.year ?? 0)) {
      return (left.year ?? 0) - (right.year ?? 0);
    }

    if (left.month !== right.month) {
      return left.month - right.month;
    }

    if (left.day !== right.day) {
      return left.day - right.day;
    }

    return left.name.localeCompare(right.name);
  });
}

function formatHolidayDate(holiday: AttendanceHoliday) {
  const year = holiday.year ?? 2000;
  const label = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  }).format(new Date(year, holiday.month - 1, holiday.day));

  return holiday.year === null
    ? `${label} every year`
    : `${label}, ${holiday.year}`;
}

function HolidayStat({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
    </div>
  );
}

function HolidayEditorDialog({
  open,
  mode,
  holiday,
  selectedYear,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  mode: HolidayEditorMode;
  holiday: AttendanceHoliday | null;
  selectedYear: number;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AttendanceHolidayPayload) => Promise<void>;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty, isSubmitting },
  } = useForm<HolidayFormValues>({
    resolver: zodResolver(holidaySchema),
    defaultValues: buildHolidayFormValues(holiday, selectedYear),
    mode: "onSubmit",
  });
  const yearMode = watch("yearMode");

  useEffect(() => {
    reset(buildHolidayFormValues(holiday, selectedYear));
    setSubmitError(null);
  }, [holiday, reset, selectedYear]);

  async function handleFormSubmit(values: HolidayFormValues) {
    setSubmitError(null);

    try {
      await onSubmit(toHolidayPayload(values));
      onOpenChange(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to save holiday.",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Holiday" : "Edit Holiday"}
          </DialogTitle>
          <DialogDescription>
            Register one effective calendar date at a time. Recurring holidays
            apply every year; specific holidays only apply to the selected year.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
          {submitError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          ) : null}

          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label htmlFor="holiday-name">Holiday Name</Label>
                <Input
                  id="holiday-name"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={(event) => field.onChange(event.target.value)}
                  placeholder="Foundation Day"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="month"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label htmlFor="holiday-month">Month</Label>
                  <Input
                    id="holiday-month"
                    type="number"
                    min={1}
                    max={12}
                    value={field.value}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
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
              name="day"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label htmlFor="holiday-day">Day</Label>
                  <Input
                    id="holiday-day"
                    type="number"
                    min={1}
                    max={31}
                    value={field.value}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
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
          </div>

          <Controller
            control={control}
            name="yearMode"
            render={({ field }) => (
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-left transition-colors",
                    field.value === "recurring"
                      ? "border-foreground bg-foreground text-background"
                      : "border-border/70 bg-muted/20 text-foreground",
                  )}
                  onClick={() => field.onChange("recurring")}
                >
                  <p className="text-sm font-medium">Recurring Holiday</p>
                  <p className="mt-1 text-xs opacity-80">
                    Repeats every year on the same month and day.
                  </p>
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-left transition-colors",
                    field.value === "specific"
                      ? "border-foreground bg-foreground text-background"
                      : "border-border/70 bg-muted/20 text-foreground",
                  )}
                  onClick={() => field.onChange("specific")}
                >
                  <p className="text-sm font-medium">Specific Year</p>
                  <p className="mt-1 text-xs opacity-80">
                    Applies only to one selected calendar year.
                  </p>
                </button>
              </div>
            )}
          />

          <Controller
            control={control}
            name="year"
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label htmlFor="holiday-year">Year</Label>
                <Input
                  id="holiday-year"
                  type="number"
                  min={1900}
                  max={9999}
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={(event) => field.onChange(event.target.value)}
                  disabled={yearMode !== "specific"}
                  aria-invalid={fieldState.invalid ? "true" : "false"}
                />
                <p className="text-xs text-muted-foreground">
                  {yearMode === "specific"
                    ? "Used only for this holiday entry."
                    : "Recurring holidays ignore the year field."}
                </p>
                {fieldState.error ? (
                  <p className="text-xs text-destructive" role="alert">
                    {fieldState.error.message}
                  </p>
                ) : null}
              </div>
            )}
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
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : mode === "create" ? (
                <Plus className="size-4" />
              ) : (
                <Save className="size-4" />
              )}
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                  ? "Create Holiday"
                  : "Save Holiday"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function HolidayManagementClient({
  initialYear,
  initialHolidays,
}: HolidayManagementClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [holidays, setHolidays] = useState(() => sortHolidays(initialHolidays));
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<HolidayEditorMode>("create");
  const [selectedHoliday, setSelectedHoliday] =
    useState<AttendanceHoliday | null>(null);
  const [deletingHolidayId, setDeletingHolidayId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    setSelectedYear(initialYear);
    setHolidays(sortHolidays(initialHolidays));
  }, [initialHolidays, initialYear]);

  const recurringCount = useMemo(
    () => holidays.filter((item) => item.year === null).length,
    [holidays],
  );
  const yearSpecificCount = holidays.length - recurringCount;

  function syncYear(year: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", String(year));
    router.replace(`${pathname}?${params.toString()}`);
  }

  function handleYearChange(year: number) {
    setSelectedYear(year);
    syncYear(year);
  }

  async function handleCreate(payload: AttendanceHolidayPayload) {
    const created = await requestJson<AttendanceHoliday>(
      "/api/attendance/holidays",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
    const nextHolidays =
      created.year === null || created.year === selectedYear
        ? sortHolidays([...holidays, created])
        : holidays;
    setHolidays(nextHolidays);
    toast.success("Holiday registered.");
  }

  async function handleUpdate(payload: AttendanceHolidayPayload) {
    if (!selectedHoliday) {
      return;
    }

    const updated = await requestJson<AttendanceHoliday>(
      `/api/attendance/holidays/${selectedHoliday.id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );

    let nextHolidays = holidays.filter(
      (item) => item.id !== selectedHoliday.id,
    );
    if (updated.year === null || updated.year === selectedYear) {
      nextHolidays = [...nextHolidays, updated];
    }

    setHolidays(sortHolidays(nextHolidays));
    toast.success("Holiday updated.");
  }

  async function handleDelete(holiday: AttendanceHoliday) {
    setDeletingHolidayId(holiday.id);
    try {
      await requestJson<string>(`/api/attendance/holidays/${holiday.id}`, {
        method: "DELETE",
      });
      setHolidays((current) =>
        current.filter((item) => item.id !== holiday.id),
      );
      toast.success("Holiday removed.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete holiday.",
      );
    } finally {
      setDeletingHolidayId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Holiday Registry</CardTitle>
            <CardDescription>
              Review the effective holiday calendar for {selectedYear}.
              Recurring entries appear every year; specific entries only appear
              in the year they were registered.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="space-y-2">
              <Label htmlFor="holiday-year-filter">Year</Label>
              <Input
                id="holiday-year-filter"
                type="number"
                min={1900}
                max={9999}
                value={selectedYear}
                onChange={(event) => {
                  const nextYear = Number.parseInt(event.target.value, 10);
                  if (Number.isFinite(nextYear) && nextYear >= 1900) {
                    handleYearChange(nextYear);
                  }
                }}
                className="w-full sm:w-36"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                type="button"
                onClick={() => {
                  setEditorMode("create");
                  setSelectedHoliday(null);
                  setEditorOpen(true);
                }}
              >
                <Plus className="size-4" />
                Add Holiday
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <HolidayStat
              label="Visible Entries"
              value={String(holidays.length)}
              helper="Recurring and year-specific holidays visible for the selected year."
            />
            <HolidayStat
              label="Recurring"
              value={String(recurringCount)}
              helper="Entries with no fixed year."
            />
            <HolidayStat
              label="Specific Year"
              value={String(yearSpecificCount)}
              helper={`Entries scoped only to ${selectedYear}.`}
            />
          </div>

          {holidays.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 px-6 py-10 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-foreground">
                <CalendarDays className="size-5" />
              </div>
              <p className="mt-4 text-base font-medium text-foreground">
                No Holidays Registered For {selectedYear}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Add recurring or year-specific holidays manually as needed.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Name</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidays.map((holiday) => (
                    <TableRow key={holiday.id}>
                      <TableCell className="font-medium text-foreground">
                        {holiday.name}
                      </TableCell>
                      <TableCell>{formatHolidayDate(holiday)}</TableCell>
                      <TableCell>
                        {holiday.year === null
                          ? "Recurring"
                          : `Year ${holiday.year}`}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditorMode("edit");
                              setSelectedHoliday(holiday);
                              setEditorOpen(true);
                            }}
                          >
                            <PencilLine className="size-4" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={deletingHolidayId === holiday.id}
                            onClick={() => void handleDelete(holiday)}
                          >
                            {deletingHolidayId === holiday.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <HolidayEditorDialog
        open={editorOpen}
        mode={editorMode}
        holiday={selectedHoliday}
        selectedYear={selectedYear}
        onOpenChange={setEditorOpen}
        onSubmit={editorMode === "create" ? handleCreate : handleUpdate}
      />
    </div>
  );
}
