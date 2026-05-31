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
  fleetpro_internal: { label: "FleetPro Internal", icon: Building2, color: "text-primary" },
  fonu_connectivity: { label: "Fonu Connectivity", icon: Wifi, color: "text-chart-3" },
  vendor_installer: { label: "Vendor / Installer", icon: Wrench, color: "text-chart-5" },
};

// Demo escalated tickets — used when there are no real escalations so the screen always reflects platform-level activity
const DEMO_ESCALATED: SupportTicket[] = [
  {
    id: "tkt-30000001-aaaa",
    tenantId: "demo-tenant-lagos",
    category: "device_tracking",
    subject: "GPS tracker firmware crash on TRK-204",
    description: "Device reboots every 15 minutes after firmware push v2.4.1. Affecting 3 vehicles in Apapa cluster.",
    status: "escalated",
    priority: "critical",
    contextType: "device",
    escalatedTo: "vendor_installer",
    escalatedReferenceId: "VND-INC-88421",
    escalationNotes: "Vendor confirmed receipt. Firmware rollback ETA 24h.",
    escalatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    createdBy: "usr-21f4a8c0",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tkt-30000002-bbbb",
    tenantId: "demo-tenant-abuja",
    category: "sim_connectivity",
    subject: "SIM batch stuck in pending activation",
    description: "12 SIMs from latest Fonu provisioning batch failed to activate after 6h.",
    status: "escalated",
    priority: "high",
    contextType: "sim",
    escalatedTo: "fonu_connectivity",
    escalatedReferenceId: "FONU-TKT-50217",
    escalationNotes: "Fonu NOC investigating HLR sync delay.",
    escalatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    createdBy: "usr-9a3b1c44",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tkt-30000003-cccc",
    tenantId: "demo-tenant-portharcourt",
    category: "billing",
    subject: "Wallet top-up reconciliation mismatch",
    description: "₦450,000 MoMo top-up not reflecting after settlement window.",
    status: "escalated",
    priority: "critical",
    contextType: "billing",
    escalatedTo: "fleetpro_internal",
    escalatedReferenceId: "FP-FIN-9981",
    escalationNotes: "Finance team reviewing payment provider reconciliation file.",
    escalatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    createdBy: "usr-55cd0091",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tkt-30000004-dddd",
    tenantId: "demo-tenant-kano",
    category: "messaging",
    subject: "WhatsApp template policy violation",
    description: "Template 'oo_job_offer_v3' rejected by Meta — needs internal compliance review.",
    status: "escalated",
    priority: "medium",
    contextType: "whatsapp",
    escalatedTo: "fleetpro_internal",
    escalatedReferenceId: "FP-COMP-3340",
    escalationNotes: "Compliance team rewriting template variables.",
    escalatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    createdBy: "usr-ab991122",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tkt-30000005-eeee",
    tenantId: "demo-tenant-ibadan",
    category: "device_tracking",
    subject: "Installer wiring fault on new fleet batch",
    description: "5 newly installed devices report constant power loss — suspected wiring issue.",
    status: "escalated",
    priority: "high",
    contextType: "device",
    escalatedTo: "vendor_installer",
    escalatedReferenceId: "VND-INC-88455",
    escalationNotes: "Installer dispatching technician on Friday.",
    escalatedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    createdBy: "usr-31aa55b9",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function EscalatedTickets() {
  const { tickets, isLoading } = useSupportTickets();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const realEscalated = tickets.filter((t) => t.status === "escalated" || t.escalatedTo);
  const escalatedTickets = realEscalated.length > 0 ? realEscalated : DEMO_ESCALATED;

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

  // Lookup helpers — keep escalation rows readable for platform admins
  const TENANT_NAMES: Record<string, string> = {
    "demo-tenant-lagos": "Lagos Express Logistics",
    "demo-tenant-abuja": "Abuja Freight Co.",
    "demo-tenant-portharcourt": "PH Cargo Movers",
    "demo-tenant-kano": "Kano Northern Haulage",
    "demo-tenant-ibadan": "Ibadan Swift Transit",
  };
  const tenantLabel = (id: string) => TENANT_NAMES[id] || `Tenant #${id.slice(0, 8)}`;

  const priorityStyles: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-primary/10 text-primary",
    high: "bg-chart-5/10 text-chart-5",
    critical: "bg-destructive/10 text-destructive",
  };

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
                {targetTickets.length} escalated ticket{targetTickets.length > 1 ? "s" : ""} awaiting action from this party
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {targetTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setSelectedTicket(ticket)}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    {/* Target icon */}
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Main content */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-medium text-sm truncate">{ticket.subject}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="font-mono text-muted-foreground">#{ticket.id.slice(0, 8)}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-foreground">{tenantLabel(ticket.tenantId)}</span>
                        <Badge variant="outline" className={priorityStyles[ticket.priority] ?? ""}>
                          {ticket.priority}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {ticket.category.replace(/_/g, " ")}
                        </Badge>
                        {ticket.escalatedReferenceId && (
                          <Badge variant="outline" className="font-mono">
                            Ref: {ticket.escalatedReferenceId}
                          </Badge>
                        )}
                      </div>

                      {ticket.escalationNotes && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {ticket.escalationNotes}
                        </p>
                      )}
                    </div>

                    {/* Right meta */}
                    <div className="flex flex-col items-end gap-1 shrink-0 text-right">
                      <Badge variant="destructive" className="text-[10px]">Escalated</Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {ticket.escalatedAt
                          ? formatDistanceToNow(new Date(ticket.escalatedAt), { addSuffix: true })
                          : "—"}
                      </span>
                    </div>
                  </button>
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



