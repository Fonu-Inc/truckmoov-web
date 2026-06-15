import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemSupportDashboardQueryOptions,
  getSystemSupportTicketsQueryOptions,
} from "@truckmoov/api/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Badge } from "@/components/shadcn/badge";
import { Progress } from "@/components/shadcn/progress";
import {
  TicketCheck,
  AlertCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Users,
  CheckCircle2,
  Loader2,
  Inbox,
  UserCheck,
  CircleDot,
} from "lucide-react";

interface SupportTicket {
  id: string;
  tenantId: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  contextType: string;
  escalatedTo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  contextSnapshot?: Record<string, unknown>;
}

const CATEGORY_LABELS: Record<string, string> = {
  device_tracking: "Device & Tracking",
  sim_connectivity: "SIM & Connectivity",
  messaging: "Messaging (WhatsApp/SMS)",
  billing: "Billing & Subscription",
  billing_subscription: "Billing & Subscription",
  account_access: "Account Access",
  other: "Other",
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readString = (source: Record<string, unknown> | null, key: string): string | undefined => {
  const value = source?.[key];
  return typeof value === "string" && value.trim() ? value : undefined;
};

const readNestedString = (source: Record<string, unknown> | null, path: string[]): string | undefined => {
  let current: unknown = source;
  for (const key of path) {
    current = asRecord(current)?.[key];
  }
  return typeof current === "string" && current.trim() ? current : undefined;
};

const extractRawTickets = (response: unknown): Record<string, unknown>[] => {
  const root = asRecord(response);
  const data = root?.data;
  if (Array.isArray(data)) return data.map(asRecord).filter(Boolean) as Record<string, unknown>[];

  const dataRecord = asRecord(data);
  const candidates = [dataRecord?.tickets, dataRecord?.items, dataRecord?.rows, dataRecord?.data];
  const match = candidates.find(Array.isArray);
  return Array.isArray(match) ? (match.map(asRecord).filter(Boolean) as Record<string, unknown>[]) : [];
};

const normalizeTicket = (raw: Record<string, unknown>): SupportTicket => ({
  id: readString(raw, "id") ?? readString(raw, "ticketId") ?? "",
  tenantId: readString(raw, "tenantId") ?? readNestedString(raw, ["tenant", "id"]) ?? "",
  category: readString(raw, "category") ?? "other",
  subject: readString(raw, "subject") ?? readString(raw, "title") ?? "Untitled ticket",
  description: readString(raw, "description") ?? readString(raw, "content") ?? "",
  status: readString(raw, "status") ?? "open",
  priority: readString(raw, "priority") ?? "medium",
  contextType: readString(raw, "contextType") ?? readString(raw, "channel") ?? "none",
  escalatedTo: readString(raw, "escalatedTo"),
  createdBy: readString(raw, "createdBy") ?? readNestedString(raw, ["reporter", "id"]) ?? "",
  createdAt: readString(raw, "createdAt") ?? new Date().toISOString(),
  updatedAt: readString(raw, "updatedAt") ?? new Date().toISOString(),
  resolvedAt: readString(raw, "resolvedAt"),
  contextSnapshot: asRecord(raw.contextSnapshot) ?? undefined,
});

export function SupportDashboard() {
  const dashboardQuery = useQuery(getSystemSupportDashboardQueryOptions());
  const ticketsQuery = useQuery(getSystemSupportTicketsQueryOptions());
  const isLoading = dashboardQuery.isLoading || ticketsQuery.isLoading;

  const [tenantNames] = useState<Record<string, string>>({});

  const tickets = useMemo(
    () => extractRawTickets(ticketsQuery.data).map(normalizeTicket).filter((ticket) => ticket.id),
    [ticketsQuery.data],
  );

  const dashboard = dashboardQuery.data?.data;

  const tenantName = (id: string) => tenantNames[id] || `${id.slice(0, 8)}...`;

  const stats = useMemo(() => {
    const open = dashboard?.open ?? 0;
    const inProgress = dashboard?.inProgress ?? 0;
    const escalated = dashboard?.escalated ?? 0;
    const waitingOnTenant = dashboard?.waitingOnTenant ?? 0;
    const resolved = dashboard?.resolved ?? 0;
    const closed = dashboard?.closed ?? 0;
    const resolvedToday = dashboard?.resolvedToday ?? 0;

    return {
      open,
      inProgress,
      escalated,
      waitingOnTenant,
      resolved,
      closed,
      resolvedToday,
      activeWorkload: open + inProgress + escalated,
    };
  }, [dashboard]);

  const byCategory = useMemo(() => dashboard?.byCategory ?? {}, [dashboard]);
  const totalForBars = Math.max(1, ...Object.values(byCategory));

  const topTenants = useMemo(
    () =>
      (dashboard?.topTenants ?? [])
        .map((tenant) => ({
          tenantId: readString(tenant, "tenantId") ?? readString(tenant, "id") ?? "",
          tenantName: readString(tenant, "tenantName") ?? readString(tenant, "name"),
          count: Number(tenant.count ?? 0),
        }))
        .filter((tenant) => tenant.tenantId || tenant.tenantName),
    [dashboard],
  );

  const needsAttention = useMemo(() => {
    return [...tickets]
      .filter((t) => ["open", "escalated"].includes(t.status))
      .sort((a, b) => {
        if (a.status === "escalated" && b.status !== "escalated") return -1;
        if (b.status === "escalated" && a.status !== "escalated") return 1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      })
      .slice(0, 5);
  }, [tickets]);

  const recentlyResolved = useMemo(() => {
    return [...tickets]
      .filter((ticket) => ticket.status === "resolved" || ticket.status === "closed")
      .sort(
        (a, b) =>
          new Date(b.resolvedAt || b.updatedAt).getTime() -
          new Date(a.resolvedAt || a.updatedAt).getTime(),
      )
      .slice(0, 5);
  }, [tickets]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="rounded-lg p-2.5 bg-primary/10 text-primary shrink-0">
                <Inbox className="h-5 w-5" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Active Workload</p>
                <p className="text-2xl font-bold tracking-tight">{stats.activeWorkload}</p>
                <p className="text-xs text-muted-foreground">Open + In Progress + Escalated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="rounded-lg p-2.5 bg-destructive/10 text-destructive shrink-0">
                <CircleDot className="h-5 w-5" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Open</p>
                <p className="text-2xl font-bold tracking-tight">{stats.open}</p>
                <p className="text-xs text-muted-foreground">New support requests</p>
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
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold tracking-tight">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">Currently being handled</p>
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
                <p className="text-sm font-medium text-muted-foreground">Escalated</p>
                <p className="text-2xl font-bold tracking-tight">{stats.escalated}</p>
                <p className="text-xs text-muted-foreground">Routed to vendor / engineering</p>
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
                <p className="text-sm font-medium text-muted-foreground">Awaiting Tenant</p>
                <p className="text-2xl font-bold tracking-tight">{stats.waitingOnTenant}</p>
                <p className="text-xs text-muted-foreground">Pending customer info</p>
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
                <p className="text-sm font-medium text-muted-foreground">Resolved Today</p>
                <p className="text-2xl font-bold tracking-tight">{stats.resolvedToday}</p>
                <p className="text-xs text-muted-foreground">Tickets resolved today</p>
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
                <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold tracking-tight">{stats.resolved}</p>
                <p className="text-xs text-muted-foreground">Resolved ticket total</p>
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
                <p className="text-sm font-medium text-muted-foreground">Closed</p>
                <p className="text-2xl font-bold tracking-tight">{stats.closed}</p>
                <p className="text-xs text-muted-foreground">Closed ticket total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-chart-5" />
              Needs Attention
            </CardTitle>
            <CardDescription>Tickets requiring immediate action</CardDescription>
          </CardHeader>
          <CardContent>
            {needsAttention.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                All caught up! No urgent tickets.
              </p>
            ) : (
              <div className="space-y-3">
                {needsAttention.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="font-medium text-sm truncate">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        #{ticket.id.slice(0, 8)} - {tenantName(ticket.tenantId)} -{" "}
                        {CATEGORY_LABELS[ticket.category] || ticket.category}
                      </p>
                    </div>
                    <Badge
                      variant={ticket.status === "escalated" ? "destructive" : "default"}
                      className="shrink-0 capitalize"
                    >
                      {ticket.status.replace(/_/g, " ")}
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
                .map(([category, count]) => (
                  <div key={category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span>{CATEGORY_LABELS[category] || category.replace(/_/g, " ")}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                    <Progress value={(count / totalForBars) * 100} className="h-1.5" />
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
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
              {topTenants.slice(0, 8).map(({ tenantId, tenantName: name, count }) => (
                <div
                  key={tenantId || name}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <span className="text-sm truncate pr-2">{name || tenantName(tenantId)}</span>
                  <Badge variant="outline" className="shrink-0">
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
            {recentlyResolved.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No resolved tickets yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentlyResolved.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="font-medium text-sm truncate">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        #{ticket.id.slice(0, 8)} - {tenantName(ticket.tenantId)} -{" "}
                        {CATEGORY_LABELS[ticket.category] || ticket.category}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      Resolved
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
