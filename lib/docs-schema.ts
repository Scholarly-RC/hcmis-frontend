export type DocCategoryId =
  | "overview"
  | "getting-started"
  | "employee-features"
  | "approvals-and-workflows"
  | "hr-and-admin-features"
  | "payroll-features"
  | "attendance-and-biometric"
  | "troubleshooting";

export type DocContentBlock =
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "video";
      url: string;
    }
  | {
      type: "bullet-list";
      items: string[];
    }
  | {
      type: "numbered-list";
      items: string[];
    }
  | {
      type: "note";
      text: string;
    };

export type DocSection = {
  title: string;
  blocks: DocContentBlock[];
};

export type DocPage = {
  slug: string[];
  title: string;
  description: string;
  categoryId: DocCategoryId;
  audience: string;
  summary: string;
  related: string[][];
  sections: DocSection[];
};

export type DocCategory = {
  id: DocCategoryId;
  title: string;
  description: string;
};

export const docsCategories = [
  {
    id: "overview",
    title: "Overview",
    description: "Start here for the product scope and the help-center map.",
  },
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Account access, dashboard behavior, profile, and alerts.",
  },
  {
    id: "employee-features",
    title: "Employee Features",
    description:
      "Self-service tasks such as leave, overtime, attendance, and records.",
  },
  {
    id: "approvals-and-workflows",
    title: "Approvals And Workflows",
    description: "How approvals move, what statuses mean, and who acts next.",
  },
  {
    id: "hr-and-admin-features",
    title: "HR And Admin Features",
    description:
      "Operational workspaces used by HR, approvers, and administrators.",
  },
  {
    id: "payroll-features",
    title: "Payroll Features",
    description:
      "Payroll visibility, release behavior, and admin payroll work.",
  },
  {
    id: "attendance-and-biometric",
    title: "Attendance And Biometric",
    description:
      "Attendance concepts, biometric sync, and mismatch interpretation.",
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    description: "Common access, workflow, attendance, and payroll issues.",
  },
] as const satisfies readonly DocCategory[];

export function getDocHref(slug: readonly string[]) {
  if (slug.length === 0) {
    return "/docs";
  }

  return `/docs/${slug.join("/")}`;
}
