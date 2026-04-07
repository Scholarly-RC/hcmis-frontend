import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { SharedResourcesClient } from "@/app/hr/shared-resources/_components/shared-resources-client";

export const metadata = {
  title: "Shared Resources",
  description: "Upload files and access resources shared with you",
};

export default function MySharedResourcesPage() {
  return (
    <DashboardPageFrame>
      {(user) => (
        <SharedResourcesClient
          currentUserId={user.id}
          canManageAll={false}
          title="Shared Resources"
          pageDescription="Upload files, download resources shared with you, and manage access for your own uploads."
        />
      )}
    </DashboardPageFrame>
  );
}
