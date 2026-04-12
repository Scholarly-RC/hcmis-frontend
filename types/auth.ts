export type AuthDepartment = {
  id: number;
  name: string;
  code: string;
};

export type AuthUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  gender: string | null;
  education: string | null;
  civil_status: string | null;
  religion: string | null;
  rank: string | null;
  position_id: number | null;
  rank_level: number | null;
  step_number: number | null;
  employee_number: string | null;
  biometric_uid: number | null;
  role: string | null;
  department_id: number | null;
  level_1_approver_id: string | null;
  level_2_approver_id: string | null;
  department: AuthDepartment | null;
  phone_number: string | null;
  address: string | null;
  date_of_birth: string | null;
  date_of_hiring: string | null;
  resignation_date: string | null;
  profile_picture_url: string | null;
  can_modify_shift: boolean;
  must_change_password: boolean;
  temporary_password_expires_at: string | null;
  capabilities?: string[];
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
};

export type AuthLoginResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

export type AuthUserProfileUpdate = {
  first_name?: string;
  last_name?: string;
  middle_name?: string | null;
  gender?: string | null;
  education?: string | null;
  civil_status?: string | null;
  religion?: string | null;
  phone_number?: string | null;
  address?: string | null;
  date_of_birth?: string | null;
  date_of_hiring?: string | null;
  profile_picture_url?: string | null;
};

export type AuthUserChangePassword = {
  current_password?: string;
  new_password: string;
};
