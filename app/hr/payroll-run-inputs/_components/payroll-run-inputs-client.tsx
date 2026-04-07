"use client";

import {
  CheckCheck,
  ClipboardCheck,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  HrFormSectionScaffold,
  HrListSectionScaffold,
  HrModulePageScaffold,
} from "@/components/hr/module-scaffold";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type PayrollItemType,
  type PayrollPolicyVersion,
  type PayrollRun,
  type PayrollRunInput,
  requestJson,
  toNumber,
} from "@/lib/payroll";
import { toast } from "@/lib/toast";
import type { AuthUser } from "@/types/auth";

type RunFormState = {
  month: string;
  year: string;
  period: "1ST" | "2ND";
  policy_version_id: string;
};

type InputFormState = {
  user_id: string;
  payroll_item_type_id: string;
  amount: string;
  remarks: string;
};

const MONTH_OPTIONS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
] as const;

function currentMonth() {
  return String(new Date().getMonth() + 1);
}

function currentYear() {
  return String(new Date().getFullYear());
}

function emptyInputForm(): InputFormState {
  return {
    user_id: "",
    payroll_item_type_id: "",
    amount: "",
    remarks: "",
  };
}

function formatCurrency(value: string | number | null | undefined) {
  return toNumber(value).toFixed(2);
}

function formatRunLabel(run: PayrollRun) {
  const monthLabel =
    MONTH_OPTIONS.find((option) => option.value === String(run.month))?.label ??
    run.month;
  return `${monthLabel} ${run.year} ${run.period}`;
}

