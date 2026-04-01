"use client";

import type { LucideIcon } from "lucide-react";
import {
  BookOpenText,
  LayoutDashboard,
  ListTodo,
  NotebookTabs,
  ReceiptText,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SidebarAccountMenu } from "@/components/sidebar-account-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { AuthUser } from "@/lib/auth";
import { can } from "@/lib/capabilities";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  user: AuthUser;
  displayName: string;
  isHr: boolean;
  children: ReactNode;
};

type SidebarItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
  active?: boolean;
  requiredCapabilities?: string[];
  status?: "active" | "coming_soon" | "hidden";
};

const sidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "My Workflows",
    icon: ListTodo,
    href: "/my-workflows",
  },
  {
    label: "Users",
    icon: Users,
    href: "/hr/users",
    requiredCapabilities: ["manage_hr_users"],
    status: "active",
  },
  {
    label: "Attendance",
    icon: NotebookTabs,
    href: "/hr/attendance",
    requiredCapabilities: ["access_hr_workspace"],
    status: "active",
  },
  {
    label: "Payroll",
    icon: ReceiptText,
    href: "/hr/payroll",
    requiredCapabilities: ["access_hr_workspace"],
    status: "active",
  },
  {
    label: "Performance",
    icon: User,
    href: "/hr/performance",
    requiredCapabilities: ["access_hr_workspace"],
    status: "active",
  },
  {
    label: "Leave",
    icon: BookOpenText,
    href: "/hr/leave",
    requiredCapabilities: ["access_hr_workspace"],
    status: "active",
  },
  {
    label: "Reports",
    icon: BookOpenText,
    href: "/hr/reports-hub",
    requiredCapabilities: ["view_app_logs"],
    status: "active",
  },
];

export function DashboardShell({
  user,
  displayName,
  isHr: _isHr,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();

  function hasRequiredCapabilities(requiredCapabilities?: string[]) {
    if (!requiredCapabilities || requiredCapabilities.length === 0) {
      return true;
    }

    return requiredCapabilities.every((capability) => can(user, capability));
  }

  function isItemVisible(item: SidebarItem) {
    if (item.status === "hidden") {
      return false;
    }

    return hasRequiredCapabilities(item.requiredCapabilities);
  }

  function isItemClickable(item: SidebarItem) {
    if (!item.href) {
      return false;
    }

    return item.status !== "coming_soon";
  }

  function isActive(item: SidebarItem) {
    if (!item.href || item.status === "coming_soon") {
      return item.active === true;
    }

    if (item.href === "/dashboard") {
      return pathname === item.href;
    }

    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_color-mix(in_oklab,var(--color-primary)_9%,transparent)_0%,_transparent_30%),linear-gradient(180deg,var(--color-background),color-mix(in_oklab,var(--color-muted)_25%,var(--color-background)))]">
      <div className="grid min-h-screen lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border-b border-border/70 bg-card/80 px-4 py-6 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden lg:border-b-0 lg:border-r lg:px-5">
          <div className="flex h-full min-h-0 flex-col gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-black/10">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold tracking-tight">
                      HCMIS
                    </p>
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </div>

            <Separator />

            <nav
              aria-label="Application launcher"
              className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1"
            >
              <section className="space-y-2">
                {sidebarItems
                  .filter((item) => isItemVisible(item))
                  .map((item) => {
                    const ItemIcon = item.icon;
                    const active = isActive(item);
                    const isComingSoon = item.status === "coming_soon";
                    const itemClasses = cn(
                      "flex items-center gap-3 rounded-2xl border px-3 py-2",
                      active
                        ? "border-primary/30 bg-primary/5"
                        : isComingSoon
                          ? "cursor-not-allowed border-dashed border-border/70 bg-muted/20 opacity-80"
                          : "border-border/70 bg-background/70 transition-colors hover:bg-muted/60",
                    );
                    const iconClasses = cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl",
                      active
                        ? "bg-primary text-primary-foreground"
                        : isComingSoon
                          ? "bg-muted/70 text-muted-foreground"
                          : "bg-muted text-foreground",
                    );
                    const itemContent = (
                      <>
                        <div className={iconClasses}>
                          <ItemIcon className="size-4" />
                        </div>

                        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                          <p className="text-sm font-medium leading-none text-foreground">
                            {item.label}
                          </p>
                          {isComingSoon ? (
                            <Badge
                              variant="secondary"
                              className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide"
                            >
                              Soon
                            </Badge>
                          ) : null}
                        </div>
                      </>
                    );

                    const href = item.href;
                    const key = `${item.label}-${href ?? "nohref"}`;
                    if (isItemClickable(item) && href) {
                      return (
                        <Link
                          key={key}
                          href={href}
                          aria-current={active ? "page" : undefined}
                          className={itemClasses}
                        >
                          {itemContent}
                        </Link>
                      );
                    }

                    return (
                      <div
                        key={key}
                        aria-disabled="true"
                        className={itemClasses}
                      >
                        {itemContent}
                      </div>
                    );
                  })}
              </section>
            </nav>

            <div className="mt-auto shrink-0 pt-2">
              <Separator className="mb-5" />
              <SidebarAccountMenu
                displayName={displayName}
                email={user.email}
              />
            </div>
          </div>
        </aside>

        <div className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </div>
    </main>
  );
}
