import { redirect } from "next/navigation";

import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { ThirteenthMonthClient } from "@/app/hr/thirteenth-month/_components/thirteenth-month-client";
import { isStaff } from "@/utils/capabilities";

export const metadata = {
  title: "13th Month Management",
  description: "Generate, adjust, and release 13th month payouts.",
};

export default function ThirteenthMonthPage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }
        return <ThirteenthMonthClient />;
      }}
    </DashboardPageFrame>
  );
}
