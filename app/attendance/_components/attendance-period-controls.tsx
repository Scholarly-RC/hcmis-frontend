"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MONTH_NAMES } from "@/constants/date";

type AttendancePeriodControlsProps = {
  year: number;
  month: number;
  tab: "today" | "monthly";
};

function clampYear(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(2100, Math.max(2000, Math.trunc(value)));
}

export function AttendancePeriodControls({
  year,
  month,
  tab,
}: AttendancePeriodControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [yearInput, setYearInput] = useState(year.toString());
  const [monthInput, setMonthInput] = useState(month.toString());

  useEffect(() => {
    setYearInput(year.toString());
    setMonthInput(month.toString());
  }, [year, month]);

  const previousMonth = useMemo(() => {
    const previousDate = new Date(year, month - 2, 1);
    return {
      year: previousDate.getFullYear(),
      month: previousDate.getMonth() + 1,
    };
  }, [month, year]);

  const nextMonth = useMemo(() => {
    const nextDate = new Date(year, month, 1);
    return {
      year: nextDate.getFullYear(),
      month: nextDate.getMonth() + 1,
    };
  }, [month, year]);

  function buildHref(targetYear: number, targetMonth: number) {
    const query = new URLSearchParams({
      year: targetYear.toString(),
      month: targetMonth.toString(),
      tab,
    });
    return `${pathname}?${query.toString()}`;
  }

  function applyPeriod() {
    const parsedYear = Number.parseInt(yearInput, 10);
    const normalizedYear = clampYear(parsedYear, year);
    const parsedMonth = Number.parseInt(monthInput, 10);
    const normalizedMonth =
      Number.isFinite(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12
        ? parsedMonth
        : month;

    router.push(buildHref(normalizedYear, normalizedMonth));
  }

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const currentPeriodLabel = `${MONTH_NAMES[month - 1] ?? `Month ${month}`} ${year}`;

  return (
    <div className="rounded-2xl border border-border/70 bg-card/85 p-4 shadow-lg shadow-black/5 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Attendance period
          </p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {currentPeriodLabel}
          </p>
        </div>

        <form
          className="flex w-full flex-col items-start gap-2 lg:w-auto lg:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            applyPeriod();
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Select value={monthInput} onValueChange={setMonthInput}>
              <SelectTrigger
                id="attendance-month"
                aria-label="Select month"
                className="h-10 w-[10rem]"
              >
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((label, index) => (
                  <SelectItem key={label} value={(index + 1).toString()}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              id="attendance-year"
              aria-label="Select year"
              type="number"
              min={2000}
              max={2100}
              value={yearInput}
              onChange={(event) => setYearInput(event.target.value)}
              className="h-10 w-[7rem]"
            />

            <Button type="submit" className="h-10">
              <CalendarDays className="size-4" />
              Apply
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" className="h-10">
              <Link href={buildHref(previousMonth.year, previousMonth.month)}>
                <ChevronLeft className="size-4" />
                Previous
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-10">
              <Link href={buildHref(nextMonth.year, nextMonth.month)}>
                Next
                <ChevronRight className="size-4" />
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-10">
              <Link href={buildHref(todayYear, todayMonth)}>
                <CalendarDays className="size-4" />
                Current month
              </Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
