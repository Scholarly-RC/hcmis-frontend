import { redirect } from "next/navigation";

import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { SalaryStructureClient } from "@/app/hr/salary-structure/_components/salary-structure-client";
import { isStaff } from "@/lib/capabilities";

export const metadata = {
  title: "Salary Structure",
  description: "Manage jobs, salary grades, and department mappings",
};

export default function SalaryStructurePage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }
        return <SalaryStructureClient />;
      }}
    </DashboardPageFrame>
  );
}
