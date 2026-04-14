import type { AuthUser } from "@/types/auth";

export type LeaveTypeOption = {
  value: string;
  label: string;
};

export type LeaveTypePolicyMode = "incremental" | "fixed";

export type LeaveTypePolicy = {
  id: string;
  code: string;
  name: string;
  max_credits: number;
  credit_mode: LeaveTypePolicyMode;
  created_at: string;
  updated_at: string;
};

export type LeaveTypePolicyUpsertPayload = {
  name: string;
  max_credits: number;
  credit_mode: LeaveTypePolicyMode;
};

export type LeaveCredit = {
  user_id: string;
  leave_type?: string | null;
  credits: number;
  used_credits: number;
  remaining_credits: number;
  user: AuthUser | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type LeaveRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type LeaveRequestApproverRecord = {
  id: number;
  leave_request_id: number;
  approver_id: string;
  status: LeaveRequestStatus;
  acted_at: string | null;
  approver: AuthUser | null;
};

export type LeaveRequestRecord = {
  id: number;
  user_id: string;
  leave_date: string;
  leave_type: string;
  approval_type?: "PAID" | "NON_PAID" | null;
  info: string | null;
  first_approver_id: string | null;
  first_approver_status: LeaveRequestStatus;
  first_approver_at: string | null;
  second_approver_id: string | null;
  second_approver_status: LeaveRequestStatus | null;
  second_approver_at: string | null;
  escalated_to_backup_at: string | null;
  escalated_to_backup_by_id: string | null;
  status: LeaveRequestStatus;
  user: AuthUser | null;
  first_approver: AuthUser | null;
  second_approver: AuthUser | null;
  approver_pool: LeaveRequestApproverRecord[];
  created_at: string;
  updated_at: string;
};

export type LeaveRequestCreatePayload = {
  leave_date: string;
  leave_type: string;
  info: string | null;
};

export type LeaveReviewPayload = {
  response: "APPROVE" | "REJECT";
  approval_type?: "PAID" | "NON_PAID";
};

export type LeaveCreditUpsertPayload = {
  credits: number;
};

export function leaveTypeLabel(type: string) {
  return type;
}

export function leaveStatusClass(status: LeaveRequestStatus) {
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

export function leaveStatusLabel(status: LeaveRequestStatus) {
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
