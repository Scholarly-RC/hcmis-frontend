"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Copy,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  UserCircle2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type ReactNode, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { ConfirmationModal } from "@/components/confirmation-modal";
import { SelectField } from "@/components/form-select-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { PayrollPosition } from "@/lib/payroll";
import { toast } from "@/lib/toast";
import type { AuthDepartment, AuthUser } from "@/types/auth";
import { cn } from "@/utils/cn";

type UsersResponse = AuthUser[];
type DepartmentsResponse = AuthDepartment[];
type ResetPasswordResponse = {
  temporary_password: string;
};

type UserStatusFilter = "all" | "active" | "inactive";
export type UserEditorMode = "create" | "edit";

type UserFormState = {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  employee_number: string;
  biometric_uid: string;
  role: (typeof userRoles)[number];
  department_id: string;
  level_1_approver_id: string;
  level_2_approver_id: string;
  position_id: string;
  rank_level: string;
  step_number: string;
  assignment_effective_from: string;
  phone_number: string;
  date_of_birth: string;
  date_of_hiring: string;
  can_modify_shift: boolean;
};

const userRoles = ["EMP", "HR", "DH", "DIR", "PRES"] as const;

function buildUserEditorSchema(mode: UserEditorMode) {
  return z
    .object({
      email: z
        .string()
        .trim()
        .min(1, "Email is required.")
        .email("Enter a valid email address."),
      username: z.string(),
      password: z.string(),
      confirmPassword: z.string(),
      first_name: z.string().trim().min(1, "First name is required."),
      middle_name: z.string(),
      last_name: z.string().trim().min(1, "Last name is required."),
      employee_number: z.string(),
      biometric_uid: z.string(),
      role: z.enum(userRoles),
      department_id: z.string(),
      level_1_approver_id: z.string(),
      level_2_approver_id: z.string(),
      position_id: z.string(),
      rank_level: z.string(),
      step_number: z.string(),
      assignment_effective_from: z.string(),
      phone_number: z.string(),
      date_of_birth: z.string(),
      date_of_hiring: z.string(),
      can_modify_shift: z.boolean(),
    })
    .superRefine((values, context) => {
      if (mode === "create") {
        if (values.password.length < 8) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["password"],
            message: "Password must be at least 8 characters long.",
          });
        }

        if (values.password !== values.confirmPassword) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["confirmPassword"],
            message: "Password confirmation does not match.",
          });
        }
      }

      if (
        values.biometric_uid.trim().length > 0 &&
        !/^\d+$/.test(values.biometric_uid.trim())
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["biometric_uid"],
          message: "Biometric UID must be a whole number.",
        });
      }

      if (
        values.department_id.trim().length > 0 &&
        values.department_id.trim() !== "none" &&
        !/^\d+$/.test(values.department_id.trim())
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["department_id"],
          message: "Department selection is invalid.",
        });
      }

      if (
        values.position_id.trim().length > 0 &&
        values.position_id.trim() !== "none" &&
        !/^\d+$/.test(values.position_id.trim())
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["position_id"],
          message: "Position selection is invalid.",
        });
      }

      if (
        values.rank_level.trim().length > 0 &&
        !/^\d+$/.test(values.rank_level.trim())
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rank_level"],
          message: "Rank level must be a whole number.",
        });
      }

      if (
        values.step_number.trim().length > 0 &&
        !/^\d+$/.test(values.step_number.trim())
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["step_number"],
          message: "Step number must be a whole number.",
        });
      }

      const hasPosition =
        values.position_id.trim().length > 0 &&
        values.position_id.trim() !== "none";
      const hasRankLevel = values.rank_level.trim().length > 0;
      if (hasPosition !== hasRankLevel) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: hasPosition ? ["rank_level"] : ["position_id"],
          message: "Position and rank level are required together.",
        });
      }

      if (
        values.level_1_approver_id.trim() !== "none" &&
        values.level_1_approver_id.trim().length > 0 &&
        values.level_1_approver_id.trim() === values.level_2_approver_id.trim()
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["level_2_approver_id"],
          message: "Level 2 approver must be different from Level 1 approver.",
        });
      }
    });
}

