"use client";

import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SelectOption = {
  value: string;
  label: ReactNode;
};

type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (field: string, value: string) => void;
  options: SelectOption[];
  placeholder: string;
  className?: string;
  triggerClassName?: string;
  contentPosition?: "item-aligned" | "popper";
  error?: string;
};

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  className,
  triggerClassName,
  contentPosition = "popper",
  error,
}: SelectFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        onValueChange={(nextValue) => onChange(id, nextValue)}
      >
        <SelectTrigger
          id={id}
          name={id}
          className={cn("h-10 w-full", triggerClassName)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position={contentPosition}>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
