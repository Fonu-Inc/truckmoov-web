import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useSupportTickets,
  SupportTicket,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  ContextType,
} from "@/hooks/useSupportTickets";
import { AdminTicketSheet } from "./AdminTicketSheet";
import { ExportButton } from "@/components/ui/export-button";
import type { ExportColumn } from "@/lib/exportTable";
import {
  Search,
  CheckCircle2,
  Loader2,
  MessageSquare,
  ArrowUpRight,
  Ticket as TicketIcon,
  CircleDot,
  Eye,
  SlidersHorizontal,
} from "lucide-react";

const statusConfig: Record<TicketStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: { label: "Open", variant: "default" },
  in_progress: { label: "In Progress", variant: "secondary" },
  waiting_on_tenant: { label: "Awaiting Response", variant: "outline" },
  escalated: { label: "Escalated", variant: "destructive" },
  resolved: { label: "Resolved", variant: "secondary" },
  closed: { label: "Closed", variant: "outline" },
};

const priorityConfig: Record<TicketPriority, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", className: "bg-primary/10 text-primary" },
  high: { label: "High", className: "bg-chart-5/10 text-chart-5" },
  critical: { label: "Critical", className: "bg-destructive/10 text-destructive" },
};

const channelFromContext = (c: ContextType): string => {
  switch (c) {
    case "device": return "Device";
    case "sim": return "SIM";
    case "vehicle": return "Vehicle";
    case "whatsapp": return "WhatsApp";
    case "billing": return "Billing";
    default: return "Web";
  }
};

const formatCategory = (c: TicketCategory) =>
  c.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

const shortId = (id?: string) => (id ? id.slice(0, 8) : "—");

type DemoTicket = SupportTicket & { reporterName?: string; tenantName?: string };

const REPORTER_NAMES: Record<string, string> = {
  "usr-21f4a8c0": "Adaeze Okafor",
  "usr-9a3b1c44": "Tunde Bakare",
  "usr-55cd0091": "Chinedu Eze",
  "usr-ab991122": "Funmi Adeyemi",
  "usr-31aa55b9": "Ibrahim Musa",
  "usr-7711eecc": "Kemi Lawal",
  "usr-cc220011": "Oluwaseun Bello",
  "usr-66aa00ee": "Ngozi Uche",
  "usr-aa11bbcc": "Yusuf Sani",
  "usr-12340987": "Blessing Akpan",
};

const TENANT_NAMES: Record<string, string> = {
  "demo-tenant-lagos": "Lagos Express Logistics",
  "demo-tenant-abuja": "Abuja Freight Co.",
  "demo-tenant-portharcourt": "PH Cargo Movers",
  "demo-tenant-kano": "Kano Northern Haulage",
  "demo-tenant-ibadan": "Ibadan Swift Transit",
};

const reporterName = (ticket: DemoTicket) =>
  ticket.reporterName || REPORTER_NAMES[ticket.createdBy] || shortId(ticket.createdBy);

const tenantLabel = (ticket: DemoTicket) =>
  ticket.tenantName || TENANT_NAMES[ticket.tenantId] || `Tenant ${shortId(ticket.tenantId)}`;

// Demo dataset spanning multiple tenants — only used when no real tickets exist
const DEMO_TICKETS: DemoTicket[] = [
  { id: "tkt-20000001-aaaa", tenantId: "demo-tenant-lagos", category: "device_tracking", subject: "GPS tracker offline on TRK-204", description: "Device stopped reporting since 06:42. Last known position Apapa.", status: "open", priority: "high", contextType: "device", createdBy: "usr-21f4a8c0", createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(), updatedAt: new Date().toISOString() },
  { id: "tkt-20000002-bbbb", tenantId: "demo-tenant-lagos", category: "sim_connectivity", subject: "SIM not activating after swap", description: "ICCID 8923440100… stuck in 'pending activation' for 4h.", status: "in_progress", priority: "medium", contextType: "sim", createdBy: "usr-9a3b1c44", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), updatedAt: new Date().toISOString() },
  { id: "tkt-20000003-cccc", tenantId: "demo-tenant-abuja", category: "billing", subject: "Wallet top-up not reflecting", description: "₦250,000 top-up via MoMo not credited to wallet.", status: "escalated", priority: "critical", contextType: "billing", createdBy: "usr-55cd0091", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), updatedAt: new Date().toISOString() },
  { id: "tkt-20000004-dddd", tenantId: "demo-tenant-abuja", category: "messaging", subject: "WhatsApp template rejected", description: "Template 'oo_job_offer_v3' rejected by Meta with policy violation.", status: "waiting_on_tenant", priority: "medium", contextType: "whatsapp", createdBy: "usr-ab991122", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), updatedAt: new Date().toISOString() },
  { id: "tkt-20000005-eeee", tenantId: "demo-tenant-portharcourt", category: "account_access", subject: "Manager locked out of dashboard", description: "Operations manager unable to log in after password reset.", status: "in_progress", priority: "critical", contextType: "none", createdBy: "usr-31aa55b9", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), updatedAt: new Date().toISOString() },
  { id: "tkt-20000006-ffff", tenantId: "demo-tenant-portharcourt", category: "device_tracking", subject: "Geofence alerts not firing", description: "Geofence Apapa-Port created but no entry/exit alerts received.", status: "resolved", priority: "low", contextType: "device", createdBy: "usr-7711eecc", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), updatedAt: new Date().toISOString(), resolvedAt: new Date().toISOString() },
  { id: "tkt-20000007-0000", tenantId: "demo-tenant-kano", category: "sim_connectivity", subject: "SIM data exhausted early", description: "5GB plan consumed in 2 days — possible misuse.", status: "resolved", priority: "medium", contextType: "sim", createdBy: "usr-cc220011", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(), updatedAt: new Date().toISOString(), resolvedAt: new Date().toISOString() },
  { id: "tkt-20000008-1111", tenantId: "demo-tenant-kano", category: "other", subject: "Driver app crashes on launch", description: "Latest mobile app build crashes on Android 12 devices.", status: "escalated", priority: "high", contextType: "none", createdBy: "usr-66aa00ee", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), updatedAt: new Date().toISOString() },
  { id: "tkt-20000009-2222", tenantId: "demo-tenant-ibadan", category: "billing", subject: "Wallet top-up not credited", description: "Bank transfer of ₦100k not reflecting in wallet.", status: "open", priority: "high", contextType: "billing", createdBy: "usr-aa11bbcc", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), updatedAt: new Date().toISOString() },
  { id: "tkt-20000010-3333", tenantId: "demo-tenant-ibadan", category: "messaging", subject: "SMS delivery delayed", description: "Bulk SMS notifications taking >10 min to deliver.", status: "in_progress", priority: "low", contextType: "whatsapp", createdBy: "usr-12340987", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), updatedAt: new Date().toISOString() },
];

