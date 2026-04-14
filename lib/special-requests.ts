import type { AuthUser } from "@/types/auth";

export type SpecialRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type SpecialRequestScope = "mine" | "approvals" | "all";

export type SpecialRequestApproverAssignment = {
  approver_id: string | null;
  approver: AuthUser | null;
  approver_ids: string[];
  approvers: AuthUser[];
};

export type OfficialBusinessRequestApproverRecord = {
  id: number;
  official_business_request_id: number;
  approver_id: string;
  status: SpecialRequestStatus;
  acted_at: string | null;
  approver: AuthUser | null;
};

export type OfficialBusinessRequestRecord = {
  id: number;
  user_id: string;
  approver_id: string;
  info: string | null;
  date: string;
  escalated_to_backup_at: string | null;
  escalated_to_backup_by_id: string | null;
  status: SpecialRequestStatus;
  user_name: string | null;
  user_email: string | null;
  user_department_name: string | null;
  approver_name: string | null;
  approver_pool: OfficialBusinessRequestApproverRecord[];
  created_at: string;
  updated_at: string;
};

export type CertificateAttendanceRequestApproverRecord = {
  id: number;
  certificate_attendance_request_id: number;
  approver_id: string;
  status: SpecialRequestStatus;
  acted_at: string | null;
  approver: AuthUser | null;
};

export type CertificateAttendanceRequestRecord = {
  id: number;
  user_id: string;
  approver_id: string;
  info: string | null;
  date: string;
  time: string;
  punch: "IN" | "OUT";
  escalated_to_backup_at: string | null;
  escalated_to_backup_by_id: string | null;
  status: SpecialRequestStatus;
  user_name: string | null;
  user_email: string | null;
  user_department_name: string | null;
  approver_name: string | null;
  approver_pool: CertificateAttendanceRequestApproverRecord[];
  created_at: string;
  updated_at: string;
};

export function specialRequestStatusLabel(status: SpecialRequestStatus) {
  if (status === "APPROVED") {
    return "Approved";
  }
  if (status === "REJECTED") {
    return "Rejected";
  }
  if (status === "CANCELLED") {
    return "Cancelled";
  }
  return "Pending";
}

export function specialRequestStatusClass(status: SpecialRequestStatus) {
  if (status === "APPROVED") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status === "REJECTED") {
    return "bg-rose-100 text-rose-700";
  }
  if (status === "CANCELLED") {
    return "bg-slate-200 text-slate-700";
  }
  return "bg-amber-100 text-amber-700";
}
