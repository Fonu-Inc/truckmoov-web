import type { ColumnDef } from "@tanstack/react-table";
import type { SystemBlockedIp } from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemBlockedIpsQueryOptions,
  useBlockSystemIp,
  useUnblockSystemIp,
} from "@truckmoov/api/auth";
import {
  formatDateInTimezone,
  TIMEZONES,
} from "@truckmoov/app-core/utils/time-utils";
import {
  Ban,
  Clock,
  Loader2,
  Lock,
  Plus,
  Unlock,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
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
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { TableToolbar } from "@/components/shadcn/table-toolbar";
import { usePreferences } from "@/contexts/PreferencesContext";

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

export default function BlockedIpsPage() {
  const { timezone } = usePreferences();
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    page,
    setPage,
  ] = useState(1);
  const [
    pageSize,
    setPageSize,
  ] = useState(25);
  const [
    blockDialogOpen,
    setBlockDialogOpen,
  ] = useState(false);
  const [
    newBlock,
    setNewBlock,
  ] = useState({
    ipAddress: "", reason: "",
  });
  const [
    unblockTarget,
    setUnblockTarget,
  ] = useState<SystemBlockedIp | null>(null);

  const debouncedSearch = useDebouncedValue(
    search,
    300,
  );

  useEffect(
    () => {
      setPage(1);
    },
    [
      debouncedSearch,
      pageSize,
    ],
  );

  // ponytail: server ignores `search`; filter locally over the returned page's `reason`
  const blockedQuery = useQuery(
    getSystemBlockedIpsQueryOptions({
      params: {
        offset: (page - 1) * pageSize,
        limit: pageSize,
      },
    }),
  );

  const rawItems = blockedQuery.data?.data.items ?? [];
  const total = blockedQuery.data?.data.total ?? 0;

  const items = useMemo(
    () => {
      if (!debouncedSearch)
        return rawItems;
      const q = debouncedSearch.toLowerCase();
      return rawItems.filter(row =>
        (row.reason ?? "").toLowerCase().includes(q)
        || (row.ipAddress ?? "").toLowerCase().includes(q)
        || row.id.toLowerCase().includes(q));
    },
    [
      rawItems,
      debouncedSearch,
    ],
  );

  const blockMutation = useBlockSystemIp();
  const unblockMutation = useUnblockSystemIp();

  const handleBlockIP = () => {
    if (!newBlock.ipAddress || !newBlock.reason) {
      toast.error("Please enter IP address and reason");
      return;
    }
    blockMutation.mutate(
      {
        data: {
          ipAddress: newBlock.ipAddress, reason: newBlock.reason,
        },
      },
      {
        onSuccess: () => {
          toast.success(`IP ${newBlock.ipAddress} blocked`);
          setBlockDialogOpen(false);
          setNewBlock({
            ipAddress: "", reason: "",
          });
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  const handleUnblock = () => {
    if (!unblockTarget)
      return;
    const label = unblockTarget.ipAddress ?? unblockTarget.id;
    unblockMutation.mutate(
      { id: unblockTarget.id },
      {
        onSuccess: () => {
          toast.success(`IP ${label} unblocked`);
          setUnblockTarget(null);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  const columns = useMemo<ColumnDef<SystemBlockedIp>[]>(
    () => [
      {
        id: "ip",
        header: "IP Address",
        cell: ({ row }) => (
          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
            {row.original.ipAddress ?? row.original.id}
          </code>
        ),
      },
      {
        id: "reason",
        header: "Reason",
        cell: ({ row }) => (
          <p
            className="text-sm max-w-[280px] truncate"
            title={row.original.reason ?? undefined}
          >
            {row.original.reason ?? "—"}
          </p>
        ),
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => {
          const isPermanent = row.original.blockType === "permanent" || !row.original.expiresAt;
          return isPermanent
            ? (
                <Badge className="bg-destructive/10 text-destructive border-destructive/30">
                  <Lock className="h-3 w-3 mr-1" />
                  Permanent
                </Badge>
              )
            : (
                <Badge className="bg-warning/10 text-warning border-warning/30">
                  <Clock className="h-3 w-3 mr-1" />
                  Temporary
                </Badge>
              );
        },
      },
      {
        id: "blockedAt",
        header: `Blocked At (${TIMEZONES[timezone].offset})`,
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {row.original.blockedAt
              ? formatDateInTimezone(
                  row.original.blockedAt,
                  timezone,
                  {
                    hour: "2-digit", minute: "2-digit",
                  },
                )
              : "—"}
          </div>
        ),
      },
      {
        id: "expires",
        header: "Expires",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.expiresAt
              ? formatDateInTimezone(
                  row.original.expiresAt,
                  timezone,
                  {
                    hour: "2-digit", minute: "2-digit",
                  },
                )
              : "Never"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        meta: { className: "w-[120px] text-right" },
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setUnblockTarget(row.original)}
          >
            <Unlock className="h-4 w-4 mr-2" />
            Unblock
          </Button>
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
                <Ban className="h-5 w-5 text-destructive" />
                Blocked IP Addresses
              </CardTitle>
              <CardDescription>
                IP addresses currently denied all authenticated access to the platform.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => setBlockDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Block IP
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <TableToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search by IP, reason, or id..."
              filterEntity="blocked IPs"
            />
          </div>
          <div className="rounded-lg border">
            <DataTable
              columns={columns}
              data={items}
              isLoading={blockedQuery.isLoading}
              isError={blockedQuery.isError}
              errorMessage={blockedQuery.error?.message ?? "Failed to load"}
              onRetry={() => blockedQuery.refetch()}
              hasActiveFilters={Boolean(debouncedSearch)}
              emptyState="No blocked IPs."
              filteredEmptyState="No blocks match your search."
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
      <Dialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Ban className="h-5 w-5 text-destructive" />
              </div>
              Block IP Address
            </DialogTitle>
            <DialogDescription>
              Block an IP address from accessing the platform. This will prevent all login attempts from this IP.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ip_address">IP Address</Label>
              <Input
                id="ip_address"
                value={newBlock.ipAddress}
                onChange={e => setNewBlock({
                  ...newBlock, ipAddress: e.target.value,
                })}
                placeholder="e.g., 192.168.1.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={newBlock.reason}
                onChange={e => setNewBlock({
                  ...newBlock, reason: e.target.value,
                })}
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

      {/* Unblock confirmation */}
      <AlertDialog
        open={!!unblockTarget}
        onOpenChange={o => !o && setUnblockTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock IP Address?</AlertDialogTitle>
            <AlertDialogDescription>
              {unblockTarget && (
                <>
                  <code className="bg-muted px-2 py-1 rounded font-mono text-xs">
                    {unblockTarget.ipAddress ?? unblockTarget.id}
                  </code>
                  {" "}
                  will be able to reach the platform again.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unblockMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleUnblock();
              }}
              disabled={unblockMutation.isPending}
            >
              {unblockMutation.isPending
                ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Unblocking...
                    </>
                  )
                : (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Unblock
                    </>
                  )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
