export type DocCategoryId =
  | "hr-and-admin-features"
  | "attendance-guides"
  | "overview"
  | "getting-started"
  | "employee-features"
  | "approvals-and-workflows"
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
    id: "hr-and-admin-features",
    title: "Organization Guides",
    description:
      "Operational guides for organization-wide workflows and administrative tasks.",
  },
  {
    id: "attendance-guides",
    title: "Attendance Guides",
    description:
      "Shift templates and holiday calendars used by attendance workflows.",
  },
] as const satisfies readonly DocCategory[];

export function getDocHref(slug: readonly string[]) {
  if (slug.length === 0) {
    return "/docs";
  }

  return `/docs/${slug.join("/")}`;
}
