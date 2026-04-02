import { redirect } from "next/navigation";

import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { PayrollSettingsClient } from "@/app/hr/payroll-settings/_components/payroll-settings-client";
import { isStaff } from "@/utils/capabilities";

export const metadata = {
  title: "Payroll Settings",
  description: "Configure payroll rules, deduction setup, and MP2 assignments",
};

export default function PayrollSettingsPage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }
        return <PayrollSettingsClient />;
      }}
    </DashboardPageFrame>
  );
}
