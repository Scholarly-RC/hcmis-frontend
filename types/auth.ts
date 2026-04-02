export type AuthDepartment = {
  id: number;
  name: string;
  code: string;
};

export type AuthUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  gender: string | null;
  education: string | null;
  civil_status: string | null;
  religion: string | null;
  rank: string | null;
  employee_number: string | null;
  biometric_uid: number | null;
  role: string | null;
  department_id: number | null;
  department: AuthDepartment | null;
  phone_number: string | null;
  address: string | null;
  date_of_birth: string | null;
  date_of_hiring: string | null;
  resignation_date: string | null;
  profile_picture_url: string | null;
  can_modify_shift: boolean;
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
  rank?: string | null;
  phone_number?: string | null;
  address?: string | null;
  date_of_birth?: string | null;
  date_of_hiring?: string | null;
  profile_picture_url?: string | null;
};
