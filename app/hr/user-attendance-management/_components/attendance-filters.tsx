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
import { debounce } from "@/lib/debounce";

type EmployeeOption = {
  id: number;
  label: string;
};

type AttendanceFiltersProps = {
  query: string;
  userId: string;
  year: number;
  month: number;
  employees: EmployeeOption[];
};

type FilterState = {
  query: string;
  userId: string;
  year: string;
  month: string;
};

type DebouncedUpdate = {
  (state: FilterState): void;
  cancel: () => void;
};

const attendanceFiltersSchema = z.object({
  query: z.string(),
  userId: z.string(),
  year: z.string(),
  month: z.string(),
});

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function buildUrl(pathname: string, state: FilterState) {
  const searchParams = new URLSearchParams();

  if (state.query.trim().length > 0) {
    searchParams.set("q", state.query.trim());
  }

  if (state.userId.length > 0) {
    searchParams.set("user", state.userId);
  }

  if (state.year.trim().length > 0) {
    searchParams.set("year", state.year.trim());
  }

  if (state.month.trim().length > 0) {
    searchParams.set("month", state.month.trim());
  }

  const queryString = searchParams.toString();
  return queryString.length > 0 ? `${pathname}?${queryString}` : pathname;
}

export function AttendanceFilters({
  query,
  userId,
  year,
  month,
  employees,
}: AttendanceFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const debouncedUpdateRef = useRef<DebouncedUpdate | null>(null);
  const hasMountedRef = useRef(false);
  const { control, register, reset } = useForm<FilterState>({
    resolver: zodResolver(attendanceFiltersSchema),
    defaultValues: {
      query,
      userId,
      year: year.toString(),
      month: month.toString(),
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
      query,
      userId,
      year: year.toString(),
      month: month.toString(),
    });
  }, [month, query, reset, userId, year]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (!watchedValues) {
      return;
    }

    debouncedUpdateRef.current?.({
      query: watchedValues.query ?? "",
      userId: watchedValues.userId ?? "",
      year: watchedValues.year ?? "",
      month: watchedValues.month ?? "",
    });
  }, [watchedValues]);

  return (
    <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
      <CardHeader className="space-y-2">
        <CardTitle>Filters</CardTitle>
        <CardDescription>
          Search for an employee, then choose the month you want to review.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 xl:grid-cols-[1.4fr_1.4fr_0.8fr_0.8fr]"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="space-y-2 xl:col-span-1">
            <Label htmlFor="q">Employee search</Label>
            <Input
              id="q"
              className="h-10"
              placeholder="Name, email, or employee number"
              {...register("query")}
            />
          </div>

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
                className="xl:col-span-1"
              />
            )}
          />

          <div className="grid grid-cols-2 gap-3 xl:col-span-1">
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
