import {
  BadgeDollarSign,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  FileBadge2,
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
              label: "Attendance",
              description: "Personal attendance timeline and summary view.",
              icon: Clock3,
              href: "/attendance",
              requiredCapabilities: ["view_attendance_self"],
            },
            {
              label: "My Leave",
              description: "Submit leave requests and track approval status.",
              icon: CalendarDays,
              href: "/leave",
              requiredCapabilities: ["manage_leave_self"],
            },
            {
              label: "My Overtime",
              description:
                "Submit overtime requests and track approval status.",
              icon: Timer,
              href: "/overtime",
              requiredCapabilities: ["view_attendance_self"],
            },
            {
              label: "My Official Business",
              description:
                "Submit official business requests and track approval status.",
              icon: BriefcaseBusiness,
              href: "/official-business",
              requiredCapabilities: ["view_attendance_self"],
            },
            {
              label: "My Certificate of Attendance",
              description:
                "Submit certificate of attendance requests and track approval status.",
              icon: FileBadge2,
              href: "/certificate-of-attendance",
              requiredCapabilities: ["view_attendance_self"],
            },
            {
              label: "My Payslips",
              description: "View released payslip records by period.",
              icon: ReceiptText,
              href: "/my-payslips",
              requiredCapabilities: ["view_payslips_self"],
            },
            {
              label: "My 13th Month",
              description: "View released 13th month payouts and adjustments.",
              icon: BadgeDollarSign,
              href: "/my-thirteenth-month",
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
          ]}
        />
      )}
    </DashboardPageFrame>
  );
}
