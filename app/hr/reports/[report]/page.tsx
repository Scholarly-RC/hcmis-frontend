import { notFound, redirect } from "next/navigation";

import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { ReportsClient } from "@/app/hr/reports/_components/reports-client";
import { getReportKeyFromSlug } from "@/app/hr/reports/report-routes";
import { CAP_VIEW_PAYROLL_SUMMARY } from "@/constants/capabilities";
import { can, isStaff } from "@/utils/capabilities";

export const metadata = {
  title: "Report",
  description: "Generate and inspect an HR report",
};

type ReportRoutePageProps = {
  params: Promise<{
    report: string;
  }>;
};

export default async function ReportRoutePage({
  params,
}: ReportRoutePageProps) {
  const { report } = await params;
  const reportKey = getReportKeyFromSlug(report);

  if (!reportKey) {
    notFound();
  }

  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }
        if (
          reportKey === "payroll-summary" &&
          !can(user, CAP_VIEW_PAYROLL_SUMMARY)
        ) {
          redirect("/hr/reports");
        }

        return (
          <ReportsClient
            canViewPayrollSummary={can(user, CAP_VIEW_PAYROLL_SUMMARY)}
            initialReportKey={reportKey}
          />
        );
      }}
    </DashboardPageFrame>
  );
}
