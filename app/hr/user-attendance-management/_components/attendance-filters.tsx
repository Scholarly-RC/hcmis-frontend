"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { SelectField } from "@/components/form-select-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MONTH_NAMES } from "@/constants/date";
import { debounce } from "@/utils/debounce";

type EmployeeOption = {
  id: number;
  label: string;
};

type AttendanceFiltersProps = {
  query: string;
  userId: string;
  year: number;
  month: number;
  tab: string;
  employees: EmployeeOption[];
};

type FilterState = {
  query: string;
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
  query: z.string(),
  userId: z.string(),
  year: z.string(),
  month: z.string(),
  tab: z.string(),
});

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
  if (state.tab.trim().length > 0) {
    searchParams.set("tab", state.tab.trim());
  }

  const queryString = searchParams.toString();
  return queryString.length > 0 ? `${pathname}?${queryString}` : pathname;
}

export function AttendanceFilters({
  query,
  userId,
  year,
  month,
  tab,
  employees,
}: AttendanceFiltersProps) {
  const currentDate = new Date();
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
      query,
      userId,
      year: year.toString(),
      month: month.toString(),
      tab,
    });
  }, [month, query, reset, tab, userId, year]);

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
      tab: watchedValues.tab ?? "",
    });
  }, [watchedValues]);

  return (
    <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
      <CardHeader className="space-y-2">
        <CardTitle>Filters</CardTitle>
        <CardDescription>
          Start with employee search, then expand advanced filters only when
          needed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="grid gap-4 xl:grid-cols-[1.1fr_1.6fr_0.9fr]">
            <div className="space-y-2">
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
                />
              )}
            />

            <div className="space-y-2">
              <Label htmlFor="filter-actions" className="text-transparent">
                Filter actions
              </Label>
              <div id="filter-actions" className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  onClick={() => {
                    reset({
                      query: "",
                      userId,
                      year: currentDate.getFullYear().toString(),
                      month: (currentDate.getMonth() + 1).toString(),
                    });
                  }}
                >
                  Today
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10"
                  onClick={() =>
                    reset({
                      query: "",
                      userId: "",
                      year: currentDate.getFullYear().toString(),
                      month: (currentDate.getMonth() + 1).toString(),
                    })
                  }
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
              >
                More filters
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 grid gap-3 sm:grid-cols-2">
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
            </CollapsibleContent>
          </Collapsible>
        </form>
      </CardContent>
    </Card>
  );
}
