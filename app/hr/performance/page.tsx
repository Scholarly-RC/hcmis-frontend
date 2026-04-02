import { redirect } from "next/navigation";
import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { WorkspaceHub } from "@/components/workspace-hub";
import { HR_WORKSPACES } from "@/lib/hr-workspaces";
import { isStaff } from "@/utils/capabilities";

export const metadata = {
  title: "Performance",
  description: "Performance and engagement workspace",
};

export default function HrPerformanceHubPage() {
  const workspace = HR_WORKSPACES.performance;

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
