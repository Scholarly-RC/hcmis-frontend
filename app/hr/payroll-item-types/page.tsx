import { redirect } from "next/navigation";

import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { PayrollItemTypesClient } from "@/app/hr/payroll-item-types/_components/payroll-item-types-client";
import { isStaff } from "@/utils/capabilities";

export const metadata = {
  title: "Payroll Item Types",
  description: "Manage payroll earning and deduction item definitions.",
};

export default function PayrollItemTypesPage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }

        return <PayrollItemTypesClient />;
      }}
    </DashboardPageFrame>
  );
}
