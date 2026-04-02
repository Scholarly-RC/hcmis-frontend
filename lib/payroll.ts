import type { AuthUser } from "@/types/auth";

export type PayrollSetting = {
  id: number;
  minimum_wage_amount: string;
  deduction_config: Array<Record<string, unknown>>;
  basic_salary_multiplier: string;
  basic_salary_step_multiplier: string;
  basic_salary_steps: number;
  max_job_rank: number;
  created_at: string;
  updated_at: string;
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

export type Mp2Account = {
  id: number;
  amount: string;
  users: AuthUser[];
};

export type PayrollJob = {
  id: number;
  title: string;
  code: string;
  salary_grade: number;
  is_active: boolean;
  departments: Array<{ id: number; name: string }>;
  created_at: string;
  updated_at: string;
};

export type PayrollPayslip = {
  id: number;
  user_id: number;
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
  variable_compensations: Array<{ id: number; name: string; amount: string }>;
  variable_deductions: Array<{ id: number; name: string; amount: string }>;
  compensations: Array<{ id: number; name: string; amount: string }>;
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
  grossPay: string;
  totalDeductions: string;
  netSalary: string;
}) {
  const win = window.open(
    "",
    "_blank",
    "noopener,noreferrer,width=900,height=700",
  );
  if (!win) {
    throw new Error("Unable to open print window.");
  }

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Payslip</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; }
    h1 { margin: 0 0 8px; }
    .meta { margin-bottom: 24px; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #f5f5f5; }
    .right { text-align: right; }
    .bold { font-weight: 700; }
  </style>
</head>
<body>
  <h1>Payslip</h1>
  <div class="meta">
    <div><strong>Employee:</strong> ${input.employeeLabel}</div>
    <div><strong>Month/Year:</strong> ${input.monthYear}</div>
    <div><strong>Period:</strong> ${input.period}</div>
    <div><strong>Rank:</strong> ${input.rank}</div>
  </div>
  <table>
    <thead>
      <tr><th>Item</th><th class="right">Amount</th></tr>
    </thead>
    <tbody>
      <tr><td>Gross Pay</td><td class="right">${input.grossPay}</td></tr>
      <tr><td>Total Deductions</td><td class="right">${input.totalDeductions}</td></tr>
      <tr><td class="bold">Net Salary</td><td class="right bold">${input.netSalary}</td></tr>
    </tbody>
  </table>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
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
    if (
      payload &&
      typeof payload === "object" &&
      "detail" in payload &&
      typeof (payload as { detail: unknown }).detail === "string"
    ) {
      throw new Error((payload as { detail: string }).detail);
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
