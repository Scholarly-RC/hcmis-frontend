"use client";

import {
  BookOpenText,
  Landmark,
  PencilLine,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  type Mp2Enrollment,
  type Mp2EnrollmentStatus,
  type PayrollPolicySourcesDetail,
  type PayrollPolicyVersion,
  requestJson,
} from "@/lib/payroll";
import { toast } from "@/lib/toast";
import type { AuthUser } from "@/types/auth";

type PolicySourcesWriteItem = {
  _rowId: string;
  document_type: string;
  reference_code: string;
  title: string;
  source_url: string;
  published_at: string;
  effective_from: string;
  effective_to: string;
};

type EditableSssBracket = {
  _rowId: string;
  compensation_range_from: string;
  compensation_range_to: string;
  monthly_salary_credit: string;
  employee_contribution: string;
  employer_contribution: string;
  ec_contribution: string;
  mpf_employee_contribution: string;
  mpf_employer_contribution: string;
  source_reference: string;
};

type EditablePhilhealthRule = {
  _rowId: string;
  compensation_range_from: string;
  compensation_range_to: string;
  premium_rate: string;
  employee_share_ratio: string;
  employer_share_ratio: string;
  source_reference: string;
};

type EditablePagibigRule = {
  _rowId: string;
  compensation_range_from: string;
  compensation_range_to: string;
  compensation_cap: string;
  employee_rate: string;
  employer_rate: string;
  employee_share_cap: string;
  employer_share_cap: string;
  source_reference: string;
};

type EditableBirBracket = {
  _rowId: string;
  payroll_period: string;
  compensation_range_from: string;
  compensation_range_to: string;
  base_tax: string;
  marginal_rate: string;
  excess_over: string;
  source_reference: string;
};

type EditableMinimumWageOrder = {
  _rowId: string;
  region_code: string;
  sector: string;
  daily_rate: string;
  effective_from: string;
  effective_to: string;
  source_reference: string;
};

type Mp2EnrollmentForm = {
  user_id: string;
  amount: string;
  effective_from: string;
  effective_to: string;
  status: Mp2EnrollmentStatus;
  mp2_account_number: string;
  notes: string;
};

type PayrollPolicyRulesPayload = {
  sss_brackets: EditableSssBracket[];
  philhealth_rules: EditablePhilhealthRule[];
  pagibig_rules: EditablePagibigRule[];
  bir_withholding_brackets: EditableBirBracket[];
  minimum_wage_orders: EditableMinimumWageOrder[];
};

type PayrollPolicyRulesDetail = {
  version: PayrollPolicyVersion;
  rules: PayrollPolicyRulesPayload;
};

type PolicyRulesForm = PayrollPolicyRulesPayload;

const PAYROLL_PERIODS = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "SEMI_MONTHLY", label: "Semi-Monthly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "ANNUAL", label: "Annual" },
] as const;

function currentYear() {
  return new Date().getFullYear();
}

