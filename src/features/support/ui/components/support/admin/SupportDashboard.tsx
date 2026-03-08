import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSupportTickets, SupportTicket } from "@/hooks/useSupportTickets";
import { 
  TicketCheck, 
  AlertCircle, 
  Clock, 
  ArrowUpRight,
  TrendingUp,
  Users,
  Loader2
} from "lucide-react";

export function SupportDashboard() {
  const { tickets, isLoading } = useSupportTickets();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Calculate stats
  const openTickets = tickets.filter((t) => t.status === "open");
  const inProgressTickets = tickets.filter((t) => t.status === "in_progress");
  const escalatedTickets = tickets.filter((t) => t.status === "escalated");
  const resolvedToday = tickets.filter((t) => {
    if (!t.resolvedAt) return false;
    const today = new Date();
    const resolved = new Date(t.resolvedAt);
    return resolved.toDateString() === today.toDateString();
  });

  // Group by category
  const byCategory = tickets.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group by tenant
  const byTenant = tickets.reduce((acc, t) => {
    acc[t.tenantId] = (acc[t.tenantId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Recent tickets needing attention
  const needsAttention = tickets
    .filter((t) => ["open", "escalated"].includes(t.status))
    .sort((a, b) => {
      if (a.status === "escalated" && b.status !== "escalated") return -1;
      if (b.status === "escalated" && a.status !== "escalated") return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open Tickets</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {openTickets.length}
              <AlertCircle className="h-6 w-6 text-chart-5" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Awaiting first response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {inProgressTickets.length}
              <Clock className="h-6 w-6 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Being worked on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Escalated</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {escalatedTickets.length}
              <ArrowUpRight className="h-6 w-6 text-destructive" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Requires external action
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resolved Today</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {resolvedToday.length}
              <TrendingUp className="h-6 w-6 text-chart-2" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Successfully closed
            </p>
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
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        #{ticket.id.slice(0, 8)} • {ticket.category.replace(/_/g, " ")}
                      </p>
                    </div>
                    <Badge variant={ticket.status === "escalated" ? "destructive" : "default"}>
                      {ticket.status.replace(/_/g, " ")}
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
            <div className="space-y-3">
              {Object.entries(byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm capitalize">{category.replace(/_/g, " ")}</span>
                    <Badge variant="secondary">{count}</Badge>
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
                .slice(0, 8)
                .map(([tenantId, count]) => (
                  <div
                    key={tenantId}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <span className="text-sm truncate font-mono">
                      {tenantId.slice(0, 8)}...
                    </span>
                    <Badge variant="outline">{count}</Badge>
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
      </div>
    </div>
  );
}
