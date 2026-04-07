import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { AUTH_COOKIE_NAME, fetchCurrentUser } from "@/lib/auth-server";

export const metadata = {
  title: "Change Password",
  description: "Update your account password",
};

export default async function ChangePasswordPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");
  }

  const user = await fetchCurrentUser(token);
  if (!user) {
    redirect("/login");
  }

  if (!user.must_change_password) {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-muted/20 dark:bg-muted/10" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <ChangePasswordForm forceChange />
      </div>
    </main>
  );
}
