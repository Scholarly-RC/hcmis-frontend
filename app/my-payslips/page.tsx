import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { MyPayslipsClient } from "@/app/dashboard/my-payslips/_components/my-payslips-client";

export const metadata = {
  title: "My Payslips",
  description: "View your released payslips",
};

export default function MyPayslipsPage() {
  return (
    <DashboardPageFrame>
      {(user) => <MyPayslipsClient user={user} />}
    </DashboardPageFrame>
  );
}
