import { redirect } from "next/navigation";
import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { LeaveManagementClient } from "@/app/hr/leave-management/_components/leave-management-client";
import { isStaff } from "@/utils/capabilities";

export const metadata = {
  title: "Leave Management",
  description: "Manage leave credits and requests",
};

type SearchParams =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>;

type LeaveManagementTab = "requests" | "credits" | "leave-types";

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function parseLeaveManagementTab(value: string): LeaveManagementTab {
  if (value === "credits") {
    return value;
  }
  if (value === "leave-types") {
    return value;
  }
  return "requests";
}

export default async function HrLeaveManagementPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = (await searchParams) ?? {};
  const initialTab = parseLeaveManagementTab(firstValue(params.tab));

  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }

        return <LeaveManagementClient initialTab={initialTab} />;
      }}
    </DashboardPageFrame>
  );
}
