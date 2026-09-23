import type { ColumnDef } from "@tanstack/react-table";
import type {
  SystemSupportTicketCategory, SystemSupportTicketsQuery,
} from "@truckmoov/api/auth";
import type { ReactNode } from "react";
import type { SupportTicket } from "./AdminTicketSheet";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getSystemSupportTicketsExportQueryOptions,
  getSystemSupportTicketsQueryOptions,
  getSystemSupportTicketSummaryQueryOptions,
} from "@truckmoov/api/auth";
import { getInitials } from "@truckmoov/app-core/utils/general-utils";

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
import { DataTable } from "@/components/shadcn/data-table";
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
import { AdminTicketSheet } from "./AdminTicketSheet";
import { toSheetTicket } from "./toSheetTicket";

type TicketStatus = "open" | "in_progress" | "waiting_on_tenant" | "escalated" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "critical";
type TicketCategory = SystemSupportTicketCategory;
type TicketRow = SupportTicket & {
  tenantName?: string;
  reporterName?: string;
};

const statusConfig: Record<TicketStatus, {
  label: string;
  className: string;
}> = {
  open: {
    label: "Open",
    className: "border-transparent bg-primary text-primary-foreground",
  },
  in_progress: {
    label: "In Progress",
    className: "border-transparent bg-secondary text-secondary-foreground",
  },
  waiting_on_tenant: {
    label: "Awaiting Response",
    className: "border-border bg-transparent text-foreground",
  },
  escalated: {
    label: "Escalated",
    className: "border-transparent bg-destructive text-destructive-foreground",
  },
  resolved: {
    label: "Resolved",
    className: "border-transparent bg-secondary text-secondary-foreground",
  },
  closed: {
    label: "Closed",
    className: "border-border bg-transparent text-muted-foreground",
  },
};

const priorityConfig: Record<TicketPriority, {
  label: string;
  className: string;
}> = {
  low: {
    label: "Low",
    className: "border-border bg-secondary/50 text-muted-foreground",
  },
  medium: {
    label: "Medium",
    className: "border-transparent bg-primary/10 text-primary",
  },
  high: {
    label: "High",
    className: "border-transparent bg-destructive/10 text-destructive",
  },
  critical: {
    label: "Critical",
    className: "border-destructive/20 bg-destructive/10 text-destructive",
  },
};

const categoryOptions: {
  value: TicketCategory;
  label: string;
}[] = [
  {
    value: "device_tracking",
    label: "Device Tracking",
  },
  {
    value: "billing",
    label: "Billing",
  },
  {
    value: "sim_connectivity",
    label: "Sim Connectivity",
  },
  {
    value: "messaging",
    label: "Messaging",
  },
  {
    value: "compliance",
    label: "Compliance",
  },
  {
    value: "onboarding",
    label: "Onboarding",
  },
  {
    value: "billing_subscription",
    label: "Billing & Subscription",
  },
  {
    value: "account_access",
    label: "Account / Access",
  },
  {
    value: "enterprise_enquiry",
    label: "Enterprise Enquiry",
  },
  {
    value: "other",
    label: "Other",
  },
];

