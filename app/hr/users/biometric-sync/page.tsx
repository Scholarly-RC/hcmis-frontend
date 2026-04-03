import { redirect } from "next/navigation";

import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { BiometricSyncClient } from "@/app/dashboard/hr/users/_components/biometric-sync-client";
import { isStaff } from "@/utils/capabilities";

export const metadata = {
  title: "Biometric Sync",
  description: "Compare app users with biometric device records",
};

export default function HrUsersBiometricSyncPage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }

        return <BiometricSyncClient />;
      }}
    </DashboardPageFrame>
  );
}
