"use client";

import type { LucideIcon } from "lucide-react";
import {
  BookOpenText,
  Building2,
  LayoutDashboard,
  ListTodo,
  NotebookTabs,
  ReceiptText,
  Search,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { SidebarAccountMenu } from "@/components/sidebar-account-menu";
import { SidebarNotificationMenu } from "@/components/sidebar-notification-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { HR_WORKSPACES, type HrWorkspaceKey } from "@/lib/hr-workspaces";
import type { AuthUser } from "@/types/auth";
import { can } from "@/utils/capabilities";
import { cn } from "@/utils/cn";

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
  keywords?: string[];
  children?: SidebarChildItem[];
  active?: boolean;
  requiredCapabilities?: string[];
  status?: "active" | "coming_soon" | "hidden";
};

type SidebarChildItem = {
  label: string;
  href?: string;
  keywords?: string[];
  requiredCapabilities?: string[];
  status?: "active" | "coming_soon" | "hidden";
};

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();
}

function splitSearchTokens(value: string) {
  return normalizeSearchText(value).split(/\s+/).filter(Boolean);
}

function hasOneEditOrLess(a: string, b: string) {
  if (a === b) {
    return true;
  }

  const lengthDifference = Math.abs(a.length - b.length);
  if (lengthDifference > 1) {
    return false;
  }

  if (a.length === b.length) {
    let mismatchCount = 0;
    for (let index = 0; index < a.length; index += 1) {
      if (a[index] !== b[index]) {
        mismatchCount += 1;
        if (mismatchCount > 1) {
          return false;
        }
      }
    }
    return true;
  }

  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  let shorterIndex = 0;
  let longerIndex = 0;
  let mismatchCount = 0;

  while (shorterIndex < shorter.length && longerIndex < longer.length) {
    if (shorter[shorterIndex] === longer[longerIndex]) {
      shorterIndex += 1;
      longerIndex += 1;
      continue;
    }

    mismatchCount += 1;
    if (mismatchCount > 1) {
      return false;
    }

    longerIndex += 1;
  }

  return true;
}

function tokenMatches(queryToken: string, candidateToken: string) {
  if (candidateToken.includes(queryToken)) {
    return true;
  }

  if (queryToken.length >= 4) {
    return hasOneEditOrLess(queryToken, candidateToken);
  }

  return false;
}

function matchesSearchParts(parts: string[], query: string) {
  const queryTokens = splitSearchTokens(query);
  if (queryTokens.length === 0) {
    return true;
  }

  const candidateTokens = parts.flatMap((part) => splitSearchTokens(part));

  return queryTokens.every((queryToken) =>
    candidateTokens.some((candidateToken) =>
      tokenMatches(queryToken, candidateToken),
    ),
  );
}

function matchesSidebarItem(item: SidebarItem, query: string) {
  return matchesSearchParts(
    [item.label, item.href ?? "", ...(item.keywords ?? [])],
    query,
  );
}

function matchesSidebarChildItem(item: SidebarChildItem, query: string) {
  return matchesSearchParts(
    [item.label, item.href ?? "", ...(item.keywords ?? [])],
    query,
  );
}

const hrWorkspaceSidebarIcons: Record<HrWorkspaceKey, LucideIcon> = {
  attendance: NotebookTabs,
  payroll: ReceiptText,
  performance: User,
  leave: BookOpenText,
  reports: BookOpenText,
};

const hrWorkspaceSidebarOrder: HrWorkspaceKey[] = [
  "attendance",
  "payroll",
  "performance",
  "leave",
  "reports",
];

const hrWorkspaceSidebarItems: SidebarItem[] = hrWorkspaceSidebarOrder.map(
  (workspaceKey) => {
    const workspace = HR_WORKSPACES[workspaceKey];
    return {
      label: workspace.sidebar.label,
      icon: hrWorkspaceSidebarIcons[workspaceKey],
      href: workspace.sidebar.href,
      keywords: workspace.sidebar.keywords,
      requiredCapabilities: workspace.sidebar.requiredCapabilities,
      status: workspace.sidebar.status,
      children: workspace.items.map((item) => ({
        label: item.label,
        href: item.href,
        keywords: item.keywords,
        requiredCapabilities: item.requiredCapabilities,
        status: item.status,
      })),
    };
  },
);

const sidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    keywords: ["home", "overview", "main"],
  },
  {
    label: "My Workflows",
    icon: ListTodo,
    href: "/my-workflows",
    keywords: ["tasks", "approvals", "workflow"],
    children: [
      {
        label: "My Leave",
        href: "/leave",
        keywords: ["leave", "time off", "request"],
        requiredCapabilities: ["manage_leave_self"],
      },
      {
        label: "My Payslips",
        href: "/my-payslips",
        keywords: ["payslip", "salary", "payroll"],
        requiredCapabilities: ["view_payslips_self"],
      },
      {
        label: "Performance Evaluations",
        href: "/performance-evaluations",
        keywords: ["performance", "evaluation", "review"],
        requiredCapabilities: ["view_performance_self"],
      },
      {
        label: "My Attendance",
        href: "/attendance",
        keywords: ["attendance", "timeline", "summary"],
        requiredCapabilities: ["view_attendance_self"],
      },
    ],
  },
  {
    label: "Users",
    icon: Users,
    href: "/hr/users",
    keywords: ["employees", "staff", "accounts", "people"],
    requiredCapabilities: ["manage_hr_users"],
    status: "active",
  },
  {
    label: "Departments",
    icon: Building2,
    href: "/hr/departments",
    keywords: ["department", "teams", "organization"],
    requiredCapabilities: ["access_hr_workspace"],
    status: "active",
  },
  ...hrWorkspaceSidebarItems,
];

export function DashboardShell({
  user,
  displayName,
  isHr: _isHr,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

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

  function isChildVisible(item: SidebarChildItem) {
    if (item.status === "hidden") {
      return false;
    }

    return hasRequiredCapabilities(item.requiredCapabilities);
  }

  function isChildClickable(item: SidebarChildItem) {
    if (!item.href) {
      return false;
    }

    return item.status !== "coming_soon";
  }

  function isChildActive(item: SidebarChildItem) {
    if (!item.href || item.status === "coming_soon") {
      return false;
    }

    return pathname === item.href || pathname.startsWith(`${item.href}/`);
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

  const hasSearchQuery = searchQuery.trim().length > 0;
  const visibleSidebarItems = sidebarItems.filter((item) =>
    isItemVisible(item),
  );
  const sidebarResults = hasSearchQuery
    ? visibleSidebarItems
        .map((item) => {
          const visibleChildren = (item.children ?? []).filter((child) =>
            isChildVisible(child),
          );
          const matchedChildren = visibleChildren.filter(
            (child) =>
              isChildClickable(child) &&
              matchesSidebarChildItem(child, searchQuery),
          );
          const parentMatches =
            isItemClickable(item) && matchesSidebarItem(item, searchQuery);

          return {
            item,
            matchedChildren,
            include: parentMatches || matchedChildren.length > 0,
          };
        })
        .filter((result) => result.include)
    : visibleSidebarItems.map((item) => ({
        item,
        matchedChildren: [] as SidebarChildItem[],
        include: true,
      }));

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
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <SidebarNotificationMenu />
                </div>
              </div>
            </div>

            <Separator />

            <nav
              aria-label="Application launcher"
              className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1"
            >
              <section className="space-y-2">
                <label htmlFor="sidebar-search" className="sr-only">
                  Search pages
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="sidebar-search"
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search pages..."
                    className="h-9 appearance-none rounded-xl border-border/70 bg-background/80 pl-8 shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </section>

              <section className="space-y-2">
                {sidebarResults.map((result) => {
                  const { item, matchedChildren } = result;
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
                  return (
                    <div key={key} className="space-y-1.5">
                      {isItemClickable(item) && href ? (
                        <Link
                          href={href}
                          aria-current={active ? "page" : undefined}
                          className={itemClasses}
                        >
                          {itemContent}
                        </Link>
                      ) : (
                        <div aria-disabled="true" className={itemClasses}>
                          {itemContent}
                        </div>
                      )}

                      {hasSearchQuery && matchedChildren.length > 0 ? (
                        <div className="space-y-1 pl-4">
                          {matchedChildren.map((child) => {
                            const childHref = child.href;
                            if (!childHref) {
                              return null;
                            }

                            const childActive = isChildActive(child);
                            return (
                              <Link
                                key={`${key}-${child.label}-${childHref}`}
                                href={childHref}
                                aria-current={childActive ? "page" : undefined}
                                className={cn(
                                  "block rounded-lg border px-2.5 py-1.5 text-xs",
                                  childActive
                                    ? "border-primary/30 bg-primary/5 text-foreground"
                                    : "border-border/50 bg-background/50 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground",
                                )}
                              >
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                {hasSearchQuery && sidebarResults.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                    No pages found for "{searchQuery.trim()}".
                  </div>
                ) : null}
              </section>
            </nav>

            <div className="mt-auto shrink-0 pt-2">
              <Separator className="mb-5" />
              <SidebarAccountMenu
                displayName={displayName}
                email={user.email}
                profilePictureUrl={user.profile_picture_url}
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
