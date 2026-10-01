import type { SystemSupportTicket } from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import { getSystemSupportDashboardQueryOptions } from "@truckmoov/api/auth";
import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Flame,
  Inbox,
  TicketCheck,
  Timer,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/shadcn/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Progress } from "@/components/shadcn/progress";
import { Skeleton } from "@/components/shadcn/skeleton";
import { ListSkeleton } from "@/components/ui/skeletons";

const CATEGORY_LABELS: Record<string, string> = {
  device_tracking: "Device & Tracking",
  sim_connectivity: "SIM & Connectivity",
  messaging: "Messaging (WhatsApp/SMS)",
  billing: "Billing & Subscription",
  billing_subscription: "Billing & Subscription",
  account_access: "Account Access",
  compliance: "Compliance",
  onboarding: "Onboarding",
  enterprise_enquiry: "Enterprise Enquiry",
  other: "Other",
};

// TRU-FE-10 §F: `null` means nothing has resolved yet — don't show it as "0h"
// (that reads as instant resolution). Zero is a legitimate value.
function formatResolutionHours(hrs: number | null): string {
  if (hrs === null || hrs === undefined)
    return "—";
  if (hrs < 1)
    return `${Math.round(hrs * 60)}m`;
  if (hrs < 24)
    return `${hrs.toFixed(1)}h`;
  return `${(hrs / 24).toFixed(1)}d`;
}

