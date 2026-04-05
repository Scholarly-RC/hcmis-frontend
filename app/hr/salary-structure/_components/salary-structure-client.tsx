"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
import { type PayrollPosition, requestJson } from "@/lib/payroll";
import { toast } from "@/lib/toast";
import type { AuthDepartment } from "@/types/auth";

type PositionForm = {
  title: string;
  code: string;
  salary_grade: string;
  department_ids: number[];
  is_active: boolean;
};

const emptyForm: PositionForm = {
  title: "",
  code: "",
  salary_grade: "1",
  department_ids: [],
  is_active: true,
};

export function SalaryStructureClient() {
  const [positions, setPositions] = useState<PayrollPosition[]>([]);
  const [departments, setDepartments] = useState<AuthDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPositionId, setEditingPositionId] = useState<number | null>(
    null,
  );
  const [form, setForm] = useState<PositionForm>(emptyForm);

  const departmentMap = useMemo(
    () => new Map(departments.map((department) => [department.id, department])),
    [departments],
  );

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const [positionList, departmentList] = await Promise.all([
        requestJson<PayrollPosition[]>("/api/payroll/positions"),
        requestJson<AuthDepartment[]>("/api/departments"),
      ]);
      setPositions(positionList);
      setDepartments(departmentList);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load positions.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  function openCreate() {
    setEditingPositionId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(position: PayrollPosition) {
    setEditingPositionId(position.id);
    setForm({
      title: position.title,
      code: position.code,
      salary_grade: String(position.salary_grade),
      department_ids: position.departments.map((department) => department.id),
      is_active: position.is_active,
    });
    setDialogOpen(true);
  }

  function toggleDepartment(departmentId: number, checked: boolean) {
    setForm((current) => {
      if (checked) {
        return {
          ...current,
          department_ids: [...current.department_ids, departmentId],
        };
      }
      return {
        ...current,
        department_ids: current.department_ids.filter(
          (id) => id !== departmentId,
        ),
      };
    });
  }

  async function submit() {
    try {
      setSaving(true);
      const payload = {
        title: form.title.trim(),
        code: form.code.trim().toUpperCase(),
        salary_grade: Number(form.salary_grade),
        department_ids: form.department_ids,
        is_active: form.is_active,
      };

      if (!payload.title || !payload.code || payload.salary_grade < 1) {
        toast.error("Please fill valid position details.");
        return;
      }

      if (editingPositionId) {
        await requestJson<PayrollPosition>(
          `/api/payroll/positions/${editingPositionId}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );
        toast.success("Position updated.");
      } else {
        await requestJson<PayrollPosition>("/api/payroll/positions", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Position created.");
      }
      setDialogOpen(false);
      await reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save position.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(position: PayrollPosition) {
    try {
      await requestJson<PayrollPosition>(
        `/api/payroll/positions/${position.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: position.title,
            code: position.code,
            salary_grade: position.salary_grade,
            department_ids: position.departments.map(
              (department) => department.id,
            ),
            is_active: false,
          }),
        },
      );
      toast.success(`Position ${position.code} deactivated.`);
      await reload();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to deactivate position.",
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Salary Structure</h1>
          <p className="text-sm text-muted-foreground">
            Manage position codes, salary grades, and department assignment.
          </p>
        </div>
        <Button onClick={openCreate}>Add Position</Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Salary Grade</TableHead>
              <TableHead>Departments</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>Loading positions...</TableCell>
              </TableRow>
            ) : positions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>No positions configured yet.</TableCell>
              </TableRow>
            ) : (
              positions.map((position) => (
                <TableRow key={position.id}>
                  <TableCell>{position.code}</TableCell>
                  <TableCell>{position.title}</TableCell>
                  <TableCell>{position.salary_grade}</TableCell>
                  <TableCell>
                    {position.departments
                      .map((department) => department.name)
                      .join(", ") || "-"}
                  </TableCell>
                  <TableCell>
                    {position.is_active ? "Active" : "Inactive"}
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(position)}
                    >
                      Edit
                    </Button>
                    {position.is_active ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => void deactivate(position)}
                      >
                        Deactivate
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPositionId ? "Edit Position" : "Add Position"}
            </DialogTitle>
            <DialogDescription>
              Define position code, salary grade, and department mapping.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="position_title">Title</Label>
              <Input
                id="position_title"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position_code">Code</Label>
              <Input
                id="position_code"
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    code: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary_grade">Salary Grade</Label>
              <Input
                id="salary_grade"
                type="number"
                min={1}
                value={form.salary_grade}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    salary_grade: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Departments</Label>
              <div className="grid max-h-40 gap-2 overflow-auto rounded border p-3 md:grid-cols-2">
                {departments.map((department) => {
                  const checked = form.department_ids.includes(department.id);
                  return (
                    <div
                      key={department.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={checked}
                        onChange={(event) =>
                          toggleDepartment(department.id, event.target.checked)
                        }
                      />
                      <span>
                        {departmentMap.get(department.id)?.name ??
                          department.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Input
                type="checkbox"
                className="h-4 w-4"
                checked={form.is_active}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    is_active: event.target.checked,
                  }))
                }
              />
              Active
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void submit()} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
