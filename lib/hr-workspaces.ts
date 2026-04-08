import type { LucideIcon } from "lucide-react";
import {
  BadgeDollarSign,
  CalendarClock,
  CalendarRange,
  ClipboardCheck,
  FileBarChart,
  FileSearch,
  Files,
  Megaphone,
  ReceiptText,
  Scale,
  Timer,
  Vote,
} from "lucide-react";

export type WorkspaceItem = {
  label: string;
  description: string;
  icon?: LucideIcon;
  href: string;
  keywords?: string[];
  requiredCapabilities?: string[];
  status?: "active" | "coming_soon";
};

export type WorkspaceSidebarConfig = {
  label: string;
  href: string;
  keywords: string[];
  requiredCapabilities?: string[];
  status?: "active" | "coming_soon" | "hidden";
};

export type HrWorkspaceConfig = {
  title: string;
  description: string;
  sidebar: WorkspaceSidebarConfig;
  items: WorkspaceItem[];
};

export type HrWorkspaceKey =
  | "attendance"
  | "payroll"
  | "performance"
  | "leave"
  | "reports";

export const HR_WORKSPACES: Record<HrWorkspaceKey, HrWorkspaceConfig> = {
  attendance: {
    title: "Attendance",
    description: "Manage schedules, records, and overtime operations.",
    sidebar: {
      label: "Attendance",
      href: "/hr/attendance",
      keywords: [
        "timekeeping",
        "clock in",
        "clock out",
        "presence",
        "overtime",
        "shifts",
        "attendance records",
      ],
      requiredCapabilities: ["access_hr_workspace"],
      status: "active",
    },
    items: [
      {
        label: "Shift Management",
        description: "Configure shift templates and department shift policies.",
        icon: CalendarClock,
        href: "/hr/shift-management",
        keywords: ["shift", "schedule", "templates", "policies"],
        requiredCapabilities: ["manage_shift_templates"],
      },
      {
        label: "User Attendance Management",
        description:
          "Review and update employee attendance records and assignments.",
        icon: ClipboardCheck,
        href: "/hr/user-attendance-management",
        keywords: ["attendance records", "employee attendance", "assignments"],
        requiredCapabilities: ["manage_attendance_records"],
      },
      {
        label: "Overtime Management",
        description: "Review and resolve overtime requests.",
        icon: Timer,
        href: "/hr/overtime-management",
        keywords: ["overtime", "extra hours", "ot requests"],
        requiredCapabilities: ["manage_overtime_requests"],
      },
    ],
  },
  payroll: {
    title: "Payroll",
    description:
      "Set up salary rules, prepare payslips, and release employee payroll.",
    sidebar: {
      label: "Payroll",
      href: "/hr/payroll",
      keywords: ["payslip", "payslips", "salary", "compensation", "pay"],
      requiredCapabilities: ["access_hr_workspace"],
      status: "active",
    },
    items: [
      {
        label: "Salary Structure",
        description:
          "Manage positions, salary grades, and department mappings.",
        icon: BadgeDollarSign,
        href: "/hr/salary-structure",
        keywords: ["positions", "salary grade", "mapping"],
        requiredCapabilities: ["manage_salary_structure"],
      },
      {
        label: "Payslip Management",
        description:
          "Create payslips, review the payroll breakdown, and release them when ready.",
        icon: ReceiptText,
        href: "/hr/payslips",
        keywords: ["payslip", "release", "payroll records"],
        requiredCapabilities: ["manage_payslips"],
      },
      {
        label: "13th Month Management",
        description:
          "Generate yearly 13th month payouts, apply adjustments, and release to employees.",
        icon: CalendarClock,
        href: "/hr/thirteenth-month",
        keywords: ["13th month", "yearly payout", "adjustments"],
        requiredCapabilities: ["manage_payslips"],
      },
      {
        label: "Payroll Rules And Deductions",
        description:
          "Maintain statutory payroll rules, legal references, and MP2 membership settings.",
        icon: Scale,
        href: "/hr/payroll-settings",
        keywords: ["deductions", "mp2", "rules"],
        requiredCapabilities: ["manage_payroll_settings"],
      },
    ],
  },
  performance: {
    title: "Performance",
    description:
      "Handle evaluations, announcements, polls, and shared resources.",
    sidebar: {
      label: "Performance",
      href: "/hr/performance",
      keywords: ["evaluation", "kpi", "reviews", "appraisal"],
      requiredCapabilities: ["access_hr_workspace"],
      status: "active",
    },
    items: [
      {
        label: "Performance Evaluations",
        description:
          "Manage HR evaluation cycles and peer/self evaluation workflows.",
        icon: Vote,
        href: "/performance-evaluations",
        keywords: ["evaluation", "peer review", "self review"],
        requiredCapabilities: ["access_hr_workspace"],
      },
      {
        label: "Announcements and Polls",
        description:
          "Publish announcements and run company participation polls.",
        icon: Megaphone,
        href: "/announcements-and-polls",
        keywords: ["announcement", "poll", "engagement"],
        requiredCapabilities: ["manage_announcements_polls"],
      },
      {
        label: "Shared Resources",
        description: "Upload and manage shared resource documents for staff.",
        icon: Files,
        href: "/hr/shared-resources",
        keywords: ["resources", "documents", "uploads"],
        requiredCapabilities: ["manage_shared_resources"],
      },
    ],
  },
  leave: {
    title: "Leave",
    description: "Handle leave approvals, credits, and leave policy workflows.",
    sidebar: {
      label: "Leave",
      href: "/hr/leave",
      keywords: ["vacation", "time off", "absence"],
      requiredCapabilities: ["access_hr_workspace"],
      status: "active",
    },
    items: [
      {
        label: "Leave Management",
        description:
          "Manage leave approvers, balances, and department leave controls.",
        icon: CalendarRange,
        href: "/hr/leave-management",
        keywords: ["leave balances", "leave approvals", "leave approvers"],
        requiredCapabilities: ["manage_leave_requests"],
      },
      {
        label: "Leave Review Inbox",
        description:
          "Review and decide leave requests assigned to your account.",
        icon: ClipboardCheck,
        href: "/leave/inbox",
        keywords: ["leave inbox", "pending leave", "review requests"],
        requiredCapabilities: ["manage_leave_requests"],
      },
    ],
  },
  reports: {
    title: "Reports",
    description: "Generate analytics reports and review activity logs.",
    sidebar: {
      label: "Reports",
      href: "/hr/reports-hub",
      keywords: ["analytics", "logs", "insights", "reporting"],
      requiredCapabilities: ["view_app_logs"],
      status: "active",
    },
    items: [
      {
        label: "Reports and Analytics",
        description: "Generate HR and operational reports from backend data.",
        icon: FileBarChart,
        href: "/hr/reports",
        keywords: ["reports", "analytics", "exports"],
        requiredCapabilities: ["view_reports"],
      },
      {
        label: "App Logs",
        description: "Inspect application logs by user and timeline.",
        icon: FileSearch,
        href: "/hr/app-logs",
        keywords: ["audit", "activity", "logs"],
        requiredCapabilities: ["view_app_logs"],
      },
    ],
  },
};
