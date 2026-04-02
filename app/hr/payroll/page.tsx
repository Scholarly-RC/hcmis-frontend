import { redirect } from "next/navigation";
import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { WorkspaceHub } from "@/components/workspace-hub";
import { isStaff } from "@/utils/capabilities";

export const metadata = {
  title: "Payroll",
  description: "Payroll operations workspace",
};

export default function HrPayrollHubPage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }

        return (
          <WorkspaceHub
            user={user}
            title="Payroll"
            description="Manage salary structures, payroll configuration, and payslip release."
            items={[
              {
                label: "Salary Structure",
                description:
                  "Manage jobs, salary grades, and department mappings.",
                href: "/hr/salary-structure",
                requiredCapabilities: ["manage_salary_structure"],
              },
              {
                label: "Payslip Management",
                description:
                  "Generate, review, and release payroll payslip records.",
                href: "/hr/payslips",
                requiredCapabilities: ["manage_payslips"],
              },
              {
                label: "Payroll Settings",
                description:
                  "Configure deductions, payroll rules, and MP2 settings.",
                href: "/hr/payroll-settings",
                requiredCapabilities: ["manage_payroll_settings"],
              },
            ]}
          />
        );
      }}
    </DashboardPageFrame>
  );
}
