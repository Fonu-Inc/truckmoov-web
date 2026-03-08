import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSupportTickets, SupportTicket, EscalationType } from "@/hooks/useSupportTickets";
import { AdminTicketSheet } from "./AdminTicketSheet";
import { 
  ArrowUpRight, 
  Loader2,
  Building2,
  Wifi,
  Wrench
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const escalationConfig: Record<EscalationType, { label: string; icon: React.ElementType; color: string }> = {
  truckmoov_internal: { label: "Truckmoov Internal", icon: Building2, color: "text-primary" },
  fonu_connectivity: { label: "Fonu Connectivity", icon: Wifi, color: "text-chart-3" },
  vendor_installer: { label: "Vendor / Installer", icon: Wrench, color: "text-chart-5" },
};

export function EscalatedTickets() {
  const { tickets, isLoading } = useSupportTickets();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const escalatedTickets = tickets.filter((t) => t.status === "escalated" || t.escalatedTo);

  // Group by escalation target
  const byTarget = escalatedTickets.reduce((acc, t) => {
    const target = t.escalatedTo || "unknown";
    if (!acc[target]) acc[target] = [];
    acc[target].push(t);
    return acc;
  }, {} as Record<string, SupportTicket[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (escalatedTickets.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ArrowUpRight className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Escalated Tickets</h3>
          <p className="text-sm text-muted-foreground">
            There are currently no tickets that have been escalated to external parties.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(escalationConfig).map(([key, config]) => {
          const count = byTarget[key]?.length || 0;
          const Icon = config.icon;
          return (
            <Card key={key}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Icon className={`h-5 w-5 ${config.color}`} />
                  <Badge variant="outline">{count}</Badge>
                </div>
                <CardTitle className="text-base">{config.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {count === 0 ? "No active escalations" : `${count} ticket${count > 1 ? "s" : ""} pending`}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Grouped Lists */}
      {Object.entries(byTarget).map(([target, targetTickets]) => {
        const config = escalationConfig[target as EscalationType] || {
          label: target,
          icon: ArrowUpRight,
          color: "text-muted-foreground",
        };
        const Icon = config.icon;

        return (
          <Card key={target}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${config.color}`} />
                {config.label}
              </CardTitle>
              <CardDescription>
                {targetTickets.length} escalated ticket{targetTickets.length > 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {targetTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        #{ticket.id.slice(0, 8)} • {ticket.category.replace(/_/g, " ")}
                        {ticket.escalatedReferenceId && (
                          <> • Ref: {ticket.escalatedReferenceId}</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {ticket.escalatedAt
                          ? formatDistanceToNow(new Date(ticket.escalatedAt), { addSuffix: true })
                          : ""}
                      </span>
                      <Badge variant="destructive">Escalated</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <AdminTicketSheet
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
}
