"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { SelectField } from "@/components/form-select-field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MONTH_NAMES } from "@/constants/date";
import { debounce } from "@/utils/debounce";

type EmployeeOption = {
  id: string;
  label: string;
};

type AttendanceFiltersProps = {
  userId: string;
  year: number;
  month: number;
  tab: string;
  employees: EmployeeOption[];
};

type FilterState = {
  userId: string;
  year: string;
  month: string;
  tab: string;
};

type DebouncedUpdate = {
  (state: FilterState): void;
  cancel: () => void;
};

const attendanceFiltersSchema = z.object({
  userId: z.string(),
  year: z.string(),
  month: z.string(),
  tab: z.string(),
});

function buildUrl(pathname: string, state: FilterState) {
  const searchParams = new URLSearchParams();

  if (state.userId.length > 0) {
    searchParams.set("user", state.userId);
  }

  if (state.year.trim().length > 0) {
    searchParams.set("year", state.year.trim());
  }

  if (state.month.trim().length > 0) {
    searchParams.set("month", state.month.trim());
  }
  if (state.tab.trim().length > 0) {
    searchParams.set("tab", state.tab.trim());
  }

  const queryString = searchParams.toString();
  return queryString.length > 0 ? `${pathname}?${queryString}` : pathname;
}

export function AttendanceFilters({
  userId,
  year,
  month,
  tab,
  employees,
}: AttendanceFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const debouncedUpdateRef = useRef<DebouncedUpdate | null>(null);
  const hasMountedRef = useRef(false);
  const { control, register, reset } = useForm<FilterState>({
    resolver: zodResolver(attendanceFiltersSchema),
    defaultValues: {
      userId,
      year: year.toString(),
      month: month.toString(),
      tab,
    },
    mode: "onChange",
  });
  const watchedValues = useWatch({ control });

  if (!debouncedUpdateRef.current) {
    debouncedUpdateRef.current = debounce((state: FilterState) => {
      router.replace(buildUrl(pathname, state));
    }, 300);
  }

  useEffect(() => {
    const debouncedUpdate = debouncedUpdateRef.current;

    return () => {
      debouncedUpdate?.cancel();
    };
  }, []);

  useEffect(() => {
    reset({
      userId,
      year: year.toString(),
      month: month.toString(),
      tab,
    });
  }, [month, reset, tab, userId, year]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (!watchedValues) {
      return;
    }

    debouncedUpdateRef.current?.({
      userId: watchedValues.userId ?? "",
      year: watchedValues.year ?? "",
      month: watchedValues.month ?? "",
      tab: watchedValues.tab ?? "",
    });
  }, [watchedValues]);

  return (
    <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
      <CardHeader className="space-y-2">
        <CardTitle>Filters</CardTitle>
        <CardDescription>
          Select an employee and date range to load attendance records.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="grid gap-4 xl:grid-cols-[1.6fr_1.2fr_1.2fr]">
            <Controller
              control={control}
              name="userId"
              render={({ field }) => (
                <SelectField
                  id="user"
                  label="Employee"
                  value={field.value}
                  onChange={(_, value) => field.onChange(value)}
                  options={employees.map((employee) => ({
                    value: employee.id.toString(),
                    label: employee.label,
                  }))}
                  placeholder="Select employee"
                />
              )}
            />
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                min={2020}
                className="h-10"
                {...register("year")}
              />
            </div>
            <Controller
              control={control}
              name="month"
              render={({ field }) => (
                <SelectField
                  id="month"
                  label="Month"
                  value={field.value}
                  onChange={(_, value) => field.onChange(value)}
                  options={MONTH_NAMES.map((label, index) => ({
                    value: (index + 1).toString(),
                    label,
                  }))}
                  placeholder="Select month"
                />
              )}
            />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