function asText(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function rowId() {
  return crypto.randomUUID();
}

function emptySssBracket(): EditableSssBracket {
  return {
    _rowId: rowId(),
    compensation_range_from: "",
    compensation_range_to: "",
    monthly_salary_credit: "",
    employee_contribution: "",
    employer_contribution: "",
    ec_contribution: "",
    mpf_employee_contribution: "",
    mpf_employer_contribution: "",
    source_reference: "",
  };
}

function emptyPhilhealthRule(): EditablePhilhealthRule {
  return {
    _rowId: rowId(),
    compensation_range_from: "",
    compensation_range_to: "",
    premium_rate: "",
    employee_share_ratio: "",
    employer_share_ratio: "",
    source_reference: "",
  };
}

function emptyPagibigRule(): EditablePagibigRule {
  return {
    _rowId: rowId(),
    compensation_range_from: "",
    compensation_range_to: "",
    compensation_cap: "",
    employee_rate: "",
    employer_rate: "",
    employee_share_cap: "",
    employer_share_cap: "",
    source_reference: "",
  };
}

function emptyBirBracket(): EditableBirBracket {
  return {
    _rowId: rowId(),
    payroll_period: "SEMI_MONTHLY",
    compensation_range_from: "",
    compensation_range_to: "",
    base_tax: "",
    marginal_rate: "",
    excess_over: "",
    source_reference: "",
  };
}

function emptyMinimumWageOrder(): EditableMinimumWageOrder {
  return {
    _rowId: rowId(),
    region_code: "",
    sector: "GENERAL",
    daily_rate: "",
    effective_from: new Date().toISOString().slice(0, 10),
    effective_to: "",
    source_reference: "",
  };
}

function emptySourceReference(): PolicySourcesWriteItem {
  return {
    _rowId: rowId(),
    document_type: "",
    reference_code: "",
    title: "",
    source_url: "",
    published_at: "",
    effective_from: new Date().toISOString().slice(0, 10),
    effective_to: "",
  };
}

function emptyPolicyRulesForm(): PolicyRulesForm {
  return {
    sss_brackets: [],
    philhealth_rules: [],
    pagibig_rules: [],
    bir_withholding_brackets: [],
    minimum_wage_orders: [],
  };
}

function toPolicyRulesForm(
  payload: Partial<PayrollPolicyRulesPayload>,
): PolicyRulesForm {
  return {
    sss_brackets: (payload.sss_brackets ?? []).map((item) => ({
      _rowId: rowId(),
      compensation_range_from: asText(item.compensation_range_from),
      compensation_range_to: asText(item.compensation_range_to),
      monthly_salary_credit: asText(item.monthly_salary_credit),
      employee_contribution: asText(item.employee_contribution),
      employer_contribution: asText(item.employer_contribution),
      ec_contribution: asText(item.ec_contribution),
      mpf_employee_contribution: asText(item.mpf_employee_contribution),
      mpf_employer_contribution: asText(item.mpf_employer_contribution),
      source_reference: asText(item.source_reference),
    })),
    philhealth_rules: (payload.philhealth_rules ?? []).map((item) => ({
      _rowId: rowId(),
      compensation_range_from: asText(item.compensation_range_from),
      compensation_range_to: asText(item.compensation_range_to),
      premium_rate: asText(item.premium_rate),
      employee_share_ratio: asText(item.employee_share_ratio),
      employer_share_ratio: asText(item.employer_share_ratio),
      source_reference: asText(item.source_reference),
    })),
    pagibig_rules: (payload.pagibig_rules ?? []).map((item) => ({
      _rowId: rowId(),
      compensation_range_from: asText(item.compensation_range_from),
      compensation_range_to: asText(item.compensation_range_to),
      compensation_cap: asText(item.compensation_cap),
      employee_rate: asText(item.employee_rate),
      employer_rate: asText(item.employer_rate),
      employee_share_cap: asText(item.employee_share_cap),
      employer_share_cap: asText(item.employer_share_cap),
      source_reference: asText(item.source_reference),
    })),
    bir_withholding_brackets: (payload.bir_withholding_brackets ?? []).map(
      (item) => ({
        _rowId: rowId(),
        payroll_period: asText(item.payroll_period) || "SEMI_MONTHLY",
        compensation_range_from: asText(item.compensation_range_from),
        compensation_range_to: asText(item.compensation_range_to),
        base_tax: asText(item.base_tax),
        marginal_rate: asText(item.marginal_rate),
        excess_over: asText(item.excess_over),
        source_reference: asText(item.source_reference),
      }),
    ),
    minimum_wage_orders: (payload.minimum_wage_orders ?? []).map((item) => ({
      _rowId: rowId(),
      region_code: asText(item.region_code),
      sector: asText(item.sector),
      daily_rate: asText(item.daily_rate),
      effective_from: asText(item.effective_from),
      effective_to: asText(item.effective_to),
      source_reference: asText(item.source_reference),
    })),
  };
}

function requireText(
  value: string,
  label: string,
  rowNumber: number,
  optional = false,
) {
  const normalized = value.trim();
  if (!normalized) {
    if (optional) {
      return null;
    }
    throw new Error(`${label} is required on row ${rowNumber}.`);
  }
  return normalized;
}

function buildRulesPayload(form: PolicyRulesForm) {
  return {
    sss_brackets: form.sss_brackets.map((item, index) => ({
      compensation_range_from: requireText(
        item.compensation_range_from,
        "SSS compensation range from",
        index + 1,
      ),
      compensation_range_to: requireText(
        item.compensation_range_to,
        "SSS compensation range to",
        index + 1,
      ),
      monthly_salary_credit: requireText(
        item.monthly_salary_credit,
        "SSS monthly salary credit",
        index + 1,
      ),
      employee_contribution: requireText(
        item.employee_contribution,
        "SSS employee contribution",
        index + 1,
      ),
      employer_contribution: requireText(
        item.employer_contribution,
        "SSS employer contribution",
        index + 1,
      ),
      ec_contribution: requireText(
        item.ec_contribution,
        "SSS EC contribution",
        index + 1,
      ),
      mpf_employee_contribution: requireText(
        item.mpf_employee_contribution,
        "SSS MPF employee contribution",
        index + 1,
      ),
      mpf_employer_contribution: requireText(
        item.mpf_employer_contribution,
        "SSS MPF employer contribution",
        index + 1,
      ),
      source_reference: requireText(
        item.source_reference,
        "SSS source reference",
        index + 1,
        true,
      ),
    })),
    philhealth_rules: form.philhealth_rules.map((item, index) => ({
      compensation_range_from: requireText(
        item.compensation_range_from,
        "PhilHealth compensation range from",
        index + 1,
      ),
      compensation_range_to: requireText(
        item.compensation_range_to,
        "PhilHealth compensation range to",
        index + 1,
      ),
      premium_rate: requireText(
        item.premium_rate,
        "PhilHealth premium rate",
        index + 1,
      ),
      employee_share_ratio: requireText(
        item.employee_share_ratio,
        "PhilHealth employee share ratio",
        index + 1,
      ),
      employer_share_ratio: requireText(
        item.employer_share_ratio,
        "PhilHealth employer share ratio",
        index + 1,
      ),
      source_reference: requireText(
        item.source_reference,
        "PhilHealth source reference",
        index + 1,
        true,
      ),
    })),
    pagibig_rules: form.pagibig_rules.map((item, index) => ({
      compensation_range_from: requireText(
        item.compensation_range_from,
        "Pag-IBIG compensation range from",
        index + 1,
      ),
      compensation_range_to: requireText(
        item.compensation_range_to,
        "Pag-IBIG compensation range to",
        index + 1,
        true,
      ),
      compensation_cap: requireText(
        item.compensation_cap,
        "Pag-IBIG compensation cap",
        index + 1,
      ),
      employee_rate: requireText(
        item.employee_rate,
        "Pag-IBIG employee rate",
        index + 1,
      ),
      employer_rate: requireText(
        item.employer_rate,
        "Pag-IBIG employer rate",
        index + 1,
      ),
      employee_share_cap: requireText(
        item.employee_share_cap,
        "Pag-IBIG maximum employee share",
        index + 1,
        true,
      ),
      employer_share_cap: requireText(
        item.employer_share_cap,
        "Pag-IBIG maximum employer share",
        index + 1,
        true,
      ),
      source_reference: requireText(
        item.source_reference,
        "Pag-IBIG source reference",
        index + 1,
        true,
      ),
    })),
    bir_withholding_brackets: form.bir_withholding_brackets.map(
      (item, index) => ({
        payroll_period: requireText(
          item.payroll_period,
          "Tax payroll period",
          index + 1,
        ),
        compensation_range_from: requireText(
          item.compensation_range_from,
          "Tax compensation range from",
          index + 1,
        ),
        compensation_range_to: requireText(
          item.compensation_range_to,
          "Tax compensation range to",
          index + 1,
          true,
        ),
        base_tax: requireText(item.base_tax, "Tax base amount", index + 1),
        marginal_rate: requireText(
          item.marginal_rate,
          "Tax marginal rate",
          index + 1,
        ),
        excess_over: requireText(
          item.excess_over,
          "Tax excess over amount",
          index + 1,
        ),
        source_reference: requireText(
          item.source_reference,
          "Tax source reference",
          index + 1,
          true,
        ),
      }),
    ),
    minimum_wage_orders: form.minimum_wage_orders.map((item, index) => ({
      region_code: requireText(
        item.region_code,
        "Minimum wage region",
        index + 1,
      ),
      sector: requireText(item.sector, "Minimum wage sector", index + 1),
      daily_rate: requireText(
        item.daily_rate,
        "Minimum wage daily amount",
        index + 1,
      ),
      effective_from: requireText(
        item.effective_from,
        "Minimum wage effective from",
        index + 1,
      ),
      effective_to: requireText(
        item.effective_to,
        "Minimum wage effective to",
        index + 1,
        true,
      ),
      source_reference: requireText(
        item.source_reference,
        "Minimum wage source reference",
        index + 1,
        true,
      ),
    })),
  };
}

function toSourceWriteRows(detail: PayrollPolicySourcesDetail) {
  return detail.sources.map((item) => ({
    _rowId: rowId(),
    document_type: asText(item.document_type),
    reference_code: asText(item.reference_code),
    title: asText(item.title),
    source_url: asText(item.source_url),
    published_at: asText(item.published_at),
    effective_from: asText(item.effective_from),
    effective_to: asText(item.effective_to),
  }));
}

function buildSourcesPayload(items: PolicySourcesWriteItem[]) {
  return items.map((item, index) => ({
    document_type: requireText(item.document_type, "Document type", index + 1),
    reference_code: requireText(
      item.reference_code,
      "Reference code",
      index + 1,
    ),
    title: requireText(item.title, "Document title", index + 1),
    source_url: requireText(item.source_url, "Source URL", index + 1),
    published_at: requireText(
      item.published_at,
      "Published at",
      index + 1,
      true,
    ),
    effective_from: requireText(
      item.effective_from,
      "Source effective from",
      index + 1,
    ),
    effective_to: requireText(
      item.effective_to,
      "Source effective to",
      index + 1,
      true,
    ),
  }));
}

function updateArrayItem<T extends Record<string, string>>(
  items: T[],
  index: number,
  field: keyof T,
  value: string,
) {
  return items.map((item, itemIndex) =>
    itemIndex === index ? { ...item, [field]: value } : item,
  );
}

function removeArrayItem<T>(items: T[], index: number) {
  return items.filter((_, itemIndex) => itemIndex !== index);
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function emptyMp2EnrollmentForm(): Mp2EnrollmentForm {
  return {
    user_id: "",
    amount: "500",
    effective_from: todayIsoDate(),
    effective_to: "",
    status: "active",
    mp2_account_number: "",
    notes: "",
  };
}

function toMp2EnrollmentForm(enrollment: Mp2Enrollment): Mp2EnrollmentForm {
  return {
    user_id: enrollment.user_id,
    amount: enrollment.amount,
    effective_from: enrollment.effective_from,
    effective_to: enrollment.effective_to ?? "",
    status: enrollment.status,
    mp2_account_number: enrollment.mp2_account_number ?? "",
    notes: enrollment.notes ?? "",
  };
}

function employeeLabel(user: AuthUser) {
  return (
    [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
    user.email
  );
}

export function PayrollSettingsClient() {
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [mp2Enrollments, setMp2Enrollments] = useState<Mp2Enrollment[]>([]);
  const [savingMp2, setSavingMp2] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [mp2StatusFilter, setMp2StatusFilter] = useState<
    "all" | Mp2EnrollmentStatus
  >("active");
  const [mp2DialogOpen, setMp2DialogOpen] = useState(false);
  const [editingMp2EnrollmentId, setEditingMp2EnrollmentId] = useState<
    number | null
  >(null);
  const [mp2Form, setMp2Form] = useState<Mp2EnrollmentForm>(
    emptyMp2EnrollmentForm(),
  );

  const [policyVersions, setPolicyVersions] = useState<PayrollPolicyVersion[]>(
    [],
  );
  const [selectedPolicyVersionId, setSelectedPolicyVersionId] = useState("");
  const [policyRulesForm, setPolicyRulesForm] = useState<PolicyRulesForm>(
    emptyPolicyRulesForm(),
  );
  const [policySources, setPolicySources] = useState<PolicySourcesWriteItem[]>(
    [],
  );

  const [_loadingPolicyRules, setLoadingPolicyRules] = useState(false);
  const [_loadingPolicySources, setLoadingPolicySources] = useState(false);
  const [savingPolicyRules, setSavingPolicyRules] = useState(false);
  const [savingPolicySources, setSavingPolicySources] = useState(false);
  const [deletingPolicyVersion, setDeletingPolicyVersion] = useState(false);
  const [activatingPolicyVersion, setActivatingPolicyVersion] = useState(false);

  const [seedingOfficialCore, setSeedingOfficialCore] = useState(false);
  const [createPolicyDialogOpen, setCreatePolicyDialogOpen] = useState(false);
  const [seedVersionLabel, setSeedVersionLabel] = useState(
    `PH-OFFICIAL-CORE-${currentYear()}`,
  );
  const [seedEffectiveFrom, setSeedEffectiveFrom] = useState(
    `${currentYear()}-01-01`,
  );
  const [overwriteExistingPolicyVersion, setOverwriteExistingPolicyVersion] =
    useState(false);

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
      setPolicyRulesForm(emptyPolicyRulesForm());
      return;
    }
    setLoadingPolicyRules(true);
    try {
      const detail = await requestJson<PayrollPolicyRulesDetail>(
        `/api/payroll/policy-versions/${policyVersionId}/rules`,
      );
      setPolicyRulesForm(toPolicyRulesForm(detail.rules));
    } finally {
      setLoadingPolicyRules(false);
    }
  }, []);

  const loadPolicySources = useCallback(async (policyVersionId: string) => {
    if (!policyVersionId) {
      setPolicySources([]);
      return;
    }
    setLoadingPolicySources(true);
    try {
      const detail = await requestJson<PayrollPolicySourcesDetail>(
        `/api/payroll/policy-versions/${policyVersionId}/sources`,
      );
      setPolicySources(toSourceWriteRows(detail));
    } finally {
      setLoadingPolicySources(false);
    }
  }, []);

  const loadMp2Enrollments = useCallback(async () => {
    const data = await requestJson<Mp2Enrollment[]>(
      "/api/payroll/mp2-enrollments",
    );
    setMp2Enrollments(data);
    return data;
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [mp2EnrollmentList, userList, policyVersionList] =
          await Promise.all([
            loadMp2Enrollments(),
            requestJson<AuthUser[]>("/api/users?active_only=true"),
            loadPolicyVersions(),
          ]);

        setUsers(userList);
        setMp2Enrollments(mp2EnrollmentList);

        if (policyVersionList.length > 0) {
          const first = String(policyVersionList[0].id);
          await Promise.all([loadPolicyRules(first), loadPolicySources(first)]);
        }
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
  }, [
    loadMp2Enrollments,
    loadPolicyRules,
    loadPolicySources,
    loadPolicyVersions,
  ]);

  useEffect(() => {
    if (!selectedPolicyVersionId) {
      return;
    }
    void loadPolicyRules(selectedPolicyVersionId);
    void loadPolicySources(selectedPolicyVersionId);
  }, [selectedPolicyVersionId, loadPolicyRules, loadPolicySources]);

  const selectedPolicyVersion = useMemo(
    () =>
      policyVersions.find(
        (version) => String(version.id) === selectedPolicyVersionId,
      ) ?? null,
    [policyVersions, selectedPolicyVersionId],
  );

  const filteredMp2Enrollments = useMemo(() => {
    const query = employeeSearch.trim().toLowerCase();
    return mp2Enrollments.filter((enrollment) => {
      if (mp2StatusFilter !== "all" && enrollment.status !== mp2StatusFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      const label = enrollment.user ? employeeLabel(enrollment.user) : "";
      return `${label} ${enrollment.user?.email ?? ""}`
        .toLowerCase()
        .includes(query);
    });
  }, [employeeSearch, mp2Enrollments, mp2StatusFilter]);

  function openCreateMp2Dialog(userId?: string) {
    setEditingMp2EnrollmentId(null);
    setMp2Form({
      ...emptyMp2EnrollmentForm(),
      user_id: userId ?? "",
    });
    setMp2DialogOpen(true);
  }

  function openEditMp2Dialog(enrollment: Mp2Enrollment) {
    setEditingMp2EnrollmentId(enrollment.id);
    setMp2Form(toMp2EnrollmentForm(enrollment));
    setMp2DialogOpen(true);
  }

  async function saveMp2() {
    if (!mp2Form.user_id) {
      toast.error("Select an employee first.");
      return;
    }
    if (!mp2Form.effective_from) {
      toast.error("Effective from date is required.");
      return;
    }
    try {
      setSavingMp2(true);
      await requestJson<Mp2Enrollment>(
        editingMp2EnrollmentId === null
          ? "/api/payroll/mp2-enrollments"
          : `/api/payroll/mp2-enrollments/${editingMp2EnrollmentId}`,
        {
          method: editingMp2EnrollmentId === null ? "POST" : "PATCH",
          body: JSON.stringify({
            user_id: mp2Form.user_id,
            amount: Number(mp2Form.amount),
            effective_from: mp2Form.effective_from,
            effective_to: mp2Form.effective_to || null,
            status: mp2Form.status,
            mp2_account_number: mp2Form.mp2_account_number || null,
            notes: mp2Form.notes || null,
          }),
        },
      );
      await loadMp2Enrollments();
      setMp2DialogOpen(false);
      setEditingMp2EnrollmentId(null);
      setMp2Form(emptyMp2EnrollmentForm());
      toast.success(
        editingMp2EnrollmentId === null
          ? "MP2 enrollment created."
          : "MP2 enrollment updated.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save MP2 enrollment.",
      );
    } finally {
      setSavingMp2(false);
    }
  }

  async function endMp2Enrollment(enrollmentId: number) {
    try {
      setSavingMp2(true);
      await requestJson<Mp2Enrollment>(
        `/api/payroll/mp2-enrollments/${enrollmentId}/end`,
        {
          method: "POST",
        },
      );
      await loadMp2Enrollments();
      toast.success("MP2 enrollment ended.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to end MP2 enrollment.",
      );
    } finally {
      setSavingMp2(false);
    }
  }

  async function savePolicyRules() {
    if (!selectedPolicyVersionId) {
      toast.error("Select a payroll policy version first.");
      return;
    }

    try {
      setSavingPolicyRules(true);
      await requestJson<PayrollPolicyRulesDetail>(
        `/api/payroll/policy-versions/${selectedPolicyVersionId}/rules`,
        {
          method: "PUT",
          body: JSON.stringify(buildRulesPayload(policyRulesForm)),
        },
      );
      toast.success("Payroll rules saved.");
      await loadPolicyRules(selectedPolicyVersionId);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save payroll rules.",
      );
    } finally {
      setSavingPolicyRules(false);
    }
  }

  async function savePolicySources() {
    if (!selectedPolicyVersionId) {
      toast.error("Select a payroll policy version first.");
      return;
    }

    try {
      setSavingPolicySources(true);
      await requestJson<PayrollPolicySourcesDetail>(
        `/api/payroll/policy-versions/${selectedPolicyVersionId}/sources`,
        {
          method: "PUT",
          body: JSON.stringify({
            sources: buildSourcesPayload(policySources),
          }),
        },
      );
      toast.success("Source references saved.");
      await loadPolicySources(selectedPolicyVersionId);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save source references.",
      );
    } finally {
      setSavingPolicySources(false);
    }
  }

  async function seedOfficialCorePolicy() {
    if (!seedVersionLabel.trim()) {
      toast.error("Version name is required.");
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
            overwrite_existing: overwriteExistingPolicyVersion,
          }),
        },
      );
      toast.success("Official payroll policy created.");
      await loadPolicyVersions();
      setSelectedPolicyVersionId(String(seeded.id));
      setCreatePolicyDialogOpen(false);
      setOverwriteExistingPolicyVersion(false);
      await Promise.all([
        loadPolicyRules(String(seeded.id)),
        loadPolicySources(String(seeded.id)),
      ]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to create the official payroll policy.",
      );
    } finally {
      setSeedingOfficialCore(false);
    }
  }

  async function deleteSelectedPolicyVersion() {
    if (!selectedPolicyVersion) {
      toast.error("Select a payroll policy version first.");
      return;
    }

    try {
      setDeletingPolicyVersion(true);
      await requestJson(
        `/api/payroll/policy-versions/${selectedPolicyVersion.id}`,
        {
          method: "DELETE",
        },
      );

      const remainingVersions = await loadPolicyVersions();
      const nextSelected = remainingVersions[0];
      setSelectedPolicyVersionId(nextSelected ? String(nextSelected.id) : "");

      if (nextSelected) {
        await Promise.all([
          loadPolicyRules(String(nextSelected.id)),
          loadPolicySources(String(nextSelected.id)),
        ]);
      } else {
        setPolicyRulesForm(emptyPolicyRulesForm());
        setPolicySources([]);
      }

      toast.success("Payroll policy version deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to delete payroll policy version.",
      );
    } finally {
      setDeletingPolicyVersion(false);
    }
  }

  async function activateSelectedPolicyVersion() {
    if (!selectedPolicyVersion) {
      toast.error("Select a payroll policy version first.");
      return;
    }

    try {
      setActivatingPolicyVersion(true);
      const activated = await requestJson<PayrollPolicyVersion>(
        `/api/payroll/policy-versions/${selectedPolicyVersion.id}/activate`,
        {
          method: "POST",
        },
      );
      await loadPolicyVersions();
      setSelectedPolicyVersionId(String(activated.id));
      await Promise.all([
        loadPolicyRules(String(activated.id)),
        loadPolicySources(String(activated.id)),
      ]);
      toast.success("Payroll policy version set as active.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to activate payroll policy version.",
      );
    } finally {
      setActivatingPolicyVersion(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payroll Settings</CardTitle>
          <CardDescription>Loading payroll setup...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/70">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">Payroll Settings</CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-6">
                Set up payroll rules using normal fields and tables. Staff
                should be able to update statutory rates, source references, and
                MP2 assignments without touching raw data structures.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-border/70">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShieldCheck className="size-5" />
              Policy Version Setup
            </CardTitle>
            <CardDescription>
              First choose the payroll policy version you want to work on. You
              can also create a fresh official version with default Philippine
              statutory values.
            </CardDescription>
          </div>
          <Dialog
            open={createPolicyDialogOpen}
            onOpenChange={setCreatePolicyDialogOpen}
          >
            <div className="flex flex-wrap gap-2">
              <ConfirmationModal
                trigger={
                  <Button
                    variant="outline"
                    disabled={
                      !selectedPolicyVersionId ||
                      deletingPolicyVersion ||
                      selectedPolicyVersion?.is_active
                    }
                  >
                    <Trash2 className="size-4" />
                    Delete Version
                  </Button>
                }
                title={
                  selectedPolicyVersion
                    ? `Delete ${selectedPolicyVersion.version_label}?`
                    : "Delete Policy Version?"
                }
                description="Only inactive, unused policy versions can be deleted. This permanently removes the selected version together with its seeded rules and sources. Active versions and versions already used by payroll runs are protected."
                confirmLabel="Delete"
                confirmVariant="destructive"
                onConfirm={() => deleteSelectedPolicyVersion()}
              />
              <DialogTrigger asChild>
                <Button>
                  <Settings2 className="size-4" />
                  Create Official Version
                </Button>
              </DialogTrigger>
            </div>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Official Policy Version</DialogTitle>
                <DialogDescription>
                  This creates a ready-to-edit payroll version using seeded PH
                  statutory tables as the starting point.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seed_version_label">Version Name</Label>
                  <Input
                    id="seed_version_label"
                    value={seedVersionLabel}
                    onChange={(event) =>
                      setSeedVersionLabel(event.target.value)
                    }
                    placeholder="Example: PH Official 2026"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seed_effective_from">Effective From</Label>
                  <Input
                    id="seed_effective_from"
                    type="date"
                    value={seedEffectiveFrom}
                    onChange={(event) =>
                      setSeedEffectiveFrom(event.target.value)
                    }
                  />
                </div>

                <div className="flex items-start gap-3 rounded-xl border p-3">
                  <Checkbox
                    id="overwrite_existing_policy_version"
                    checked={overwriteExistingPolicyVersion}
                    onCheckedChange={(checked) =>
                      setOverwriteExistingPolicyVersion(checked === true)
                    }
                  />
                  <div className="space-y-1">
                    <Label htmlFor="overwrite_existing_policy_version">
                      Overwrite Existing Version
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Replace the existing policy version when the same version
                      name already exists.
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => void seedOfficialCorePolicy()}
                  disabled={seedingOfficialCore}
                >
                  <Settings2 className="size-4" />
                  {seedingOfficialCore
                    ? "Creating..."
                    : "Create Official Version"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 rounded-2xl border p-4">
            <div className="space-y-2">
              <Label htmlFor="policy_version_id">Selected Policy Version</Label>
              <Select
                value={selectedPolicyVersionId || undefined}
                onValueChange={setSelectedPolicyVersionId}
              >
                <SelectTrigger className="w-full" id="policy_version_id">
                  <SelectValue placeholder="Select payroll policy version" />
                </SelectTrigger>
                <SelectContent>
                  {policyVersions.map((version) => (
                    <SelectItem key={version.id} value={String(version.id)}>
                      {version.version_label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPolicyVersion ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Label</p>
                  <p className="mt-1 font-medium">
                    {selectedPolicyVersion.version_label}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">
                    Effective From
                  </p>
                  <p className="mt-1 font-medium">
                    {selectedPolicyVersion.effective_from}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="mt-1 font-medium">
                    {selectedPolicyVersion.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
                No payroll policy version is available yet. Create one on the
                right side first.
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => void activateSelectedPolicyVersion()}
                disabled={
                  !selectedPolicyVersionId ||
                  !selectedPolicyVersion ||
                  selectedPolicyVersion.is_active ||
                  activatingPolicyVersion
                }
              >
                <ShieldCheck className="size-4" />
                {activatingPolicyVersion
                  ? "Setting Active..."
                  : "Set As Active"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Landmark className="size-5" />
              Statutory Payroll Rules
            </CardTitle>
            <CardDescription>
              Edit the payroll tables directly using plain fields instead of raw
              JSON. These values drive SSS, PhilHealth, Pag-IBIG, withholding
              tax, and minimum wage calculations for the selected version.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void savePolicyRules()}
              disabled={!selectedPolicyVersionId || savingPolicyRules}
            >
              <Save className="size-4" />
              {savingPolicyRules ? "Saving..." : "Save Policy Rules"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3 rounded-2xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-medium">SSS Brackets</h3>
                <p className="text-sm text-muted-foreground">
                  Store the official table with compensation range, monthly
                  salary credit, and separated regular and MPF contributions.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPolicyRulesForm((current) => ({
                    ...current,
                    sss_brackets: [...current.sss_brackets, emptySssBracket()],
                  }))
                }
              >
                <Plus className="size-4" />
                Add SSS Bracket
              </Button>
            </div>
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Range From</TableHead>
                    <TableHead>Range To</TableHead>
                    <TableHead>Salary Credit</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Employer</TableHead>
                    <TableHead>EC</TableHead>
                    <TableHead>MPF Employee</TableHead>
                    <TableHead>MPF Employer</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="w-16 text-right">Remove</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policyRulesForm.sss_brackets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10}>
                        No SSS brackets yet. Add a row to begin.
                      </TableCell>
                    </TableRow>
                  ) : (
                    policyRulesForm.sss_brackets.map((item, index) => (
                      <TableRow key={item._rowId}>
                        <TableCell>
                          <Input
                            value={item.compensation_range_from}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                sss_brackets: updateArrayItem(
                                  current.sss_brackets,
                                  index,
                                  "compensation_range_from",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.compensation_range_to}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                sss_brackets: updateArrayItem(
                                  current.sss_brackets,
                                  index,
                                  "compensation_range_to",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.monthly_salary_credit}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                sss_brackets: updateArrayItem(
                                  current.sss_brackets,
                                  index,
                                  "monthly_salary_credit",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.employee_contribution}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                sss_brackets: updateArrayItem(
                                  current.sss_brackets,
                                  index,
                                  "employee_contribution",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.employer_contribution}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                sss_brackets: updateArrayItem(
                                  current.sss_brackets,
                                  index,
                                  "employer_contribution",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.ec_contribution}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                sss_brackets: updateArrayItem(
                                  current.sss_brackets,
                                  index,
                                  "ec_contribution",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.mpf_employee_contribution}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                sss_brackets: updateArrayItem(
                                  current.sss_brackets,
                                  index,
                                  "mpf_employee_contribution",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.mpf_employer_contribution}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                sss_brackets: updateArrayItem(
                                  current.sss_brackets,
                                  index,
                                  "mpf_employer_contribution",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.source_reference}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                sss_brackets: updateArrayItem(
                                  current.sss_brackets,
                                  index,
                                  "source_reference",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                sss_brackets: removeArrayItem(
                                  current.sss_brackets,
                                  index,
                                ),
                              }))
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-medium">PhilHealth Rules</h3>
                <p className="text-sm text-muted-foreground">
                  Keep the premium ranges and both employee and employer share
                  ratios aligned with the official circular.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPolicyRulesForm((current) => ({
                    ...current,
                    philhealth_rules: [
                      ...current.philhealth_rules,
                      emptyPhilhealthRule(),
                    ],
                  }))
                }
              >
                <Plus className="size-4" />
                Add PhilHealth Rule
              </Button>
            </div>
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Range From</TableHead>
                    <TableHead>Range To</TableHead>
                    <TableHead>Premium Rate</TableHead>
                    <TableHead>Employee Share Ratio</TableHead>
                    <TableHead>Employer Share Ratio</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="w-16 text-right">Remove</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policyRulesForm.philhealth_rules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        No PhilHealth rules yet. Add a row to begin.
                      </TableCell>
                    </TableRow>
                  ) : (
                    policyRulesForm.philhealth_rules.map((item, index) => (
                      <TableRow key={item._rowId}>
                        <TableCell>
                          <Input
                            value={item.compensation_range_from}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                philhealth_rules: updateArrayItem(
                                  current.philhealth_rules,
                                  index,
                                  "compensation_range_from",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.compensation_range_to}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                philhealth_rules: updateArrayItem(
                                  current.philhealth_rules,
                                  index,
                                  "compensation_range_to",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.premium_rate}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                philhealth_rules: updateArrayItem(
                                  current.philhealth_rules,
                                  index,
                                  "premium_rate",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.employee_share_ratio}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                philhealth_rules: updateArrayItem(
                                  current.philhealth_rules,
                                  index,
                                  "employee_share_ratio",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.employer_share_ratio}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                philhealth_rules: updateArrayItem(
                                  current.philhealth_rules,
                                  index,
                                  "employer_share_ratio",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.source_reference}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                philhealth_rules: updateArrayItem(
                                  current.philhealth_rules,
                                  index,
                                  "source_reference",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                philhealth_rules: removeArrayItem(
                                  current.philhealth_rules,
                                  index,
                                ),
                              }))
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-medium">Pag-IBIG Rules</h3>
                <p className="text-sm text-muted-foreground">
                  Store the contribution range, compensation cap, rates, and
                  optional caps by bracket.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPolicyRulesForm((current) => ({
                    ...current,
                    pagibig_rules: [
                      ...current.pagibig_rules,
                      emptyPagibigRule(),
                    ],
                  }))
                }
              >
                <Plus className="size-4" />
                Add Pag-IBIG Rule
              </Button>
            </div>
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Range From</TableHead>
                    <TableHead>Range To</TableHead>
                    <TableHead>Compensation Cap</TableHead>
                    <TableHead>Employee Rate</TableHead>
                    <TableHead>Employer Rate</TableHead>
                    <TableHead>Maximum Employee Share</TableHead>
                    <TableHead>Maximum Employer Share</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="w-16 text-right">Remove</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policyRulesForm.pagibig_rules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9}>
                        No Pag-IBIG rules yet. Add a row to begin.
                      </TableCell>
                    </TableRow>
                  ) : (
                    policyRulesForm.pagibig_rules.map((item, index) => (
                      <TableRow key={item._rowId}>
                        <TableCell>
                          <Input
                            value={item.compensation_range_from}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                pagibig_rules: updateArrayItem(
                                  current.pagibig_rules,
                                  index,
                                  "compensation_range_from",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.compensation_range_to}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                pagibig_rules: updateArrayItem(
                                  current.pagibig_rules,
                                  index,
                                  "compensation_range_to",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.compensation_cap}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                pagibig_rules: updateArrayItem(
                                  current.pagibig_rules,
                                  index,
                                  "compensation_cap",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.employee_rate}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                pagibig_rules: updateArrayItem(
                                  current.pagibig_rules,
                                  index,
                                  "employee_rate",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.employer_rate}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                pagibig_rules: updateArrayItem(
                                  current.pagibig_rules,
                                  index,
                                  "employer_rate",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.employee_share_cap}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                pagibig_rules: updateArrayItem(
                                  current.pagibig_rules,
                                  index,
                                  "employee_share_cap",
                                  event.target.value,
                                ),
                              }))
                            }
                            placeholder="Optional"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.employer_share_cap}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                pagibig_rules: updateArrayItem(
                                  current.pagibig_rules,
                                  index,
                                  "employer_share_cap",
                                  event.target.value,
                                ),
                              }))
                            }
                            placeholder="Optional"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.source_reference}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                pagibig_rules: updateArrayItem(
                                  current.pagibig_rules,
                                  index,
                                  "source_reference",
                                  event.target.value,
                                ),
                              }))
                            }
                            placeholder="Optional"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                pagibig_rules: removeArrayItem(
                                  current.pagibig_rules,
                                  index,
                                ),
                              }))
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-medium">Withholding Tax Brackets</h3>
                <p className="text-sm text-muted-foreground">
                  Define the official withholding table by payroll period, range
                  band, and excess-over amount.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPolicyRulesForm((current) => ({
                    ...current,
                    bir_withholding_brackets: [
                      ...current.bir_withholding_brackets,
                      emptyBirBracket(),
                    ],
                  }))
                }
              >
                <Plus className="size-4" />
                Add Tax Bracket
              </Button>
            </div>
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payroll Period</TableHead>
                    <TableHead>Range From</TableHead>
                    <TableHead>Range To</TableHead>
                    <TableHead>Base Tax</TableHead>
                    <TableHead>Marginal Rate</TableHead>
                    <TableHead>Excess Over</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="w-16 text-right">Remove</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policyRulesForm.bir_withholding_brackets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8}>
                        No tax brackets yet. Add a row to begin.
                      </TableCell>
                    </TableRow>
                  ) : (
                    policyRulesForm.bir_withholding_brackets.map(
                      (item, index) => (
                        <TableRow key={item._rowId}>
                          <TableCell>
                            <Select
                              value={item.payroll_period}
                              onValueChange={(value) =>
                                setPolicyRulesForm((current) => ({
                                  ...current,
                                  bir_withholding_brackets: updateArrayItem(
                                    current.bir_withholding_brackets,
                                    index,
                                    "payroll_period",
                                    value,
                                  ),
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PAYROLL_PERIODS.map((period) => (
                                  <SelectItem
                                    key={period.value}
                                    value={period.value}
                                  >
                                    {period.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.compensation_range_from}
                              onChange={(event) =>
                                setPolicyRulesForm((current) => ({
                                  ...current,
                                  bir_withholding_brackets: updateArrayItem(
                                    current.bir_withholding_brackets,
                                    index,
                                    "compensation_range_from",
                                    event.target.value,
                                  ),
                                }))
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.compensation_range_to}
                              onChange={(event) =>
                                setPolicyRulesForm((current) => ({
                                  ...current,
                                  bir_withholding_brackets: updateArrayItem(
                                    current.bir_withholding_brackets,
                                    index,
                                    "compensation_range_to",
                                    event.target.value,
                                  ),
                                }))
                              }
                              placeholder="Optional for open-ended"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.base_tax}
                              onChange={(event) =>
                                setPolicyRulesForm((current) => ({
                                  ...current,
                                  bir_withholding_brackets: updateArrayItem(
                                    current.bir_withholding_brackets,
                                    index,
                                    "base_tax",
                                    event.target.value,
                                  ),
                                }))
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.marginal_rate}
                              onChange={(event) =>
                                setPolicyRulesForm((current) => ({
                                  ...current,
                                  bir_withholding_brackets: updateArrayItem(
                                    current.bir_withholding_brackets,
                                    index,
                                    "marginal_rate",
                                    event.target.value,
                                  ),
                                }))
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.excess_over}
                              onChange={(event) =>
                                setPolicyRulesForm((current) => ({
                                  ...current,
                                  bir_withholding_brackets: updateArrayItem(
                                    current.bir_withholding_brackets,
                                    index,
                                    "excess_over",
                                    event.target.value,
                                  ),
                                }))
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.source_reference}
                              onChange={(event) =>
                                setPolicyRulesForm((current) => ({
                                  ...current,
                                  bir_withholding_brackets: updateArrayItem(
                                    current.bir_withholding_brackets,
                                    index,
                                    "source_reference",
                                    event.target.value,
                                  ),
                                }))
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setPolicyRulesForm((current) => ({
                                  ...current,
                                  bir_withholding_brackets: removeArrayItem(
                                    current.bir_withholding_brackets,
                                    index,
                                  ),
                                }))
                              }
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ),
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-medium">Minimum Wage Orders</h3>
                <p className="text-sm text-muted-foreground">
                  Keep region-based wage orders and their effective dates in one
                  place.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPolicyRulesForm((current) => ({
                    ...current,
                    minimum_wage_orders: [
                      ...current.minimum_wage_orders,
                      emptyMinimumWageOrder(),
                    ],
                  }))
                }
              >
                <Plus className="size-4" />
                Add Wage Order
              </Button>
            </div>
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Region</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Daily Rate</TableHead>
                    <TableHead>Effective From</TableHead>
                    <TableHead>Effective To</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="w-16 text-right">Remove</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policyRulesForm.minimum_wage_orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        No minimum wage orders yet. Add a row to begin.
                      </TableCell>
                    </TableRow>
                  ) : (
                    policyRulesForm.minimum_wage_orders.map((item, index) => (
                      <TableRow key={item._rowId}>
                        <TableCell>
                          <Input
                            value={item.region_code}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                minimum_wage_orders: updateArrayItem(
                                  current.minimum_wage_orders,
                                  index,
                                  "region_code",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.sector}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                minimum_wage_orders: updateArrayItem(
                                  current.minimum_wage_orders,
                                  index,
                                  "sector",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.daily_rate}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                minimum_wage_orders: updateArrayItem(
                                  current.minimum_wage_orders,
                                  index,
                                  "daily_rate",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={item.effective_from}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                minimum_wage_orders: updateArrayItem(
                                  current.minimum_wage_orders,
                                  index,
                                  "effective_from",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={item.effective_to}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                minimum_wage_orders: updateArrayItem(
                                  current.minimum_wage_orders,
                                  index,
                                  "effective_to",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.source_reference}
                            onChange={(event) =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                minimum_wage_orders: updateArrayItem(
                                  current.minimum_wage_orders,
                                  index,
                                  "source_reference",
                                  event.target.value,
                                ),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setPolicyRulesForm((current) => ({
                                ...current,
                                minimum_wage_orders: removeArrayItem(
                                  current.minimum_wage_orders,
                                  index,
                                ),
                              }))
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BookOpenText className="size-5" />
              Legal Source References
            </CardTitle>
            <CardDescription>
              Keep the circulars, memoranda, and source links tied to the
              selected policy version. This is for traceability and audit, not
              for payroll math.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void savePolicySources()}
              disabled={!selectedPolicyVersionId || savingPolicySources}
            >
              <Save className="size-4" />
              {savingPolicySources ? "Saving..." : "Save Sources"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() =>
                setPolicySources((current) => [
                  ...current,
                  emptySourceReference(),
                ])
              }
            >
              <Plus className="size-4" />
              Add Source Reference
            </Button>
          </div>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Reference Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Source URL</TableHead>
                  <TableHead>Published At</TableHead>
                  <TableHead>Effective From</TableHead>
                  <TableHead>Effective To</TableHead>
                  <TableHead className="w-16 text-right">Remove</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policySources.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      No source references yet. Add a row to begin.
                    </TableCell>
                  </TableRow>
                ) : (
                  policySources.map((item, index) => (
                    <TableRow key={item._rowId}>
                      <TableCell>
                        <Input
                          value={item.document_type}
                          onChange={(event) =>
                            setPolicySources((current) =>
                              updateArrayItem(
                                current,
                                index,
                                "document_type",
                                event.target.value,
                              ),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.reference_code}
                          onChange={(event) =>
                            setPolicySources((current) =>
                              updateArrayItem(
                                current,
                                index,
                                "reference_code",
                                event.target.value,
                              ),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.title}
                          onChange={(event) =>
                            setPolicySources((current) =>
                              updateArrayItem(
                                current,
                                index,
                                "title",
                                event.target.value,
                              ),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.source_url}
                          onChange={(event) =>
                            setPolicySources((current) =>
                              updateArrayItem(
                                current,
                                index,
                                "source_url",
                                event.target.value,
                              ),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={item.published_at}
                          onChange={(event) =>
                            setPolicySources((current) =>
                              updateArrayItem(
                                current,
                                index,
                                "published_at",
                                event.target.value,
                              ),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={item.effective_from}
                          onChange={(event) =>
                            setPolicySources((current) =>
                              updateArrayItem(
                                current,
                                index,
                                "effective_from",
                                event.target.value,
                              ),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={item.effective_to}
                          onChange={(event) =>
                            setPolicySources((current) =>
                              updateArrayItem(
                                current,
                                index,
                                "effective_to",
                                event.target.value,
                              ),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setPolicySources((current) =>
                              removeArrayItem(current, index),
                            )
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Wallet className="size-5" />
              MP2 Enrollments
            </CardTitle>
            <CardDescription>
              Manage MP2 as an employee-level recurring deduction with its own
              amount, status, and effective dates.
            </CardDescription>
          </div>
          <Button onClick={() => openCreateMp2Dialog()} disabled={savingMp2}>
            <Plus className="size-4" />
            Add MP2 Enrollment
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div className="space-y-2">
              <Label htmlFor="mp2_search">Find Enrollment</Label>
              <Input
                id="mp2_search"
                className="h-11"
                value={employeeSearch}
                onChange={(event) => setEmployeeSearch(event.target.value)}
                placeholder="Search by employee name or email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mp2_status_filter">Status</Label>
              <Select
                value={mp2StatusFilter}
                onValueChange={(value) =>
                  setMp2StatusFilter(value as "all" | Mp2EnrollmentStatus)
                }
              >
                <SelectTrigger id="mp2_status_filter" className="h-11 w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {filteredMp2Enrollments.length} Enrollment
              {filteredMp2Enrollments.length === 1 ? "" : "s"}
            </Badge>
          </div>

          <div className="rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Effective From</TableHead>
                  <TableHead>Effective To</TableHead>
                  <TableHead>MP2 Account No.</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMp2Enrollments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      No MP2 enrollments found for the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMp2Enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {enrollment.user
                              ? employeeLabel(enrollment.user)
                              : enrollment.user_id}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {enrollment.user?.employee_number ??
                              "No Employee ID"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="rounded-full px-3 py-1 capitalize"
                        >
                          {enrollment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        PHP {enrollment.amount}
                      </TableCell>
                      <TableCell>{enrollment.effective_from}</TableCell>
                      <TableCell>
                        {enrollment.effective_to ?? "Open-ended"}
                      </TableCell>
                      <TableCell>
                        {enrollment.mp2_account_number ?? "Not set"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditMp2Dialog(enrollment)}
                          >
                            <PencilLine className="size-4" />
                            Edit
                          </Button>
                          {enrollment.status !== "ended" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                void endMp2Enrollment(enrollment.id)
                              }
                              disabled={savingMp2}
                            >
                              <Trash2 className="size-4" />
                              End
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Dialog
            open={mp2DialogOpen}
            onOpenChange={(open) => {
              setMp2DialogOpen(open);
              if (!open) {
                setEditingMp2EnrollmentId(null);
                setMp2Form(emptyMp2EnrollmentForm());
              }
            }}
          >
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>
                  {editingMp2EnrollmentId === null
                    ? "Add MP2 Enrollment"
                    : "Edit MP2 Enrollment"}
                </DialogTitle>
                <DialogDescription>
                  Keep MP2 at the employee level so payroll can apply the right
                  amount per member.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="mp2_employee">Employee</Label>
                  <Select
                    value={mp2Form.user_id}
                    onValueChange={(value) =>
                      setMp2Form((current) => ({ ...current, user_id: value }))
                    }
                    disabled={editingMp2EnrollmentId !== null}
                  >
                    <SelectTrigger id="mp2_employee" className="h-11">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {employeeLabel(user)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mp2_form_amount">Amount (PHP)</Label>
                  <Input
                    id="mp2_form_amount"
                    className="h-11"
                    type="number"
                    min={0}
                    value={mp2Form.amount}
                    onChange={(event) =>
                      setMp2Form((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mp2_form_status">Status</Label>
                  <Select
                    value={mp2Form.status}
                    onValueChange={(value) =>
                      setMp2Form((current) => ({
                        ...current,
                        status: value as Mp2EnrollmentStatus,
                      }))
                    }
                  >
                    <SelectTrigger id="mp2_form_status" className="h-11">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="ended">Ended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mp2_form_effective_from">
                    Effective From
                  </Label>
                  <Input
                    id="mp2_form_effective_from"
                    className="h-11"
                    type="date"
                    value={mp2Form.effective_from}
                    onChange={(event) =>
                      setMp2Form((current) => ({
                        ...current,
                        effective_from: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mp2_form_effective_to">Effective To</Label>
                  <Input
                    id="mp2_form_effective_to"
                    className="h-11"
                    type="date"
                    value={mp2Form.effective_to}
                    onChange={(event) =>
                      setMp2Form((current) => ({
                        ...current,
                        effective_to: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="mp2_form_account_number">
                    MP2 Account Number
                  </Label>
                  <Input
                    id="mp2_form_account_number"
                    className="h-11"
                    value={mp2Form.mp2_account_number}
                    onChange={(event) =>
                      setMp2Form((current) => ({
                        ...current,
                        mp2_account_number: event.target.value,
                      }))
                    }
                    placeholder="Optional MP2 reference"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="mp2_form_notes">Notes</Label>
                  <Input
                    id="mp2_form_notes"
                    className="h-11"
                    value={mp2Form.notes}
                    onChange={(event) =>
                      setMp2Form((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Optional enrollment notes"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setMp2DialogOpen(false)}
                  disabled={savingMp2}
                >
                  Cancel
                </Button>
                <Button onClick={() => void saveMp2()} disabled={savingMp2}>
                  <Save className="size-4" />
                  {savingMp2 ? "Saving..." : "Save MP2 Enrollment"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
