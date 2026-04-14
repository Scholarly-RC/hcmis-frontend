export type ProfileOption = {
  value: string;
  label: string;
};

export const GENDER_OPTIONS: ProfileOption[] = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
];

export const CIVIL_STATUS_OPTIONS: ProfileOption[] = [
  { value: "SI", label: "Single" },
  { value: "MA", label: "Married" },
  { value: "DI", label: "Divorced" },
  { value: "WI", label: "Widowed" },
  { value: "SE", label: "Separated" },
];

export const RELIGION_OPTIONS: ProfileOption[] = [
  { value: "RC", label: "Roman Catholic" },
  { value: "IS", label: "Islam" },
  { value: "EV", label: "Evangelical" },
  { value: "INC", label: "Iglesia ni Cristo" },
  { value: "AG", label: "Aglipayan" },
  { value: "JW", label: "Jehovah's Witnesses" },
  { value: "BAC", label: "Born Again Christian" },
  { value: "SDA", label: "Seventh-day Adventist" },
  { value: "UPC", label: "United Pentecostal Church" },
  { value: "BAP", label: "Baptist" },
  { value: "MET", label: "Methodist" },
  { value: "COC", label: "Church of Christ" },
];

export const EDUCATION_OPTIONS: ProfileOption[] = [
  { value: "HS", label: "High School" },
  { value: "VC", label: "Vocational" },
  { value: "BA", label: "Bachelor" },
  { value: "MA", label: "Master" },
  { value: "DR", label: "Doctorate" },
];

export const EMPLOYEE_TYPE_OPTIONS: ProfileOption[] = [
  { value: "RANK_AND_FILE", label: "Rank & File" },
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "MANAGER", label: "Manager" },
  { value: "OFFICER", label: "Officer" },
];

export const EMPLOYMENT_STATUS_OPTIONS: ProfileOption[] = [
  { value: "CONTRACTUAL", label: "Contractual" },
  { value: "PROVISIONARY", label: "Provisionary" },
  { value: "REGULAR", label: "Regular" },
];