export type UserEditorPayload = {
  email: string;
  username: string | null;
  password?: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  employee_number: string | null;
  biometric_uid: number | null;
  role: string | null;
  department_id: number | null;
  level_1_approver_id: string | null;
  level_2_approver_id: string | null;
  position_id: number | null;
  rank_level: number | null;
  step_number: number | null;
  assignment_effective_from: string | null;
  phone_number: string | null;
  date_of_birth: string | null;
  date_of_hiring: string | null;
  can_modify_shift: boolean;
};

export type UserEditorInitialValues = Partial<
  Pick<UserFormState, "first_name" | "last_name" | "biometric_uid">
>;

const ROLE_OPTIONS = [
  { value: "EMP", label: "Employee" },
  { value: "HR", label: "HR" },
  { value: "DH", label: "Department Head" },
  { value: "DIR", label: "Director" },
  { value: "PRES", label: "President" },
];

const emptyFormState = (): UserFormState => ({
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  employee_number: "",
  biometric_uid: "",
  role: "EMP",
  department_id: "none",
  level_1_approver_id: "none",
  level_2_approver_id: "none",
  position_id: "none",
  rank_level: "",
  step_number: "",
  assignment_effective_from: "",
  phone_number: "",
  date_of_birth: "",
  date_of_hiring: "",
  can_modify_shift: false,
});

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function requestJson<T>(
  pathname: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) {
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

function formatDateInput(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

function buildDisplayName(user: AuthUser) {
  return [user.first_name, user.middle_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function getRoleLabel(role: string | null) {
  const normalized = role?.trim().toUpperCase();
  if (!normalized || normalized === "EMP") {
    return "Employee";
  }

  return (
    ROLE_OPTIONS.find((option) => option.value === normalized)?.label ??
    normalized
  );
}

function normalizeUserRole(
  role: string | null | undefined,
): (typeof userRoles)[number] {
  const normalized = role?.trim().toUpperCase();
  return userRoles.includes(normalized as (typeof userRoles)[number])
    ? (normalized as (typeof userRoles)[number])
    : "EMP";
}

function buildFormState(
  user: AuthUser | null,
  initialValues?: UserEditorInitialValues,
): UserFormState {
  const baseState = !user
    ? emptyFormState()
    : {
        email: user.email,
        username: user.username ?? "",
        password: "",
        confirmPassword: "",
        first_name: user.first_name,
        middle_name: user.middle_name ?? "",
        last_name: user.last_name,
        employee_number: user.employee_number ?? "",
        biometric_uid: user.biometric_uid?.toString() ?? "",
        role: normalizeUserRole(user.role),
        department_id: user.department_id?.toString() ?? "none",
        level_1_approver_id: user.level_1_approver_id ?? "none",
        level_2_approver_id: user.level_2_approver_id ?? "none",
        position_id: user.position_id?.toString() ?? "none",
        rank_level: user.rank_level?.toString() ?? "",
        step_number: user.step_number?.toString() ?? "",
        assignment_effective_from: formatDateInput(user.date_of_hiring),
        phone_number: user.phone_number ?? "",
        date_of_birth: formatDateInput(user.date_of_birth),
        date_of_hiring: formatDateInput(user.date_of_hiring),
        can_modify_shift: user.can_modify_shift,
      };

  if (!initialValues) {
    return baseState;
  }

  return {
    ...baseState,
    ...initialValues,
  };
}

function normalizeText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function FormField({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/70 bg-muted/20 p-4 sm:p-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function ResetPasswordDialog({
  open,
  user,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  user: AuthUser | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => Promise<string>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(
    null,
  );

  async function handleGenerate() {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const nextTemporaryPassword = await onSubmit();
      setTemporaryPassword(nextTemporaryPassword);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to reset password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setSubmitError(null);
      setIsSubmitting(false);
      setTemporaryPassword(null);
    }
  }

  async function copyTemporaryPassword() {
    if (!temporaryPassword) {
      return;
    }
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      toast.success("Temporary password copied.");
    } catch {
      toast.error("Unable to copy password.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Create a temporary password for{" "}
            <span className="font-medium text-foreground">
              {user ? buildDisplayName(user) || user.email : "selected user"}
            </span>
            . The user will be required to change it on next login.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The temporary password expires in 24 hours.
          </p>
          {temporaryPassword ? (
            <div className="space-y-2 rounded-xl border border-border/70 bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground">
                Temporary password
              </p>
              <p className="rounded-md bg-background px-3 py-2 font-mono text-sm">
                {temporaryPassword}
              </p>
              <p className="text-xs text-muted-foreground">
                This value is shown once. Share it securely with the user.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={copyTemporaryPassword}
              >
                <Copy className="size-4" />
                Copy Password
              </Button>
            </div>
          ) : null}

          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
            >
              <X className="size-4" />
              Close
            </Button>
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <KeyRound className="size-4" />
              )}
              {isSubmitting ? "Generating..." : "Generate Temporary Password"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UserEditorDialog({
  open,
  mode,
  user,
  initialValues,
  departments,
  positions,
  users,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  mode: UserEditorMode;
  user: AuthUser | null;
  initialValues?: UserEditorInitialValues;
  departments: AuthDepartment[];
  positions: PayrollPosition[];
  users: AuthUser[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: UserEditorPayload) => Promise<void>;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const controlHeightClass = "h-10";
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<UserFormState>({
    resolver: zodResolver(buildUserEditorSchema(mode)),
    defaultValues: buildFormState(user, initialValues),
    mode: "onSubmit",
  });
  const departmentOptions = [
    { value: "none", label: "Unassigned" },
    ...departments.map((department) => ({
      value: department.id.toString(),
      label: `${department.name} (${department.code})`,
    })),
  ];
  const positionOptions = [
    { value: "none", label: "Unassigned" },
    ...positions
      .filter((position) => position.is_active)
      .map((position) => ({
        value: position.id.toString(),
        label: `${position.code} (${position.title})`,
      })),
  ];
  const approverOptions = [
    { value: "none", label: "Not set" },
    ...users
      .filter((item) => item.is_active && item.id !== user?.id)
      .map((item) => ({
        value: item.id,
        label: `${buildDisplayName(item) || item.email} (${getRoleLabel(item.role)})`,
      })),
  ];

  async function handleFormSubmit(values: UserFormState) {
    setSubmitError(null);

    try {
      const payload: UserEditorPayload = {
        email: values.email.trim(),
        username: normalizeText(values.username),
        first_name: values.first_name.trim(),
        middle_name: normalizeText(values.middle_name),
        last_name: values.last_name.trim(),
        employee_number: normalizeText(values.employee_number),
        biometric_uid:
          values.biometric_uid.trim() === "none" ||
          values.biometric_uid.trim().length === 0
            ? null
            : Number(values.biometric_uid.trim()),
        role: normalizeText(values.role),
        department_id:
          values.department_id.trim() === "none" ||
          values.department_id.trim().length === 0
            ? null
            : Number(values.department_id.trim()),
        level_1_approver_id:
          values.level_1_approver_id.trim() === "none" ||
          values.level_1_approver_id.trim().length === 0
            ? null
            : values.level_1_approver_id.trim(),
        level_2_approver_id:
          values.level_2_approver_id.trim() === "none" ||
          values.level_2_approver_id.trim().length === 0
            ? null
            : values.level_2_approver_id.trim(),
        position_id:
          values.position_id.trim() === "none" ||
          values.position_id.trim().length === 0
            ? null
            : Number(values.position_id.trim()),
        rank_level:
          values.rank_level.trim().length === 0
            ? null
            : Number(values.rank_level.trim()),
        step_number:
          values.step_number.trim().length === 0
            ? null
            : Number(values.step_number.trim()),
        assignment_effective_from: normalizeText(
          values.assignment_effective_from,
        ),
        phone_number: normalizeText(values.phone_number),
        date_of_birth: normalizeText(values.date_of_birth),
        date_of_hiring: normalizeText(values.date_of_hiring),
        can_modify_shift: values.can_modify_shift,
        ...(mode === "create" ? { password: values.password } : {}),
      };

      await onSubmit(payload);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to save user.",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-5xl flex w-[min(96vw,64rem)] max-h-[90vh] flex-col gap-1 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b bg-background px-6 py-4">
          <DialogTitle>
            {mode === "create" ? "Add User" : "Edit User"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new HR-managed account with role, department, and contact details."
              : "Update account details without leaving the management table."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-1 flex-col gap-1"
          onSubmit={handleSubmit(handleFormSubmit)}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-0 pb-6">
            <div className="space-y-5">
              {submitError ? (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {submitError}
                </div>
              ) : null}

              <FormSection
                title="Account and Access"
                description="Login identity and organization access."
              >
                <FormField
                  label="Email"
                  htmlFor="user-email"
                  error={errors.email?.message}
                >
                  <Input
                    id="user-email"
                    type="email"
                    autoComplete="email"
                    className={controlHeightClass}
                    aria-invalid={errors.email ? "true" : "false"}
                    {...register("email")}
                  />
                </FormField>

                <FormField
                  label="Username"
                  htmlFor="user-username"
                  hint="Optional. Can be used together with email for login."
                  error={errors.username?.message}
                >
                  <Input
                    id="user-username"
                    autoComplete="username"
                    className={controlHeightClass}
                    aria-invalid={errors.username ? "true" : "false"}
                    {...register("username")}
                  />
                </FormField>

                <FormField
                  label="Employee number"
                  htmlFor="user-employee-number"
                  error={errors.employee_number?.message}
                >
                  <Input
                    id="user-employee-number"
                    placeholder="EMP-001"
                    className={controlHeightClass}
                    aria-invalid={errors.employee_number ? "true" : "false"}
                    {...register("employee_number")}
                  />
                </FormField>

                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <SelectField
                      id="user-role"
                      label="Role"
                      value={field.value}
                      onChange={(_, value) => field.onChange(value)}
                      options={ROLE_OPTIONS}
                      placeholder="Select a role"
                      triggerClassName={controlHeightClass}
                      error={errors.role?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="department_id"
                  render={({ field }) => (
                    <SelectField
                      id="user-department"
                      label="Department"
                      value={field.value}
                      onChange={(_, value) => field.onChange(value)}
                      options={departmentOptions}
                      placeholder="Select a department"
                      triggerClassName={controlHeightClass}
                      error={errors.department_id?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="level_1_approver_id"
                  render={({ field }) => (
                    <SelectField
                      id="user-level-1-approver"
                      label="Level 1 Approver"
                      value={field.value}
                      onChange={(_, value) => field.onChange(value)}
                      options={approverOptions}
                      placeholder="Select approver"
                      triggerClassName={controlHeightClass}
                      error={errors.level_1_approver_id?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="level_2_approver_id"
                  render={({ field }) => (
                    <SelectField
                      id="user-level-2-approver"
                      label="Level 2 Approver (Backup)"
                      value={field.value}
                      onChange={(_, value) => field.onChange(value)}
                      options={approverOptions}
                      placeholder="Select backup approver"
                      triggerClassName={controlHeightClass}
                      error={errors.level_2_approver_id?.message}
                    />
                  )}
                />

                {mode === "create" ? (
                  <>
                    <FormField
                      label="Password"
                      htmlFor="user-password"
                      error={errors.password?.message}
                    >
                      <Input
                        id="user-password"
                        type="password"
                        autoComplete="new-password"
                        className={controlHeightClass}
                        aria-invalid={errors.password ? "true" : "false"}
                        {...register("password")}
                      />
                    </FormField>

                    <FormField
                      label="Confirm password"
                      htmlFor="user-confirm-password"
                      error={errors.confirmPassword?.message}
                    >
                      <Input
                        id="user-confirm-password"
                        type="password"
                        autoComplete="new-password"
                        className={controlHeightClass}
                        aria-invalid={errors.confirmPassword ? "true" : "false"}
                        {...register("confirmPassword")}
                      />
                    </FormField>
                  </>
                ) : null}
              </FormSection>

              <FormSection
                title="Personal Information"
                description="Employee identity and contact details."
              >
                <FormField
                  label="First name"
                  htmlFor="user-first-name"
                  error={errors.first_name?.message}
                >
                  <Input
                    id="user-first-name"
                    autoComplete="given-name"
                    className={controlHeightClass}
                    aria-invalid={errors.first_name ? "true" : "false"}
                    {...register("first_name")}
                  />
                </FormField>

                <FormField
                  label="Middle name"
                  htmlFor="user-middle-name"
                  error={errors.middle_name?.message}
                >
                  <Input
                    id="user-middle-name"
                    autoComplete="additional-name"
                    className={controlHeightClass}
                    aria-invalid={errors.middle_name ? "true" : "false"}
                    {...register("middle_name")}
                  />
                </FormField>

                <FormField
                  label="Last name"
                  htmlFor="user-last-name"
                  error={errors.last_name?.message}
                >
                  <Input
                    id="user-last-name"
                    autoComplete="family-name"
                    className={controlHeightClass}
                    aria-invalid={errors.last_name ? "true" : "false"}
                    {...register("last_name")}
                  />
                </FormField>

                <FormField
                  label="Phone number"
                  htmlFor="user-phone"
                  error={errors.phone_number?.message}
                >
                  <Input
                    id="user-phone"
                    autoComplete="tel"
                    className={controlHeightClass}
                    aria-invalid={errors.phone_number ? "true" : "false"}
                    {...register("phone_number")}
                  />
                </FormField>

                <FormField
                  label="Date of birth"
                  htmlFor="user-dob"
                  error={errors.date_of_birth?.message}
                >
                  <Input
                    id="user-dob"
                    type="date"
                    className={controlHeightClass}
                    aria-invalid={errors.date_of_birth ? "true" : "false"}
                    {...register("date_of_birth")}
                  />
                </FormField>
              </FormSection>

              <FormSection
                title="Employment Details"
                description="Organization records and employment dates."
              >
                <FormField
                  label="Biometric UID"
                  htmlFor="user-biometric-uid"
                  error={errors.biometric_uid?.message}
                >
                  <Input
                    id="user-biometric-uid"
                    type="number"
                    min="0"
                    placeholder="Optional"
                    className={controlHeightClass}
                    aria-invalid={errors.biometric_uid ? "true" : "false"}
                    {...register("biometric_uid")}
                  />
                </FormField>

                <Controller
                  control={control}
                  name="position_id"
                  render={({ field }) => (
                    <SelectField
                      id="user-position"
                      label="Position"
                      value={field.value}
                      onChange={(_, value) => field.onChange(value)}
                      options={positionOptions}
                      placeholder="Select a position"
                      triggerClassName={controlHeightClass}
                      error={errors.position_id?.message}
                    />
                  )}
                />

                <FormField
                  label="Rank Level"
                  htmlFor="user-rank-level"
                  error={errors.rank_level?.message}
                >
                  <Input
                    id="user-rank-level"
                    type="number"
                    min="1"
                    placeholder="1"
                    className={controlHeightClass}
                    aria-invalid={errors.rank_level ? "true" : "false"}
                    {...register("rank_level")}
                  />
                </FormField>

                <FormField
                  label="Step Number"
                  htmlFor="user-step-number"
                  error={errors.step_number?.message}
                  hint="Optional"
                >
                  <Input
                    id="user-step-number"
                    type="number"
                    min="1"
                    placeholder="Optional"
                    className={controlHeightClass}
                    aria-invalid={errors.step_number ? "true" : "false"}
                    {...register("step_number")}
                  />
                </FormField>

                <FormField
                  label="Assignment Effective From"
                  htmlFor="user-assignment-effective-from"
                  error={errors.assignment_effective_from?.message}
                  hint="Used when creating a new assignment history record."
                >
                  <Input
                    id="user-assignment-effective-from"
                    type="date"
                    className={controlHeightClass}
                    aria-invalid={
                      errors.assignment_effective_from ? "true" : "false"
                    }
                    {...register("assignment_effective_from")}
                  />
                </FormField>

                <FormField
                  label="Date of hiring"
                  htmlFor="user-doh"
                  error={errors.date_of_hiring?.message}
                >
                  <Input
                    id="user-doh"
                    type="date"
                    className={controlHeightClass}
                    aria-invalid={errors.date_of_hiring ? "true" : "false"}
                    {...register("date_of_hiring")}
                  />
                </FormField>
              </FormSection>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-end gap-2 border-t bg-background px-6 py-3">
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
              ) : (
                <Save className="size-4" />
              )}
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                  ? "Create User"
                  : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type UserManagementClientProps = {
  currentUser: AuthUser;
};

export function UserManagementClient({
  currentUser,
}: UserManagementClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UsersResponse>([]);
  const [departments, setDepartments] = useState<DepartmentsResponse>([]);
  const [positions, setPositions] = useState<PayrollPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<UserEditorMode>("create");
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<AuthUser | null>(
    null,
  );
  const departmentFilterOptions = [
    { value: "all", label: "All departments" },
    ...departments.map((department) => ({
      value: department.id.toString(),
      label: `${department.name} (${department.code})`,
    })),
  ];
  const statusFilterOptions = [
    { value: "all", label: "All statuses" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const [loadedUsers, loadedDepartments, loadedPositions] =
          await Promise.all([
            requestJson<UsersResponse>(
              "/api/users?include_superusers=true&exclude_self=true",
            ),
            requestJson<DepartmentsResponse>("/api/departments"),
            requestJson<PayrollPosition[]>("/api/payroll/positions"),
          ]);

        if (cancelled) {
          return;
        }

        setUsers(loadedUsers);
        setDepartments(loadedDepartments);
        setPositions(loadedPositions);
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }

        const message =
          err instanceof Error ? err.message : "Unable to load users.";
        setError(message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const currentUserId = currentUser?.id ?? null;

  const visibleUsers = users.filter((user) => {
    return currentUserId === null || user.id !== currentUserId;
  });

  const filteredUsers = visibleUsers.filter((user) => {
    const matchesSearch = (() => {
      const normalized = search.trim().toLowerCase();
      if (!normalized) {
        return true;
      }

      const departmentText = user.department
        ? `${user.department.name} ${user.department.code}`
        : "";

      return (
        buildDisplayName(user).toLowerCase().includes(normalized) ||
        user.email.toLowerCase().includes(normalized) ||
        (user.username?.toLowerCase().includes(normalized) ?? false) ||
        (user.employee_number?.toLowerCase().includes(normalized) ?? false) ||
        (user.rank?.toLowerCase().includes(normalized) ?? false) ||
        departmentText.toLowerCase().includes(normalized)
      );
    })();

    const matchesDepartment =
      departmentFilter === "all" ||
      user.department_id?.toString() === departmentFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  function openCreateDialog() {
    setEditingUser(null);
    setEditorMode("create");
    setEditorOpen(true);
  }

  function openEditDialog(user: AuthUser) {
    setEditingUser(user);
    setEditorMode("edit");
    setEditorOpen(true);
  }

  function closeEditor(nextOpen: boolean) {
    setEditorOpen(nextOpen);
    if (!nextOpen) {
      setEditingUser(null);
      setEditorMode("create");
    }
  }

  function openResetPasswordDialog(user: AuthUser) {
    setResetPasswordUser(user);
    setResetPasswordOpen(true);
  }

  function closeResetPasswordDialog(nextOpen: boolean) {
    setResetPasswordOpen(nextOpen);
    if (!nextOpen) {
      setResetPasswordUser(null);
    }
  }

  async function handleSaveUser(payload: UserEditorPayload) {
    try {
      const targetUserId = editingUser?.id;
      if (editorMode === "edit" && !targetUserId) {
        throw new Error("No user is selected for editing.");
      }

      const response =
        editorMode === "create" && editingUser === null
          ? await requestJson<AuthUser>("/api/users", {
              method: "POST",
              body: JSON.stringify(payload),
            })
          : await requestJson<AuthUser>(`/api/users/${targetUserId}`, {
              method: "PATCH",
              body: JSON.stringify(payload),
            });

      setUsers((current) => {
        if (editorMode === "create") {
          return [response, ...current];
        }

        return current.map((item) =>
          item.id === response.id ? response : item,
        );
      });

      toast.success(
        editorMode === "create" ? "User created." : "User updated.",
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }

      const message =
        err instanceof Error ? err.message : "Unable to save user.";
      toast.error(message);
      throw err;
    }
  }

  async function toggleUserStatus(user: AuthUser) {
    if (user.id === currentUser?.id && user.is_active) {
      toast.error("You cannot deactivate your own account.");
      return;
    }

    try {
      const response = await requestJson<AuthUser>(
        `/api/users/${user.id}/toggle-status`,
        {
          method: "POST",
        },
      );

      setUsers((current) =>
        current.map((item) => (item.id === response.id ? response : item)),
      );

      toast.success(
        response.is_active ? "User activated." : "User deactivated.",
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }

      const message =
        err instanceof Error ? err.message : "Unable to update user status.";
      toast.error(message);
    }
  }

  async function handleResetPassword(): Promise<string> {
    if (!resetPasswordUser) {
      throw new Error("No user selected.");
    }

    try {
      const response = await requestJson<ResetPasswordResponse>(
        `/api/users/${resetPasswordUser.id}/reset-password`,
        {
          method: "POST",
        },
      );
      toast.success("Temporary password generated.");
      return response.temporary_password;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        throw err;
      }

      throw err instanceof Error
        ? err
        : new Error("Unable to reset user password.");
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            User Management
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage staff accounts, roles, and account status from a single
            screen.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          <Button asChild type="button" variant="outline">
            <Link href="/hr/users/biometric-sync">
              <RefreshCw className="size-4" />
              Biometric Sync
            </Link>
          </Button>
          <Button onClick={openCreateDialog} type="button" variant="secondary">
            <Plus className="size-4" />
            Add User
          </Button>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px] lg:items-end">
        <div className="space-y-2">
          <Label htmlFor="search-users">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search-users"
              value={search}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setSearch(event.target.value)
              }
              className="h-10 pl-9"
              placeholder="Search users"
            />
          </div>
        </div>

        <SelectField
          id="department-filter"
          label="Department"
          value={departmentFilter}
          onChange={(_, value) => setDepartmentFilter(value)}
          options={departmentFilterOptions}
          placeholder="All departments"
        />

        <SelectField
          id="status-filter"
          label="Status"
          value={statusFilter}
          onChange={(_, value) => setStatusFilter(value as UserStatusFilter)}
          options={statusFilterOptions}
          placeholder="All statuses"
        />
      </section>

      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          {isLoading
            ? "Loading directory..."
            : `${filteredUsers.length} of ${visibleUsers.length} users shown`}
        </p>
        {error ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setError(null);
              setIsLoading(true);
              void (async () => {
                try {
                  const [loadedUsers, loadedDepartments, loadedPositions] =
                    await Promise.all([
                      requestJson<UsersResponse>(
                        "/api/users?include_superusers=true&exclude_self=true",
                      ),
                      requestJson<DepartmentsResponse>("/api/departments"),
                      requestJson<PayrollPosition[]>("/api/payroll/positions"),
                    ]);
                  setUsers(loadedUsers);
                  setDepartments(loadedDepartments);
                  setPositions(loadedPositions);
                } catch (loadError) {
                  const message =
                    loadError instanceof Error
                      ? loadError.message
                      : "Unable to load users.";
                  setError(message);
                } finally {
                  setIsLoading(false);
                }
              })();
            }}
          >
            Retry
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/70">
        <Table className="min-w-[760px]">
          <TableHeader className="bg-muted/95 backdrop-blur">
            <TableRow className="text-left text-xs uppercase tracking-[0.18em] text-muted-foreground hover:bg-transparent">
              <TableHead className="border-b border-border/70 px-4 py-3 font-medium">
                Full name
              </TableHead>
              <TableHead className="border-b border-border/70 px-4 py-3 font-medium">
                Status
              </TableHead>
              <TableHead className="border-b border-border/70 px-4 py-3 font-medium">
                Role
              </TableHead>
              <TableHead className="border-b border-border/70 px-4 py-3 font-medium text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-background">
            {isLoading ? (
              [1, 2, 3, 4, 5].map((row) => (
                <TableRow
                  key={`skeleton-${row}`}
                  className="hover:bg-transparent"
                >
                  <TableCell className="border-b border-border/50 px-4 py-4">
                    <div className="h-4 w-52 animate-pulse rounded-full bg-muted" />
                  </TableCell>
                  <TableCell className="border-b border-border/50 px-4 py-4">
                    <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
                  </TableCell>
                  <TableCell className="border-b border-border/50 px-4 py-4">
                    <div className="h-6 w-28 animate-pulse rounded-full bg-muted" />
                  </TableCell>
                  <TableCell className="border-b border-border/50 px-4 py-4">
                    <div className="ml-auto h-8 w-28 animate-pulse rounded-full bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="px-4 py-10">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <UserCircle2 className="size-10 text-muted-foreground" />
                    <p className="font-medium text-foreground">
                      No users match the current filters.
                    </p>
                    <p className="max-w-md text-sm leading-6 text-muted-foreground">
                      Try clearing the search or switching the department and
                      status filters.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                return (
                  <TableRow key={user.id} className="group">
                    <TableCell className="border-b border-border/60 px-4 py-4 align-top">
                      <p className="font-medium text-foreground">
                        {buildDisplayName(user) || "Unnamed user"}
                      </p>
                    </TableCell>
                    <TableCell className="border-b border-border/60 px-4 py-4 align-top">
                      <Badge
                        variant={user.is_active ? "secondary" : "destructive"}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="border-b border-border/60 px-4 py-4 align-top">
                      <Badge variant="outline">{getRoleLabel(user.role)}</Badge>
                    </TableCell>
                    <TableCell className="border-b border-border/60 px-4 py-4 align-top">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          <Pencil className="size-4" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => openResetPasswordDialog(user)}
                        >
                          <KeyRound className="size-4" />
                          Reset Password
                        </Button>

                        <ConfirmationModal
                          trigger={
                            <Button
                              type="button"
                              variant={
                                user.is_active ? "destructive" : "secondary"
                              }
                              size="sm"
                              className="min-w-28 justify-center"
                            >
                              {user.is_active ? "Deactivate" : "Activate"}
                            </Button>
                          }
                          title={
                            user.is_active
                              ? `Deactivate ${buildDisplayName(user) || user.email}?`
                              : `Activate ${buildDisplayName(user) || user.email}?`
                          }
                          description={
                            user.is_active
                              ? "The account will remain in the system but lose access until it is reactivated."
                              : "The account will regain access after activation."
                          }
                          confirmLabel={
                            user.is_active ? "Deactivate" : "Activate"
                          }
                          confirmVariant={
                            user.is_active ? "destructive" : "default"
                          }
                          onConfirm={() => toggleUserStatus(user)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <UserEditorDialog
        key={`${editorMode}-${editingUser?.id ?? "new"}`}
        open={editorOpen}
        mode={editorMode}
        user={editingUser}
        departments={departments}
        positions={positions}
        users={visibleUsers}
        onOpenChange={closeEditor}
        onSubmit={handleSaveUser}
      />
      <ResetPasswordDialog
        open={resetPasswordOpen}
        user={resetPasswordUser}
        onOpenChange={closeResetPasswordDialog}
        onSubmit={handleResetPassword}
      />
    </div>
  );
}
