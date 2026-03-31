import type { AuthDepartment, AuthUser } from "@/lib/auth";

export type LeaveTypeOption = {
  value: "PA" | "UN" | "WR";
  label: string;
};

export type LeaveApprover = {
  id: number;
  department_id: number;
  department: AuthDepartment | null;
  department_approver_id: number | null;
  director_approver_id: number | null;
  president_approver_id: number | null;
  hr_approver_id: number | null;
  department_approver: AuthUser | null;
  director_approver: AuthUser | null;
  president_approver: AuthUser | null;
  hr_approver: AuthUser | null;
  created_at: string;
  updated_at: string;
};

export type LeaveCredit = {
  user_id: number;
  credits: number;
  used_credits: number;
  remaining_credits: number;
  user: AuthUser | null;
  created_at: string;
  updated_at: string;
};

export type LeaveRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type LeaveRequestRecord = {
  id: number;
  user_id: number;
  leave_date: string;
  leave_type: "PA" | "UN" | "WR";
  info: string | null;
  first_approver_id: number | null;
  first_approver_status: LeaveRequestStatus;
  first_approver_at: string | null;
  second_approver_id: number | null;
  second_approver_status: LeaveRequestStatus | null;
  second_approver_at: string | null;
  status: LeaveRequestStatus;
  user: AuthUser | null;
  first_approver: AuthUser | null;
  second_approver: AuthUser | null;
  created_at: string;
  updated_at: string;
};

export type LeaveRequestCreatePayload = {
  leave_date: string;
  leave_type: "PA" | "UN" | "WR";
  info: string | null;
};

export type LeaveReviewPayload = {
  response: "APPROVE" | "REJECT";
};

export type LeaveApproverUpsertPayload = {
  department_approver_id: number | null;
  director_approver_id: number | null;
  president_approver_id: number | null;
  hr_approver_id: number | null;
};

export type LeaveCreditUpsertPayload = {
  credits: number;
};

export function leaveTypeLabel(type: string) {
  if (type === "PA") {
    return "Paid";
  }
  if (type === "UN") {
    return "Unpaid";
  }
  if (type === "WR") {
    return "Work-Related Trip";
  }
  return type;
}

export function leaveStatusClass(status: LeaveRequestStatus) {
  if (status === "APPROVED") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status === "REJECTED") {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-amber-100 text-amber-700";
}
