import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { MyOvertimeClient } from "@/app/dashboard/overtime/_components/my-overtime-client";

export const metadata = {
  title: "My Overtime",
  description: "Submit and track your overtime requests",
};

export default function OvertimePage() {
  return (
    <DashboardPageFrame>
      {(user) => (
        <MyOvertimeClient
          currentUserId={user.id}
          canManageOvertime={Boolean(
            user.capabilities?.includes("manage_overtime_requests"),
          )}
        />
      )}
    </DashboardPageFrame>
  );
}
