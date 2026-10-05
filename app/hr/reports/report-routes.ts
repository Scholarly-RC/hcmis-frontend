export type ReportActionKey =
  | "staffing"
  | "payroll-expense"
  | "payroll-summary"
  | "user-demographics"
  | "resignation";

export const REPORT_PATHS: Record<ReportActionKey, string> = {
  staffing: "/hr/reports/daily-staffing",
  "payroll-expense": "/hr/reports/yearly-payroll-expense",
  "payroll-summary": "/hr/reports/payroll-summary",
  "user-demographics": "/hr/reports/user-demographics",
  resignation: "/hr/reports/resignations",
};

const REPORT_KEYS_BY_SLUG: Record<string, ReportActionKey> = {
  "daily-staffing": "staffing",
  "yearly-payroll-expense": "payroll-expense",
  "payroll-summary": "payroll-summary",
  "user-demographics": "user-demographics",
  resignations: "resignation",
};

export function getReportKeyFromSlug(slug: string): ReportActionKey | null {
  return REPORT_KEYS_BY_SLUG[slug] ?? null;
}
