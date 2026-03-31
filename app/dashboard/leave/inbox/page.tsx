import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { LeaveInboxClient } from "@/app/dashboard/leave/inbox/_components/leave-inbox-client";

export const metadata = {
  title: "Leave Review Inbox",
  description: "Review leave requests assigned to you",
};

export default function LeaveInboxPage() {
  return <DashboardPageFrame>{() => <LeaveInboxClient />}</DashboardPageFrame>;
}
