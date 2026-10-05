import { redirect } from "next/navigation";

import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { ReportsClient } from "@/app/hr/reports/_components/reports-client";
import { CAP_VIEW_PAYROLL_SUMMARY } from "@/constants/capabilities";
import { can, isStaff } from "@/utils/capabilities";

export const metadata = {
  title: "Reports",
  description: "Generate and inspect HR analytics reports",
};

export default function ReportsPage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }
        return (
          <ReportsClient
            canViewPayrollSummary={can(user, CAP_VIEW_PAYROLL_SUMMARY)}
          />
        );
      }}
    </DashboardPageFrame>
  );
}
