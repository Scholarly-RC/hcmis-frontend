"use client";

import {
  BookOpenText,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Save,
  Settings2,
  UserCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type Mp2Account,
  type PayrollPolicySourcesDetail,
  type PayrollPolicyVersion,
  requestJson,
} from "@/lib/payroll";
import { toast } from "@/lib/toast";
import type { AuthUser } from "@/types/auth";

type PolicySourcesWriteItem = {
  source_type: string;
  reference_code: string;
  source_url: string;
  effective_from: string;
  effective_to: string | null;
};

type PayrollPolicyRulesPayload = {
  sss_brackets: Array<Record<string, unknown>>;
  philhealth_rules: Array<Record<string, unknown>>;
  pagibig_rules: Array<Record<string, unknown>>;
  bir_withholding_brackets: Array<Record<string, unknown>>;
  minimum_wage_orders: Array<Record<string, unknown>>;
};

type PayrollPolicyRulesDetail = {
  version: PayrollPolicyVersion;
  rules: PayrollPolicyRulesPayload;
};

function currentYear() {
  return new Date().getFullYear();
}

function todayDateIso() {
  return new Date().toISOString().slice(0, 10);
}

function prettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function parseRulesPayload(input: string): PayrollPolicyRulesPayload {
  const parsed = JSON.parse(input) as Partial<PayrollPolicyRulesPayload>;
  return {
    sss_brackets: parsed.sss_brackets ?? [],
    philhealth_rules: parsed.philhealth_rules ?? [],
    pagibig_rules: parsed.pagibig_rules ?? [],
    bir_withholding_brackets: parsed.bir_withholding_brackets ?? [],
    minimum_wage_orders: parsed.minimum_wage_orders ?? [],
  };
}

function parseSourcesPayload(input: string): PolicySourcesWriteItem[] {
  const parsed = JSON.parse(input) as PolicySourcesWriteItem[];
  return parsed.map((item, index) => {
    if (
      !item.source_type?.trim() ||
      !item.reference_code?.trim() ||
      !item.source_url?.trim() ||
      !item.effective_from?.trim()
    ) {
      throw new Error(`Source row ${index + 1} is missing required fields.`);
    }
    return {
      source_type: item.source_type.trim(),
      reference_code: item.reference_code.trim(),
      source_url: item.source_url.trim(),
      effective_from: item.effective_from.trim(),
      effective_to: item.effective_to?.trim() || null,
    };
  });
}

