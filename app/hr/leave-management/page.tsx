import { redirect } from "next/navigation";
import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { LeaveManagementClient } from "@/app/hr/leave-management/_components/leave-management-client";
import { isStaff } from "@/lib/capabilities";

export const metadata = {
  title: "Leave Management",
  description: "Manage leave approvers, credits, and requests",
};

export default function HrLeaveManagementPage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }

        return <LeaveManagementClient />;
      }}
    </DashboardPageFrame>
  );
}
