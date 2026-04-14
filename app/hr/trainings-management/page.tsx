import { redirect } from "next/navigation";
import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { TrainingsManagementClient } from "@/app/hr/trainings-management/_components/trainings-management-client";
import { isStaff } from "@/utils/capabilities";

export const metadata = {
  title: "Trainings Management",
  description: "Create and manage employee trainings",
};

export default function TrainingsManagementPage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }
        return <TrainingsManagementClient />;
      }}
    </DashboardPageFrame>
  );
}
