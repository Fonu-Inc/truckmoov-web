import type {
  SystemSupportTicketCategory, SystemSupportTicketsQuery,
} from "@truckmoov/api/auth";
import type {
  SupportTicket, TicketStatus,
} from "./AdminTicketSheet";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getSystemSupportTicketsExportQueryOptions,
  getSystemSupportTicketsQueryOptions,
  getSystemSupportTicketSummaryQueryOptions,
} from "@truckmoov/api/auth";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
  Download,
  Eye,
  Loader2,
  MessageSquare,
  Search,
  SlidersHorizontal,
  Ticket as TicketIcon,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { AdminTicketSheet } from "./AdminTicketSheet";
import { toSheetTicket } from "./toSheetTicket";
import { useSupportTenantDirectory } from "./useSupportTenantDirectory";

type TicketPriority = "low" | "medium" | "high" | "critical";

const statusConfig: Record<TicketStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: {
    label: "Open", variant: "default",
  },
  in_progress: {
    label: "In Progress", variant: "secondary",
  },
  waiting_on_tenant: {
    label: "Awaiting Response", variant: "outline",
  },
  escalated: {
    label: "Escalated", variant: "destructive",
  },
  resolved: {
    label: "Resolved", variant: "secondary",
  },
  closed: {
    label: "Closed", variant: "outline",
  },
};

const priorityConfig: Record<TicketPriority, { label: string; className: string }> = {
  low: {
    label: "Low", className: "bg-muted text-muted-foreground",
  },
  medium: {
    label: "Medium", className: "bg-primary/10 text-primary",
  },
  high: {
    label: "High", className: "bg-chart-5/10 text-chart-5",
  },
  critical: {
    label: "Critical", className: "bg-destructive/10 text-destructive",
  },
};

// Not in fleetflow (its Filter button opens nothing) — the popover's category
// field drives the live `category` query param.
const categoryOptions: { value: SystemSupportTicketCategory; label: string }[] = [
  {
    value: "device_tracking", label: "Device Tracking",
  },
  {
    value: "billing", label: "Billing",
  },
  {
    value: "sim_connectivity", label: "Sim Connectivity",
  },
  {
    value: "messaging", label: "Messaging",
  },
  {
    value: "compliance", label: "Compliance",
  },
  {
    value: "onboarding", label: "Onboarding",
  },
  {
    value: "billing_subscription", label: "Billing & Subscription",
  },
  {
    value: "account_access", label: "Account / Access",
  },
  {
    value: "enterprise_enquiry", label: "Enterprise Enquiry",
  },
  {
    value: "other", label: "Other",
  },
];

function channelFromContext(c?: string): string {
  switch (c) {
    case "device": return "Device";
    case "sim": return "SIM";
    case "vehicle": return "Vehicle";
    case "whatsapp": return "WhatsApp";
    case "billing": return "Billing";
    default: return "Web";
  }
}

const formatCategory = (c: string) =>
  c.replace(
    /_/g,
    " ",
  ).replace(
    /\b\w/g,
    l => l.toUpperCase(),
  );

const shortId = (id?: string) => (id
  ? id.slice(
      0,
      8,
    )
  : "—");

