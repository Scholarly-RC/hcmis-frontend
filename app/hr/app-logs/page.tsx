import { redirect } from "next/navigation";

import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { AppLogsClient } from "@/app/hr/app-logs/_components/app-logs-client";
import { isStaff } from "@/lib/capabilities";

export const metadata = {
  title: "App Logs",
  description: "Review application logs by date and user",
};

export default function AppLogsPage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }
        return <AppLogsClient />;
      }}
    </DashboardPageFrame>
  );
}
