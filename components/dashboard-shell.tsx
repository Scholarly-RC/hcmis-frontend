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
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import type { AuthUser } from "@/lib/auth";
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
};

type SidebarGroup = {
  title: string;
  icon: LucideIcon;
  items: SidebarItem[];
  requiresHr?: boolean;
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
    items: [
      {
        label: "Attendance",
        icon: Activity,
      },
      {
        label: "Performance and Learning",
        icon: BarChart3,
      },
      {
        label: "Payroll",
        icon: Warehouse,
      },
      {
        label: "Leave",
        icon: ClipboardList,
      },
      {
        label: "Reports and Analytics",
        icon: PackageOpen,
      },
    ],
  },
  {
    title: "HR Modules",
    icon: Users,
    requiresHr: true,
    items: [
      {
        label: "User Management",
        icon: Users,
        href: "/hr/users",
      },
      {
        label: "Shift Management",
        icon: ClipboardList,
        href: "/hr/shift-management",
      },
      {
        label: "User Attendance Management",
        icon: Activity,
        href: "/hr/user-attendance-management",
      },
      {
        label: "Overtime Management",
        icon: Truck,
      },
      {
        label: "User Evaluation Management",
        icon: BarChart3,
      },
      {
        label: "Peer Evaluation",
        icon: Users,
      },
      {
        label: "Poll and Post Management",
        icon: ClipboardList,
      },
      {
        label: "Shared Resources Management",
        icon: PackageOpen,
      },
      {
        label: "Salary and Rank Management",
        icon: Warehouse,
      },
      {
        label: "Payslip Management",
        icon: BarChart3,
      },
      {
        label: "Leave Management",
        icon: ClipboardList,
      },
      {
        label: "Reports and Analytics Management",
        icon: PackageOpen,
      },
      {
        label: "App Logs",
        icon: Settings2,
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

  function isActive(item: SidebarItem) {
    if (!item.href) {
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
                if (group.requiresHr && !isHr) {
                  return null;
                }

                const GroupIcon = group.icon;
                const isOpen = openGroups[group.title] ?? false;

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
                      {group.items.map((item) => {
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