const reporterName = (ticket: SupportTicket) => shortId(ticket.createdBy);

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [
    debounced,
    setDebounced,
  ] = useState(value);

  useEffect(
    () => {
      const timeout = window.setTimeout(
        setDebounced,
        delayMs,
        value,
      );
      return () => window.clearTimeout(timeout);
    },
    [
      delayMs,
      value,
    ],
  );

  return debounced;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function AllTickets() {
  const queryClient = useQueryClient();
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<string>("all");
  const [
    pendingStatusFilter,
    setPendingStatusFilter,
  ] = useState("all");
  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("all");
  const [
    pendingCategoryFilter,
    setPendingCategoryFilter,
  ] = useState("all");
  const [
    filterOpen,
    setFilterOpen,
  ] = useState(false);
  const [
    isExporting,
    setIsExporting,
  ] = useState(false);
  const [
    selectedTicket,
    setSelectedTicket,
  ] = useState<SupportTicket | null>(null);
  const debouncedSearch = useDebouncedValue(
    search.trim(),
    350,
  );

  const queryPayload = useMemo<SystemSupportTicketsQuery>(
    () => {
      const params: NonNullable<SystemSupportTicketsQuery["params"]> = {};
      if (debouncedSearch)
        params.search = debouncedSearch;
      if (statusFilter !== "all")
        params.status = statusFilter;
      if (categoryFilter !== "all")
        params.category = categoryFilter as SystemSupportTicketCategory;
      return { params };
    },
    [
      categoryFilter,
      debouncedSearch,
      statusFilter,
    ],
  );

  const summaryQuery = useQuery(getSystemSupportTicketSummaryQueryOptions());
  const ticketsQuery = useQuery({
    ...getSystemSupportTicketsQueryOptions(queryPayload),
    placeholderData: keepPreviousData,
  });
  const {
    tenantName, tenantType,
  } = useSupportTenantDirectory();

  const filteredTickets = useMemo(
    () => (ticketsQuery.data?.data?.tickets ?? []).map(toSheetTicket),
    [ticketsQuery.data],
  );

  const tenantLabel = (ticket: SupportTicket) =>
    tenantName(ticket.tenantId) || `Tenant ${shortId(ticket.tenantId)}`;

  async function handleExport() {
    setIsExporting(true);
    try {
      const blob = await queryClient.fetchQuery(getSystemSupportTicketsExportQueryOptions(queryPayload));
      downloadBlob(
        blob,
        "all_support_tickets.csv",
      );
      toast.success("Support tickets exported");
    }
    catch {
      toast.error("Export failed");
    }
    finally {
      setIsExporting(false);
    }
  }

  if (ticketsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Counts come from the summary endpoint, so they cover every ticket rather than
  // the filtered page. "Open" is fleetflow's "anything not resolved/closed".
  const summary = summaryQuery.data?.data;
  const openCount = (summary?.open ?? 0) + (summary?.inProgress ?? 0) + (summary?.waitingOnTenant ?? 0) + (summary?.escalated ?? 0);
  const closedCount = (summary?.resolved ?? 0) + (summary?.closed ?? 0);

  const kpis = [
    {
      label: "Total Tickets", value: openCount + closedCount, icon: TicketIcon, accent: "text-foreground",
    },
    {
      label: "Open", value: openCount, icon: CircleDot, accent: "text-chart-5",
    },
    {
      label: "In Progress", value: summary?.inProgress ?? 0, icon: Loader2, accent: "text-primary",
    },
    {
      label: "Escalated", value: summary?.escalated ?? 0, icon: ArrowUpRight, accent: "text-destructive",
    },
    {
      label: "Closed", value: closedCount, icon: CheckCircle2, accent: "text-muted-foreground",
    },
  ];

  const hasFilters = !!search || statusFilter !== "all" || categoryFilter !== "all";

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
              {/* Fleetflow's ExportButton, wired to the server CSV export so it covers every matching row. */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
                className="bg-transparent border-input"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
            {/* Toolbar */}
            <div className="flex flex-col gap-2 pt-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, title, tenant, or reporter..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9 border-border bg-transparent font-semibold placeholder:font-normal hover:bg-secondary"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setPendingStatusFilter(value);
                  }}
                >
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
                <Popover
                  open={filterOpen}
                  onOpenChange={setFilterOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 font-semibold"
                    >
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-80 space-y-4"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Only show tickets by...</p>
                      <p className="text-xs text-muted-foreground">
                        {statusFilter === "all" && categoryFilter === "all" ? "No filters applied" : "Filters applied"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Select
                        value={pendingStatusFilter}
                        onValueChange={setPendingStatusFilter}
                      >
                        <SelectTrigger className="h-9 border-border bg-background">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          {Object.entries(statusConfig).map(([
                            value,
                            config,
                          ]) => (
                            <SelectItem
                              key={value}
                              value={value}
                            >
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Category</p>
                      <Select
                        value={pendingCategoryFilter}
                        onValueChange={setPendingCategoryFilter}
                      >
                        <SelectTrigger className="h-9 border-border bg-background">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categoryOptions.map(option => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button
                        className="font-semibold"
                        onClick={() => {
                          setStatusFilter(pendingStatusFilter);
                          setCategoryFilter(pendingCategoryFilter);
                          setFilterOpen(false);
                        }}
                      >
                        Apply
                      </Button>
                      <Button
                        variant="outline"
                        className="font-semibold"
                        onClick={() => {
                          setPendingStatusFilter("all");
                          setStatusFilter("all");
                          setPendingCategoryFilter("all");
                          setCategoryFilter("all");
                          setFilterOpen(false);
                        }}
                      >
                        Show All
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {ticketsQuery.isError
              ? (
                  <div className="py-12 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Unable to load support tickets</h3>
                    <Button
                      variant="link"
                      onClick={() => ticketsQuery.refetch()}
                    >
                      Try again
                    </Button>
                  </div>
                )
              : filteredTickets.length === 0
                ? (
                    <div className="py-12 text-center">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No tickets found</h3>
                      <p className="text-sm text-muted-foreground">
                        {hasFilters ? "Try adjusting your search or filters" : "No support tickets have been logged yet"}
                      </p>
                    </div>
                  )
                : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Tenant</TableHead>
                            <TableHead>Tenant Type</TableHead>
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
                            const status = statusConfig[ticket.status] ?? statusConfig.open;
                            const priority = priorityConfig[ticket.priority as TicketPriority] ?? priorityConfig.medium;
                            const reporter = reporterName(ticket);
                            const initials = reporter
                              .split(" ")
                              .map(p => p[0])
                              .filter(Boolean)
                              .slice(
                                0,
                                2,
                              )
                              .join("")
                              .toUpperCase();
                            return (
                              <TableRow
                                key={ticket.id}
                                className="cursor-pointer"
                                onClick={() => setSelectedTicket(ticket)}
                              >
                                <TableCell className="font-medium max-w-[220px] truncate">{ticket.subject}</TableCell>
                                <TableCell className="text-sm max-w-[180px] truncate">{tenantLabel(ticket)}</TableCell>
                                <TableCell className="text-sm whitespace-nowrap">{tenantType(ticket.tenantId)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                                      {initials || "?"}
                                    </div>
                                    <span className="text-sm truncate">{reporter}</span>
                                  </div>
                                </TableCell>
                                {/* The API records the intake channel; fall back to fleetflow's context mapping. */}
                                <TableCell className="text-sm">{ticket.channel ? formatCategory(ticket.channel) : channelFromContext(ticket.contextType)}</TableCell>
                                <TableCell className="text-sm">{formatCategory(ticket.category)}</TableCell>
                                <TableCell>
                                  <Badge variant={status.variant}>{status.label}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={priority.className}
                                  >
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
