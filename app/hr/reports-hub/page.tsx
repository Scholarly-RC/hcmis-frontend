import { redirect } from "next/navigation";
import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { WorkspaceHub } from "@/components/workspace-hub";
import { isStaff } from "@/utils/capabilities";

export const metadata = {
  title: "Reports",
  description: "Reporting and audit workspace",
};

export default function HrReportsHubPage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }

        return (
          <WorkspaceHub
            user={user}
            title="Reports"
            description="Generate analytics reports and review activity logs."
            items={[
              {
                label: "Reports and Analytics",
                description:
                  "Generate HR and operational reports from backend data.",
                href: "/hr/reports",
                requiredCapabilities: ["view_reports"],
              },
              {
                label: "App Logs",
                description: "Inspect application logs by user and timeline.",
                href: "/hr/app-logs",
                requiredCapabilities: ["view_app_logs"],
              },
            ]}
          />
        );
      }}
    </DashboardPageFrame>
  );
}
