import { redirect } from "next/navigation";
import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { TrainingDetailClient } from "@/app/hr/trainings-management/[training_id]/training-detail-client";
import { isStaff } from "@/utils/capabilities";

export const metadata = {
  title: "Training Details",
  description: "Manage participants and attachments for a training",
};

type TrainingDetailPageProps = {
  params: Promise<{
    training_id: string;
  }>;
};

export default async function TrainingDetailPage({
  params,
}: TrainingDetailPageProps) {
  const { training_id } = await params;

  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }
        return <TrainingDetailClient trainingId={training_id} />;
      }}
    </DashboardPageFrame>
  );
}
