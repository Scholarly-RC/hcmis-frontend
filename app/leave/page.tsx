import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { MyLeaveClient } from "@/app/dashboard/leave/_components/my-leave-client";

export const metadata = {
  title: "My Leave",
  description: "Submit and track your leave requests",
};

export default function LeavePage() {
  return <DashboardPageFrame>{() => <MyLeaveClient />}</DashboardPageFrame>;
}
