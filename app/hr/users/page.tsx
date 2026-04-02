import { redirect } from "next/navigation";

import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";

import { UserManagementClient } from "@/app/dashboard/hr/users/_components/user-management-client";
import { isStaff } from "@/utils/capabilities";

export const metadata = {
  title: "User Management",
  description: "HR user directory and account administration",
};

export default function HrUsersPage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }

        return <UserManagementClient currentUser={user} />;
      }}
    </DashboardPageFrame>
  );
}
