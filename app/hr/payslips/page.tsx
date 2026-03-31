import { redirect } from "next/navigation";

import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { PayslipsClient } from "@/app/hr/payslips/_components/payslips-client";
import { isStaff } from "@/lib/capabilities";

export const metadata = {
  title: "Payslip Management",
  description: "Generate, review, and release employee payslips",
};

export default function PayslipsPage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }
        return <PayslipsClient />;
      }}
    </DashboardPageFrame>
  );
}
