import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemAuthEventsQueryOptions,
  useBlockSystemIp,
} from "@truckmoov/api/auth";
import type { SystemAuthEvent } from "@truckmoov/api/auth";
import { getInitials } from "@truckmoov/app-core/utils/general-utils";
import {
  formatDateInTimezone,
  TIMEZONES,
} from "@truckmoov/app-core/utils/time-utils";
import {
  Ban,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Loader2,
  LogIn,
  LogOut,
  MoreHorizontal,
  RefreshCw,
  User,
  XCircle,
  Monitor,
  Smartphone,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  TableToolbar,
  type FilterField,
  type FilterValues,
} from "@/components/shadcn/table-toolbar";
import { usePreferences } from "@/contexts/PreferencesContext";

// ponytail: extra filters (event type, tenant) not documented; re-add when swagger publishes params
const LOGIN_FILTER_FIELDS: FilterField[] = [
  { key: "dateRange", label: "Date range", type: "daterange" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
];

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(setDebounced, delayMs, value);
    return () => window.clearTimeout(timeout);
  }, [delayMs, value]);
  return debounced;
}

function getEventTypeBadge(type: SystemAuthEvent["eventType"]) {
  switch (type) {
    case "login":
      return (
        <Badge className="bg-success/10 text-success border-success/30">
          <LogIn className="h-3 w-3 mr-1" />
          Login
        </Badge>
      );
    case "logout":
      return (
        <Badge className="bg-muted text-muted-foreground">
          <LogOut className="h-3 w-3 mr-1" />
          Logout
        </Badge>
      );
    case "refresh":
      return (
        <Badge className="bg-primary/10 text-primary border-primary/30">
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Badge>
      );
    default:
      return <Badge variant="outline">{type ?? "—"}</Badge>;
  }
}

function getStatusBadge(status: SystemAuthEvent["status"]) {
  if (status === "success") {
    return (
      <Badge className="bg-success/10 text-success border-success/30">
        <CheckCircle className="h-3 w-3 mr-1" />
        Success
      </Badge>
    );
  }
  if (status === "failed") {
    return (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Failed
      </Badge>
    );
  }
  return <Badge variant="outline">{status ?? "—"}</Badge>;
}

// ponytail: naive UA sniff, upgrade to a real parser (ua-parser-js) if we need reliable device breakdowns
function parseUserAgent(ua: string | null | undefined) {
  if (!ua) return { device: "Unknown", browser: "Unknown", isMobile: false };
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/.test(ua);
  const device = /iPhone|iPod/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac OS X|Macintosh/.test(ua)
            ? "Mac"
            : /Linux/.test(ua)
              ? "Linux"
              : "Unknown";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Firefox\//.test(ua)
      ? "Firefox"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Unknown";
  return { device, browser, isMobile };
}

