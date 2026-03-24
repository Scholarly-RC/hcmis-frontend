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
      redirect("/dashboard");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_var(--color-muted)_0%,_transparent_34%),radial-gradient(circle_at_bottom_right,_color-mix(in_oklab,var(--color-primary)_10%,transparent)_0%,_transparent_30%),linear-gradient(180deg,var(--color-background),color-mix(in_oklab,var(--color-muted)_20%,var(--color-background)))]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
      <div className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <LoginForm />
      </div>
    </main>
  );
}
