import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard-shell";
import type { AuthUser } from "@/lib/auth";
import { AUTH_COOKIE_NAME, fetchCurrentUser } from "@/lib/auth-server";

type DashboardPageFrameProps = {
  children: (user: AuthUser) => ReactNode;
};

export async function DashboardPageFrame({
  children,
}: DashboardPageFrameProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");
  }

  const user = await fetchCurrentUser(token);

  if (!user) {
    redirect("/login");
  }

  const displayName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const isHr = user.role?.trim().toUpperCase() === "HR";

  return (
    <DashboardShell user={user} displayName={displayName} isHr={isHr}>
      {children(user)}
    </DashboardShell>
  );
}
