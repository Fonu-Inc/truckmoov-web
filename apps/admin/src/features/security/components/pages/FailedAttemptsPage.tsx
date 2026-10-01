import type { ColumnDef } from "@tanstack/react-table";
import type { SystemFailedLogin } from "@truckmoov/api/auth";
import type {
  FilterField, FilterValues,
} from "@/components/shadcn/table-toolbar";
import { useQuery } from "@tanstack/react-query";
import { getSystemFailedLoginsQueryOptions } from "@truckmoov/api/auth";
import {
  formatDateInTimezone,
  TIMEZONES,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle,
  Ban,
  Clock,
  Download,
  Eye,
  Key,
  Lock,
  MapPin,
  MoreHorizontal,
  Shield,
  UserX,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { TableToolbar } from "@/components/shadcn/table-toolbar";
import { usePreferences } from "@/contexts/PreferencesContext";

// ponytail: only date range added; `ipAddress` filter param collapses into free-text search, and
// `offset`/`limit` will be needed once the endpoint returns non-empty data + a pager is added
const FAILED_FILTER_FIELDS: FilterField[] = [
  {
    key: "dateRange",
    label: "Date range",
    type: "daterange",
  },
];

const STATUS_OPTIONS = [
  {
    value: "all", label: "All Status",
  },
  {
    value: "blocked", label: "Blocked",
  },
  {
    value: "active", label: "Active",
  },
];

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

function getFailureReasonBadge(reason: string | null | undefined) {
  switch (reason) {
    case "invalid_password":
      return (
        <Badge variant="destructive">
          <Key className="h-3 w-3 mr-1" />
          Invalid Password
        </Badge>
      );
    case "user_not_found":
      return (
        <Badge className="bg-warning/10 text-warning border-warning/30">
          <UserX className="h-3 w-3 mr-1" />
          User Not Found
        </Badge>
      );
    case "account_locked":
      return (
        <Badge variant="secondary">
          <Lock className="h-3 w-3 mr-1" />
          Account Locked
        </Badge>
      );
    case "mfa_failed":
      return (
        <Badge className="bg-primary/10 text-primary border-primary/30">
          <Shield className="h-3 w-3 mr-1" />
          MFA Failed
        </Badge>
      );
    case "suspicious_activity":
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Suspicious
        </Badge>
      );
    default:
      return <Badge variant="outline">{reason ?? "—"}</Badge>;
  }
}

