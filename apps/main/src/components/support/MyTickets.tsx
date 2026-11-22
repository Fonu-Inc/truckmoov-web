import type { ColumnDef } from "@tanstack/react-table";
import type {
  SupportTicket, SupportTicketPriority, SupportTicketStatus,
} from "@truckmoov/api/auth";
import type {
  FilterField, FilterValues,
} from "@/components/shadcn/table-toolbar";
import {
  useQuery, useQueryClient,
} from "@tanstack/react-query";
import {
  getSupportTicketOptionsQueryOptions,
  getSupportTicketsExportQueryOptions,
  getSupportTicketsQueryOptions,
  getSupportTicketsSummaryQueryOptions,
} from "@truckmoov/api/auth";
import {
  debounce, getInitials,
} from "@truckmoov/app-core/utils/general-utils";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
  Clock,
  Download,
  Eye,
  Loader2,
  MessageSquare,
  Ticket as TicketIcon,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import { Skeleton } from "@/components/shadcn/skeleton";
import { TableToolbar } from "@/components/shadcn/table-toolbar";
import { useSupportTicketLiveUpdates } from "@/hooks/useSupportTicketLiveUpdates";
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

function formatCategory(category: string) {
  return category.replace(
    /_/g,
    " ",
  ).replace(
    /\b\w/g,
    letter => letter.toUpperCase(),
  );
}

function reporterName(ticket: SupportTicket) {
  return ticket.reporterName ?? "Former user";
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
  useSupportTicketLiveUpdates();
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

  const queryClient = useQueryClient();
  const {
    data, error, isLoading, refetch,
  } = useQuery(getSupportTicketsQueryOptions(query));
  const tickets = data?.data.tickets ?? [];
  const summaryQuery = useQuery(getSupportTicketsSummaryQueryOptions());
  const summary = summaryQuery.data?.data;
  const optionsQuery = useQuery(getSupportTicketOptionsQueryOptions());
  const options = optionsQuery.data?.data;

  const kpis = [
    {
      label: "Total Tickets", value: summary?.total ?? 0, icon: TicketIcon, accent: "text-foreground",
    },
    {
      label: "Open", value: summary?.open ?? 0, icon: CircleDot, accent: "text-chart-5",
    },
    {
      label: "In Progress", value: summary?.inProgress ?? 0, icon: Loader2, accent: "text-primary",
    },
    {
      label: "Escalated", value: summary?.escalated ?? 0, icon: ArrowUpRight, accent: "text-destructive",
    },
    {
      label: "Awaiting Response", value: summary?.awaitingResponse ?? 0, icon: Clock, accent: "text-muted-foreground",
    },
    {
      label: "Closed", value: summary?.closed ?? 0, icon: CheckCircle2, accent: "text-muted-foreground",
    },
  ];

  const filterFields: FilterField[] = useMemo(
    () => [
      {
        type: "select",
        key: "category",
        label: "Category",
        options: options?.categories ?? [],
      },
      {
        type: "select",
        key: "priority",
        label: "Priority",
        options: options?.priorities ?? Object.entries(priorityConfig).map(([
          value,
          config,
        ]) => ({
          value, label: config.label,
        })),
      },
    ],
    [options],
  );

  const [
    isExporting,
    setIsExporting,
  ] = useState(false);
  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Export takes only status + search (TRU-FE-10 §E).
      const {
        status, search,
      } = query.params;
      const blob = await queryClient.fetchQuery(getSupportTicketsExportQueryOptions({
        params: {
          status, search,
        },
      }));
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "support-tickets.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
    catch {
      toast.error("Export failed");
    }
    finally {
      setIsExporting(false);
    }
  };

  // No early returns: KPIs, toolbar and table each show their own loading
  // state, so a slow tickets call (or a filter change) never unmounts the
  // search input.
  const hasFilters = search.trim() || statusFilter !== "all"
    || Object.values(filters).some(filter => filter.enabled);

  const ticketColumns: ColumnDef<SupportTicket>[] = [
    {
      id: "id",
      header: "Ticket ID",
      enableSorting: false,
      meta: { className: "font-mono text-xs" },
      cell: ({ row }) => row.original.displayId,
    },
    {
      accessorKey: "subject",
      header: "Title",
      meta: { className: "font-medium max-w-[200px] truncate" },
    },
    {
      accessorKey: "description",
      header: "Message",
      enableSorting: false,
      meta: { className: "text-sm max-w-[260px] truncate text-muted-foreground" },
    },
    {
      id: "reporter",
      header: "Reporter",
      accessorFn: reporterName,
      cell: ({ row }) => {
        const reporter = reporterName(row.original);
        return (
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
              {getInitials(reporter)}
            </div>
            <span className="text-sm truncate">{reporter}</span>
          </div>
        );
      },
    },
    {
      id: "channel",
      header: "Channel",
      accessorFn: channelName,
      meta: { className: "text-sm" },
    },
    {
      accessorKey: "category",
      header: "Category",
      meta: { className: "text-sm" },
      cell: ({ row }) => formatCategory(row.original.category),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = statusConfig[row.original.status];
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = priorityConfig[row.original.priority];
        return (
          <Badge
            variant="outline"
            className={priority.className}
          >
            {priority.label}
          </Badge>
        );
      },
    },
    {
      id: "action",
      header: "Action",
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={(event) => {
            event.stopPropagation();
            setSelectedTicketId(row.original.id);
          }}
        >
          <Eye className="h-4 w-4 mr-1.5" />
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
                    {summaryQuery.isPending
                      ? <Skeleton className="mt-1 h-6 w-10" />
                      : <p className="text-xl font-semibold leading-tight">{summary ? kpi.value : "—"}</p>}
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
                  Browse, filter, and manage every support ticket logged on the platform.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting…" : "Export"}
              </Button>
            </div>
            <div className="pt-4">
              <TableToolbar
                search={search}
                onSearchChange={(value) => {
                  setSearch(value);
                  updateSearch(value);
                }}
                searchPlaceholder="Search by ticket number (#tkt-1000), title, or description..."
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
            {!isLoading && !error && tickets.length === 0
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
                    <DataTable
                      columns={ticketColumns}
                      data={tickets}
                      isLoading={isLoading}
                      isError={!!error}
                      errorMessage="Unable to load support tickets."
                      onRetry={() => void refetch()}
                      onRowClick={ticket => setSelectedTicketId(ticket.id)}
                    />
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
