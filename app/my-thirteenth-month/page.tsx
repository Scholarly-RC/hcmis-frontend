import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { MyThirteenthMonthClient } from "@/app/dashboard/my-thirteenth-month/_components/my-thirteenth-month-client";

export const metadata = {
  title: "My 13th Month",
  description: "View your released 13th month payouts.",
};

export default function MyThirteenthMonthPage() {
  return (
    <DashboardPageFrame>{() => <MyThirteenthMonthClient />}</DashboardPageFrame>
  );
}
