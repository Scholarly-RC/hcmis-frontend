import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { ProfileDetailsSections } from "@/app/profile/_components/profile-details-sections";
import { ProfileEditModal } from "@/app/profile/_components/profile-edit-modal";
import { ProfileHeader } from "@/app/profile/_components/profile-header";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import type { AuthUser } from "@/types/auth";

export const metadata = {
  title: "My Profile",
  description: "Your HCMIS account and employment details",
};

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

export default function ProfilePage() {
  return (
    <DashboardPageFrame>
      {(user) => {
        const displayName =
          buildDisplayName(user) || user.email || "My Profile";
        const initials = buildInitials(user);

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

              <ProfileDetailsSections user={user} />
            </section>

            <section className="space-y-3">
              <div>
                <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground">
                  Security
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Change your password anytime from your account.
                </p>
              </div>
              <ChangePasswordForm redirectToDashboard={false} />
            </section>
          </div>
        );
      }}
    </DashboardPageFrame>
  );
}
