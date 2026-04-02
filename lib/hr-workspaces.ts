export type WorkspaceItem = {
  label: string;
  description: string;
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
        href: "/hr/shift-management",
        keywords: ["shift", "schedule", "templates", "policies"],
        requiredCapabilities: ["manage_shift_templates"],
      },
      {
        label: "User Attendance Management",
        description:
          "Review and update employee attendance records and assignments.",
        href: "/hr/user-attendance-management",
        keywords: ["attendance records", "employee attendance", "assignments"],
        requiredCapabilities: ["manage_attendance_records"],
      },
      {
        label: "Overtime Management",
        description: "Review and resolve overtime requests.",
        href: "/hr/overtime-management",
        keywords: ["overtime", "extra hours", "ot requests"],
        requiredCapabilities: ["manage_overtime_requests"],
      },
    ],
  },
  payroll: {
    title: "Payroll",
    description:
      "Manage salary structures, payroll configuration, and payslip release.",
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
        description: "Manage jobs, salary grades, and department mappings.",
        href: "/hr/salary-structure",
        keywords: ["jobs", "salary grade", "mapping"],
        requiredCapabilities: ["manage_salary_structure"],
      },
      {
        label: "Payslip Management",
        description: "Generate, review, and release payroll payslip records.",
        href: "/hr/payslips",
        keywords: ["payslip", "release", "payroll records"],
        requiredCapabilities: ["manage_payslips"],
      },
      {
        label: "Payroll Settings",
        description: "Configure deductions, payroll rules, and MP2 settings.",
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
        href: "/performance-evaluations",
        keywords: ["evaluation", "peer review", "self review"],
        requiredCapabilities: ["access_hr_workspace"],
      },
      {
        label: "Announcements and Polls",
        description:
          "Publish announcements and run company participation polls.",
        href: "/announcements-and-polls",
        keywords: ["announcement", "poll", "engagement"],
        requiredCapabilities: ["manage_announcements_polls"],
      },
      {
        label: "Shared Resources",
        description: "Upload and manage shared resource documents for staff.",
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
        href: "/hr/leave-management",
        keywords: ["leave balances", "leave approvals", "leave approvers"],
        requiredCapabilities: ["manage_leave_requests"],
      },
      {
        label: "Leave Review Inbox",
        description:
          "Review and decide leave requests assigned to your account.",
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
        href: "/hr/reports",
        keywords: ["reports", "analytics", "exports"],
        requiredCapabilities: ["view_reports"],
      },
      {
        label: "App Logs",
        description: "Inspect application logs by user and timeline.",
        href: "/hr/app-logs",
        keywords: ["audit", "activity", "logs"],
        requiredCapabilities: ["view_app_logs"],
      },
    ],
  },
};
