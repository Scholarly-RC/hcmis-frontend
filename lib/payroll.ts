import type { AuthUser } from "@/types/auth";

export type AutomaticDeductionSchedule =
  | "SECOND_CUTOFF_ONLY"
  | "SPLIT_BOTH_CUTOFFS";

export type PayrollSetting = {
  id: number;
  minimum_wage_amount: string;
  deduction_config: Array<Record<string, unknown>>;
  basic_salary_multiplier: string;
  basic_salary_step_multiplier: string;
  basic_salary_steps: number;
  max_position_rank: number;
  automatic_deduction_schedule: AutomaticDeductionSchedule;
  created_at: string;
  updated_at: string;
};

export type PayrollPolicyVersion = {
  id: number;
  policy_key: string;
  version_label: string;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PayrollPolicySource = {
  id: number;
  document_type: string;
  reference_code: string;
  title: string;
  source_url: string;
  published_at: string | null;
  effective_from: string;
  effective_to: string | null;
  applied_by: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PayrollPolicySourcesDetail = {
  version: PayrollPolicyVersion;
  sources: PayrollPolicySource[];
};

export type DeductionConfigData = {
  sss_min_compensation: string;
  sss_max_compensation: string;
  sss_min_contribution: string;
  sss_max_contribution: string;
  sss_contribution_difference: string;
  philhealth_min_compensation: string;
  philhealth_max_compensation: string;
  philhealth_min_contribution: string;
  philhealth_max_contribution: string;
  philhealth_rate: string;
  pag_ibig_amount: string;
  tax_compensation_range: string;
  tax_percentage: string;
  tax_base_tax: string;
};

export type FixedCompensation = {
  id: number;
  name: string;
  amount: string;
  month: number;
  year: number;
  users: AuthUser[];
  created_at: string;
  updated_at: string;
};

export type Mp2EnrollmentStatus = "active" | "ended";

export type Mp2Enrollment = {
  id: number;
  user_id: string;
  amount: string;
  effective_from: string;
  effective_to: string | null;
  status: Mp2EnrollmentStatus;
  mp2_account_number: string | null;
  notes: string | null;
  user: AuthUser | null;
  created_at: string;
  updated_at: string;
};

export type PayrollPosition = {
  id: number;
  title: string;
  code: string;
  salary_grade: number;
  is_active: boolean;
  departments: Array<{ id: number; name: string }>;
  created_at: string;
  updated_at: string;
};

export type PayrollItemType = {
  id: number;
  code: string;
  name: string;
  category: "earning" | "deduction";
  behavior: "fixed" | "formula" | "variable";
  taxable: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type PayrollRun = {
  id: number;
  month: number;
  year: number;
  period: "1ST" | "2ND";
  status: "DRAFT" | "VALIDATED" | "APPROVED" | "POSTED" | "RELEASED";
  policy_version_id: number | null;
  started_at: string | null;
  posted_at: string | null;
  released_at: string | null;
  locked_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PayrollRunInput = {
  id: number;
  payroll_run_id: number;
  user_id: string;
  payroll_item_type_id: number;
  amount: string;
  remarks: string | null;
  source: "manual" | "import" | "system";
  status: "draft" | "approved";
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  item_type: PayrollItemType;
  user: AuthUser | null;
  created_at: string;
  updated_at: string;
};

export type PayrollPayslip = {
  id: number;
  user_id: string;
  rank: string | null;
  salary: string | null;
  period: "1ST" | "2ND" | null;
  released: boolean;
  release_date: string | null;
  month: number | null;
  year: number | null;
  user?: AuthUser | null;
  created_at: string;
  updated_at: string;
};

export type PayslipVariableLineItem = {
  id: number;
  name: string;
  amount: string;
};

export type PayslipVariableCompensation = PayslipVariableLineItem & {
  payslip_id: number;
  created_at: string;
  updated_at: string;
};

export type PayslipVariableDeduction = PayslipVariableLineItem & {
  payslip_id: number;
  created_at: string;
  updated_at: string;
};

export type PayslipSummary = {
  period: string | null;
  salary: string | null;
  gross_pay: string | null;
  total_deductions: string | null;
  net_salary: string | null;
  sss_deduction: string | null;
  philhealth_deduction: string | null;
  pag_ibig_deduction: string | null;
  mp2_deduction: string | null;
  tax_deduction: string | null;
  variable_compensations: PayslipVariableLineItem[];
  variable_deductions: PayslipVariableLineItem[];
  compensations: Array<{ id: number; name: string; amount: string }>;
};

type PayslipPrintLineItem = {
  label: string;
  amount: string;
  note?: string;
};

export const DEFAULT_DEDUCTION_CONFIG: DeductionConfigData = {
  sss_min_compensation: "0",
  sss_max_compensation: "999999",
  sss_min_contribution: "0",
  sss_max_contribution: "0",
  sss_contribution_difference: "0",
  philhealth_min_compensation: "0",
  philhealth_max_compensation: "999999",
  philhealth_min_contribution: "0",
  philhealth_max_contribution: "0",
  philhealth_rate: "0",
  pag_ibig_amount: "0",
  tax_compensation_range: "0",
  tax_percentage: "0",
  tax_base_tax: "0",
};

function getConfigItem(
  deductionConfig: Array<Record<string, unknown>>,
  name: string,
): Record<string, unknown> {
  return (
    deductionConfig.find((item) => item.name === name) ?? {
      data: {},
    }
  );
}

export function parseDeductionConfig(
  deductionConfig: Array<Record<string, unknown>>,
): DeductionConfigData {
  const sssData = getConfigItem(deductionConfig, "SSS").data as
    | Record<string, string>
    | undefined;
  const philhealthData = getConfigItem(deductionConfig, "PHILHEALTH").data as
    | Record<string, string>
    | undefined;
  const pagibigData = getConfigItem(deductionConfig, "PAG-IBIG").data as
    | Record<string, string>
    | undefined;
  const taxData = getConfigItem(deductionConfig, "TAX").data as
    | Record<string, string>
    | undefined;

  return {
    sss_min_compensation:
      sssData?.min_compensation ??
      DEFAULT_DEDUCTION_CONFIG.sss_min_compensation,
    sss_max_compensation:
      sssData?.max_compensation ??
      DEFAULT_DEDUCTION_CONFIG.sss_max_compensation,
    sss_min_contribution:
      sssData?.min_contribution ??
      DEFAULT_DEDUCTION_CONFIG.sss_min_contribution,
    sss_max_contribution:
      sssData?.max_contribution ??
      DEFAULT_DEDUCTION_CONFIG.sss_max_contribution,
    sss_contribution_difference:
      sssData?.contribution_difference ??
      DEFAULT_DEDUCTION_CONFIG.sss_contribution_difference,
    philhealth_min_compensation:
      philhealthData?.min_compensation ??
      DEFAULT_DEDUCTION_CONFIG.philhealth_min_compensation,
    philhealth_max_compensation:
      philhealthData?.max_compensation ??
      DEFAULT_DEDUCTION_CONFIG.philhealth_max_compensation,
    philhealth_min_contribution:
      philhealthData?.min_contribution ??
      DEFAULT_DEDUCTION_CONFIG.philhealth_min_contribution,
    philhealth_max_contribution:
      philhealthData?.max_contribution ??
      DEFAULT_DEDUCTION_CONFIG.philhealth_max_contribution,
    philhealth_rate:
      philhealthData?.rate ?? DEFAULT_DEDUCTION_CONFIG.philhealth_rate,
    pag_ibig_amount:
      pagibigData?.amount ?? DEFAULT_DEDUCTION_CONFIG.pag_ibig_amount,
    tax_compensation_range:
      taxData?.compensation_range ??
      DEFAULT_DEDUCTION_CONFIG.tax_compensation_range,
    tax_percentage:
      taxData?.percentage ?? DEFAULT_DEDUCTION_CONFIG.tax_percentage,
    tax_base_tax: taxData?.base_tax ?? DEFAULT_DEDUCTION_CONFIG.tax_base_tax,
  };
}

export function buildDeductionConfig(
  data: DeductionConfigData,
): Array<Record<string, unknown>> {
  return [
    {
      name: "SSS",
      data: {
        min_compensation: data.sss_min_compensation,
        max_compensation: data.sss_max_compensation,
        min_contribution: data.sss_min_contribution,
        max_contribution: data.sss_max_contribution,
        contribution_difference: data.sss_contribution_difference,
      },
    },
    {
      name: "PHILHEALTH",
      data: {
        min_compensation: data.philhealth_min_compensation,
        max_compensation: data.philhealth_max_compensation,
        min_contribution: data.philhealth_min_contribution,
        max_contribution: data.philhealth_max_contribution,
        rate: data.philhealth_rate,
      },
    },
    {
      name: "TAX",
      data: {
        compensation_range: data.tax_compensation_range,
        percentage: data.tax_percentage,
        base_tax: data.tax_base_tax,
      },
    },
    {
      name: "PAG-IBIG",
      data: {
        amount: data.pag_ibig_amount,
      },
    },
  ];
}

export function openPayslipPrintWindow(input: {
  employeeLabel: string;
  monthYear: string;
  period: string;
  rank: string;
  status: string;
  basePay: string;
  grossPay: string;
  totalDeductions: string;
  netSalary: string;
  earnings: PayslipPrintLineItem[];
  deductions: PayslipPrintLineItem[];
}) {
  const earningsRows = input.earnings
    .map(
      (item) => `
      <tr>
        <td>
          <div class="item-label">${item.label}</div>
          ${item.note ? `<div class="item-note">${item.note}</div>` : ""}
        </td>
        <td class="right">${item.amount}</td>
      </tr>`,
    )
    .join("");

  const deductionRows = input.deductions
    .map(
      (item) => `
      <tr>
        <td>
          <div class="item-label">${item.label}</div>
          ${item.note ? `<div class="item-note">${item.note}</div>` : ""}
        </td>
        <td class="right">${item.amount}</td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Payslip</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; margin: 0; padding: 32px; color: #111827; background: #f8fafc; }
    h1, h2, h3, p { margin: 0; }
    .sheet { max-width: 820px; margin: 0 auto; background: white; border: 1px solid #e5e7eb; border-radius: 20px; padding: 28px; }
    .header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb; }
    .eyebrow { font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #6b7280; margin-bottom: 12px; }
    .name { font-size: 32px; line-height: 1.05; font-weight: 700; margin-bottom: 8px; }
    .subtle { color: #6b7280; font-size: 14px; }
    .net { min-width: 220px; border: 1px solid #bbf7d0; background: #ecfdf5; border-radius: 16px; padding: 16px 18px; }
    .net-label { font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #6b7280; }
    .net-value { margin-top: 8px; font-size: 34px; font-weight: 700; }
    .stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 18px; }
    .stat { border: 1px solid #e5e7eb; border-radius: 16px; padding: 14px 16px; }
    .stat-label { font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; }
    .stat-value { font-size: 28px; font-weight: 700; }
    .meta-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 18px; }
    .meta-card { border-radius: 16px; background: #f8fafc; padding: 14px 16px; }
    .meta-label { font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; }
    .meta-value { font-size: 15px; font-weight: 600; }
    .section-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 20px; }
    .section { border: 1px solid #e5e7eb; border-radius: 18px; padding: 18px; }
    .section-title { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
    .section-subtitle { font-size: 13px; color: #6b7280; margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-top: 1px solid #e5e7eb; padding: 12px 0; text-align: left; vertical-align: top; }
    tr:first-child th, tr:first-child td { border-top: 0; }
    th { font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: #6b7280; font-weight: 600; }
    .right { text-align: right; }
    .item-label { font-weight: 600; }
    .item-note { margin-top: 4px; font-size: 12px; color: #6b7280; }
    .totals { margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 18px; }
    .totals-row { display: flex; justify-content: space-between; gap: 16px; padding: 6px 0; }
    .totals-label { color: #6b7280; }
    .totals-value { font-weight: 600; }
    .grand-total { font-size: 18px; font-weight: 700; }
    @media print {
      body { background: white; padding: 0; }
      .sheet { border: 0; border-radius: 0; max-width: none; padding: 24px; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <div class="eyebrow">${input.period} Cutoff • ${input.monthYear}</div>
        <div class="name">${input.employeeLabel}</div>
        <div class="subtle">Rank: ${input.rank}</div>
      </div>
      <div class="net">
        <div class="net-label">Net Pay</div>
        <div class="net-value">${input.netSalary}</div>
      </div>
    </div>

    <div class="stats">
      <div class="stat">
        <div class="stat-label">Base Pay</div>
        <div class="stat-value">${input.basePay}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Gross Pay</div>
        <div class="stat-value">${input.grossPay}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Deductions</div>
        <div class="stat-value">${input.totalDeductions}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-card">
        <div class="meta-label">Payroll Month</div>
        <div class="meta-value">${input.monthYear}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Cutoff</div>
        <div class="meta-value">${input.period}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Status</div>
        <div class="meta-value">${input.status}</div>
      </div>
    </div>

    <div class="section-grid">
      <section class="section">
        <div class="section-title">Earnings</div>
        <div class="section-subtitle">Base pay plus fixed and variable compensation.</div>
        <table>
          <thead>
            <tr><th>Item</th><th class="right">Amount</th></tr>
          </thead>
          <tbody>
            ${earningsRows}
          </tbody>
        </table>
      </section>

      <section class="section">
        <div class="section-title">Deductions</div>
        <div class="section-subtitle">Statutory and manual deductions for this cutoff.</div>
        <table>
          <thead>
            <tr><th>Item</th><th class="right">Amount</th></tr>
          </thead>
          <tbody>
            ${deductionRows}
          </tbody>
        </table>
      </section>
    </div>

    <div class="totals">
      <div class="totals-row">
        <div class="totals-label">Gross Pay</div>
        <div class="totals-value">${input.grossPay}</div>
      </div>
      <div class="totals-row">
        <div class="totals-label">Total Deductions</div>
        <div class="totals-value">${input.totalDeductions}</div>
      </div>
      <div class="totals-row grand-total">
        <div>Net Salary</div>
        <div>${input.netSalary}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  let hasPrinted = false;

  const cleanup = () => {
    window.setTimeout(() => {
      frame.remove();
    }, 1000);
  };

  frame.onload = () => {
    if (hasPrinted) {
      return;
    }

    const win = frame.contentWindow;
    const doc = frame.contentDocument;
    if (!win || !doc || !doc.body || !doc.body.children.length) {
      return;
    }

    hasPrinted = true;
    window.setTimeout(() => {
      win.focus();
      win.print();
      cleanup();
    }, 50);
  };

  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  if (!doc) {
    cleanup();
    throw new Error("Unable to prepare print preview.");
  }

  doc.open();
  doc.write(html);
  doc.close();
}

export async function requestJson<T>(
  pathname: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(pathname, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (Array.isArray(payload)) {
      const messages = payload
        .map((item) => {
          if (
            item &&
            typeof item === "object" &&
            "msg" in item &&
            typeof (item as { msg: unknown }).msg === "string"
          ) {
            return (item as { msg: string }).msg;
          }
          return null;
        })
        .filter((message): message is string => Boolean(message));
      if (messages.length > 0) {
        throw new Error(messages.join("; "));
      }
    }

    if (payload && typeof payload === "object" && "detail" in payload) {
      const detail = (payload as { detail: unknown }).detail;
      if (typeof detail === "string") {
        throw new Error(detail);
      }
      if (Array.isArray(detail)) {
        const messages = detail
          .map((item) => {
            if (
              item &&
              typeof item === "object" &&
              "msg" in item &&
              typeof (item as { msg: unknown }).msg === "string"
            ) {
              return (item as { msg: string }).msg;
            }
            return null;
          })
          .filter((message): message is string => Boolean(message));
        if (messages.length > 0) {
          throw new Error(messages.join("; "));
        }
      }
    }
    throw new Error("Request failed.");
  }

  return payload as T;
}

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
