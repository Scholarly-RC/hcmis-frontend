import type { AuthUser } from "@/lib/auth";

export type AttendanceRecord = {
  id: number;
  user_id: number;
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
  user_id: number;
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
  is_regular: boolean;
  created_at: string;
  updated_at: string;
};

export type AttendanceSummaryDay = {
  day: number;
  day_name: string;
  shift: DailyShiftSchedule | null;
  attendance_records: AttendanceRecord[];
  holidays: AttendanceHoliday[];
  overtime_approved: boolean;
};

export type AttendanceSummary = {
  year: number;
  month: number;
  days: AttendanceSummaryDay[];
};
