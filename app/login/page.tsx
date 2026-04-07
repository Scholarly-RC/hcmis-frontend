import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { AUTH_COOKIE_NAME, fetchCurrentUser } from "@/lib/auth-server";

export const metadata = {
  title: "Sign In",
  description: "Access the HCMIS dashboard",
};

export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    const user = await fetchCurrentUser(token);

    if (user) {
      redirect(user.must_change_password ? "/change-password" : "/dashboard");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[color-mix(in_oklab,var(--color-primary)_10%,white)] blur-3xl dark:bg-[color-mix(in_oklab,var(--color-primary)_14%,transparent)]" />
      <div className="absolute inset-0 bg-muted/20 dark:bg-muted/10" />
      <div className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <LoginForm />
      </div>
    </main>
  );
}
