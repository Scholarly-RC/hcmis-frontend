import { redirect } from "next/navigation";
import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { WorkspaceHub } from "@/components/workspace-hub";
import { isStaff } from "@/utils/capabilities";

export const metadata = {
  title: "Leave",
  description: "Leave operations workspace",
};

export default function HrLeaveHubPage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }

        return (
          <WorkspaceHub
            user={user}
            title="Leave"
            description="Handle leave approvals, credits, and leave policy workflows."
            items={[
              {
                label: "Leave Management",
                description:
                  "Manage leave approvers, balances, and department leave controls.",
                href: "/hr/leave-management",
                requiredCapabilities: ["manage_leave_requests"],
              },
              {
                label: "Leave Review Inbox",
                description:
                  "Review and decide leave requests assigned to your account.",
                href: "/leave/inbox",
                requiredCapabilities: ["manage_leave_requests"],
              },
            ]}
          />
        );
      }}
    </DashboardPageFrame>
  );
}
