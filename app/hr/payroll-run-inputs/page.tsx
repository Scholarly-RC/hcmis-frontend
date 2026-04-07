import { redirect } from "next/navigation";

import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { PayrollRunInputsClient } from "@/app/hr/payroll-run-inputs/_components/payroll-run-inputs-client";
import { isStaff } from "@/utils/capabilities";

export const metadata = {
  title: "Payroll Run Inputs",
  description: "Encode variable payroll earnings and deductions by run.",
};

export default function PayrollRunInputsPage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }

        return <PayrollRunInputsClient />;
      }}
    </DashboardPageFrame>
  );
}
