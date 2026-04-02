import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { AnnouncementsPollsClient } from "@/app/dashboard/announcements-and-polls/_components/announcements-polls-client";
import { isStaff } from "@/utils/capabilities";

export const metadata = {
  title: "Announcements and Polls",
  description: "Company announcements and participation polls",
};

export default function AnnouncementsAndPollsPage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        return <AnnouncementsPollsClient isStaff={isStaff(user)} />;
      }}
    </DashboardPageFrame>
  );
}
