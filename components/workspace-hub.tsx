import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AuthUser } from "@/types/auth";
import { can } from "@/utils/capabilities";

type WorkspaceHubItem = {
  label: string;
  description: string;
  icon?: LucideIcon;
  href?: string;
  requiredCapabilities?: string[];
  status?: "active" | "coming_soon";
};

type WorkspaceHubProps = {
  user: AuthUser;
  title: string;
  description: string;
  items: WorkspaceHubItem[];
  emptyMessage?: string;
};

function isVisible(user: AuthUser, item: WorkspaceHubItem) {
  if (!item.requiredCapabilities || item.requiredCapabilities.length === 0) {
    return true;
  }

  return item.requiredCapabilities.every((capability) => can(user, capability));
}

export function WorkspaceHub({
  user,
  title,
  description,
  items,
  emptyMessage = "No options are available for this workspace.",
}: WorkspaceHubProps) {
  const visibleItems = items.filter((item) => isVisible(user, item));

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-2xl border border-border/70 bg-card/85 p-5 shadow-lg shadow-black/5 sm:p-6">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </section>

      {visibleItems.length === 0 ? (
        <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle>No available modules</CardTitle>
            <CardDescription>{emptyMessage}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {visibleItems.map((item) => {
            const isComingSoon = item.status === "coming_soon";
            const key = `${item.label}-${item.href ?? "soon"}`;
            const Icon = item.icon;

            const content = (
              <div className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-4">
                {Icon ? (
                  <span className="inline-flex size-16 items-center justify-center rounded-3xl border border-border/70 bg-muted/60 text-foreground transition-colors group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary">
                    <Icon className="size-8" />
                  </span>
                ) : (
                  <span />
                )}
                <div className="min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base">{item.label}</CardTitle>
                    {isComingSoon ? (
                      <Badge
                        variant="secondary"
                        className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide"
                      >
                        Soon
                      </Badge>
                    ) : null}
                  </div>
                  <CardDescription>{item.description}</CardDescription>
                </div>
              </div>
            );

            if (item.href && !isComingSoon) {
              return (
                <Link key={key} href={item.href} className="group">
                  <Card className="h-full border-border/70 bg-card/85 p-5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-lg group-hover:shadow-primary/5 sm:p-6">
                    {content}
                  </Card>
                </Link>
              );
            }

            return (
              <Card
                key={key}
                aria-disabled="true"
                className="h-full border-dashed border-border/70 bg-muted/20 p-5 opacity-85 sm:p-6"
              >
                {content}
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}
