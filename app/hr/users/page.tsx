import { redirect } from "next/navigation";

import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";

import { UserManagementClient } from "@/app/dashboard/hr/users/_components/user-management-client";

export const metadata = {
  title: "User Management",
  description: "HR user directory and account administration",
};

export default function HrUsersPage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        const isHr = user.role?.trim().toUpperCase() === "HR";
        if (!isHr && !user.is_superuser) {
          redirect("/dashboard");
        }

        return <UserManagementClient currentUser={user} />;
      }}
    </DashboardPageFrame>
  );
}
