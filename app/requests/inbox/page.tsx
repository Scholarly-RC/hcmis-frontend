import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { RequestInboxClient } from "@/app/requests/inbox/_components/request-inbox-client";

export const metadata = {
  title: "Request Inbox",
  description: "Review and track leave and overtime requests",
};

export default function RequestInboxPage() {
  return (
    <DashboardPageFrame>
      {(user) => <RequestInboxClient currentUserId={user.id} />}
    </DashboardPageFrame>
  );
}
