import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemFailedLoginsQueryOptions,
  useBlockSystemIp,
} from "@truckmoov/api/auth";
import type { SystemFailedLogin } from "@truckmoov/api/auth";
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
  Loader2,
  Lock,
  MapPin,
  MoreHorizontal,
  Shield,
  UserX,
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

// ponytail: only date range added; `ipAddress` filter param collapses into free-text search, and
// `offset`/`limit` will be needed once the endpoint returns non-empty data + a pager is added
const FAILED_FILTER_FIELDS: FilterField[] = [
  {
    key: "dateRange",
    label: "Date range",
    type: "daterange",
  },
];

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(setDebounced, delayMs, value);
    return () => window.clearTimeout(timeout);
  }, [delayMs, value]);
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
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterValues>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<SystemFailedLogin | null>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [newBlock, setNewBlock] = useState({ ipAddress: "", reason: "" });

  const debouncedSearch = useDebouncedValue(search, 300);
  const from = filters.dateRange?.enabled ? filters.dateRange.dateFrom : undefined;
  const to = filters.dateRange?.enabled ? filters.dateRange.dateTo : undefined;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, from, to, pageSize]);

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

  const items = failedQuery.data?.data.items ?? [];
  const total = failedQuery.data?.data.total ?? 0;
  const blockMutation = useBlockSystemIp();

  const openBlockDialogForRow = (row: SystemFailedLogin) => {
    setNewBlock({
      ipAddress: row.ipAddress ?? "",
      reason: `Suspicious activity from ${row.location || row.ipAddress || "unknown"}`,
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

  const columns = useMemo<ColumnDef<SystemFailedLogin>[]>(() => [
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
      id: "location",
      header: "Location",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          {row.original.location ?? "Unknown"}
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
            {formatDateInTimezone(ts, timezone, { hour: "2-digit", minute: "2-digit" })}
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
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelected(row.original)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            {!row.original.blocked && row.original.ipAddress && (
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => openBlockDialogForRow(row.original)}
              >
                <Ban className="h-4 w-4 mr-2" />
                Block IP
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [timezone]);

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
              <CardDescription>Recent unsuccessful sign-in attempts</CardDescription>
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
                    {formatDateInTimezone(selected.createdAt ?? selected.timestamp, timezone)}
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
