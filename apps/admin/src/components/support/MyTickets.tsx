import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/shadcn/card";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { TicketDetailSheet } from "./TicketDetailSheet";
import { ExportButton } from "@/components/shadcn/export-button";
import type { ExportColumn } from "@/lib/exportTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import {
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  ArrowUpRight,
  Ticket as TicketIcon,
  CircleDot,
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
  SlidersHorizontal,
} from "lucide-react";

type TicketStatus = "open" | "in_progress" | "waiting_on_tenant" | "escalated" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "critical";
type TicketCategory = string;
type ContextType = "device" | "sim" | "vehicle" | "whatsapp" | "billing" | "none" | string;

interface SupportTicket {
  id: string;
  tenantId: string;
  category: TicketCategory;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  contextType: ContextType;
  escalatedTo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  reporterName?: string;
}

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

type DemoTicket = SupportTicket & { reporterName?: string };

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

const reporterName = (ticket: SupportTicket & { reporterName?: string }) =>
  ticket.reporterName || REPORTER_NAMES[ticket.createdBy] || shortId(ticket.createdBy);

export function MyTickets() {
  // Inline defaults — useSupportTickets hook deleted
  const tickets: SupportTicket[] = [];
  const isLoading = false;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
      ticket.description.toLowerCase().includes(search.toLowerCase()) ||
      ticket.id.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "open" && !["resolved", "closed"].includes(ticket.status)) ||
      (statusFilter === "closed" && ["resolved", "closed"].includes(ticket.status)) ||
      ticket.status === statusFilter;

    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    const matchesCategory = categoryFilter === "all" || ticket.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
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
  const closedCount = tickets.filter((t) => ["resolved", "closed"].includes(t.status)).length;
  const escalatedCount = tickets.filter((t) => t.status === "escalated").length;

  const kpis = [
    { label: "Total Tickets", value: totalCount, icon: TicketIcon, accent: "text-foreground" },
    { label: "Open", value: openCount, icon: CircleDot, accent: "text-chart-5" },
    { label: "In Progress", value: inProgressCount, icon: Loader2, accent: "text-primary" },
    { label: "Escalated", value: escalatedCount, icon: ArrowUpRight, accent: "text-destructive" },
    { label: "Closed", value: closedCount, icon: CheckCircle2, accent: "text-muted-foreground" },
  ];

  const exportColumns: ExportColumn<DemoTicket>[] = [
    { header: "Ticket ID", accessor: (t) => t.id },
    { header: "Title", accessor: (t) => t.subject },
    { header: "Description", accessor: (t) => t.description },
    { header: "Reporter", accessor: (t) => reporterName(t) },
    { header: "Channel", accessor: (t) => channelFromContext(t.contextType) },
    { header: "Category", accessor: (t) => formatCategory(t.category) },
    { header: "Status", accessor: (t) => statusConfig[t.status].label },
    { header: "Priority", accessor: (t) => priorityConfig[t.priority].label },
    { header: "Created", accessor: (t) => new Date(t.createdAt).toISOString() },
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>All Tickets</CardTitle>
                <CardDescription>
                  Browse, filter, and manage every support ticket logged on the platform.
                </CardDescription>
              </div>
              <ExportButton
                rows={filteredTickets}
                columns={exportColumns}
                filename="support-tickets"
              />
            </div>
            {/* Toolbar */}
            <div className="flex flex-col gap-3 pt-4 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, title, or description..."
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
                      <TableHead>Message</TableHead>
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
                      const reporter = reporterName(ticket as DemoTicket);
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
                          <TableCell className="font-medium max-w-[200px] truncate">{ticket.subject}</TableCell>
                          <TableCell className="text-sm max-w-[260px] truncate text-muted-foreground">
                            {ticket.description}
                          </TableCell>
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
                              View
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

      {/* Ticket Detail Sheet */}
      <TicketDetailSheet
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </>
  );
}


