import { Building2, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { WorkspaceHub } from "@/components/workspace-hub";
import { isStaff } from "@/utils/capabilities";

export const metadata = {
  title: "Organization",
  description: "Organization setup and account administration workspace",
};

const organizationWorkspaceItems = [
  {
    label: "Users",
    description: "Manage employee accounts, roles, and profile records.",
    icon: Users,
    href: "/hr/users",
    requiredCapabilities: ["manage_hr_users"],
  },
  {
    label: "Departments",
    description: "Maintain department records and assignment availability.",
    icon: Building2,
    href: "/hr/departments",
    requiredCapabilities: ["access_hr_workspace"],
  },
];

export default function HrOrganizationsPage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }

        return (
          <WorkspaceHub
            user={user}
            title="Organization"
            description="Manage users and departments for the organization."
            items={organizationWorkspaceItems}
          />
        );
      }}
    </DashboardPageFrame>
  );
}
