import {
  CIVIL_STATUS_OPTIONS,
  EDUCATION_OPTIONS,
  EMPLOYEE_TYPE_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
  GENDER_OPTIONS,
  RELIGION_OPTIONS,
} from "@/lib/profile-options";
import type { AuthUser } from "@/types/auth";

type DetailItem = {
  label: string;
  value: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not provided";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function calculateAge(value: string | null) {
  if (!value) {
    return null;
  }

  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();

  const birthdayPassed =
    now.getMonth() > birthDate.getMonth() ||
    (now.getMonth() === birthDate.getMonth() &&
      now.getDate() >= birthDate.getDate());

  if (!birthdayPassed) {
    age -= 1;
  }

  return age;
}

function getTenure(value: string | null) {
  if (!value) {
    return "Not provided";
  }

  const hireDate = new Date(value);
  if (Number.isNaN(hireDate.getTime())) {
    return value;
  }

  const now = new Date();
  let years = now.getFullYear() - hireDate.getFullYear();
  let months = now.getMonth() - hireDate.getMonth();

  if (now.getDate() < hireDate.getDate()) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years <= 0) {
    const safeMonths = Math.max(months, 0);
    return `${safeMonths} month${safeMonths === 1 ? "" : "s"}`;
  }

  if (months === 0) {
    return `${years} year${years === 1 ? "" : "s"}`;
  }

  return `${years} year${years === 1 ? "" : "s"} ${months} month${months === 1 ? "" : "s"}`;
}

function getOptionLabel(
  value: string | null,
  options: { value: string; label: string }[],
) {
  if (!value) {
    return "Not provided";
  }

  return options.find((option) => option.value === value)?.label ?? value;
}

function DetailRow({ label, value }: DetailItem) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-border/60 py-3 last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="max-w-[60%] text-right text-sm font-medium leading-6 text-foreground">
        {value}
      </dd>
    </div>
  );
}

function DetailGroup({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: DetailItem[];
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-background/70 p-5">
      <div className="space-y-1">
        <h3 className="font-heading text-base font-medium tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      <dl className="mt-4">
        {items.map((item) => (
          <DetailRow key={item.label} {...item} />
        ))}
      </dl>
    </section>
  );
}

export function ProfileDetailsSections({ user }: { user: AuthUser }) {
  const age = calculateAge(user.date_of_birth);

  const personalItems: DetailItem[] = [
    { label: "Email", value: user.email },
    {
      label: "Phone",
      value: user.phone_number?.trim() || "Not provided",
    },
    { label: "Address", value: user.address?.trim() || "Not provided" },
    {
      label: "Birth date",
      value: user.date_of_birth
        ? formatDate(user.date_of_birth)
        : "Not provided",
    },
    {
      label: "Age",
      value: age ? `${age} years old` : "Not provided",
    },
    {
      label: "Gender",
      value: getOptionLabel(user.gender, GENDER_OPTIONS),
    },
    {
      label: "Civil status",
      value: getOptionLabel(user.civil_status, CIVIL_STATUS_OPTIONS),
    },
    {
      label: "Religion",
      value: getOptionLabel(user.religion, RELIGION_OPTIONS),
    },
  ];

  const educationItems: DetailItem[] = [
    {
      label: "Highest Educational Background",
      value: getOptionLabel(user.highest_education_level, EDUCATION_OPTIONS),
    },
    {
      label: "Program / Degree",
      value: user.highest_education_program?.trim() || "Not provided",
    },
  ];

  const employmentItems: DetailItem[] = [
    {
      label: "Employee number",
      value: user.employee_number?.trim() || "Not provided",
    },
    {
      label: "Department",
      value: user.department
        ? `${user.department.name} (${user.department.code})`
        : "Not assigned",
    },
    { label: "Role", value: user.role?.trim() || "Employee" },
    {
      label: "Employee Type",
      value: getOptionLabel(user.employee_type, EMPLOYEE_TYPE_OPTIONS),
    },
    {
      label: "Employment Status",
      value: getOptionLabel(user.employment_status, EMPLOYMENT_STATUS_OPTIONS),
    },
    { label: "Rank", value: user.rank?.trim() || "Not provided" },
    {
      label: "Hire date",
      value: user.date_of_hiring
        ? formatDate(user.date_of_hiring)
        : "Not provided",
    },
    {
      label: "Tenure",
      value: getTenure(user.date_of_hiring),
    },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <DetailGroup
        title="Personal & contact"
        description="The information used for communication and identity checks."
        items={personalItems}
      />
      <DetailGroup
        title="Educational Background"
        description="Your highest educational attainment and degree/program detail."
        items={educationItems}
      />
      <DetailGroup
        title="Employment details"
        description="The information that defines your role and position record."
        items={employmentItems}
      />
    </div>
  );
}
