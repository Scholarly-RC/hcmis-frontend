"use client";

import { useEffect, useMemo, useState } from "react";

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
import { type PayrollJob, requestJson } from "@/lib/payroll";
import { toast } from "@/lib/toast";
import type { AuthDepartment } from "@/types/auth";

type JobForm = {
  title: string;
  code: string;
  salary_grade: string;
  department_ids: number[];
  is_active: boolean;
};

const emptyForm: JobForm = {
  title: "",
  code: "",
  salary_grade: "1",
  department_ids: [],
  is_active: true,
};

export function SalaryStructureClient() {
  const [jobs, setJobs] = useState<PayrollJob[]>([]);
  const [departments, setDepartments] = useState<AuthDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [form, setForm] = useState<JobForm>(emptyForm);

  const departmentMap = useMemo(
    () => new Map(departments.map((department) => [department.id, department])),
    [departments],
  );

  async function reload() {
    try {
      setLoading(true);
      const [jobList, departmentList] = await Promise.all([
        requestJson<PayrollJob[]>("/api/payroll/jobs"),
        requestJson<AuthDepartment[]>("/api/departments"),
      ]);
      setJobs(jobList);
      setDepartments(departmentList);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load jobs.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        const [jobList, departmentList] = await Promise.all([
          requestJson<PayrollJob[]>("/api/payroll/jobs"),
          requestJson<AuthDepartment[]>("/api/departments"),
        ]);
        setJobs(jobList);
        setDepartments(departmentList);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Unable to load jobs.",
        );
      } finally {
        setLoading(false);
      }
    }
    void loadInitialData();
  }, []);

  function openCreate() {
    setEditingJobId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(job: PayrollJob) {
    setEditingJobId(job.id);
    setForm({
      title: job.title,
      code: job.code,
      salary_grade: String(job.salary_grade),
      department_ids: job.departments.map((department) => department.id),
      is_active: job.is_active,
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
        toast.error("Please fill valid job details.");
        return;
      }

      if (editingJobId) {
        await requestJson<PayrollJob>(`/api/payroll/jobs/${editingJobId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Job updated.");
      } else {
        await requestJson<PayrollJob>("/api/payroll/jobs", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Job created.");
      }
      setDialogOpen(false);
      await reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save job.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(job: PayrollJob) {
    try {
      await requestJson<PayrollJob>(`/api/payroll/jobs/${job.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: job.title,
          code: job.code,
          salary_grade: job.salary_grade,
          department_ids: job.departments.map((department) => department.id),
          is_active: false,
        }),
      });
      toast.success(`Job ${job.code} deactivated.`);
      await reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to deactivate job.",
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Salary Structure</h1>
          <p className="text-sm text-muted-foreground">
            Manage job codes, salary grades, and department assignment.
          </p>
        </div>
        <Button onClick={openCreate}>Add Job</Button>
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
                <TableCell colSpan={6}>Loading jobs...</TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>No jobs configured yet.</TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>{job.code}</TableCell>
                  <TableCell>{job.title}</TableCell>
                  <TableCell>{job.salary_grade}</TableCell>
                  <TableCell>
                    {job.departments
                      .map((department) => department.name)
                      .join(", ") || "-"}
                  </TableCell>
                  <TableCell>{job.is_active ? "Active" : "Inactive"}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(job)}
                    >
                      Edit
                    </Button>
                    {job.is_active ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => void deactivate(job)}
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
            <DialogTitle>{editingJobId ? "Edit Job" : "Add Job"}</DialogTitle>
            <DialogDescription>
              Define job code, salary grade, and department mapping.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="job_title">Title</Label>
              <Input
                id="job_title"
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
              <Label htmlFor="job_code">Code</Label>
              <Input
                id="job_code"
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
