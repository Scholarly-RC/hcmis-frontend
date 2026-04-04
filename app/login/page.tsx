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
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_12%,color-mix(in_oklab,var(--color-primary)_16%,transparent)_0%,transparent_35%),radial-gradient(circle_at_90%_84%,color-mix(in_oklab,var(--color-muted)_88%,white)_0%,transparent_42%),linear-gradient(180deg,color-mix(in_oklab,var(--color-background)_95%,white),var(--color-background))]">
      <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[color-mix(in_oklab,var(--color-primary)_12%,white)] blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:36px_36px] opacity-40" />
      <div className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <LoginForm />
      </div>
    </main>
  );
}
