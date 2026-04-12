import type { AuthUser } from "@/types/auth";

export type AttendanceRecord = {
  id: number;
  user_id: string;
  device_user_id: number | null;
  timestamp: string;
  punch: "IN" | "OUT";
  created_at: string;
  updated_at: string;
};

export type AttendanceShift = {
  id: number;
  description: string;
  start_time: string | null;
  end_time: string | null;
  start_time_2: string | null;
  end_time_2: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DailyShiftSchedule = {
  id: number;
  date: string;
  user_id: string;
  shift_id: number;
  user: AuthUser | null;
  shift: AttendanceShift | null;
  created_at: string;
  updated_at: string;
};

export type EmployeeShiftAssignmentRecord = {
  id: number;
  date: string;
  user_id: string;
  shift_id: number;
  user: AuthUser | null;
  shift: AttendanceShift | null;
  created_at: string;
  updated_at: string;
};

export type AttendanceHoliday = {
  id: number;
  name: string;
  day: number;
  month: number;
  year: number | null;
  created_at: string;
  updated_at: string;
};

export type AttendanceHolidayPayload = {
  name: string;
  day: number;
  month: number;
  year: number | null;
};

export type AttendanceApprovedLeave = {
  id: number;
  leave_date: string;
  leave_type: "PA" | "UN" | "WR";
  info: string | null;
};

export type AttendanceSummaryDay = {
  day: number;
  day_name: string;
  shift: DailyShiftSchedule | null;
  attendance_records: AttendanceRecord[];
  holidays: AttendanceHoliday[];
  overtime_approved: boolean;
  approved_leave: AttendanceApprovedLeave | null;
};

export type AttendanceSummary = {
  year: number;
  month: number;
  days: AttendanceSummaryDay[];
};

export type OvertimeRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type OvertimeRequestScope = "mine" | "approvals" | "all";

export type OvertimeApproverAssignment = {
  approver_id: string | null;
  approver: AuthUser | null;
  approver_ids: string[];
  approvers: AuthUser[];
};

export type OvertimeRequestApproverRecord = {
  id: number;
  overtime_request_id: number;
  approver_id: string;
  status: OvertimeRequestStatus;
  acted_at: string | null;
  approver: AuthUser | null;
};

export type OvertimeRequestRecord = {
  id: number;
  user_id: string;
  approver_id: string;
  info: string | null;
  date: string;
  escalated_to_backup_at: string | null;
  escalated_to_backup_by_id: string | null;
  status: OvertimeRequestStatus;
  user_name: string | null;
  user_email: string | null;
  user_department_name: string | null;
  approver_name: string | null;
  approver_pool: OvertimeRequestApproverRecord[];
  created_at: string;
  updated_at: string;
};
