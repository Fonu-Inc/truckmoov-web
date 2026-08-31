import type {
  SupportTicket, SupportTicketPriority, SupportTicketStatus,
} from "@truckmoov/api/auth";
import type {
  FilterField, FilterValues,
} from "@/components/shadcn/table-toolbar";
import type { ExportColumn } from "@/lib/exportTable";
import { useQuery } from "@tanstack/react-query";
import { getSupportTicketsQueryOptions } from "@truckmoov/api/auth";
import {
  debounce, getInitials,
} from "@truckmoov/app-core/utils/general-utils";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
  Eye,
  Loader2,
  MessageSquare,
  Ticket as TicketIcon,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { ExportButton } from "@/components/shadcn/export-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { TableToolbar } from "@/components/shadcn/table-toolbar";
import { TicketDetailSheet } from "./TicketDetailSheet";

const statusConfig: Record<SupportTicketStatus, {
  label: string; variant: "default" | "secondary" | "destructive" | "outline";
}> = {
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

const priorityConfig: Record<SupportTicketPriority, {
  label: string; className: string;
}> = {
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

const statusOptions = Object.entries(statusConfig).map(([
  value,
  config,
]) => ({
  value,
  label: config.label,
}));

const filterFields: FilterField[] = [
  {
    type: "select",
    key: "category",
    label: "Category",
    options: [
      {
        value: "device_tracking", label: "Device & Tracking",
      },
      {
        value: "sim_connectivity", label: "SIM & Connectivity",
      },
      {
        value: "messaging", label: "Messaging",
      },
      {
        value: "billing", label: "Billing",
      },
      {
        value: "billing_subscription", label: "Billing & Subscription",
      },
      {
        value: "account_access", label: "Account / Access",
      },
      {
        value: "compliance", label: "Compliance",
      },
      {
        value: "onboarding", label: "Onboarding",
      },
      {
        value: "other", label: "Other",
      },
      {
        value: "enterprise_enquiry", label: "Enterprise Enquiry",
      },
    ],
  },
  {
    type: "select",
    key: "priority",
    label: "Priority",
    options: Object.entries(priorityConfig).map(([
      value,
      config,
    ]) => ({
      value,
      label: config.label,
    })),
  },
];

function formatCategory(category: string) {
  return category.replace(
    /_/g,
    " ",
  ).replace(
    /\b\w/g,
    letter => letter.toUpperCase(),
  );
}

function shortId(id?: string) {
  return id ? id.slice(
    0,
    8,
  ) : "—";
}

function reporterName(ticket: SupportTicket) {
  return ticket.createdBy ? `User #${shortId(ticket.createdBy)}` : "—";
}

function channelName(ticket: SupportTicket) {
  const channel = ticket.channel ?? ticket.contextType;
  if (!channel || channel === "none")
    return "Web";
  return channel === "messaging" || channel === "whatsapp"
    ? "Messaging"
    : formatCategory(channel);
}

export function MyTickets() {
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");
  const [
    filters,
    setFilters,
  ] = useState<FilterValues>({});
  const [
    selectedTicketId,
    setSelectedTicketId,
  ] = useState<string | null>(null);
  const updateSearch = useMemo(
    () => debounce(
      setDebouncedSearch,
      300,
    ),
    [],
  );

  useEffect(
    () => () => updateSearch.cancel(),
    [updateSearch],
  );

  const query = useMemo(
    () => ({
      params: {
        search: debouncedSearch.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter as SupportTicketStatus,
        category: filters.category?.enabled ? filters.category.value : undefined,
        priority: filters.priority?.enabled
          ? filters.priority.value as SupportTicketPriority
          : undefined,
      },
    }),
    [
      debouncedSearch,
      filters,
      statusFilter,
    ],
  );

  const {
    data, error, isLoading, refetch,
  } = useQuery(getSupportTicketsQueryOptions(query));
  const tickets = data?.data.tickets ?? [];
  const counts = data?.data.countsByStatus;

  const kpis = [
    {
      label: "Total Tickets", value: data?.data.total ?? 0, icon: TicketIcon, accent: "text-foreground",
    },
    {
      label: "Open", value: counts?.open ?? 0, icon: CircleDot, accent: "text-chart-5",
    },
    {
      label: "In Progress", value: counts?.in_progress ?? 0, icon: Loader2, accent: "text-primary",
    },
    {
      label: "Escalated", value: counts?.escalated ?? 0, icon: ArrowUpRight, accent: "text-destructive",
    },
    {
      label: "Closed",
      value: (counts?.resolved ?? 0) + (counts?.closed ?? 0),
      icon: CheckCircle2,
      accent: "text-muted-foreground",
    },
  ];

  const exportColumns: ExportColumn<SupportTicket>[] = [
    {
      header: "Ticket ID", accessor: ticket => ticket.id,
    },
    {
      header: "Title", accessor: ticket => ticket.subject,
    },
    {
      header: "Description", accessor: ticket => ticket.description,
    },
    {
      header: "Reporter", accessor: reporterName,
    },
    {
      header: "Channel", accessor: channelName,
    },
    {
      header: "Category", accessor: ticket => formatCategory(ticket.category),
    },
    {
      header: "Status", accessor: ticket => statusConfig[ticket.status].label,
    },
    {
      header: "Priority", accessor: ticket => priorityConfig[ticket.priority].label,
    },
    {
      header: "Created", accessor: ticket => ticket.createdAt,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">Unable to load support tickets.</p>
          <Button
            variant="link"
            onClick={() => refetch()}
          >
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasFilters = search.trim() || statusFilter !== "all"
    || Object.values(filters).some(filter => filter.enabled);

  return (
    <>
      <div className="space-y-4">
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

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>All Tickets</CardTitle>
                <CardDescription>
                  Browse and track every support ticket logged by your organization.
                </CardDescription>
              </div>
              <ExportButton
                rows={tickets}
                columns={exportColumns}
                filename="support-tickets"
              />
            </div>
            <div className="pt-4">
              <TableToolbar
                search={search}
                onSearchChange={(value) => {
                  setSearch(value);
                  updateSearch(value);
                }}
                searchPlaceholder="Search by ID, title, or description..."
                status={statusFilter}
                onStatusChange={setStatusFilter}
                statusOptions={statusOptions}
                filterEntity="tickets"
                filterFields={filterFields}
                filterValues={filters}
                onFiltersApply={setFilters}
              />
            </div>
          </CardHeader>
          <CardContent>
            {tickets.length === 0
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
                        <TableRow className="hover:bg-transparent">
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
                        {tickets.map((ticket) => {
                          const status = statusConfig[ticket.status];
                          const priority = priorityConfig[ticket.priority];
                          const reporter = reporterName(ticket);
                          return (
                            <TableRow
                              key={ticket.id}
                              className="cursor-pointer border-border/50"
                              onClick={() => setSelectedTicketId(ticket.id)}
                            >
                              <TableCell className="font-mono text-xs">
                                #
                                {shortId(ticket.id)}
                              </TableCell>
                              <TableCell className="font-medium max-w-[200px] truncate">{ticket.subject}</TableCell>
                              <TableCell className="text-sm max-w-[260px] truncate text-muted-foreground">
                                {ticket.description}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                                    {getInitials(reporter)}
                                  </div>
                                  <span className="text-sm truncate">{reporter}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">{channelName(ticket)}</TableCell>
                              <TableCell className="text-sm">{formatCategory(ticket.category)}</TableCell>
                              <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
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
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setSelectedTicketId(ticket.id);
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

      <TicketDetailSheet
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
      />
    </>
  );
}
