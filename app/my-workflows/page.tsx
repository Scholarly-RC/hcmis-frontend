import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { WorkspaceHub } from "@/components/workspace-hub";

export const metadata = {
  title: "My Workflows",
  description: "Quick access to your personal HR workflows",
};

export default function MyWorkflowsPage() {
  return (
    <DashboardPageFrame>
      {(user) => (
        <WorkspaceHub
          user={user}
          title="My Workflows"
          description="Access your personal leave, payroll, performance, and attendance tasks from one place."
          items={[
            {
              label: "My Leave",
              description: "Submit leave requests and track approval status.",
              href: "/leave",
              requiredCapabilities: ["manage_leave_self"],
            },
            {
              label: "My Payslips",
              description: "View released payslip records by period.",
              href: "/my-payslips",
              requiredCapabilities: ["view_payslips_self"],
            },
            {
              label: "Performance",
              description: "Review self and peer performance evaluations.",
              href: "/performance-evaluations",
              requiredCapabilities: ["view_performance_self"],
            },
            {
              label: "Attendance",
              description: "Personal attendance timeline and summary view.",
              href: "/attendance",
              requiredCapabilities: ["view_attendance_self"],
            },
            {
              label: "My Overtime",
              description:
                "Submit overtime requests and track approval status.",
              href: "/overtime",
              requiredCapabilities: ["view_attendance_self"],
            },
          ]}
        />
      )}
    </DashboardPageFrame>
  );
}
