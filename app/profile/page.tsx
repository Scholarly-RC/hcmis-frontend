import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { ProfileEditModal } from "@/app/profile/_components/profile-edit-modal";
import { ProfileHeader } from "@/app/profile/_components/profile-header";
import { Card, CardContent } from "@/components/ui/card";
import type { AuthUser } from "@/lib/auth";

export const metadata = {
  title: "My Profile",
  description: "Your HCMIS account and employment details",
};

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

function buildDisplayName(user: AuthUser) {
  return [user.first_name, user.middle_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function buildInitials(user: AuthUser) {
  const firstInitial = user.first_name.trim().charAt(0);
  const lastInitial = user.last_name.trim().charAt(0);

  return `${firstInitial}${lastInitial}`.trim().toUpperCase() || "U";
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

export default function ProfilePage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        const displayName =
          buildDisplayName(user) || user.email || "My Profile";
        const initials = buildInitials(user);
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
          { label: "Gender", value: user.gender?.trim() || "Not provided" },
          {
            label: "Civil status",
            value: user.civil_status?.trim() || "Not provided",
          },
          { label: "Religion", value: user.religion?.trim() || "Not provided" },
          {
            label: "Education",
            value: user.education?.trim() || "Not provided",
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
          {
            label: "Account status",
            value: user.is_active ? "Active" : "Inactive",
          },
          {
            label: "Superuser",
            value: user.is_superuser ? "Yes" : "No",
          },
          {
            label: "Shift permission",
            value: user.can_modify_shift ? "Can modify shifts" : "Read only",
          },
          {
            label: "Biometric UID",
            value:
              user.biometric_uid !== null
                ? String(user.biometric_uid)
                : "Not enrolled",
          },
          {
            label: "Profile created",
            value: formatDate(user.created_at),
          },
          {
            label: "Last updated",
            value: formatDate(user.updated_at),
          },
        ];

        return (
          <div className="flex w-full flex-col gap-6">
            <ProfileHeader
              user={user}
              displayName={displayName}
              initials={initials}
            />

            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground">
                    Profile details
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Read-only information from your profile record.
                  </p>
                </div>

                <ProfileEditModal user={user} />
              </div>

              <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
                <CardContent className="p-6">
                  <div className="grid gap-6 xl:grid-cols-2">
                    <DetailGroup
                      title="Personal & contact"
                      description="The information used for communication and identity checks."
                      items={personalItems}
                    />
                    <DetailGroup
                      title="Employment & access"
                      description="The information that defines your role and account behavior."
                      items={employmentItems}
                    />
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        );
      }}
    </DashboardPageFrame>
  );
}
