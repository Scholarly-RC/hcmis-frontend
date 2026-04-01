import { redirect } from "next/navigation";
import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { WorkspaceHub } from "@/components/workspace-hub";
import { isStaff } from "@/lib/capabilities";

export const metadata = {
  title: "Performance",
  description: "Performance and engagement workspace",
};

export default function HrPerformanceHubPage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }

        return (
          <WorkspaceHub
            user={user}
            title="Performance"
            description="Handle evaluations, announcements, polls, and shared resources."
            items={[
              {
                label: "Performance Evaluations",
                description:
                  "Manage HR evaluation cycles and peer/self evaluation workflows.",
                href: "/performance-evaluations",
                requiredCapabilities: ["access_hr_workspace"],
              },
              {
                label: "Announcements and Polls",
                description:
                  "Publish announcements and run company participation polls.",
                href: "/announcements-and-polls",
                requiredCapabilities: ["manage_announcements_polls"],
              },
              {
                label: "Shared Resources",
                description:
                  "Upload and manage shared resource documents for staff.",
                href: "/hr/shared-resources",
                requiredCapabilities: ["manage_shared_resources"],
              },
            ]}
          />
        );
      }}
    </DashboardPageFrame>
  );
}