export default function LoginHistoryPage() {
  const { timezone } = usePreferences();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [filters, setFilters] = useState<FilterValues>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<SystemAuthEvent | null>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [newBlock, setNewBlock] = useState({ ipAddress: "", reason: "" });

  const debouncedSearch = useDebouncedValue(search, 300);
  const from = filters.dateRange?.enabled ? filters.dateRange.dateFrom : undefined;
  const to = filters.dateRange?.enabled ? filters.dateRange.dateTo : undefined;
  const statusParam = status === "success" || status === "failed" ? status : undefined;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusParam, from, to, pageSize]);

  const eventsQuery = useQuery(
    getSystemAuthEventsQueryOptions({
      params: {
        offset: (page - 1) * pageSize,
        limit: pageSize,
        search: debouncedSearch || undefined,
        status: statusParam,
        from: from || undefined,
        to: to || undefined,
      },
    }),
  );

  const items = eventsQuery.data?.data.items ?? [];
  const total = eventsQuery.data?.data.total ?? 0;
  const blockMutation = useBlockSystemIp();

  const openBlockDialogForRow = (row: SystemAuthEvent) => {
    setNewBlock({
      ipAddress: row.ipAddress ?? "",
      reason: `Suspicious activity from ${row.ipAddress || "unknown"}`,
    });
    setBlockDialogOpen(true);
  };

  const handleBlockIP = () => {
    if (!newBlock.ipAddress || !newBlock.reason) {
      toast.error("Please enter IP address and reason");
      return;
    }
    blockMutation.mutate(
      { data: { ipAddress: newBlock.ipAddress, reason: newBlock.reason } },
      {
        onSuccess: () => {
          toast.success(`IP ${newBlock.ipAddress} blocked`);
          setBlockDialogOpen(false);
          setNewBlock({ ipAddress: "", reason: "" });
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  const columns = useMemo<ColumnDef<SystemAuthEvent>[]>(() => [
    {
      id: "user",
      header: "User",
      cell: ({ row }) => {
        const email = row.original.email ?? "—";
        return (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {getInitials(email)}
            </div>
            <div>
              <p className="font-medium text-sm">{email}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {row.original.tenantId ?? "—"}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: "event",
      header: "Event",
      cell: ({ row }) => getEventTypeBadge(row.original.eventType),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="space-y-1">
          {getStatusBadge(row.original.status)}
          {row.original.failureReason && (
            <p className="text-xs text-muted-foreground">{row.original.failureReason}</p>
          )}
        </div>
      ),
    },
    {
      id: "ip",
      header: "IP Address",
      cell: ({ row }) =>
        row.original.ipAddress
          ? <code className="text-xs bg-muted px-2 py-1 rounded">{row.original.ipAddress}</code>
          : <span className="text-muted-foreground">—</span>,
    },
    {
      id: "device",
      header: "Device",
      cell: ({ row }) => {
        const { device, browser, isMobile } = parseUserAgent(row.original.userAgent);
        const Icon = isMobile ? Smartphone : Monitor;
        return (
          <div className="flex items-center gap-2 text-sm">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span>{browser} · {device}</span>
          </div>
        );
      },
    },
    {
      id: "time",
      header: `Time (${TIMEZONES[timezone].offset})`,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {row.original.occurredAt
            ? formatDateInTimezone(row.original.occurredAt, timezone, { hour: "2-digit", minute: "2-digit" })
            : "—"}
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      meta: { className: "w-[50px]" },
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelected(row.original)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("Coming soon")}>
              <User className="h-4 w-4 mr-2" />
              View User Profile
            </DropdownMenuItem>
            {row.original.ipAddress && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => openBlockDialogForRow(row.original)}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Block IP
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [timezone]);

  const selectedUa = selected ? parseUserAgent(selected.userAgent) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5 text-primary" />
                Login History
              </CardTitle>
              <CardDescription>Successful and failed login attempts across all tenants and users</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("Coming soon")}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <TableToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search by email or IP..."
              status={status}
              onStatusChange={setStatus}
              statusOptions={STATUS_OPTIONS}
              filterEntity="login events"
              filterFields={LOGIN_FILTER_FIELDS}
              filterValues={filters}
              onFiltersApply={setFilters}
            />
          </div>
          <div className="rounded-lg border">
            <DataTable
              columns={columns}
              data={items}
              isLoading={eventsQuery.isLoading}
              isError={eventsQuery.isError}
              errorMessage={eventsQuery.error?.message ?? "Failed to load"}
              onRetry={() => eventsQuery.refetch()}
              hasActiveFilters={
                Boolean(debouncedSearch)
                || Boolean(statusParam)
                || Object.values(filters).some(f => f?.enabled)
              }
              emptyState="No login events."
              filteredEmptyState="No events match your filters."
              pagination={{
                page,
                pageSize,
                total,
                onPageChange: setPage,
                onPageSizeChange: setPageSize,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Block IP Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Ban className="h-5 w-5 text-destructive" />
              </div>
              Block IP Address
            </DialogTitle>
            <DialogDescription>
              Block an IP address from accessing the platform. All login attempts from this IP will be rejected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ip_address">IP Address</Label>
              <Input
                id="ip_address"
                value={newBlock.ipAddress}
                onChange={e => setNewBlock({ ...newBlock, ipAddress: e.target.value })}
                placeholder="e.g., 192.168.1.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={newBlock.reason}
                onChange={e => setNewBlock({ ...newBlock, reason: e.target.value })}
                placeholder="e.g., Suspicious activity, multiple failed attempts"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBlockDialogOpen(false)}
              disabled={blockMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlockIP}
              disabled={blockMutation.isPending}
            >
              {blockMutation.isPending
                ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Blocking...
                    </>
                  )
                : (
                    <>
                      <Ban className="h-4 w-4 mr-2" />
                      Block IP
                    </>
                  )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Login Event Details Dialog */}
      <Dialog
        open={!!selected}
        onOpenChange={open => !open && setSelected(null)}
      >
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogTitle className="sr-only">
            Authentication event · {selected?.status ?? "unknown"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Full context for this authentication event.
          </DialogDescription>
          {selected && (() => {
            const isFail = selected.status === "failed";
            const railColor = isFail ? "bg-destructive" : "bg-success";
            const statusText = isFail ? "text-destructive" : "text-success";
            const verb = (selected.eventType ?? "event").toString();
            const when = selected.occurredAt
              ? formatDateInTimezone(selected.occurredAt, timezone)
              : "—";
            return (
              <div className="flex">
                <div aria-hidden className={`w-[2px] shrink-0 ${railColor}`} />
                <div className="flex-1 min-w-0">
                  {/* Verdict band */}
                  <div className="px-6 pt-5 pb-5">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      Authentication event ·{" "}
                      <span className={`${statusText} font-medium`}>
                        {isFail ? "Failed" : "Success"}
                      </span>
                    </p>
                    <p className="mt-1.5 text-lg font-semibold truncate">
                      {selected.email ?? "unknown user"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                      <span className="uppercase tracking-wide">{verb}</span>
                      <span className="mx-1.5 text-border">·</span>
                      <span>{when}</span>
                    </p>
                    {isFail && selected.failureReason && (
                      <p className="mt-3 text-sm text-destructive">
                        {selected.failureReason}
                      </p>
                    )}
                  </div>

                  {/* Origin band */}
                  <div className="border-t border-border/50 px-6 py-4">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2">
                      Origin
                    </p>
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <code className="text-sm font-mono tabular-nums">
                        {selected.ipAddress ?? "—"}
                      </code>
                      <span className="text-sm text-muted-foreground">
                        {selectedUa ? `${selectedUa.device} · ${selectedUa.browser}` : "unknown device"}
                      </span>
                    </div>
                    {selected.userAgent && (
                      <p className="mt-2 text-[11px] leading-relaxed font-mono text-muted-foreground/80 break-all">
                        {selected.userAgent}
                      </p>
                    )}
                  </div>

                  {/* Identity band */}
                  <div className="border-t border-border/50 px-6 py-4 grid grid-cols-2 gap-x-6 gap-y-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        Tenant
                      </p>
                      <p className="mt-1 text-xs font-mono break-all">
                        {selected.tenantId ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        User
                      </p>
                      <p className="mt-1 text-xs font-mono break-all">
                        {selected.userId ?? "—"}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-border/50 px-6 py-3 flex items-center justify-between gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={!selected.ipAddress}
                      onClick={() => {
                        setSelected(null);
                        openBlockDialogForRow(selected);
                      }}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Block IP
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelected(null)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