function titleCase(value: string) {
  return value
    .replace(
      /_/g,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim()
    .replace(
      /\b\w/g,
      letter => letter.toUpperCase(),
    );
}

function shortId(id: string) {
  return id.slice(
    0,
    8,
  );
}

function channelFromContext(value?: string) {
  switch (value) {
    case "device":
      return "Device";
    case "sim":
      return "SIM";
    case "vehicle":
      return "Vehicle";
    case "whatsapp":
      return "WhatsApp";
    case "billing":
      return "Billing";
    default:
      return "Web";
  }
}

const tenantLabel = (ticket: TicketRow) => ticket.tenantName || `Tenant ${shortId(ticket.tenantId || ticket.id)}`;
const reporterLabel = (ticket: TicketRow) => ticket.reporterName || `User ${shortId(ticket.createdBy || ticket.id)}`;

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
  ] = useState("all");
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
  ] = useState<TicketRow | null>(null);
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
  const ticketsQuery = useQuery(getSystemSupportTicketsQueryOptions(queryPayload));

  const tickets = useMemo(
    () => (ticketsQuery.data?.data?.tickets ?? []).map(toSheetTicket),
    [ticketsQuery.data],
  );

  const summary = summaryQuery.data?.data;
  const counts = useMemo(
    () => ({
      total:
        (summary?.open ?? 0)
        + (summary?.inProgress ?? 0)
        + (summary?.waitingOnTenant ?? 0)
        + (summary?.escalated ?? 0)
        + (summary?.resolved ?? 0)
        + (summary?.closed ?? 0),
      open: summary?.open ?? 0,
      inProgress: summary?.inProgress ?? 0,
      escalated: summary?.escalated ?? 0,
      closed: (summary?.resolved ?? 0) + (summary?.closed ?? 0),
    }),
    [summary],
  );

  const ticketColumns: ColumnDef<TicketRow>[] = useMemo(
    () => [
      {
        id: "id",
        header: "Ticket ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold">
            #
            {shortId(row.original.id)}
          </span>
        ),
      },
      {
        id: "title",
        header: "Title",
        cell: ({ row }) => (
          <span className="block max-w-[260px] truncate font-semibold">{row.original.subject}</span>
        ),
      },
      {
        id: "tenant",
        header: "Tenant",
        cell: ({ row }) => (
          <span className="block max-w-[220px] truncate font-semibold">{tenantLabel(row.original)}</span>
        ),
      },
      {
        id: "reporter",
        header: "Reporter",
        cell: ({ row }) => {
          const reporter = reporterLabel(row.original);
          return (
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                {getInitials(reporter)}
              </div>
              <span className="truncate font-semibold">{reporter}</span>
            </div>
          );
        },
      },
      {
        id: "channel",
        header: "Channel",
        cell: ({ row }) => <span className="font-semibold">{row.original.channel ? titleCase(row.original.channel) : channelFromContext(row.original.contextType)}</span>,
      },
      {
        id: "category",
        header: "Category",
        cell: ({ row }) => <span className="font-semibold">{titleCase(row.original.category)}</span>,
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const s = statusConfig[row.original.status as TicketStatus] ?? statusConfig.open;
          return (
            <Badge
              variant="outline"
              className={s.className}
            >
              {s.label}
            </Badge>
          );
        },
      },
      {
        id: "priority",
        header: "Priority",
        cell: ({ row }) => {
          const p = priorityConfig[row.original.priority as TicketPriority] ?? priorityConfig.medium;
          return (
            <Badge
              variant="outline"
              className={p.className}
            >
              {p.label}
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
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 font-semibold"
              onClick={(event) => {
                event.stopPropagation();
                setSelectedTicket(row.original);
              }}
            >
              <Eye className="mr-3 h-4 w-4" />
              Manage
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

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

  return (
    <>
      <div className="space-y-4">
        <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(13rem,1fr))]">
          <StatCard
            label="Total Tickets"
            value={counts.total}
            icon={<TicketIcon className="h-4 w-4 text-foreground" />}
          />
          <StatCard
            label="Open"
            value={counts.open}
            icon={<CircleDot className="h-4 w-4 text-chart-5" />}
          />
          <StatCard
            label="In Progress"
            value={counts.inProgress}
            icon={<Loader2 className="h-4 w-4 text-primary" />}
          />
          <StatCard
            label="Escalated"
            value={counts.escalated}
            icon={<ArrowUpRight className="h-4 w-4 text-destructive" />}
          />
          <StatCard
            label="Closed"
            value={counts.closed}
            icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
          />
        </div>

        <Card>
          <CardHeader className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>All Tickets</CardTitle>
                <CardDescription>
                  Tickets logged by tenants across the platform. Click any row to review, edit, or escalate.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={ticketsQuery.isLoading || isExporting}
                className="bg-transparent border-input"
              >
                {isExporting
                  ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )
                  : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                Export Data
              </Button>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, title, tenant, or reporter..."
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  className="h-10 border-border bg-transparent pl-10 font-semibold placeholder:font-normal hover:bg-secondary"
                />
              </div>
              {/* ponytail: inline All Statuses select mirrors the platform
                  reference. Kept alongside the Filter popover — popover still
                  owns category + any future fields, this is the one-click
                  status swap. */}
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPendingStatusFilter(value);
                }}
              >
                <SelectTrigger className="h-10 w-[160px] border-border bg-transparent font-semibold">
                  <SelectValue placeholder="All Statuses" />
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
                    className="h-10 font-semibold"
                  >
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
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
                      {statusFilter === "all"
                        ? categoryFilter === "all"
                          ? "No filters applied"
                          : `Category: ${categoryOptions.find(option => option.value === categoryFilter)?.label ?? titleCase(categoryFilter)}`
                        : `Status: ${statusConfig[statusFilter as TicketStatus]?.label ?? titleCase(statusFilter)}`}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-4 w-4 rounded border border-primary"
                        aria-hidden="true"
                      />
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                    </div>
                    <Select
                      value={pendingStatusFilter}
                      onValueChange={setPendingStatusFilter}
                    >
                      <SelectTrigger className="h-10 border-border bg-background">
                        <SelectValue placeholder="Select status" />
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
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-4 w-4 rounded border border-primary"
                        aria-hidden="true"
                      />
                      <p className="text-sm font-medium text-muted-foreground">Category</p>
                    </div>
                    <Select
                      value={pendingCategoryFilter}
                      onValueChange={setPendingCategoryFilter}
                    >
                      <SelectTrigger className="h-10 border-border bg-background">
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
          </CardHeader>
          <CardContent>
            <DataTable
              columns={ticketColumns}
              data={tickets}
              isLoading={ticketsQuery.isLoading || ticketsQuery.isFetching}
              isError={ticketsQuery.isError}
              errorMessage="Unable to load support tickets right now"
              hasActiveFilters={!!search || statusFilter !== "all" || categoryFilter !== "all"}
              emptyState={(
                <>
                  <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-medium">No tickets found</h3>
                  <p className="text-sm text-muted-foreground">
                    No support tickets have been logged yet
                  </p>
                </>
              )}
              filteredEmptyState={(
                <>
                  <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-medium">No tickets found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or filters
                  </p>
                </>
              )}
              rowClassName={() => "h-[73px]"}
              onRowClick={ticket => setSelectedTicket(ticket)}
            />
          </CardContent>
        </Card>
      </div>

      <AdminTicketSheet
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">{icon}</div>
        <div className="min-w-0">
          <p className="break-words text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
