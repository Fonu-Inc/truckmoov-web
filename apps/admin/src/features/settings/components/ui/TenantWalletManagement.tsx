import type { ColumnDef } from "@tanstack/react-table";
import type { FilterValues } from "@/components/shadcn/table-toolbar";
import { useQuery } from "@tanstack/react-query";
import {
  getPlatformWalletsQueryOptions,
  usePlatformTopUpWallet,
  useUpdatePlatformWalletCreditSettings,
} from "@truckmoov/api/auth";
import {
  AlertTriangle,
  Building2,
  CreditCard,
  Download,
  Plus,
  Settings,
  TrendingDown,
  Wallet,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Switch } from "@/components/shadcn/switch";
import { TableToolbar } from "@/components/shadcn/table-toolbar";

// ponytail: response schema not shipped by spec — assumed shape mirrors legacy mock; tighten when @ApiResponse lands
type TenantWallet = {
  id: string;
  tenant_id: string;
  balance_ngn: number;
  credit_enabled: boolean;
  credit_limit_ngn: number;
  low_balance_threshold_ngn: number;
  updated_at: string;
};

type WalletsResponseData = {
  summary?: {
    totalWallets?: number;
    totalBalanceKobo?: number;
    lowBalance?: number;
    negativeBalance?: number;
  };
  wallets?: TenantWallet[];
};

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

function getBalanceStatus(wallet: TenantWallet) {
  if (wallet.balance_ngn < 0) {
    return {
      color: "destructive", text: "Negative",
    } as const;
  }
  if (wallet.balance_ngn < wallet.low_balance_threshold_ngn) {
    return {
      color: "warning", text: "Low",
    } as const;
  }
  return {
    color: "default", text: "Healthy",
  } as const;
}

