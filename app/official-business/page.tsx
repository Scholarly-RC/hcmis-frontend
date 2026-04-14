import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { MySpecialRequestClient } from "@/app/dashboard/special-requests/_components/my-special-request-client";

export const metadata = {
  title: "My Official Business",
  description: "Submit and track your official business requests",
};

export default function OfficialBusinessPage() {
  return (
    <DashboardPageFrame>
      {(user) => (
        <MySpecialRequestClient
          currentUserId={user.id}
          config={{
            pageTitle: "My Official Business",
            pageDescription:
              "Submit official business requests and track decision status in one place.",
            createDialogTitle: "Submit Official Business Request",
            createDialogDescription:
              "Select a date and add context. The approver is assigned automatically using your configured approver.",
            createButtonLabel: "Create Official Business Request",
            submitSuccessMessage: "Official business request submitted.",
            cancelSuccessMessage: "Official business request cancelled.",
            noApproverMessage:
              "No eligible approvers are configured for your account. Please contact HR.",
            requestNoun: "official business request",
            listPath: "/api/official-business?scope=mine",
            approverPath: "/api/official-business-approvers/me",
            createPath: "/api/official-business",
            cancelPathBase: "/api/official-business",
          }}
        />
      )}
    </DashboardPageFrame>
  );
}