export function AllTickets() {
  const { tickets: realTickets, isLoading } = useSupportTickets();
  const tickets: DemoTicket[] = realTickets.length > 0 ? realTickets : DEMO_TICKETS;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const filteredTickets = tickets.filter((ticket) => {
    const q = search.toLowerCase();
    const matchesSearch =
      ticket.subject.toLowerCase().includes(q) ||
      ticket.description.toLowerCase().includes(q) ||
      ticket.id.toLowerCase().includes(q) ||
      tenantLabel(ticket).toLowerCase().includes(q) ||
      reporterName(ticket).toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "open" && !["resolved", "closed"].includes(ticket.status)) ||
      (statusFilter === "closed" && ["resolved", "closed"].includes(ticket.status)) ||
      ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => !["resolved", "closed"].includes(t.status)).length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const escalatedCount = tickets.filter((t) => t.status === "escalated").length;
  const closedCount = tickets.filter((t) => ["resolved", "closed"].includes(t.status)).length;

  const kpis = [
    { label: "Total Tickets", value: totalCount, icon: TicketIcon, accent: "text-foreground" },
    { label: "Open", value: openCount, icon: CircleDot, accent: "text-chart-5" },
    { label: "In Progress", value: inProgressCount, icon: Loader2, accent: "text-primary" },
    { label: "Escalated", value: escalatedCount, icon: ArrowUpRight, accent: "text-destructive" },
    { label: "Closed", value: closedCount, icon: CheckCircle2, accent: "text-muted-foreground" },
  ];

  const exportColumns: ExportColumn<DemoTicket>[] = [
    { header: "Ticket ID", accessor: (r) => r.id },
    { header: "Title", accessor: (r) => r.subject },
    { header: "Tenant", accessor: (r) => tenantLabel(r) },
    { header: "Reporter", accessor: (r) => reporterName(r) },
    { header: "Channel", accessor: (r) => channelFromContext(r.contextType) },
    { header: "Category", accessor: (r) => formatCategory(r.category) },
    { header: "Status", accessor: (r) => statusConfig[r.status]?.label ?? r.status },
    { header: "Priority", accessor: (r) => priorityConfig[r.priority]?.label ?? r.priority },
    { header: "Created", accessor: (r) => new Date(r.createdAt).toISOString() },
  ];

  return (
    <>
      <div className="space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                    <Icon className={`h-4 w-4 ${kpi.accent}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
                    <p className="text-xl font-semibold leading-tight">{kpi.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* All Tickets Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>All Tickets</CardTitle>
                <CardDescription>
                  Tickets logged by tenants across the platform. Click any row to review, edit, or escalate.
                </CardDescription>
              </div>
              <ExportButton
                rows={filteredTickets}
                columns={exportColumns}
                filename="all_support_tickets"
              />
            </div>
            {/* Toolbar */}
            <div className="flex flex-col gap-2 pt-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, title, tenant, or reporter..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 border-border bg-transparent font-semibold placeholder:font-normal hover:bg-secondary"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-[160px] border-border bg-transparent font-semibold hover:bg-secondary">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="waiting_on_tenant">Awaiting Response</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-9 font-semibold">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTickets.length === 0 ? (
              <div className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No tickets found</h3>
                <p className="text-sm text-muted-foreground">
                  {search ? "Try adjusting your search or filters" : "No support tickets have been logged yet"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => {
                      const status = statusConfig[ticket.status];
                      const priority = priorityConfig[ticket.priority];
                      const reporter = reporterName(ticket);
                      const initials = reporter
                        .split(" ")
                        .map((p) => p[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();
                      return (
                        <TableRow
                          key={ticket.id}
                          className="cursor-pointer"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <TableCell className="font-mono text-xs">#{shortId(ticket.id)}</TableCell>
                          <TableCell className="font-medium max-w-[220px] truncate">{ticket.subject}</TableCell>
                          <TableCell className="text-sm max-w-[180px] truncate">{tenantLabel(ticket)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                                {initials || "?"}
                              </div>
                              <span className="text-sm truncate">{reporter}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{channelFromContext(ticket.contextType)}</TableCell>
                          <TableCell className="text-sm">{formatCategory(ticket.category)}</TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={priority.className}>
                              {priority.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTicket(ticket);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1.5" />
                              Manage
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin sheet — full edit + escalate powers */}
      <AdminTicketSheet
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </>
  );
}