export function TenantWalletManagement() {
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<string>("all");
  const [
    walletFilters,
    setWalletFilters,
  ] = useState<FilterValues>({});

  const debouncedSearch = useDebouncedValue(
    searchQuery,
    300,
  );

  const walletsQuery = useQuery(
    getPlatformWalletsQueryOptions({
      params: {
        query: debouncedSearch || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      },
    }),
  );

  const responseData = walletsQuery.data?.data as WalletsResponseData | undefined;
  const wallets = useMemo<TenantWallet[]>(
    () => responseData?.wallets ?? [],
    [responseData],
  );
  const summary = responseData?.summary;

  // ponytail: structured filters (credit yes/no, balance range) applied client-side —
  // endpoint doesn't expose these params yet; move server-side once it does
  const filteredWallets = useMemo(
    () => {
      const creditFilter = walletFilters.credit;
      const balanceFilter = walletFilters.balance;
      return wallets.filter((w) => {
        if (creditFilter?.enabled) {
          const want = creditFilter.value === "yes";
          if (w.credit_enabled !== want)
            return false;
        }
        if (balanceFilter?.enabled) {
          const min = balanceFilter.from ? Number(balanceFilter.from) : Number.NEGATIVE_INFINITY;
          const max = balanceFilter.to ? Number(balanceFilter.to) : Number.POSITIVE_INFINITY;
          if (w.balance_ngn < min || w.balance_ngn > max)
            return false;
        }
        return true;
      });
    },
    [
      wallets,
      walletFilters,
    ],
  );

  const [
    topupDialogOpen,
    setTopupDialogOpen,
  ] = useState(false);
  const [
    creditDialogOpen,
    setCreditDialogOpen,
  ] = useState(false);
  const [
    selectedWallet,
    setSelectedWallet,
  ] = useState<TenantWallet | null>(null);
  const [
    topupAmount,
    setTopupAmount,
  ] = useState("");
  const [
    topupReason,
    setTopupReason,
  ] = useState("");
  const [
    creditEnabled,
    setCreditEnabled,
  ] = useState(false);
  const [
    creditLimit,
    setCreditLimit,
  ] = useState("");
  const [
    lowBalanceThreshold,
    setLowBalanceThreshold,
  ] = useState("");

  const topupMutation = usePlatformTopUpWallet();
  const creditMutation = useUpdatePlatformWalletCreditSettings();

  const openTopup = (wallet: TenantWallet) => {
    setSelectedWallet(wallet);
    setTopupAmount("");
    setTopupReason("");
    setTopupDialogOpen(true);
  };

  const openCreditSettings = (wallet: TenantWallet) => {
    setSelectedWallet(wallet);
    setCreditEnabled(wallet.credit_enabled);
    setCreditLimit(String(wallet.credit_limit_ngn ?? 0));
    setLowBalanceThreshold(String(wallet.low_balance_threshold_ngn ?? 0));
    setCreditDialogOpen(true);
  };

  const handleTopup = () => {
    if (!selectedWallet)
      return;
    const amount = Number(topupAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    topupMutation.mutate(
      {
        tenantId: selectedWallet.tenant_id,
        data: {
          amount, reason: topupReason.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Wallet topped up");
          setTopupDialogOpen(false);
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  const handleCreditSubmit = () => {
    if (!selectedWallet)
      return;
    const limit = creditLimit === "" ? null : Number(creditLimit);
    const threshold = Number(lowBalanceThreshold);
    if (limit !== null && !Number.isFinite(limit)) {
      toast.error("Enter a valid credit limit.");
      return;
    }
    if (!Number.isFinite(threshold) || threshold < 0) {
      toast.error("Enter a valid low balance threshold.");
      return;
    }
    creditMutation.mutate(
      {
        tenantId: selectedWallet.tenant_id,
        data: {
          creditEnabled,
          creditLimit: limit,
          lowBalanceThreshold: threshold,
        },
      },
      {
        onSuccess: () => {
          toast.success("Credit settings updated");
          setCreditDialogOpen(false);
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  const walletColumns: ColumnDef<TenantWallet>[] = [
    {
      accessorKey: "tenant_id",
      header: "Tenant ID",
      cell: ({ row }) => <span className="font-medium">{row.original.tenant_id}</span>,
    },
    {
      accessorKey: "balance_ngn",
      header: "Balance",
      cell: ({ row }) => (
        <span className={row.original.balance_ngn < 0 ? "text-destructive" : ""}>
          ₦
          {row.original.balance_ngn.toLocaleString()}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = getBalanceStatus(row.original);
        return (
          <Badge variant={status.color as "default" | "destructive" | "outline" | "secondary"}>
            {status.text}
          </Badge>
        );
      },
    },
    {
      accessorKey: "credit_enabled",
      header: "Credit Enabled",
      cell: ({ row }) => (
        <Switch
          checked={row.original.credit_enabled}
          onCheckedChange={() => openCreditSettings(row.original)}
        />
      ),
    },
    {
      accessorKey: "credit_limit_ngn",
      header: "Credit Limit",
      cell: ({ row }) => (
        <>
          ₦
          {row.original.credit_limit_ngn.toLocaleString()}
        </>
      ),
    },
    {
      accessorKey: "low_balance_threshold_ngn",
      header: "Low Balance Threshold",
      cell: ({ row }) => (
        <>
          ₦
          {row.original.low_balance_threshold_ngn.toLocaleString()}
        </>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openTopup(row.original)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Top Up
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openCreditSettings(row.original)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const hasActiveFilters
    = !!searchQuery || statusFilter !== "all"
      || !!walletFilters.credit?.enabled || !!walletFilters.balance?.enabled;

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Wallets</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {walletsQuery.isLoading
              ? <Skeleton className="h-8 w-24" />
              : (
                  <div className="text-2xl font-bold">
                    {summary?.totalWallets?.toLocaleString() ?? "-"}
                  </div>
                )}
            <p className="text-xs text-muted-foreground">Active tenant wallets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {walletsQuery.isLoading
              ? <Skeleton className="h-8 w-32" />
              : (
                  <div className="text-2xl font-bold">
                    {summary
                      ? `₦${Math.round((summary.totalBalanceKobo ?? 0) / 100).toLocaleString()}`
                      : "-"}
                  </div>
                )}
            <p className="text-xs text-muted-foreground">Across all tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Balance</CardTitle>
            <TrendingDown className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {walletsQuery.isLoading
              ? <Skeleton className="h-8 w-24" />
              : (
                  <div className="text-2xl font-bold text-warning">
                    {summary?.lowBalance?.toLocaleString() ?? "-"}
                  </div>
                )}
            <p className="text-xs text-muted-foreground">Below threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Negative Balance</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {walletsQuery.isLoading
              ? <Skeleton className="h-8 w-24" />
              : (
                  <div className="text-2xl font-bold text-destructive">
                    {summary?.negativeBalance?.toLocaleString() ?? "-"}
                  </div>
                )}
            <p className="text-xs text-muted-foreground">Using credit</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Tenant Wallets
              </CardTitle>
              <CardDescription>
                Manage wallet balances and credit settings for all tenants
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => toast.info("Endpoint coming soon")}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
          <TableToolbar
            search={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search by tenant..."
            status={statusFilter}
            onStatusChange={setStatusFilter}
            statusOptions={[
              {
                value: "healthy", label: "Healthy",
              },
              {
                value: "low", label: "Low",
              },
              {
                value: "negative", label: "Negative",
              },
            ]}
            filterEntity="wallets"
            filterFields={[
              {
                type: "select",
                key: "credit",
                label: "Credit enabled",
                options: [
                  {
                    value: "yes", label: "Credit enabled",
                  },
                  {
                    value: "no", label: "Credit disabled",
                  },
                ],
              },
              {
                type: "range", key: "balance", label: "Balance (₦)",
              },
            ]}
            filterValues={walletFilters}
            onFiltersApply={setWalletFilters}
          />
        </CardHeader>
        <CardContent>
          <DataTable
            columns={walletColumns}
            data={filteredWallets}
            isLoading={walletsQuery.isLoading}
            isError={walletsQuery.isError}
            errorMessage="Failed to load tenant wallets."
            onRetry={() => walletsQuery.refetch()}
            hasActiveFilters={hasActiveFilters}
            emptyState="No tenant wallets found"
            filteredEmptyState="No tenant wallets match your filters."
          />
        </CardContent>
      </Card>

      <Dialog
        open={topupDialogOpen}
        onOpenChange={setTopupDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Top Up Wallet</DialogTitle>
            <DialogDescription>
              Add funds to
              {" "}
              {selectedWallet?.tenant_id}
              's wallet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Balance</Label>
              <p className="text-2xl font-bold">
                ₦
                {selectedWallet?.balance_ngn.toLocaleString() ?? 0}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topup-amount">Top Up Amount (₦)</Label>
              <Input
                id="topup-amount"
                type="number"
                min="0"
                placeholder="Enter amount"
                value={topupAmount}
                onChange={e => setTopupAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topup-reason">Reason</Label>
              <Input
                id="topup-reason"
                placeholder="e.g. Manual adjustment"
                value={topupReason}
                onChange={e => setTopupReason(e.target.value)}
              />
            </div>

            {topupAmount && (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground">New Balance</p>
                <p className="text-lg font-semibold">
                  ₦
                  {((selectedWallet?.balance_ngn ?? 0) + Number.parseFloat(topupAmount || "0")).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTopupDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTopup}
              disabled={topupMutation.isPending || !topupAmount}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {topupMutation.isPending ? "Processing…" : "Confirm Top Up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={creditDialogOpen}
        onOpenChange={setCreditDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credit Settings</DialogTitle>
            <DialogDescription>
              Update credit configuration for
              {" "}
              {selectedWallet?.tenant_id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="credit-enabled">Credit Enabled</Label>
              <Switch
                id="credit-enabled"
                checked={creditEnabled}
                onCheckedChange={setCreditEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credit-limit">Credit Limit (₦)</Label>
              <Input
                id="credit-limit"
                type="number"
                min="0"
                placeholder="Enter credit limit"
                value={creditLimit}
                onChange={e => setCreditLimit(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="low-balance-threshold">Low Balance Threshold (₦)</Label>
              <Input
                id="low-balance-threshold"
                type="number"
                min="0"
                placeholder="Enter threshold"
                value={lowBalanceThreshold}
                onChange={e => setLowBalanceThreshold(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreditSubmit}
              disabled={creditMutation.isPending}
            >
              {creditMutation.isPending ? "Saving…" : "Save Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
