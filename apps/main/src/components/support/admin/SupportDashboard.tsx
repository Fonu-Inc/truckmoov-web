import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Flame,
  Inbox,
  Loader2,
  TicketCheck,
  Timer,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { Badge } from "@/components/shadcn/badge";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Progress } from "@/components/shadcn/progress";
// Local type alias (hook deleted)
type SupportTicket = any;

// ---------- Demo data (used when no real tickets exist yet) ----------
const DEMO_TICKETS: SupportTicket[] = [
  {
    id: "demo-tkt-001",
    tenantId: "demo-tenant-lagos",
    category: "device_tracking",
    subject: "Tracker offline on truck LAG-204",
    description: "",
    status: "escalated",
    priority: "high",
    contextType: "device",
    createdBy: "demo",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-tkt-002",
    tenantId: "demo-tenant-lagos",
    category: "sim_connectivity",
    subject: "SIM not registering on network",
    description: "",
    status: "open",
    priority: "high",
    contextType: "sim",
    createdBy: "demo",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-tkt-003",
    tenantId: "demo-tenant-abuja",
    category: "messaging",
    subject: "WhatsApp template not sending",
    description: "",
    status: "in_progress",
    priority: "medium",
    contextType: "whatsapp",
    createdBy: "demo",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-tkt-004",
    tenantId: "demo-tenant-abuja",
    category: "billing",
    subject: "Invoice INV-1042 disputed",
    description: "",
    status: "open",
    priority: "medium",
    contextType: "billing",
    createdBy: "demo",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-tkt-005",
    tenantId: "demo-tenant-portharcourt",
    category: "account_access",
    subject: "Manager locked out of dashboard",
    description: "",
    status: "in_progress",
    priority: "critical",
    contextType: "none",
    createdBy: "demo",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-tkt-006",
    tenantId: "demo-tenant-portharcourt",
    category: "device_tracking",
    subject: "Geofence alerts not firing",
    description: "",
    status: "resolved",
    priority: "low",
    contextType: "device",
    createdBy: "demo",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: new Date().toISOString(),
  },
  {
    id: "demo-tkt-007",
    tenantId: "demo-tenant-kano",
    category: "sim_connectivity",
    subject: "SIM data exhausted early",
    description: "",
    status: "resolved",
    priority: "medium",
    contextType: "sim",
    createdBy: "demo",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: new Date().toISOString(),
  },
  {
    id: "demo-tkt-008",
    tenantId: "demo-tenant-kano",
    category: "other",
    subject: "Driver app crashes on launch",
    description: "",
    status: "escalated",
    priority: "high",
    contextType: "none",
    createdBy: "demo",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-tkt-009",
    tenantId: "demo-tenant-ibadan",
    category: "billing",
    subject: "Wallet top-up not credited",
    description: "",
    status: "open",
    priority: "high",
    contextType: "billing",
    createdBy: "demo",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-tkt-010",
    tenantId: "demo-tenant-ibadan",
    category: "messaging",
    subject: "SMS delivery delayed",
    description: "",
    status: "in_progress",
    priority: "low",
    contextType: "whatsapp",
    createdBy: "demo",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEMO_TENANT_NAMES: Record<string, string> = {
  "demo-tenant-lagos": "Lagos Express Logistics",
  "demo-tenant-abuja": "Abuja Freight Co.",
  "demo-tenant-portharcourt": "PH Cargo Movers",
  "demo-tenant-kano": "Kano Northern Haulage",
  "demo-tenant-ibadan": "Ibadan Swift Transit",
};

const CATEGORY_LABELS: Record<string, string> = {
  device_tracking: "Device & Tracking",
  sim_connectivity: "SIM & Connectivity",
  messaging: "Messaging (WhatsApp/SMS)",
  billing: "Billing & Subscription",
  billing_subscription: "Billing & Subscription",
  account_access: "Account Access",
  other: "Other",
};

export function SupportDashboard() {
  const realTickets: any[] = [];
  const isLoading = false;
  const [tenantNames] = useState<Record<string, string>>({});

  // Use real tickets when present, fall back to demo data otherwise
  const tickets: SupportTicket[] = realTickets.length > 0 ? realTickets : DEMO_TICKETS;

  // Tenant names are resolved via the hook in the future; for now use demo map
  const tenantName = (id: string) =>
    tenantNames[id] || DEMO_TENANT_NAMES[id] || `${id.slice(
      0,
      8,
    )}…`;

  const stats = useMemo(
    () => {
      const now = Date.now();
      const HOUR = 1000 * 60 * 60;
      const DAY = HOUR * 24;

      const open = tickets.filter(t => t.status === "open");
      const inProgress = tickets.filter(t => t.status === "in_progress");
      const escalated = tickets.filter(t => t.status === "escalated");
      const waitingTenant = tickets.filter(t => t.status === "waiting_on_tenant");
      const resolved = tickets.filter(
        t => t.status === "resolved" || t.status === "closed",
      );

      const activeWorkload = open.length + inProgress.length + escalated.length;

      const criticalHighOpen = tickets.filter(
        t =>
          [
            "open",
            "in_progress",
            "escalated",
          ].includes(t.status)
          && [
            "critical",
            "high",
          ].includes(t.priority),
      );

      // SLA breach: open/in_progress/escalated for > 24h
      const slaBreaching = tickets.filter(
        t =>
          [
            "open",
            "in_progress",
            "escalated",
          ].includes(t.status)
          && now - new Date(t.createdAt).getTime() > DAY,
      );

      // First-response backlog: still "open" after 2 hours
      const firstResponseBacklog = open.filter(
        t => now - new Date(t.createdAt).getTime() > 2 * HOUR,
      );

      // Resolved in last 7 days (throughput)
      const resolvedLast7d = resolved.filter((t) => {
        const ts = t.resolvedAt ? new Date(t.resolvedAt).getTime() : new Date(t.updatedAt).getTime();
        return now - ts <= 7 * DAY;
      });

      // Avg resolution time (hours) across resolved tickets
      const resolutionTimes = resolved
        .map((t) => {
          const end = t.resolvedAt ? new Date(t.resolvedAt).getTime() : new Date(t.updatedAt).getTime();
          return (end - new Date(t.createdAt).getTime()) / HOUR;
        })
        .filter(h => h > 0 && Number.isFinite(h));
      const avgResolutionHours
        = resolutionTimes.length > 0
          ? resolutionTimes.reduce(
            (a, b) => a + b,
            0,
          ) / resolutionTimes.length
          : 0;

      return {
        open,
        inProgress,
        escalated,
        waitingTenant,
        resolved,
        activeWorkload,
        criticalHighOpen,
        slaBreaching,
        firstResponseBacklog,
        resolvedLast7d,
        avgResolutionHours,
      };
    },
    [tickets],
  );

  const byCategory = useMemo(
    () => {
      const acc: Record<string, number> = {};
      tickets.forEach((t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
      });
      return acc;
    },
    [tickets],
  );
  const totalForBars = Math.max(
    1,
    ...Object.values(byCategory),
  );

  const byTenant = useMemo(
    () => {
      const acc: Record<string, number> = {};
      tickets.forEach((t) => {
        acc[t.tenantId] = (acc[t.tenantId] || 0) + 1;
      });
      return acc;
    },
    [tickets],
  );

  const needsAttention = useMemo(
    () => {
      return [...tickets]
        .filter(t => [
          "open",
          "escalated",
        ].includes(t.status))
        .sort((a, b) => {
          if (a.status === "escalated" && b.status !== "escalated")
            return -1;
          if (b.status === "escalated" && a.status !== "escalated")
            return 1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        })
        .slice(
          0,
          5,
        );
    },
    [tickets],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI cards — operational triage view */}
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
                <Flame className="h-5 w-5" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Critical / High Priority</p>
                <p className="text-2xl font-bold tracking-tight">{stats.criticalHighOpen.length}</p>
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
                <p className="text-2xl font-bold tracking-tight">{stats.slaBreaching.length}</p>
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
                <p className="text-2xl font-bold tracking-tight">{stats.firstResponseBacklog.length}</p>
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
                <p className="text-2xl font-bold tracking-tight">{stats.escalated.length}</p>
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
                <p className="text-2xl font-bold tracking-tight">{stats.waitingTenant.length}</p>
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
                  {stats.avgResolutionHours > 0
                    ? stats.avgResolutionHours < 24
                      ? `${stats.avgResolutionHours.toFixed(1)}h`
                      : `${(stats.avgResolutionHours / 24).toFixed(1)}d`
                    : "—"}
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
                <p className="text-2xl font-bold tracking-tight">{stats.resolvedLast7d.length}</p>
                <p className="text-xs text-muted-foreground">Throughput this week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Needs Attention */}
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
                            {" "}
                            •
                            {" "}
                            {tenantName(ticket.tenantId)}
                            {" "}
                            •
                            {" "}
                            {CATEGORY_LABELS[ticket.category] || ticket.category}
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

        {/* By Category */}
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

        {/* By Tenant */}
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
              {Object.entries(byTenant)
                .sort((a, b) => b[1] - a[1])
                .slice(
                  0,
                  8,
                )
                .map(([
                  tenantId,
                  count,
                ]) => (
                  <div
                    key={tenantId}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <span className="text-sm truncate pr-2">{tenantName(tenantId)}</span>
                    <Badge
                      variant="outline"
                      className="shrink-0"
                    >
                      {count}
                    </Badge>
                  </div>
                ))}
              {Object.keys(byTenant).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4 col-span-full">
                  No tickets yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recently Resolved */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-chart-2" />
              Recently Resolved
            </CardTitle>
            <CardDescription>Latest tickets closed by support</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.resolved.length === 0
              ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No resolved tickets yet
                  </p>
                )
              : (
                  <div className="space-y-3">
                    {[...stats.resolved]
                      .sort(
                        (a, b) =>
                          new Date(b.resolvedAt || b.updatedAt).getTime()
                            - new Date(a.resolvedAt || a.updatedAt).getTime(),
                      )
                      .slice(
                        0,
                        5,
                      )
                      .map(ticket => (
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
                              {" "}
                              •
                              {" "}
                              {tenantName(ticket.tenantId)}
                              {" "}
                              •
                              {" "}
                              {CATEGORY_LABELS[ticket.category] || ticket.category}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className="shrink-0"
                          >
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