export default function FailedAttemptsPage() {
  const { timezone } = usePreferences();
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState("all");
  const [
    filters,
    setFilters,
  ] = useState<FilterValues>({});
  const [
    page,
    setPage,
  ] = useState(1);
  const [
    pageSize,
    setPageSize,
  ] = useState(25);
  const [
    selected,
    setSelected,
  ] = useState<SystemFailedLogin | null>(null);

  const debouncedSearch = useDebouncedValue(
    search,
    300,
  );
  const from = filters.dateRange?.enabled ? filters.dateRange.dateFrom : undefined;
  const to = filters.dateRange?.enabled ? filters.dateRange.dateTo : undefined;

  useEffect(
    () => {
      setPage(1);
    },
    [
      debouncedSearch,
      from,
      to,
      pageSize,
    ],
  );

  const failedQuery = useQuery(
    getSystemFailedLoginsQueryOptions({
      params: {
        offset: (page - 1) * pageSize,
        limit: pageSize,
        search: debouncedSearch || undefined,
        from: from || undefined,
        to: to || undefined,
      },
    }),
  );

  const rawItems = failedQuery.data?.data.items ?? [];
  // ponytail: status filtered client-side; move to server param when the API adds `blocked`
  const items = status === "all"
    ? rawItems
    : rawItems.filter(i => (status === "blocked" ? i.blocked : !i.blocked));
  const total = failedQuery.data?.data.total ?? 0;

  const columns = useMemo<ColumnDef<SystemFailedLogin>[]>(
    () => [
      {
        id: "email",
        header: "Email",
        cell: ({ row }) => (
          <p className="font-medium text-sm">{row.original.email ?? "—"}</p>
        ),
      },
      {
        id: "ipAddress",
        header: "IP Address",
        cell: ({ row }) =>
          row.original.ipAddress
            ? <code className="text-sm bg-muted px-2 py-1 rounded">{row.original.ipAddress}</code>
            : <span className="text-muted-foreground">—</span>,
      },
      {
      // ponytail: fleetflow shows flag + city/country + threat/proxy/datacenter badges;
      // admin's SystemFailedLogin only exposes `location` string — render what we have,
      // upgrade when the API returns structured geolocation + threat scoring
        id: "origin",
        header: "Origin / Threat",
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{row.original.location ?? "Unknown"}</span>
            </div>
            <p className="text-xs text-muted-foreground">—</p>
          </div>
        ),
      },
      {
        id: "reason",
        header: "Reason",
        cell: ({ row }) => getFailureReasonBadge(row.original.reason),
      },
      {
        id: "attempts",
        header: "Attempts",
        cell: ({ row }) => {
          const n = row.original.attempts ?? 0;
          return (
            <Badge variant={n >= 10 ? "destructive" : n >= 5 ? "secondary" : "outline"}>
              {n}
            </Badge>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) =>
          row.original.blocked
            ? (
                <Badge variant="destructive">
                  <Ban className="h-3 w-3 mr-1" />
                  Blocked
                </Badge>
              )
            : <Badge variant="outline">Active</Badge>,
      },
      {
        id: "time",
        header: `Time (${TIMEZONES[timezone].offset})`,
        cell: ({ row }) => {
          const ts = row.original.createdAt ?? row.original.timestamp;
          return (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {formatDateInTimezone(
                ts,
                timezone,
                {
                  hour: "2-digit", minute: "2-digit",
                },
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        meta: { className: "w-[50px]" },
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelected(row.original)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [timezone],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-destructive" />
                Failed Login Attempts
              </CardTitle>
              <CardDescription>Recent unsuccessful sign-in attempts with IP, geolocation and threat scoring</CardDescription>
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
              filterEntity="failed attempts"
              filterFields={FAILED_FILTER_FIELDS}
              filterValues={filters}
              onFiltersApply={setFilters}
            />
          </div>
          <div className="rounded-lg border">
            <DataTable
              columns={columns}
              data={items}
              isLoading={failedQuery.isLoading}
              isError={failedQuery.isError}
              errorMessage={failedQuery.error?.message ?? "Failed to load"}
              onRetry={() => failedQuery.refetch()}
              hasActiveFilters={
                Boolean(debouncedSearch)
                || Object.values(filters).some(f => f?.enabled)
              }
              emptyState="No failed login attempts."
              filteredEmptyState="No attempts match your filters."
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

      {/* Details Dialog */}
      <Dialog
        open={!!selected}
        onOpenChange={open => !open && setSelected(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-destructive" />
              Failed Attempt Details
            </DialogTitle>
            <DialogDescription>Information about this failed login attempt.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{selected.email ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">IP Address</p>
                  <code className="bg-muted px-2 py-1 rounded text-xs">{selected.ipAddress ?? "—"}</code>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium">{selected.location ?? "Unknown"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reason</p>
                  {getFailureReasonBadge(selected.reason)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Attempts</p>
                  <Badge variant={(selected.attempts ?? 0) >= 10 ? "destructive" : (selected.attempts ?? 0) >= 5 ? "secondary" : "outline"}>
                    {selected.attempts ?? 0}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  {selected.blocked
                    ? (
                        <Badge variant="destructive">
                          <Ban className="h-3 w-3 mr-1" />
                          Blocked
                        </Badge>
                      )
                    : <Badge variant="outline">Active</Badge>}
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="font-medium">
                    {formatDateInTimezone(
                      selected.createdAt ?? selected.timestamp,
                      timezone,
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