export function PayrollSettingsClient() {
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [mp2Amount, setMp2Amount] = useState("0");
  const [selectedMp2Users, setSelectedMp2Users] = useState<string[]>([]);
  const [savingMp2, setSavingMp2] = useState(false);

  const [policyVersions, setPolicyVersions] = useState<PayrollPolicyVersion[]>(
    [],
  );
  const [selectedPolicyVersionId, setSelectedPolicyVersionId] = useState("");
  const [policyRulesText, setPolicyRulesText] = useState(prettyJson({}));
  const [policySourcesText, setPolicySourcesText] = useState(prettyJson([]));

  const [loadingPolicyRules, setLoadingPolicyRules] = useState(false);
  const [loadingPolicySources, setLoadingPolicySources] = useState(false);
  const [savingPolicyRules, setSavingPolicyRules] = useState(false);
  const [savingPolicySources, setSavingPolicySources] = useState(false);

  const [showSourcesEditor, setShowSourcesEditor] = useState(false);
  const [seedingOfficialCore, setSeedingOfficialCore] = useState(false);
  const [seedVersionLabel, setSeedVersionLabel] = useState(
    `PH-OFFICIAL-CORE-${currentYear()}`,
  );
  const [seedEffectiveFrom, setSeedEffectiveFrom] = useState(
    `${currentYear()}-01-01`,
  );

  const loadPolicyVersions = useCallback(async () => {
    const query = new URLSearchParams({
      policy_key: "PH_STATUTORY",
    });
    const data = await requestJson<PayrollPolicyVersion[]>(
      `/api/payroll/policy-versions?${query.toString()}`,
    );
    setPolicyVersions(data);
    if (data.length > 0) {
      setSelectedPolicyVersionId((current) =>
        current.length > 0 ? current : String(data[0].id),
      );
    }
    return data;
  }, []);

  const loadPolicyRules = useCallback(async (policyVersionId: string) => {
    if (!policyVersionId) {
      setPolicyRulesText(prettyJson({}));
      return;
    }
    setLoadingPolicyRules(true);
    try {
      const detail = await requestJson<PayrollPolicyRulesDetail>(
        `/api/payroll/policy-versions/${policyVersionId}/rules`,
      );
      setPolicyRulesText(prettyJson(detail.rules));
    } finally {
      setLoadingPolicyRules(false);
    }
  }, []);

  const loadPolicySources = useCallback(async (policyVersionId: string) => {
    if (!policyVersionId) {
      setPolicySourcesText(prettyJson([]));
      return;
    }
    setLoadingPolicySources(true);
    try {
      const detail = await requestJson<PayrollPolicySourcesDetail>(
        `/api/payroll/policy-versions/${policyVersionId}/sources`,
      );
      const writeRows: PolicySourcesWriteItem[] = detail.sources.map(
        (item) => ({
          source_type: item.source_type,
          reference_code: item.reference_code,
          source_url: item.source_url,
          effective_from: item.effective_from,
          effective_to: item.effective_to,
        }),
      );
      setPolicySourcesText(prettyJson(writeRows));
    } finally {
      setLoadingPolicySources(false);
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [mp2, userList, policyVersionList] = await Promise.all([
          requestJson<Mp2Account>("/api/payroll/mp2"),
          requestJson<AuthUser[]>("/api/users?active_only=true"),
          loadPolicyVersions(),
        ]);

        setMp2Amount(mp2.amount);
        setSelectedMp2Users(mp2.users.map((user) => user.id));
        setUsers(userList);

        if (policyVersionList.length > 0) {
          const first = String(policyVersionList[0].id);
          await Promise.all([loadPolicyRules(first), loadPolicySources(first)]);
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to load payroll management workspace.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [loadPolicyRules, loadPolicySources, loadPolicyVersions]);

  useEffect(() => {
    if (!selectedPolicyVersionId) {
      return;
    }
    void loadPolicyRules(selectedPolicyVersionId);
    void loadPolicySources(selectedPolicyVersionId);
  }, [selectedPolicyVersionId, loadPolicyRules, loadPolicySources]);

  function toggleMp2User(userId: string, checked: boolean) {
    setSelectedMp2Users((current) => {
      if (checked) {
        return [...current, userId];
      }
      return current.filter((id) => id !== userId);
    });
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

  async function savePolicyRules() {
    if (!selectedPolicyVersionId) {
      toast.error("Select a policy version first.");
      return;
    }

    try {
      setSavingPolicyRules(true);
      const payload = parseRulesPayload(policyRulesText);
      await requestJson<PayrollPolicyRulesDetail>(
        `/api/payroll/policy-versions/${selectedPolicyVersionId}/rules`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
      );
      toast.success("Policy rules saved.");
      await loadPolicyRules(selectedPolicyVersionId);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save policy rules JSON.",
      );
    } finally {
      setSavingPolicyRules(false);
    }
  }

  async function savePolicySources() {
    if (!selectedPolicyVersionId) {
      toast.error("Select a policy version first.");
      return;
    }

    try {
      setSavingPolicySources(true);
      const sources = parseSourcesPayload(policySourcesText);
      await requestJson<PayrollPolicySourcesDetail>(
        `/api/payroll/policy-versions/${selectedPolicyVersionId}/sources`,
        {
          method: "PUT",
          body: JSON.stringify({ sources }),
        },
      );
      toast.success("Policy sources saved.");
      await loadPolicySources(selectedPolicyVersionId);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save policy sources JSON.",
      );
    } finally {
      setSavingPolicySources(false);
    }
  }

  async function seedOfficialCorePolicy() {
    if (!seedVersionLabel.trim()) {
      toast.error("Seed version label is required.");
      return;
    }
    if (!seedEffectiveFrom) {
      toast.error("Effective from date is required.");
      return;
    }

    try {
      setSeedingOfficialCore(true);
      const seeded = await requestJson<PayrollPolicyVersion>(
        "/api/payroll/policy-versions/seed-ph-official-core",
        {
          method: "POST",
          body: JSON.stringify({
            version_label: seedVersionLabel.trim(),
            effective_from: seedEffectiveFrom,
            effective_to: null,
            overwrite_existing: false,
          }),
        },
      );
      toast.success("Official PH core policy seeded.");
      await loadPolicyVersions();
      setSelectedPolicyVersionId(String(seeded.id));
      await Promise.all([
        loadPolicyRules(String(seeded.id)),
        loadPolicySources(String(seeded.id)),
      ]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to seed official PH policy core.",
      );
    } finally {
      setSeedingOfficialCore(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payroll Management Workspace</CardTitle>
          <CardDescription>Loading configuration...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payroll Management Workspace</CardTitle>
          <CardDescription>
            Policy-driven payroll setup with separate MP2 assignment controls.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Policy Management</CardTitle>
          <CardDescription>
            Manage statutory payroll policy versions and their computation
            rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 rounded-md border p-3 md:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="seed_version_label">Seed Version Label</Label>
              <Input
                id="seed_version_label"
                value={seedVersionLabel}
                onChange={(event) => setSeedVersionLabel(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seed_effective_from">Effective From</Label>
              <Input
                id="seed_effective_from"
                type="date"
                value={seedEffectiveFrom}
                onChange={(event) => setSeedEffectiveFrom(event.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSeedEffectiveFrom(todayDateIso())}
              >
                <RefreshCw className="size-4" />
                Use Today
              </Button>
              <Button
                onClick={() => void seedOfficialCorePolicy()}
                disabled={seedingOfficialCore}
              >
                <Settings2 className="size-4" />
                {seedingOfficialCore ? "Seeding..." : "Seed Official Core"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="policy_version_id">Policy Version</Label>
            <Select
              value={selectedPolicyVersionId || undefined}
              onValueChange={setSelectedPolicyVersionId}
            >
              <SelectTrigger className="w-full" id="policy_version_id">
                <SelectValue placeholder="Select policy version" />
              </SelectTrigger>
              <SelectContent>
                {policyVersions.map((version) => (
                  <SelectItem key={version.id} value={String(version.id)}>
                    {version.version_label} (ID: {version.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="policy_rules_json">Policy Rules JSON</Label>
              <span className="text-xs text-muted-foreground">
                {loadingPolicyRules ? "Loading..." : "Ready"}
              </span>
            </div>
            <Textarea
              id="policy_rules_json"
              value={policyRulesText}
              onChange={(event) => setPolicyRulesText(event.target.value)}
              className="min-h-72 font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              This JSON is the source of truth for SSS, PhilHealth, Pag-IBIG,
              tax, and minimum wage rule tables.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  selectedPolicyVersionId &&
                  void loadPolicyRules(selectedPolicyVersionId)
                }
                disabled={!selectedPolicyVersionId || loadingPolicyRules}
              >
                <RefreshCw className="size-4" />
                Reload Rules
              </Button>
              <Button
                onClick={() => void savePolicyRules()}
                disabled={!selectedPolicyVersionId || savingPolicyRules}
              >
                <Save className="size-4" />
                {savingPolicyRules ? "Saving..." : "Save Rules"}
              </Button>
            </div>
          </div>

          <Collapsible
            open={showSourcesEditor}
            onOpenChange={setShowSourcesEditor}
            className="rounded-md border p-3"
          >
            <div className="flex items-center justify-between">
              <Label>Policy Source References</Label>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  {showSourcesEditor ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                  {showSourcesEditor ? "Hide Sources" : "Show Sources"}
                </Button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="space-y-3 pt-4">
              <Textarea
                id="policy_sources_json"
                value={policySourcesText}
                onChange={(event) => setPolicySourcesText(event.target.value)}
                className="min-h-56 font-mono text-xs"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    selectedPolicyVersionId &&
                    void loadPolicySources(selectedPolicyVersionId)
                  }
                  disabled={!selectedPolicyVersionId || loadingPolicySources}
                >
                  <RefreshCw className="size-4" />
                  Reload Sources
                </Button>
                <Button
                  onClick={() => void savePolicySources()}
                  disabled={!selectedPolicyVersionId || savingPolicySources}
                >
                  <BookOpenText className="size-4" />
                  {savingPolicySources ? "Saving..." : "Save Sources"}
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>MP2 Settings</CardTitle>
          <CardDescription>
            Configure MP2 amount and assign participating employees.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm space-y-2">
            <Label htmlFor="mp2_amount">MP2 Amount (PHP)</Label>
            <Input
              id="mp2_amount"
              type="number"
              min={0}
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
            <UserCheck className="size-4" />
            {savingMp2 ? "Saving..." : "Save MP2 Assignments"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operational Note</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Core statutory rules are now policy-version driven. Payroll runs
            should use a selected policy version for each cycle.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