function formatUserLabel(user: AuthUser | null | undefined) {
  if (!user) {
    return "-";
  }
  return (
    [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
    user.email
  );
}

export function PayrollRunInputsClient() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [itemTypes, setItemTypes] = useState<PayrollItemType[]>([]);
  const [policyVersions, setPolicyVersions] = useState<PayrollPolicyVersion[]>(
    [],
  );
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [inputs, setInputs] = useState<PayrollRunInput[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [inputsLoading, setInputsLoading] = useState(false);
  const [savingRun, setSavingRun] = useState(false);
  const [savingInput, setSavingInput] = useState(false);
  const [editingInputId, setEditingInputId] = useState<number | null>(null);
  const [runForm, setRunForm] = useState<RunFormState>({
    month: currentMonth(),
    year: currentYear(),
    period: "1ST",
    policy_version_id: "",
  });
  const [inputForm, setInputForm] = useState<InputFormState>(emptyInputForm);

  const selectedRun = useMemo(
    () => runs.find((run) => String(run.id) === selectedRunId) ?? null,
    [runs, selectedRunId],
  );

  const canEditInputs =
    selectedRun?.status === "DRAFT" || selectedRun?.status === "VALIDATED";
  const totalEarnings = inputs
    .filter((input) => input.item_type.category === "earning")
    .reduce((sum, input) => sum + toNumber(input.amount), 0);
  const totalDeductions = inputs
    .filter((input) => input.item_type.category === "deduction")
    .reduce((sum, input) => sum + toNumber(input.amount), 0);

  const reloadRuns = useCallback(async () => {
    const runList = await requestJson<PayrollRun[]>("/api/payroll/runs");
    setRuns(runList);
    setSelectedRunId((current) => {
      if (current && runList.some((run) => String(run.id) === current)) {
        return current;
      }
      return runList[0] ? String(runList[0].id) : "";
    });
  }, []);

  const loadInputs = useCallback(async (runId: string) => {
    if (!runId) {
      setInputs([]);
      return;
    }
    try {
      setInputsLoading(true);
      const data = await requestJson<PayrollRunInput[]>(
        `/api/payroll/runs/${runId}/inputs`,
      );
      setInputs(data);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load payroll run inputs.",
      );
    } finally {
      setInputsLoading(false);
    }
  }, []);

  const initialize = useCallback(async () => {
    try {
      setLoading(true);
      const [userList, itemTypeList, policyList] = await Promise.all([
        requestJson<AuthUser[]>("/api/users?active_only=true"),
        requestJson<PayrollItemType[]>(
          "/api/payroll/item-types?active_only=true",
        ),
        requestJson<PayrollPolicyVersion[]>(
          "/api/payroll/policy-versions?policy_key=PH_STATUTORY",
        ),
      ]);
      setUsers(userList);
      setItemTypes(itemTypeList);
      setPolicyVersions(policyList);
      setRunForm((current) => ({
        ...current,
        policy_version_id:
          current.policy_version_id ||
          String(
            policyList.find((item) => item.is_active)?.id ??
              policyList[0]?.id ??
              "",
          ),
      }));
      setInputForm((current) => ({
        ...current,
        user_id: current.user_id || String(userList[0]?.id ?? ""),
        payroll_item_type_id:
          current.payroll_item_type_id || String(itemTypeList[0]?.id ?? ""),
      }));
      await reloadRuns();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load payroll run inputs workspace.",
      );
    } finally {
      setLoading(false);
    }
  }, [reloadRuns]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    void loadInputs(selectedRunId);
  }, [loadInputs, selectedRunId]);

  function resetInputForm() {
    setEditingInputId(null);
    setInputForm({
      user_id: String(users[0]?.id ?? ""),
      payroll_item_type_id: String(itemTypes[0]?.id ?? ""),
      amount: "",
      remarks: "",
    });
  }

  async function createRun() {
    if (!runForm.policy_version_id) {
      toast.error("Select a payroll policy version.");
      return;
    }
    try {
      setSavingRun(true);
      const created = await requestJson<PayrollRun>("/api/payroll/runs", {
        method: "POST",
        body: JSON.stringify({
          month: Number(runForm.month),
          year: Number(runForm.year),
          period: runForm.period,
          policy_version_id: Number(runForm.policy_version_id),
        }),
      });
      toast.success("Payroll run created.");
      await reloadRuns();
      setSelectedRunId(String(created.id));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to create payroll run.",
      );
    } finally {
      setSavingRun(false);
    }
  }

  async function transitionRun(action: "validate" | "approve" | "post") {
    if (!selectedRunId) {
      toast.error("Select a payroll run first.");
      return;
    }
    try {
      setSavingRun(true);
      await requestJson<PayrollRun>(
        `/api/payroll/runs/${selectedRunId}/${action}`,
        {
          method: "POST",
        },
      );
      toast.success(`Payroll run ${action}d.`);
      await reloadRuns();
      await loadInputs(selectedRunId);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Unable to ${action} payroll run.`,
      );
    } finally {
      setSavingRun(false);
    }
  }

  async function submitInput() {
    if (!selectedRunId) {
      toast.error("Select or create a payroll run first.");
      return;
    }
    if (
      !inputForm.user_id ||
      !inputForm.payroll_item_type_id ||
      !inputForm.amount
    ) {
      toast.error("Complete the employee, item type, and amount.");
      return;
    }

    try {
      setSavingInput(true);
      const payload = {
        user_id: inputForm.user_id,
        payroll_item_type_id: Number(inputForm.payroll_item_type_id),
        amount: Number(inputForm.amount),
        remarks: inputForm.remarks.trim() || null,
      };
      if (editingInputId) {
        await requestJson<PayrollRunInput>(
          `/api/payroll/run-inputs/${editingInputId}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );
        toast.success("Payroll run input updated.");
      } else {
        await requestJson<PayrollRunInput>(
          `/api/payroll/runs/${selectedRunId}/inputs`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );
        toast.success("Payroll run input added.");
      }
      resetInputForm();
      await loadInputs(selectedRunId);
      await reloadRuns();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save payroll input.",
      );
    } finally {
      setSavingInput(false);
    }
  }

  function startEdit(input: PayrollRunInput) {
    setEditingInputId(input.id);
    setInputForm({
      user_id: input.user_id,
      payroll_item_type_id: String(input.payroll_item_type_id),
      amount: String(toNumber(input.amount)),
      remarks: input.remarks ?? "",
    });
  }

  async function removeInput(inputId: number) {
    if (!selectedRunId) {
      return;
    }
    try {
      await requestJson<void>(`/api/payroll/run-inputs/${inputId}`, {
        method: "DELETE",
      });
      toast.success("Payroll run input removed.");
      if (editingInputId === inputId) {
        resetInputForm();
      }
      await loadInputs(selectedRunId);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to remove payroll input.",
      );
    }
  }

  return (
    <HrModulePageScaffold
      title="Payroll Run Inputs"
      description="Encode variable earnings and deductions by payroll run, then validate, approve, and post the run."
      actions={
        <Button variant="outline" onClick={() => void initialize()}>
          <RefreshCw className="size-4" />
          Refresh Data
        </Button>
      }
    >
      <HrFormSectionScaffold
        title="Payroll Run"
        description="Create a run for the cutoff, then use the action buttons as the run moves from draft to posted."
      >
        <div className="grid gap-4 md:grid-cols-5">
          <div className="space-y-2">
            <Label>Month</Label>
            <Select
              value={runForm.month}
              onValueChange={(value) =>
                setRunForm((current) => ({ ...current, month: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Year</Label>
            <Input
              value={runForm.year}
              onChange={(event) =>
                setRunForm((current) => ({
                  ...current,
                  year: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Period</Label>
            <Select
              value={runForm.period}
              onValueChange={(value: "1ST" | "2ND") =>
                setRunForm((current) => ({ ...current, period: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1ST">1ST</SelectItem>
                <SelectItem value="2ND">2ND</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Policy Version</Label>
            <Select
              value={runForm.policy_version_id}
              onValueChange={(value) =>
                setRunForm((current) => ({
                  ...current,
                  policy_version_id: value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select policy version" />
              </SelectTrigger>
              <SelectContent>
                {policyVersions.map((version) => (
                  <SelectItem key={version.id} value={String(version.id)}>
                    {version.version_label}
                    {version.is_active ? " (Active)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={() => void createRun()} disabled={savingRun}>
            <Plus className="size-4" />
            Create Run
          </Button>
          <Select value={selectedRunId} onValueChange={setSelectedRunId}>
            <SelectTrigger className="min-w-64">
              <SelectValue placeholder="Select payroll run" />
            </SelectTrigger>
            <SelectContent>
              {runs.map((run) => (
                <SelectItem key={run.id} value={String(run.id)}>
                  {formatRunLabel(run)} - {run.status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => void transitionRun("validate")}
            disabled={
              !selectedRun ||
              savingRun ||
              selectedRun.status === "POSTED" ||
              selectedRun.status === "RELEASED" ||
              selectedRun.status === "APPROVED"
            }
          >
            <ClipboardCheck className="size-4" />
            Validate Run
          </Button>
          <Button
            variant="outline"
            onClick={() => void transitionRun("approve")}
            disabled={
              !selectedRun || savingRun || selectedRun.status !== "VALIDATED"
            }
          >
            <CheckCheck className="size-4" />
            Approve Run
          </Button>
          <Button
            variant="outline"
            onClick={() => void transitionRun("post")}
            disabled={
              !selectedRun || savingRun || selectedRun.status !== "APPROVED"
            }
          >
            <Lock className="size-4" />
            Post Run
          </Button>
          {selectedRun ? (
            <Badge variant="secondary">{selectedRun.status}</Badge>
          ) : null}
        </div>
      </HrFormSectionScaffold>

      <HrFormSectionScaffold
        title="Variable Item Entry"
        description="Add one employee-level earning or deduction line at a time. Editing resets that line back to draft until the run is approved again."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select
              value={inputForm.user_id}
              onValueChange={(value) =>
                setInputForm((current) => ({ ...current, user_id: value }))
              }
              disabled={!canEditInputs}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {formatUserLabel(user)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Item Type</Label>
            <Select
              value={inputForm.payroll_item_type_id}
              onValueChange={(value) =>
                setInputForm((current) => ({
                  ...current,
                  payroll_item_type_id: value,
                }))
              }
              disabled={!canEditInputs}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select item type" />
              </SelectTrigger>
              <SelectContent>
                {itemTypes.map((itemType) => (
                  <SelectItem key={itemType.id} value={String(itemType.id)}>
                    {itemType.name} ({itemType.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={inputForm.amount}
              onChange={(event) =>
                setInputForm((current) => ({
                  ...current,
                  amount: event.target.value,
                }))
              }
              disabled={!canEditInputs}
            />
          </div>
          <div className="space-y-2">
            <Label>Remarks</Label>
            <Input
              value={inputForm.remarks}
              onChange={(event) =>
                setInputForm((current) => ({
                  ...current,
                  remarks: event.target.value,
                }))
              }
              disabled={!canEditInputs}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={() => void submitInput()}
            disabled={!canEditInputs || savingInput}
          >
            {editingInputId ? (
              <Save className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}
            {editingInputId ? "Save Changes" : "Add Item"}
          </Button>
          {editingInputId ? (
            <Button
              variant="outline"
              onClick={resetInputForm}
              disabled={savingInput}
            >
              <RefreshCw className="size-4" />
              Cancel Edit
            </Button>
          ) : null}
        </div>
      </HrFormSectionScaffold>

      <HrListSectionScaffold
        title="Run Inputs"
        description="Review the encoded lines before validating and approving the payroll run."
      >
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>Inputs: {inputs.length}</span>
          <span>Earnings: {formatCurrency(totalEarnings)}</span>
          <span>Deductions: {formatCurrency(totalDeductions)}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading || inputsLoading ? (
              <TableRow>
                <TableCell colSpan={7}>Loading payroll run inputs...</TableCell>
              </TableRow>
            ) : inputs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  No variable payroll inputs have been added for this run yet.
                </TableCell>
              </TableRow>
            ) : (
              inputs.map((input) => (
                <TableRow key={input.id}>
                  <TableCell>{formatUserLabel(input.user)}</TableCell>
                  <TableCell>{input.item_type.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        input.item_type.category === "earning"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {input.item_type.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(input.amount)}
                  </TableCell>
                  <TableCell>{input.status}</TableCell>
                  <TableCell>{input.remarks || "-"}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(input)}
                      disabled={!canEditInputs}
                    >
                      <Pencil className="size-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => void removeInput(input.id)}
                      disabled={!canEditInputs}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </HrListSectionScaffold>
    </HrModulePageScaffold>
  );
}
