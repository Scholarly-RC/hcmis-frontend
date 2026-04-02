"use client";

import { Plus, Search, SquarePen, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";

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
import { toast } from "@/lib/toast";

type DepartmentRecord = {
  id: number;
  name: string;
  code: string;
  workweek: string[];
  is_active: boolean;
};

type DepartmentEditorMode = "create" | "edit";
type DepartmentStatusFilter = "all" | "active" | "inactive";

type DepartmentEditorState = {
  name: string;
  code: string;
  is_active: boolean;
};

type DepartmentPayload = {
  name: string;
  code: string;
  is_active: boolean;
};

const emptyEditorState = (): DepartmentEditorState => ({
  name: "",
  code: "",
  is_active: true,
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

function normalizeInput(value: string) {
  return value.trim();
}

function buildEditorState(
  department: DepartmentRecord | null,
): DepartmentEditorState {
  if (!department) {
    return emptyEditorState();
  }

  return {
    name: department.name,
    code: department.code,
    is_active: department.is_active,
  };
}

export function DepartmentManagementClient() {
  const router = useRouter();

  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<DepartmentStatusFilter>("all");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<DepartmentEditorMode>("create");
  const [editingDepartment, setEditingDepartment] =
    useState<DepartmentRecord | null>(null);
  const [editorState, setEditorState] =
    useState<DepartmentEditorState>(emptyEditorState);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDepartments() {
      setIsLoading(true);
      setError(null);

      try {
        const response =
          await requestJson<DepartmentRecord[]>("/api/departments");
        if (cancelled) {
          return;
        }
        setDepartments(response);
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 401) {
          router.replace("/login");
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load departments.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDepartments();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const statusFilterOptions = [
    { value: "all", label: "All statuses" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const filteredDepartments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...departments]
      .filter((department) => {
        if (statusFilter === "active" && !department.is_active) {
          return false;
        }

        if (statusFilter === "inactive" && department.is_active) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return (
          department.name.toLowerCase().includes(normalizedSearch) ||
          department.code.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [departments, search, statusFilter]);

  function openCreateDialog() {
    setEditorMode("create");
    setEditingDepartment(null);
    setEditorState(emptyEditorState());
    setEditorError(null);
    setEditorOpen(true);
  }

  function openEditDialog(department: DepartmentRecord) {
    setEditorMode("edit");
    setEditingDepartment(department);
    setEditorState(buildEditorState(department));
    setEditorError(null);
    setEditorOpen(true);
  }

  function closeEditor(open: boolean) {
    setEditorOpen(open);
    if (!open) {
      setEditorError(null);
      setEditingDepartment(null);
      setEditorMode("create");
      setEditorState(emptyEditorState());
    }
  }

  async function saveDepartment() {
    if (isSaving) {
      return;
    }

    const name = normalizeInput(editorState.name);
    const code = normalizeInput(editorState.code);

    if (!name || !code) {
      setEditorError("Department name and code are required.");
      return;
    }

    const payload: DepartmentPayload = {
      name,
      code,
      is_active: editorState.is_active,
    };

    setIsSaving(true);
    setEditorError(null);

    try {
      if (editorMode === "create") {
        const created = await requestJson<DepartmentRecord>(
          "/api/departments",
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );

        setDepartments((current) => [created, ...current]);
        toast.success("Department created.");
      } else {
        const targetDepartmentId = editingDepartment?.id;
        if (!targetDepartmentId) {
          throw new Error("No department selected for editing.");
        }

        const updated = await requestJson<DepartmentRecord>(
          `/api/departments/${targetDepartmentId}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );

        setDepartments((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
        toast.success("Department updated.");
      }

      closeEditor(false);
    } catch (saveError) {
      if (saveError instanceof ApiError && saveError.status === 401) {
        router.replace("/login");
        return;
      }

      const message =
        saveError instanceof Error
          ? saveError.message
          : "Unable to save department.";
      setEditorError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleDepartmentStatus(department: DepartmentRecord) {
    try {
      const updated = await requestJson<DepartmentRecord>(
        `/api/departments/${department.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            is_active: !department.is_active,
          }),
        },
      );

      setDepartments((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(
        updated.is_active ? "Department activated." : "Department deactivated.",
      );
    } catch (saveError) {
      if (saveError instanceof ApiError && saveError.status === 401) {
        router.replace("/login");
        return;
      }

      const message =
        saveError instanceof Error
          ? saveError.message
          : "Unable to update department status.";
      toast.error(message);
      throw saveError;
    }
  }

  async function deleteDepartment(department: DepartmentRecord) {
    try {
      await requestJson<string>(`/api/departments/${department.id}`, {
        method: "DELETE",
      });

      setDepartments((current) =>
        current.filter((item) => item.id !== department.id),
      );
      toast.success(`Department "${department.name}" deleted.`);
    } catch (deleteError) {
      if (deleteError instanceof ApiError && deleteError.status === 401) {
        router.replace("/login");
        return;
      }

      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete department.";
      toast.error(message);
      throw deleteError;
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Department Management
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage department records used across users, attendance, leave,
            overtime, and payroll workflows.
          </p>
        </div>

        <Button onClick={openCreateDialog} className="self-start">
          <Plus className="size-4" />
          Add department
        </Button>
      </section>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
        <div className="space-y-2">
          <Label htmlFor="search-departments">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search-departments"
              value={search}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setSearch(event.target.value)
              }
              className="h-10 pl-9"
              placeholder="Search by name or code"
            />
          </div>
        </div>

        <SelectField
          id="department-status-filter"
          label="Status"
          value={statusFilter}
          onChange={(_, value) =>
            setStatusFilter(value as DepartmentStatusFilter)
          }
          options={statusFilterOptions}
          placeholder="All statuses"
        />
      </section>

      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          {isLoading
            ? "Loading departments..."
            : `${filteredDepartments.length} of ${departments.length} departments shown`}
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/70">
        <Table className="min-w-[720px]">
          <TableHeader className="bg-muted/95 backdrop-blur">
            <TableRow className="text-left text-xs uppercase tracking-[0.18em] text-muted-foreground hover:bg-transparent">
              <TableHead className="border-b border-border/70 px-4 py-3 font-medium">
                Name
              </TableHead>
              <TableHead className="border-b border-border/70 px-4 py-3 font-medium">
                Code
              </TableHead>
              <TableHead className="border-b border-border/70 px-4 py-3 font-medium">
                Status
              </TableHead>
              <TableHead className="border-b border-border/70 px-4 py-3 font-medium text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-background">
            {isLoading ? (
              [1, 2, 3, 4].map((row) => (
                <TableRow key={`department-skeleton-${row}`}>
                  <TableCell className="border-b border-border/50 px-4 py-4">
                    <div className="h-4 w-52 animate-pulse rounded-full bg-muted" />
                  </TableCell>
                  <TableCell className="border-b border-border/50 px-4 py-4">
                    <div className="h-4 w-20 animate-pulse rounded-full bg-muted" />
                  </TableCell>
                  <TableCell className="border-b border-border/50 px-4 py-4">
                    <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
                  </TableCell>
                  <TableCell className="border-b border-border/50 px-4 py-4">
                    <div className="ml-auto h-8 w-56 animate-pulse rounded-full bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredDepartments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="px-4 py-10 text-center">
                  <p className="font-medium text-foreground">
                    No departments found.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try changing your search text or status filter.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredDepartments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell className="border-b border-border/60 px-4 py-4 align-top font-medium text-foreground">
                    {department.name}
                  </TableCell>
                  <TableCell className="border-b border-border/60 px-4 py-4 align-top text-muted-foreground">
                    {department.code}
                  </TableCell>
                  <TableCell className="border-b border-border/60 px-4 py-4 align-top">
                    <Badge
                      variant={
                        department.is_active ? "secondary" : "destructive"
                      }
                    >
                      {department.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="border-b border-border/60 px-4 py-4 align-top">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(department)}
                      >
                        <SquarePen className="size-4" />
                        Edit
                      </Button>

                      <ConfirmationModal
                        trigger={
                          <Button
                            type="button"
                            variant={
                              department.is_active ? "destructive" : "secondary"
                            }
                            size="sm"
                            className="min-w-28 justify-center"
                          >
                            {department.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        }
                        title={
                          department.is_active
                            ? `Deactivate ${department.name}?`
                            : `Activate ${department.name}?`
                        }
                        description={
                          department.is_active
                            ? "Users can keep department history, but the department becomes unavailable for active assignment."
                            : "The department becomes available for assignment in staff workflows."
                        }
                        confirmLabel={
                          department.is_active ? "Deactivate" : "Activate"
                        }
                        confirmVariant={
                          department.is_active ? "destructive" : "default"
                        }
                        onConfirm={() => toggleDepartmentStatus(department)}
                      />

                      <ConfirmationModal
                        trigger={
                          <Button type="button" variant="outline" size="sm">
                            <Trash2 className="size-4" />
                            Delete
                          </Button>
                        }
                        title={`Delete ${department.name}?`}
                        description="This permanently removes the department. If it is still referenced by users or other records, deletion will be blocked."
                        confirmLabel="Delete"
                        confirmVariant="destructive"
                        onConfirm={() => deleteDepartment(department)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editorOpen} onOpenChange={closeEditor}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editorMode === "create" ? "Add department" : "Edit department"}
            </DialogTitle>
            <DialogDescription>
              {editorMode === "create"
                ? "Create a new department record for organization workflows."
                : "Update department details used across HR modules."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {editorError ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {editorError}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="department-name">Department name</Label>
              <Input
                id="department-name"
                value={editorState.name}
                onChange={(event) =>
                  setEditorState((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Human Resources"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department-code">Department code</Label>
              <Input
                id="department-code"
                value={editorState.code}
                onChange={(event) =>
                  setEditorState((current) => ({
                    ...current,
                    code: event.target.value,
                  }))
                }
                placeholder="HR"
              />
            </div>

            <SelectField
              id="department-active"
              label="Status"
              value={editorState.is_active ? "active" : "inactive"}
              onChange={(_, value) =>
                setEditorState((current) => ({
                  ...current,
                  is_active: value === "active",
                }))
              }
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              placeholder="Select status"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => closeEditor(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void saveDepartment()}
              disabled={isSaving}
            >
              {isSaving
                ? "Saving..."
                : editorMode === "create"
                  ? "Create"
                  : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
