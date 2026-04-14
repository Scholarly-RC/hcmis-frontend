import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { MySpecialRequestClient } from "@/app/dashboard/special-requests/_components/my-special-request-client";

export const metadata = {
  title: "My Certificate of Attendance",
  description: "Submit and track your certificate of attendance requests",
};

export default function CertificateOfAttendancePage() {
  return (
    <DashboardPageFrame>
      {(user) => (
        <MySpecialRequestClient
          currentUserId={user.id}
          config={{
            pageTitle: "My Certificate of Attendance",
            pageDescription:
              "Submit certificate of attendance requests and track decision status in one place.",
            createDialogTitle: "Submit Certificate of Attendance Request",
            createDialogDescription:
              "Select a date, time, and punch type then add context. The approver is assigned automatically using your configured approver.",
            createButtonLabel: "Create Certificate Request",
            submitSuccessMessage:
              "Certificate of attendance request submitted.",
            cancelSuccessMessage:
              "Certificate of attendance request cancelled.",
            noApproverMessage:
              "No eligible approvers are configured for your account. Please contact HR.",
            requestNoun: "certificate of attendance request",
            includeAttendanceDetails: true,
            listPath: "/api/certificate-attendance?scope=mine",
            approverPath: "/api/certificate-attendance-approvers/me",
            createPath: "/api/certificate-attendance",
            cancelPathBase: "/api/certificate-attendance",
          }}
        />
      )}
    </DashboardPageFrame>
  );
}
