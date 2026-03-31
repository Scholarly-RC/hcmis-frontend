import { redirect } from "next/navigation";

import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { SharedResourcesClient } from "@/app/hr/shared-resources/_components/shared-resources-client";
import { isStaff } from "@/lib/capabilities";

export const metadata = {
  title: "Shared Resources",
  description: "Upload and manage shared resources",
};

export default function SharedResourcesPage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }
        return <SharedResourcesClient />;
      }}
    </DashboardPageFrame>
  );
}
