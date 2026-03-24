import {
  Activity,
  BarChart3,
  Boxes,
  ClipboardList,
  PackageOpen,
  Truck,
  Warehouse,
} from "lucide-react";

import { DashboardPageFrame } from "@/app/dashboard/_components/dashboard-page-frame";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Dashboard",
  description: "Overview of HCMIS operations",
};

const metrics = [
  {
    title: "Pending approvals",
    value: "14",
    delta: "+4 from yesterday",
    icon: ClipboardList,
  },
  {
    title: "Inbound deliveries",
    value: "08",
    delta: "3 arriving today",
    icon: Truck,
  },
  {
    title: "Low stock items",
    value: "05",
    delta: "2 flagged urgent",
    icon: Boxes,
  },
  {
    title: "Facilities online",
    value: "26",
    delta: "100% reporting",
    icon: Warehouse,
  },
];

const activity = [
  {
    label: "Requisition approved",
    detail: "Central Pharmacy requested 120 units of amoxicillin.",
    time: "5 minutes ago",
    state: "Approved",
  },
  {
    label: "Delivery received",
    detail: "Warehouse A logged 18 cartons of syringes and safety boxes.",
    time: "24 minutes ago",
    state: "Received",
  },
  {
    label: "Threshold alert",
    detail: "Ward B is below minimum stock for IV sets.",
    time: "1 hour ago",
    state: "Attention",
  },
];

const shortcuts = [
  {
    label: "Review requisitions",
    description: "Clear pending requests and confirm allocations.",
  },
  {
    label: "Receive shipment",
    description: "Log incoming goods against purchase orders.",
  },
  {
    label: "Check stock levels",
    description: "Open the latest balances for warehouses and wards.",
  },
];

export default function DashboardPage() {
  return (
    <DashboardPageFrame>
      {() => (
        <div className="flex w-full flex-col gap-8">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;

              return (
                <Card
                  key={metric.title}
                  className="border-border/70 bg-card/85 shadow-lg shadow-black/5"
                >
                  <CardContent className="flex items-start justify-between gap-4 pt-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {metric.title}
                      </p>
                      <div className="text-3xl font-semibold tracking-tight">
                        {metric.value}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {metric.delta}
                      </p>
                    </div>
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-muted text-foreground">
                      <Icon className="size-5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
            <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
              <CardHeader className="space-y-2">
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>
                  The latest approvals, deliveries, and alerts flowing through
                  the system.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activity.map((item, index) => (
                  <div key={item.label}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-foreground">
                            {item.label}
                          </p>
                          <Badge
                            variant={index === 2 ? "destructive" : "secondary"}
                          >
                            {item.state}
                          </Badge>
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {item.detail}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.time}
                      </p>
                    </div>
                    {index < activity.length - 1 ? (
                      <Separator className="mt-4" />
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
                <CardHeader className="space-y-2">
                  <CardTitle>Quick actions</CardTitle>
                  <CardDescription>
                    Shortcuts for the most common operational tasks.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {shortcuts.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-border/70 bg-background/70 p-4"
                    >
                      <p className="font-medium text-foreground">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
                <CardHeader className="space-y-2">
                  <CardTitle>Facility snapshot</CardTitle>
                  <CardDescription>
                    At-a-glance view of where attention is needed next.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Critical alerts
                      </p>
                      <p className="text-2xl font-semibold">2 wards</p>
                    </div>
                    <Badge variant="destructive">Immediate review</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Backordered items
                      </p>
                      <p className="text-2xl font-semibold">7 items</p>
                    </div>
                    <Badge variant="outline">Pending ETA</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5 lg:col-span-2">
              <CardHeader className="space-y-2">
                <CardTitle>Operational notes</CardTitle>
                <CardDescription>
                  Use this area to keep the team aligned on current issues and
                  priorities.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <Activity className="size-4 text-foreground" />
                  <p className="mt-3 text-sm font-medium">Approvals queue</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Focus on expiring requests before end of day.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <PackageOpen className="size-4 text-foreground" />
                  <p className="mt-3 text-sm font-medium">Receiving desk</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Match delivery slips with counted quantities.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <BarChart3 className="size-4 text-foreground" />
                  <p className="mt-3 text-sm font-medium">Trend check</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Review weekly usage before replenishment planning.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
              <CardHeader className="space-y-2">
                <CardTitle>Next checkpoint</CardTitle>
                <CardDescription>
                  Keep the team on one priority for the next shift.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl bg-muted/60 p-4">
                  <p className="text-sm text-muted-foreground">Focus area</p>
                  <p className="mt-1 text-base font-medium">
                    Emergency stock review
                  </p>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  Use the profile page for account details and the sidebar to
                  navigate back to your dashboard.
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </DashboardPageFrame>
  );
}
