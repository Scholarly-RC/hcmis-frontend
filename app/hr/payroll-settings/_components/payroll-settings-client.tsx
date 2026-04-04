"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildDeductionConfig,
  type DeductionConfigData,
  type FixedCompensation,
  type Mp2Account,
  type PayrollSetting,
  parseDeductionConfig,
  requestJson,
} from "@/lib/payroll";
import { toast } from "@/lib/toast";
import type { AuthUser } from "@/types/auth";

type PayrollSettingsForm = {
  minimum_wage_amount: string;
  basic_salary_multiplier: string;
  basic_salary_step_multiplier: string;
  basic_salary_steps: string;
  max_job_rank: string;
};

type FixedCompensationForm = {
  id: number | null;
  name: string;
  amount: string;
  user_ids: string[];
};

function currentMonth() {
  return new Date().getMonth() + 1;
}

function currentYear() {
  return new Date().getFullYear();
}

function toSettingsForm(settings: PayrollSetting): PayrollSettingsForm {
  return {
    minimum_wage_amount: settings.minimum_wage_amount,
    basic_salary_multiplier: settings.basic_salary_multiplier,
    basic_salary_step_multiplier: settings.basic_salary_step_multiplier,
    basic_salary_steps: String(settings.basic_salary_steps),
    max_job_rank: String(settings.max_job_rank),
  };
}

const emptyFixedCompensationForm: FixedCompensationForm = {
  id: null,
  name: "",
  amount: "0",
  user_ids: [],
};

