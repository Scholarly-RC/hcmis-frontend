import { redirect } from "next/navigation";

import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { DepartmentManagementClient } from "@/app/hr/departments/_components/department-management-client";
import { isStaff } from "@/utils/capabilities";

export const metadata = {
  title: "Departments",
  description: "Department records administration",
};

export default function HrDepartmentsPage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }

        return <DepartmentManagementClient />;
      }}
    </DashboardPageFrame>
  );
}
