import type { PayrollPosition } from "@/lib/payroll";
import type { AuthDepartment, AuthUser } from "@/types/auth";

const FIELD_LABELS: Record<string, string> = {
  position_id: "Position",
  rank_level: "Rank Level",
  step_number: "Step Number",
  rank: "Rank",
  department_id: "Department",
  employee_type: "Employee Type",
  employment_status: "Employment Status",
  date_of_hiring: "Date Of Hiring",
  resignation_date: "Resignation Date",
};

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function formatEmploymentMovementFieldLabel(fieldName: string): string {
  const explicit = FIELD_LABELS[fieldName];
  if (explicit) {
    return explicit;
  }
  return toTitleCase(fieldName.replaceAll("_", " "));
}

function formatDateValue(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsed);
}

export function formatEmploymentMovementValue(
  fieldName: string,
  value: string | null,
  context: {
    departments: AuthDepartment[];
    positions: PayrollPosition[];
  },
): string {
  if (!value) {
    return "None";
  }

  if (fieldName === "department_id") {
    const id = Number(value);
    if (!Number.isNaN(id)) {
      const department = context.departments.find((item) => item.id === id);
      if (department) {
        return department.name;
      }
    }
  }

  if (fieldName === "position_id") {
    const id = Number(value);
    if (!Number.isNaN(id)) {
      const position = context.positions.find((item) => item.id === id);
      if (position) {
        return `${position.code} - ${position.title}`;
      }
    }
  }

  if (fieldName === "employee_type" || fieldName === "employment_status") {
    return toTitleCase(value.replaceAll("_", " "));
  }

  if (fieldName === "date_of_hiring" || fieldName === "resignation_date") {
    return formatDateValue(value);
  }

  return value;
}

export function formatEmploymentMovementActor(
  changedBy: string | null,
  users: AuthUser[],
): string {
  if (!changedBy) {
    return "System";
  }
  const actor = users.find((item) => item.id === changedBy);
  if (!actor) {
    return "Unknown User";
  }
  const fullName = `${actor.first_name} ${actor.last_name}`.trim();
  if (fullName) {
    return fullName;
  }
  return actor.email;
}
