"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  PackageOpen,
  Settings2,
  ShieldCheck,
  Truck,
  User,
  Users,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { SidebarAccountMenu } from "@/components/sidebar-account-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import type { AuthUser } from "@/lib/auth";
import { CAP_ACCESS_HR_WORKSPACE, can } from "@/lib/capabilities";
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

type SidebarGroup = {
  title: string;
  icon: LucideIcon;
  items: SidebarItem[];
  requiredCapabilities?: string[];
  requiresHr?: boolean;
  routePrefixes?: string[];
};

const pinnedItems: SidebarItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "My Profile",
    icon: User,
    href: "/profile",
  },
];

const sidebarGroups: SidebarGroup[] = [
  {
    title: "Account Modules",
    icon: ShieldCheck,
    routePrefixes: ["/dashboard/leave", "/dashboard/my-payslips"],
    items: [
      {
        label: "Attendance",
        icon: Activity,
        requiredCapabilities: ["view_attendance_self"],
        status: "coming_soon",
      },
      {
        label: "Performance and Learning",
        icon: BarChart3,
        href: "/dashboard/performance-evaluations",
        requiredCapabilities: ["view_performance_self"],
        status: "active",
      },
      {
        label: "Payroll",
        icon: Warehouse,
        href: "/dashboard/my-payslips",
        requiredCapabilities: ["view_payslips_self"],
        status: "active",
      },
      {
        label: "Leave",
        icon: ClipboardList,
        href: "/dashboard/leave",
        requiredCapabilities: ["manage_leave_self"],
        status: "active",
      },
      {
        label: "Reports and Analytics",
        icon: PackageOpen,
        requiredCapabilities: ["view_reports"],
        status: "coming_soon",
      },
    ],
  },
  {
    title: "HR Modules",
    icon: Users,
    requiredCapabilities: [CAP_ACCESS_HR_WORKSPACE],
    requiresHr: true,
    routePrefixes: ["/hr"],
    items: [
      {
        label: "User Management",
        icon: Users,
        href: "/hr/users",
        requiredCapabilities: ["manage_hr_users"],
        status: "active",
      },
      {
        label: "Shift Management",
        icon: ClipboardList,
        href: "/hr/shift-management",
        requiredCapabilities: ["manage_shift_templates"],
        status: "active",
      },
      {
        label: "User Attendance Management",
        icon: Activity,
        href: "/hr/user-attendance-management",
        requiredCapabilities: ["manage_attendance_records"],
        status: "active",
      },
      {
        label: "Overtime Management",
        icon: Truck,
        href: "/hr/overtime-management",
        requiredCapabilities: ["manage_overtime_requests"],
        status: "active",
      },
      {
        label: "User Evaluation Management",
        icon: BarChart3,
        href: "/dashboard/performance-evaluations",
        requiredCapabilities: [CAP_ACCESS_HR_WORKSPACE],
        status: "active",
      },
      {
        label: "Peer Evaluation",
        icon: Users,
        href: "/dashboard/performance-evaluations",
        requiredCapabilities: [CAP_ACCESS_HR_WORKSPACE],
        status: "active",
      },
      {
        label: "Announcements and Polls",
        icon: ClipboardList,
        href: "/dashboard/announcements-and-polls",
        requiredCapabilities: ["manage_announcements_polls"],
        status: "active",
      },
      {
        label: "Shared Resources Management",
        icon: PackageOpen,
        href: "/hr/shared-resources",
        requiredCapabilities: ["manage_shared_resources"],
        status: "active",
      },
      {
        label: "Salary and Rank Management",
        icon: Warehouse,
        href: "/hr/salary-structure",
        requiredCapabilities: ["manage_salary_structure"],
        status: "active",
      },
      {
        label: "Payslip Management",
        icon: BarChart3,
        href: "/hr/payslips",
        requiredCapabilities: ["manage_payslips"],
        status: "active",
      },
      {
        label: "Payroll Settings",
        icon: Settings2,
        href: "/hr/payroll-settings",
        requiredCapabilities: ["manage_payroll_settings"],
        status: "active",
      },
      {
        label: "Leave Management",
        icon: ClipboardList,
        href: "/hr/leave-management",
        requiredCapabilities: ["manage_leave_requests"],
        status: "active",
      },
      {
        label: "Reports and Analytics Management",
        icon: PackageOpen,
        href: "/hr/reports",
        requiredCapabilities: ["view_reports"],
        status: "active",
      },
      {
        label: "App Logs",
        icon: Settings2,
        href: "/hr/app-logs",
        requiredCapabilities: ["view_app_logs"],
        status: "active",
      },
    ],
  },
];

export function DashboardShell({
  user,
  displayName,
  isHr,
  children,
}: DashboardShellProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
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

  function isGroupActive(group: SidebarGroup) {
    const hasActiveItem = group.items.some(
      (item) => isItemVisible(item) && isActive(item),
    );
    if (hasActiveItem) {
      return true;
    }

    if (!group.routePrefixes || group.routePrefixes.length === 0) {
      return false;
    }

    return group.routePrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  }

  function shouldRenderGroup(group: SidebarGroup) {
    if (
      !hasRequiredCapabilities(group.requiredCapabilities) &&
      !(group.requiresHr && isHr)
    ) {
      return false;
    }

    return group.items.some((item) => isItemVisible(item));
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
                {pinnedItems.map((item) => {
                  const ItemIcon = item.icon;
                  const active = isActive(item);
                  const itemClasses = cn(
                    "flex items-center gap-3 rounded-2xl border px-3 py-2",
                    active
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/70 bg-background/70 transition-colors hover:bg-muted/60",
                  );
                  const iconClasses = cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  );

                  const itemContent = (
                    <>
                      <div className={iconClasses}>
                        <ItemIcon className="size-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-none text-foreground">
                          {item.label}
                        </p>
                      </div>
                    </>
                  );

                  if (item.href) {
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={itemClasses}
                      >
                        {itemContent}
                      </Link>
                    );
                  }

                  return (
                    <div key={item.label} className={itemClasses}>
                      {itemContent}
                    </div>
                  );
                })}
              </section>

              {sidebarGroups.map((group) => {
                if (!shouldRenderGroup(group)) {
                  return null;
                }

                const GroupIcon = group.icon;
                const isOpen = openGroups[group.title] ?? isGroupActive(group);

                return (
                  <Collapsible
                    key={group.title}
                    open={isOpen}
                    onOpenChange={(nextOpen) =>
                      setOpenGroups((current) => ({
                        ...current,
                        [group.title]: nextOpen,
                      }))
                    }
                    className="space-y-3"
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        className="flex w-full items-center justify-between gap-3 rounded-2xl px-1 py-1 text-left transition-colors hover:bg-muted/40"
                      >
                        <div className="flex items-center gap-2">
                          <GroupIcon className="size-4 text-muted-foreground" />
                          <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                            {group.title}
                          </h2>
                        </div>
                        <ChevronDown
                          className={cn(
                            "size-4 text-muted-foreground transition-transform",
                            isOpen ? "rotate-180" : null,
                          )}
                        />
                      </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="space-y-2">
                      {group.items
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
                          if (isItemClickable(item) && href) {
                            return (
                              <Link
                                key={item.label}
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
                              key={item.label}
                              aria-disabled="true"
                              className={itemClasses}
                            >
                              {itemContent}
                            </div>
                          );
                        })}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
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
