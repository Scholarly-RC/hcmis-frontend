import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { PerformanceEvaluationsClient } from "@/app/dashboard/performance-evaluations/_components/performance-evaluations-client";
import { isStaff } from "@/lib/capabilities";

export const metadata = {
  title: "Performance Evaluations",
  description: "Self, peer, and cycle evaluation management",
};

export default function PerformanceEvaluationsPage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        return (
          <PerformanceEvaluationsClient
            currentUser={user}
            isStaff={isStaff(user)}
          />
        );
      }}
    </DashboardPageFrame>
  );
}
