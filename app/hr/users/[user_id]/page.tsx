import { redirect } from "next/navigation";

import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { HrUserProfileClient } from "@/app/hr/users/[user_id]/_components/hr-user-profile-client";
import { isStaff } from "@/utils/capabilities";

export const metadata = {
  title: "User Profile",
  description: "View and manage a specific user profile",
};

type UserProfilePageProps = {
  params: Promise<{
    user_id: string;
  }>;
};

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { user_id } = await params;

  return (
    <DashboardPageFrame>
      {(user) => {
        if (!isStaff(user)) {
          redirect("/dashboard");
        }

        return <HrUserProfileClient currentUser={user} userId={user_id} />;
      }}
    </DashboardPageFrame>
  );
}
