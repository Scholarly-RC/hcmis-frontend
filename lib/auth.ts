export const AUTH_COOKIE_NAME = "hcmis_access_token";

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
  employee_number: string | null;
  role: string | null;
  department: AuthDepartment | null;
  is_active: boolean;
  is_superuser: boolean;
};

export type AuthLoginResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};