export function PayrollSettingsClient() {
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingMp2, setSavingMp2] = useState(false);
  const [savingCompensation, setSavingCompensation] = useState(false);
  const [settingsForm, setSettingsForm] = useState<PayrollSettingsForm | null>(
    null,
  );
  const [deductionForm, setDeductionForm] =
    useState<DeductionConfigData | null>(null);
  const [mp2Amount, setMp2Amount] = useState("0");
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [selectedMp2Users, setSelectedMp2Users] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(String(currentMonth()));
  const [selectedYear, setSelectedYear] = useState(String(currentYear()));
  const [fixedCompensations, setFixedCompensations] = useState<
    FixedCompensation[]
  >([]);
  const [compensationForm, setCompensationForm] =
    useState<FixedCompensationForm>(emptyFixedCompensationForm);

  async function loadFixedCompensations(month: string, year: string) {
    const query = new URLSearchParams({
      month,
      year,
    });
    const data = await requestJson<FixedCompensation[]>(
      `/api/payroll/fixed-compensations?${query.toString()}`,
    );
    setFixedCompensations(data);
  }

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [settings, mp2, userList] = await Promise.all([
          requestJson<PayrollSetting>("/api/payroll/settings"),
          requestJson<Mp2Account>("/api/payroll/mp2"),
          requestJson<AuthUser[]>("/api/users?active_only=true"),
        ]);

        setSettingsForm(toSettingsForm(settings));
        setDeductionForm(parseDeductionConfig(settings.deduction_config));
        setMp2Amount(mp2.amount);
        setSelectedMp2Users(mp2.users.map((user) => user.id));
        setUsers(userList);
        const query = new URLSearchParams({
          month: String(currentMonth()),
          year: String(currentYear()),
        });
        const data = await requestJson<FixedCompensation[]>(
          `/api/payroll/fixed-compensations?${query.toString()}`,
        );
        setFixedCompensations(data);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to load payroll settings.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  function toggleMp2User(userId: string, checked: boolean) {
    setSelectedMp2Users((current) => {
      if (checked) {
        return [...current, userId];
      }
      return current.filter((id) => id !== userId);
    });
  }

  function toggleCompensationUser(userId: string, checked: boolean) {
    setCompensationForm((current) => {
      if (checked) {
        return {
          ...current,
          user_ids: [...current.user_ids, userId],
        };
      }
      return {
        ...current,
        user_ids: current.user_ids.filter((id) => id !== userId),
      };
    });
  }

  async function saveSettings() {
    if (!settingsForm || !deductionForm) {
      return;
    }
    try {
      setSavingSettings(true);
      await requestJson<PayrollSetting>("/api/payroll/settings", {
        method: "PATCH",
        body: JSON.stringify({
          minimum_wage_amount: Number(settingsForm.minimum_wage_amount),
          basic_salary_multiplier: Number(settingsForm.basic_salary_multiplier),
          basic_salary_step_multiplier: Number(
            settingsForm.basic_salary_step_multiplier,
          ),
          basic_salary_steps: Number(settingsForm.basic_salary_steps),
          max_job_rank: Number(settingsForm.max_job_rank),
          deduction_config: buildDeductionConfig(deductionForm),
        }),
      });

      toast.success("Payroll settings saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save settings.",
      );
    } finally {
      setSavingSettings(false);
    }
  }

  async function saveMp2() {
    try {
      setSavingMp2(true);
      await requestJson<Mp2Account>("/api/payroll/mp2", {
        method: "PUT",
        body: JSON.stringify({
          amount: Number(mp2Amount),
          user_ids: selectedMp2Users,
        }),
      });
      toast.success("MP2 settings updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update MP2.",
      );
    } finally {
      setSavingMp2(false);
    }
  }

  async function applyFixedCompensationFilter() {
    try {
      await loadFixedCompensations(selectedMonth, selectedYear);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load fixed compensations.",
      );
    }
  }

  async function saveFixedCompensation() {
    if (!compensationForm.name.trim()) {
      toast.error("Compensation name is required.");
      return;
    }
    if (Number(compensationForm.amount) < 0) {
      toast.error("Compensation amount should be non-negative.");
      return;
    }
    try {
      setSavingCompensation(true);
      const payload = {
        name: compensationForm.name.trim(),
        amount: Number(compensationForm.amount),
        month: Number(selectedMonth),
        year: Number(selectedYear),
        user_ids: compensationForm.user_ids,
      };
      if (compensationForm.id) {
        await requestJson<FixedCompensation>(
          `/api/payroll/fixed-compensations/${compensationForm.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );
        toast.success("Fixed compensation updated.");
      } else {
        await requestJson<FixedCompensation>(
          "/api/payroll/fixed-compensations",
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );
        toast.success("Fixed compensation created.");
      }
      setCompensationForm(emptyFixedCompensationForm);
      await loadFixedCompensations(selectedMonth, selectedYear);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save fixed compensation.",
      );
    } finally {
      setSavingCompensation(false);
    }
  }

  async function deleteFixedCompensation(id: number) {
    try {
      await requestJson<Record<string, never>>(
        `/api/payroll/fixed-compensations/${id}`,
        {
          method: "DELETE",
        },
      );
      toast.success("Fixed compensation removed.");
      await loadFixedCompensations(selectedMonth, selectedYear);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to delete fixed compensation.",
      );
    }
  }

  function editFixedCompensation(item: FixedCompensation) {
    setCompensationForm({
      id: item.id,
      name: item.name,
      amount: item.amount,
      user_ids: item.users.map((user) => user.id),
    });
  }

  if (loading || !settingsForm || !deductionForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payroll Settings</CardTitle>
          <CardDescription>Loading settings...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payroll Settings</CardTitle>
          <CardDescription>
            Core salary and mandatory deduction settings for payroll
            computation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minimum_wage_amount">Minimum Wage</Label>
              <Input
                id="minimum_wage_amount"
                type="number"
                value={settingsForm.minimum_wage_amount}
                onChange={(event) =>
                  setSettingsForm((current) =>
                    current
                      ? { ...current, minimum_wage_amount: event.target.value }
                      : current,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="basic_salary_multiplier">Salary Multiplier</Label>
              <Input
                id="basic_salary_multiplier"
                type="number"
                step="0.0001"
                value={settingsForm.basic_salary_multiplier}
                onChange={(event) =>
                  setSettingsForm((current) =>
                    current
                      ? {
                          ...current,
                          basic_salary_multiplier: event.target.value,
                        }
                      : current,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="basic_salary_step_multiplier">
                Step Multiplier
              </Label>
              <Input
                id="basic_salary_step_multiplier"
                type="number"
                step="0.0001"
                value={settingsForm.basic_salary_step_multiplier}
                onChange={(event) =>
                  setSettingsForm((current) =>
                    current
                      ? {
                          ...current,
                          basic_salary_step_multiplier: event.target.value,
                        }
                      : current,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="basic_salary_steps">Salary Steps</Label>
              <Input
                id="basic_salary_steps"
                type="number"
                min={1}
                value={settingsForm.basic_salary_steps}
                onChange={(event) =>
                  setSettingsForm((current) =>
                    current
                      ? { ...current, basic_salary_steps: event.target.value }
                      : current,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_job_rank">Max Job Rank</Label>
              <Input
                id="max_job_rank"
                type="number"
                min={1}
                value={settingsForm.max_job_rank}
                onChange={(event) =>
                  setSettingsForm((current) =>
                    current
                      ? { ...current, max_job_rank: event.target.value }
                      : current,
                  )
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              SSS
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="sss_min_compensation">Min Compensation</Label>
                <Input
                  id="sss_min_compensation"
                  value={deductionForm.sss_min_compensation}
                  onChange={(event) =>
                    setDeductionForm((current) =>
                      current
                        ? {
                            ...current,
                            sss_min_compensation: event.target.value,
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sss_max_compensation">Max Compensation</Label>
                <Input
                  id="sss_max_compensation"
                  value={deductionForm.sss_max_compensation}
                  onChange={(event) =>
                    setDeductionForm((current) =>
                      current
                        ? {
                            ...current,
                            sss_max_compensation: event.target.value,
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sss_min_contribution">Min Contribution</Label>
                <Input
                  id="sss_min_contribution"
                  value={deductionForm.sss_min_contribution}
                  onChange={(event) =>
                    setDeductionForm((current) =>
                      current
                        ? {
                            ...current,
                            sss_min_contribution: event.target.value,
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sss_max_contribution">Max Contribution</Label>
                <Input
                  id="sss_max_contribution"
                  value={deductionForm.sss_max_contribution}
                  onChange={(event) =>
                    setDeductionForm((current) =>
                      current
                        ? {
                            ...current,
                            sss_max_contribution: event.target.value,
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sss_contribution_difference">
                  Contribution Difference
                </Label>
                <Input
                  id="sss_contribution_difference"
                  value={deductionForm.sss_contribution_difference}
                  onChange={(event) =>
                    setDeductionForm((current) =>
                      current
                        ? {
                            ...current,
                            sss_contribution_difference: event.target.value,
                          }
                        : current,
                    )
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              PhilHealth
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="philhealth_min_compensation">
                  Min Compensation
                </Label>
                <Input
                  id="philhealth_min_compensation"
                  value={deductionForm.philhealth_min_compensation}
                  onChange={(event) =>
                    setDeductionForm((current) =>
                      current
                        ? {
                            ...current,
                            philhealth_min_compensation: event.target.value,
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="philhealth_max_compensation">
                  Max Compensation
                </Label>
                <Input
                  id="philhealth_max_compensation"
                  value={deductionForm.philhealth_max_compensation}
                  onChange={(event) =>
                    setDeductionForm((current) =>
                      current
                        ? {
                            ...current,
                            philhealth_max_compensation: event.target.value,
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="philhealth_min_contribution">
                  Min Contribution
                </Label>
                <Input
                  id="philhealth_min_contribution"
                  value={deductionForm.philhealth_min_contribution}
                  onChange={(event) =>
                    setDeductionForm((current) =>
                      current
                        ? {
                            ...current,
                            philhealth_min_contribution: event.target.value,
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="philhealth_max_contribution">
                  Max Contribution
                </Label>
                <Input
                  id="philhealth_max_contribution"
                  value={deductionForm.philhealth_max_contribution}
                  onChange={(event) =>
                    setDeductionForm((current) =>
                      current
                        ? {
                            ...current,
                            philhealth_max_contribution: event.target.value,
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="philhealth_rate">Rate</Label>
                <Input
                  id="philhealth_rate"
                  value={deductionForm.philhealth_rate}
                  onChange={(event) =>
                    setDeductionForm((current) =>
                      current
                        ? { ...current, philhealth_rate: event.target.value }
                        : current,
                    )
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              PAG-IBIG + Tax
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pag_ibig_amount">Pag-IBIG Amount</Label>
                <Input
                  id="pag_ibig_amount"
                  value={deductionForm.pag_ibig_amount}
                  onChange={(event) =>
                    setDeductionForm((current) =>
                      current
                        ? { ...current, pag_ibig_amount: event.target.value }
                        : current,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_compensation_range">
                  Tax Compensation Range
                </Label>
                <Input
                  id="tax_compensation_range"
                  value={deductionForm.tax_compensation_range}
                  onChange={(event) =>
                    setDeductionForm((current) =>
                      current
                        ? {
                            ...current,
                            tax_compensation_range: event.target.value,
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_percentage">Tax Percentage</Label>
                <Input
                  id="tax_percentage"
                  value={deductionForm.tax_percentage}
                  onChange={(event) =>
                    setDeductionForm((current) =>
                      current
                        ? { ...current, tax_percentage: event.target.value }
                        : current,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_base_tax">Tax Base</Label>
                <Input
                  id="tax_base_tax"
                  value={deductionForm.tax_base_tax}
                  onChange={(event) =>
                    setDeductionForm((current) =>
                      current
                        ? { ...current, tax_base_tax: event.target.value }
                        : current,
                    )
                  }
                />
              </div>
            </div>
          </div>

          <Button onClick={() => void saveSettings()} disabled={savingSettings}>
            {savingSettings ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>MP2 Settings</CardTitle>
          <CardDescription>
            Set MP2 amount and assign participating users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm space-y-2">
            <Label htmlFor="mp2_amount">MP2 Amount</Label>
            <Input
              id="mp2_amount"
              type="number"
              value={mp2Amount}
              onChange={(event) => setMp2Amount(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Users Included In MP2</Label>
            <div className="grid max-h-72 gap-2 overflow-auto rounded-md border p-3 md:grid-cols-2">
              {users.map((user) => {
                const label =
                  [user.first_name, user.last_name]
                    .filter(Boolean)
                    .join(" ")
                    .trim() || user.email;
                const checked = selectedMp2Users.includes(user.id);
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 rounded border px-2 py-1"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(next) =>
                        toggleMp2User(user.id, Boolean(next))
                      }
                    />
                    <span className="text-sm">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <Button onClick={() => void saveMp2()} disabled={savingMp2}>
            {savingMp2 ? "Saving..." : "Save MP2"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fixed Compensation Management</CardTitle>
          <CardDescription>
            Manage monthly recurring compensations and assigned users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="fc_month">Month</Label>
              <Input
                id="fc_month"
                type="number"
                min={1}
                max={12}
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fc_year">Year</Label>
              <Input
                id="fc_year"
                type="number"
                min={2000}
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => void applyFixedCompensationFilter()}>
                Load
              </Button>
            </div>
          </div>

          <div className="grid gap-4 rounded-md border p-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fc_name">Name</Label>
                <Input
                  id="fc_name"
                  value={compensationForm.name}
                  onChange={(event) =>
                    setCompensationForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fc_amount">Amount</Label>
                <Input
                  id="fc_amount"
                  type="number"
                  min={0}
                  value={compensationForm.amount}
                  onChange={(event) =>
                    setCompensationForm((current) => ({
                      ...current,
                      amount: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assigned Users</Label>
              <div className="grid max-h-56 gap-2 overflow-auto rounded border p-2 md:grid-cols-2">
                {users.map((user) => {
                  const label =
                    [user.first_name, user.last_name]
                      .filter(Boolean)
                      .join(" ")
                      .trim() || user.email;
                  const checked = compensationForm.user_ids.includes(user.id);
                  return (
                    <div key={user.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(next) =>
                          toggleCompensationUser(user.id, Boolean(next))
                        }
                      />
                      <span className="text-sm">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => void saveFixedCompensation()}
                disabled={savingCompensation}
              >
                {savingCompensation
                  ? "Saving..."
                  : compensationForm.id
                    ? "Update Compensation"
                    : "Create Compensation"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setCompensationForm(emptyFixedCompensationForm)}
              >
                Reset
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Existing Compensations ({selectedMonth}/{selectedYear})
            </Label>
            <div className="space-y-2 rounded border p-3">
              {fixedCompensations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No fixed compensation records for selected period.
                </p>
              ) : (
                fixedCompensations.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded border p-2 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="text-sm">
                      <p className="font-medium">
                        {item.name} - {item.amount}
                      </p>
                      <p className="text-muted-foreground">
                        Users: {item.users.length}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => editFixedCompensation(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => void deleteFixedCompensation(item.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
