"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Search, UserCircle2 } from "lucide-react";
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
  DialogFooter,
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
import type { AuthDepartment, AuthUser } from "@/lib/auth";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type UsersResponse = AuthUser[];
type DepartmentsResponse = AuthDepartment[];

type UserStatusFilter = "all" | "active" | "inactive";
type UserEditorMode = "create" | "edit";

type UserFormState = {
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  employee_number: string;
  biometric_uid: string;
  role: (typeof userRoles)[number];
  department_id: string;
  rank: string;
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
      password: z.string(),
      confirmPassword: z.string(),
      first_name: z.string().trim().min(1, "First name is required."),
      middle_name: z.string(),
      last_name: z.string().trim().min(1, "Last name is required."),
      employee_number: z.string(),
      biometric_uid: z.string(),
      role: z.enum(userRoles),
      department_id: z.string(),
      rank: z.string(),
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
    });
}

type UserEditorPayload = {
  email: string;
  password?: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  employee_number: string | null;
  biometric_uid: number | null;
  role: string | null;
  department_id: number | null;
  rank: string | null;
  phone_number: string | null;
  date_of_birth: string | null;
  date_of_hiring: string | null;
  can_modify_shift: boolean;
};

const ROLE_OPTIONS = [
  { value: "EMP", label: "Employee" },
  { value: "HR", label: "HR" },
  { value: "DH", label: "Department Head" },
  { value: "DIR", label: "Director" },
  { value: "PRES", label: "President" },
];

const emptyFormState = (): UserFormState => ({
  email: "",
  password: "",
  confirmPassword: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  employee_number: "",
  biometric_uid: "",
  role: "EMP",
  department_id: "none",
  rank: "",
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

function buildFormState(user: AuthUser | null): UserFormState {
  if (!user) {
    return emptyFormState();
  }

  return {
    email: user.email,
    password: "",
    confirmPassword: "",
    first_name: user.first_name,
    middle_name: user.middle_name ?? "",
    last_name: user.last_name,
    employee_number: user.employee_number ?? "",
    biometric_uid: user.biometric_uid?.toString() ?? "",
    role: normalizeUserRole(user.role),
    department_id: user.department_id?.toString() ?? "none",
    rank: user.rank ?? "",
    phone_number: user.phone_number ?? "",
    date_of_birth: formatDateInput(user.date_of_birth),
    date_of_hiring: formatDateInput(user.date_of_hiring),
    can_modify_shift: user.can_modify_shift,
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

function UserEditorDialog({
  open,
  mode,
  user,
  departments,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  mode: UserEditorMode;
  user: AuthUser | null;
  departments: AuthDepartment[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: UserEditorPayload) => Promise<void>;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<UserFormState>({
    resolver: zodResolver(buildUserEditorSchema(mode)),
    defaultValues: buildFormState(user),
    mode: "onSubmit",
  });
  const departmentOptions = [
    { value: "none", label: "Unassigned" },
    ...departments.map((department) => ({
      value: department.id.toString(),
      label: `${department.name} (${department.code})`,
    })),
  ];

  async function handleFormSubmit(values: UserFormState) {
    setSubmitError(null);

    try {
      const payload: UserEditorPayload = {
        email: values.email.trim(),
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
        rank: normalizeText(values.rank),
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
      <DialogContent className="!max-w-6xl w-[min(96vw,72rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add user" : "Edit user"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new HR-managed account with role, department, and contact details."
              : "Update account details without leaving the management table."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
          {submitError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <FormField
              label="Email"
              htmlFor="user-email"
              error={errors.email?.message}
            >
              <Input
                id="user-email"
                type="email"
                autoComplete="email"
                aria-invalid={errors.email ? "true" : "false"}
                {...register("email")}
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
                aria-invalid={errors.employee_number ? "true" : "false"}
                {...register("employee_number")}
              />
            </FormField>

            <FormField
              label="First name"
              htmlFor="user-first-name"
              error={errors.first_name?.message}
            >
              <Input
                id="user-first-name"
                autoComplete="given-name"
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
                aria-invalid={errors.last_name ? "true" : "false"}
                {...register("last_name")}
              />
            </FormField>

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
                aria-invalid={errors.biometric_uid ? "true" : "false"}
                {...register("biometric_uid")}
              />
            </FormField>

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
                  error={errors.department_id?.message}
                />
              )}
            />

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
                  error={errors.role?.message}
                />
              )}
            />

            <FormField
              label="Rank"
              htmlFor="user-rank"
              error={errors.rank?.message}
            >
              <Input
                id="user-rank"
                placeholder="Optional"
                aria-invalid={errors.rank ? "true" : "false"}
                {...register("rank")}
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
                aria-invalid={errors.date_of_birth ? "true" : "false"}
                {...register("date_of_birth")}
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
                aria-invalid={errors.date_of_hiring ? "true" : "false"}
                {...register("date_of_hiring")}
              />
            </FormField>

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
                    aria-invalid={errors.confirmPassword ? "true" : "false"}
                    {...register("confirmPassword")}
                  />
                </FormField>
              </>
            ) : null}
          </div>

          <DialogFooter className="!mx-0 !mb-0">
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
                  ? "Create user"
                  : "Save changes"}
            </Button>
          </DialogFooter>
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<UserEditorMode>("create");
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
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
        const [loadedUsers, loadedDepartments] = await Promise.all([
          requestJson<UsersResponse>(
            "/api/users?include_superusers=true&exclude_self=true",
          ),
          requestJson<DepartmentsResponse>("/api/departments"),
        ]);

        if (cancelled) {
          return;
        }

        setUsers(loadedUsers);
        setDepartments(loadedDepartments);
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

        <Button onClick={openCreateDialog} className="self-start">
          <Plus className="size-4" />
          Add user
        </Button>
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
              className="pl-9"
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
                  const [loadedUsers, loadedDepartments] = await Promise.all([
                    requestJson<UsersResponse>(
                      "/api/users?include_superusers=true&exclude_self=true",
                    ),
                    requestJson<DepartmentsResponse>("/api/departments"),
                  ]);
                  setUsers(loadedUsers);
                  setDepartments(loadedDepartments);
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
        onOpenChange={closeEditor}
        onSubmit={handleSaveUser}
      />
    </div>
  );
}
