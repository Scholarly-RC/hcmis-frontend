import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type HrModulePageScaffoldProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function HrModulePageScaffold({
  title,
  description,
  actions,
  children,
  className,
}: HrModulePageScaffoldProps) {
  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      <div className="rounded-2xl border border-border/70 bg-card/85 p-5 shadow-lg shadow-black/5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {description ? (
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div>{actions}</div> : null}
        </div>
      </div>

      {children}
    </div>
  );
}

type HrListSectionScaffoldProps = {
  title: string;
  description?: string;
  filters?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function HrListSectionScaffold({
  title,
  description,
  filters,
  children,
  className,
}: HrListSectionScaffoldProps) {
  return (
    <Card
      className={cn(
        "border-border/70 bg-card/85 shadow-lg shadow-black/5",
        className,
      )}
    >
      <CardHeader className="space-y-2">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {filters ? <div className="pt-1">{filters}</div> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

type HrFormSectionScaffoldProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function HrFormSectionScaffold({
  title,
  description,
  children,
  className,
}: HrFormSectionScaffoldProps) {
  return (
    <Card
      className={cn(
        "border-border/70 bg-card/85 shadow-lg shadow-black/5",
        className,
      )}
    >
      <CardHeader className="space-y-2">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
