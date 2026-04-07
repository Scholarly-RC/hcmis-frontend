import {
  CalendarDays,
  Clock3,
  FolderOpen,
  Megaphone,
  ReceiptText,
  ShieldCheck,
  Timer,
} from "lucide-react";
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
              icon: CalendarDays,
              href: "/leave",
              requiredCapabilities: ["manage_leave_self"],
            },
            {
              label: "My Payslips",
              description: "View released payslip records by period.",
              icon: ReceiptText,
              href: "/my-payslips",
              requiredCapabilities: ["view_payslips_self"],
            },
            {
              label: "Performance",
              description: "Review self and peer performance evaluations.",
              icon: ShieldCheck,
              href: "/performance-evaluations",
              requiredCapabilities: ["view_performance_self"],
            },
            {
              label: "Announcements and Polls",
              description:
                "Read company announcements and participate in active polls.",
              icon: Megaphone,
              href: "/announcements-and-polls",
            },
            {
              label: "Shared Resources",
              description: "Upload files and access resources shared with you.",
              icon: FolderOpen,
              href: "/my/shared-resources",
            },
            {
              label: "Attendance",
              description: "Personal attendance timeline and summary view.",
              icon: Clock3,
              href: "/attendance",
              requiredCapabilities: ["view_attendance_self"],
            },
            {
              label: "My Overtime",
              description:
                "Submit overtime requests and track approval status.",
              icon: Timer,
              href: "/overtime",
              requiredCapabilities: ["view_attendance_self"],
            },
          ]}
        />
      )}
    </DashboardPageFrame>
  );
}
