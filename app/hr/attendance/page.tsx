import { redirect } from "next/navigation";
import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { WorkspaceHub } from "@/components/workspace-hub";
import { isStaff } from "@/utils/capabilities";

export const metadata = {
  title: "Attendance",
  description: "Attendance operations workspace",
};

export default function HrAttendanceHubPage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }

        return (
          <WorkspaceHub
            user={user}
            title="Attendance"
            description="Manage schedules, records, and overtime operations."
            items={[
              {
                label: "Shift Management",
                description:
                  "Configure shift templates and department shift policies.",
                href: "/hr/shift-management",
                requiredCapabilities: ["manage_shift_templates"],
              },
              {
                label: "User Attendance Management",
                description:
                  "Review and update employee attendance records and assignments.",
                href: "/hr/user-attendance-management",
                requiredCapabilities: ["manage_attendance_records"],
              },
              {
                label: "Overtime Management",
                description: "Review and resolve overtime requests.",
                href: "/hr/overtime-management",
                requiredCapabilities: ["manage_overtime_requests"],
              },
            ]}
          />
        );
      }}
    </DashboardPageFrame>
  );
}
