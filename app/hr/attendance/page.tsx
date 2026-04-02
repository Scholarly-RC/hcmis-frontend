import { redirect } from "next/navigation";
import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { WorkspaceHub } from "@/components/workspace-hub";
import { HR_WORKSPACES } from "@/lib/hr-workspaces";
import { isStaff } from "@/utils/capabilities";

export const metadata = {
  title: "Attendance",
  description: "Attendance operations workspace",
};

export default function HrAttendanceHubPage() {
  const workspace = HR_WORKSPACES.attendance;

  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }

        return (
          <WorkspaceHub
            user={user}
            title={workspace.title}
            description={workspace.description}
            items={workspace.items}
          />
        );
      }}
    </DashboardPageFrame>
  );
}