function SupportDashboardSkeleton() {
  return (
    <div
      className="space-y-6"
      aria-hidden
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from(
          { length: 8 },
          (_, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-7 w-1/3" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ),
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from(
          { length: 2 },
          (_, index) => (
            <Card key={index}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent>
                <ListSkeleton rows={3} />
              </CardContent>
            </Card>
          ),
        )}
      </div>
    </div>
  );
}

export function SupportDashboard() {
  const dashboardQuery = useQuery(getSystemSupportDashboardQueryOptions());
  const isLoading = dashboardQuery.isLoading;

  const dashboard = dashboardQuery.data?.data;

  const needsAttention: SystemSupportTicket[] = dashboard?.needsAttention ?? [];
  const recentlyResolved: SystemSupportTicket[] = dashboard?.recentlyResolved ?? [];

  const tenantName = (id: string) => `${id.slice(
    0,
    8,
  )}…`;

  const byCategory = useMemo(
    () => dashboard?.byCategory ?? {},
    [dashboard],
  );
  const totalForBars = Math.max(
    1,
    ...Object.values(byCategory),
  );

  const topTenants = dashboard?.topTenants ?? [];

  if (isLoading) {
    return <SupportDashboardSkeleton />;
  }

  if (dashboardQuery.isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium">Unable to Load Support Dashboard</h3>
          <p className="text-sm text-muted-foreground">
            The support dashboard stats could not be loaded right now.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ponytail: 4-col at lg, 2 rows of 4 (mirrors fleetflow-pro reference). */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="rounded-lg p-2.5 bg-primary/10 text-primary shrink-0">
                <Inbox className="h-5 w-5" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Active Workload</p>
                <p className="text-2xl font-bold tracking-tight">{dashboard?.activeWorkload ?? 0}</p>
                <p className="text-xs text-muted-foreground">Open + In Progress + Escalated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="rounded-lg p-2.5 bg-destructive/10 text-destructive shrink-0">
                <Flame className="h-5 w-5" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Critical / High Priority</p>
                <p className="text-2xl font-bold tracking-tight">{dashboard?.criticalHigh ?? 0}</p>
                <p className="text-xs text-muted-foreground">Unresolved, top-priority tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="rounded-lg p-2.5 bg-chart-5/10 text-chart-5 shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">SLA Breaching</p>
                <p className="text-2xl font-bold tracking-tight">{dashboard?.slaBreaching ?? 0}</p>
                <p className="text-xs text-muted-foreground">Unresolved &gt; 24 hours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="rounded-lg p-2.5 bg-chart-5/10 text-chart-5 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">First-Response Backlog</p>
                <p className="text-2xl font-bold tracking-tight">{dashboard?.firstResponseBacklog ?? 0}</p>
                <p className="text-xs text-muted-foreground">Open with no reply &gt; 2h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="rounded-lg p-2.5 bg-destructive/10 text-destructive shrink-0">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Escalated</p>
                <p className="text-2xl font-bold tracking-tight">{dashboard?.escalated ?? 0}</p>
                <p className="text-xs text-muted-foreground">Routed to vendor / engineering</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="rounded-lg p-2.5 bg-primary/10 text-primary shrink-0">
                <UserCheck className="h-5 w-5" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Awaiting Tenant</p>
                <p className="text-2xl font-bold tracking-tight">{dashboard?.awaitingTenant ?? 0}</p>
                <p className="text-xs text-muted-foreground">Pending customer info</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="rounded-lg p-2.5 bg-chart-2/10 text-chart-2 shrink-0">
                <Timer className="h-5 w-5" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Avg Resolution Time</p>
                <p className="text-2xl font-bold tracking-tight">
                  {formatResolutionHours(dashboard?.avgResolutionHours ?? null)}
                </p>
                <p className="text-xs text-muted-foreground">From open to resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="rounded-lg p-2.5 bg-chart-2/10 text-chart-2 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Resolved (Last 7d)</p>
                <p className="text-2xl font-bold tracking-tight">{dashboard?.resolvedLast7Days ?? 0}</p>
                <p className="text-xs text-muted-foreground">Throughput this week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ponytail: `[&>*]:min-w-0` lets grid tracks shrink below their
          content min-width — without it, a card's truncated text still counts
          as full min-content, so a long ticket title inflates the column past
          the viewport on mobile. */}
      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-chart-5" />
              Needs Attention
            </CardTitle>
            <CardDescription>Tickets requiring immediate action</CardDescription>
          </CardHeader>
          <CardContent>
            {needsAttention.length === 0
              ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    All caught up! No urgent tickets.
                  </p>
                )
              : (
                  <div className="space-y-3">
                    {needsAttention.map(ticket => (
                      <div
                        key={ticket.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div className="min-w-0 pr-3">
                          <p className="font-medium text-sm truncate">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            #
                            {ticket.id.slice(
                              0,
                              8,
                            )}
                            {" • "}
                            {tenantName(ticket.tenantId)}
                            {" • "}
                            {CATEGORY_LABELS[ticket.category] || ticket.category}
                            {" • opened "}
                            {formatRelative(ticket.createdAt)}
                          </p>
                        </div>
                        <Badge
                          variant={ticket.status === "escalated" ? "destructive" : "default"}
                          className="shrink-0 capitalize"
                        >
                          {ticket.status.replace(
                            /_/g,
                            " ",
                          )}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TicketCheck className="h-5 w-5" />
              Tickets by Category
            </CardTitle>
            <CardDescription>Distribution across issue types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([
                  category,
                  count,
                ]) => (
                  <div
                    key={category}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {CATEGORY_LABELS[category] || category.replace(
                          /_/g,
                          " ",
                        )}
                      </span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                    <Progress
                      value={(count / totalForBars) * 100}
                      className="h-1.5"
                    />
                  </div>
                ))}
              {Object.keys(byCategory).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tickets yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Tickets by Tenant
            </CardTitle>
            <CardDescription>Support load distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {topTenants.slice(
                0,
                8,
              ).map(({
                tenantId,
                count,
              }) => (
                <div
                  key={tenantId}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <span
                    className="text-sm truncate pr-2"
                    title={tenantId}
                  >
                    {tenantName(tenantId)}
                  </span>
                  <Badge
                    variant="outline"
                    className="shrink-0"
                  >
                    {count}
                  </Badge>
                </div>
              ))}
              {topTenants.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4 col-span-full">
                  No tickets yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-chart-2" />
              Recently Resolved
            </CardTitle>
            <CardDescription>Latest tickets closed by support</CardDescription>
          </CardHeader>
          <CardContent>
            {recentlyResolved.length === 0
              ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No resolved tickets yet
                  </p>
                )
              : (
                  <div className="space-y-3">
                    {recentlyResolved.map(ticket => (
                      <div
                        key={ticket.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div className="min-w-0 pr-3">
                          <p className="font-medium text-sm truncate">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            #
                            {ticket.id.slice(
                              0,
                              8,
                            )}
                            {" • "}
                            {tenantName(ticket.tenantId)}
                            {" • "}
                            {CATEGORY_LABELS[ticket.category] || ticket.category}
                            {" • "}
                            {formatRelative(ticket.closedAt ?? ticket.resolvedAt)}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="shrink-0"
                        >
                          {ticket.status === "closed" ? "Closed" : "Resolved"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
