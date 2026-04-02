import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard-shell";
import { AUTH_COOKIE_NAME, fetchCurrentUser } from "@/lib/auth-server";
import type { AuthUser } from "@/types/auth";
import { isStaff } from "@/utils/capabilities";

type DashboardPageFrameProps = {
  children: (user: AuthUser) => ReactNode;
};

export type DashboardSession = {
  user: AuthUser;
  displayName: string;
  isHr: boolean;
  token: string;
};

export async function getDashboardSession(): Promise<DashboardSession> {
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
  const isHr = isStaff(user);

  return {
    user,
    displayName,
    isHr,
    token,
  };
}

export async function DashboardPageFrame({
  children,
}: DashboardPageFrameProps) {
  const { user, displayName, isHr } = await getDashboardSession();

  return (
    <DashboardShell user={user} displayName={displayName} isHr={isHr}>
      {children(user)}
    </DashboardShell>
  );
}
