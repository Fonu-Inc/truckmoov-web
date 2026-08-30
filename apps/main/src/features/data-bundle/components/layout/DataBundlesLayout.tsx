import type {
  AutoTopupSettings, SpendingLimitSettings,
} from "@/features/data-bundle/utils/dataBundle";
import { useQuery } from "@tanstack/react-query";
import {
  getDataBundleAllocationsQueryOptions,
  getDataBundleAutoTopupQueryOptions,
  getDataBundleDashboardSummaryQueryOptions,
  getDataBundleSpendingLimitQueryOptions,
  getDataBundleTransactionsQueryOptions,
  getDataBundleWalletBalanceQueryOptions,
  useDisableDataBundleAutoTopup,
  useDisableDataBundleSpendingLimit,
  useSaveDataBundleAutoTopup,
  useSaveDataBundleSpendingLimit,
  useTopUpDataBundleWallet,
} from "@truckmoov/api/auth";
import { formatDate } from "@truckmoov/app-core/utils/time-utils";
import {
  Activity, AlertTriangle, ArrowUpRight, Clock, CreditCard, Database,
  Mail, Plus, Settings2, ShieldCheck, Smartphone,
  TrendingUp, Wallet, Wifi, Zap,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
import {
  NavLink, Outlet,
} from "react-router";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  Alert, AlertDescription, AlertTitle,
} from "@/components/shadcn/alert";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent,
} from "@/components/shadcn/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Progress } from "@/components/shadcn/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuthStore } from "@/features/auth/stores/authStore";
import {
  AMOUNT_PRESETS,

  formatBundleSize,
  formatDataUsedGb,
  formatMobile,

  TRIGGER_PRESETS,
  useBundleTopup,
  useDataBundleCatalog,
} from "@/features/data-bundle/utils/dataBundle";
import { DATA_BUNDLE_TABS } from "@/features/data-bundle/utils/dataBundleNav";
import { cn } from "@/lib/utils";

export type DataBundlesLayoutContext = {
  openAllocateDialog: (init?: {
    carrier?: string;
    cycle?: string;
    bundleCode?: string;
    numbers?: string;
  }) => void;
  openViewAllocation: (alloc: any) => void;
};

export function DataBundlesLayout() {
  const { user } = useAuthStore();
  const { format: fmtCurrency } = useCurrency();
  const tenantId = user?.tenantId;

  const {
    catalog, catalogQuery,
  } = useDataBundleCatalog();
  const dataBundleSummaryQuery = useQuery(getDataBundleDashboardSummaryQueryOptions());
  const dataBundleSummary = dataBundleSummaryQuery.data?.data;
  const walletBalanceQuery = useQuery(getDataBundleWalletBalanceQueryOptions());
  const walletBalance = walletBalanceQuery.data?.data;
  const spendingLimitQuery = useQuery(getDataBundleSpendingLimitQueryOptions());
  const spendingLimit = spendingLimitQuery.data?.data;
  const autoTopupQuery = useQuery(getDataBundleAutoTopupQueryOptions());
  const autoTopup = autoTopupQuery.data?.data;

  // Unfiltered queries for KPI/alert fallbacks (matches original behavior when
  // dataBundleSummary is absent). React Query dedupes with page-specific queries.
  const allocationsQuery = useQuery(getDataBundleAllocationsQueryOptions({
    params: {
      page: 1, limit: 100,
    },
  }));
  const transactionsQuery = useQuery(getDataBundleTransactionsQueryOptions({
    params: {
      page: 1, limit: 100,
    },
  }));

  const topup = useBundleTopup();
  const walletTopup = useTopUpDataBundleWallet();
  const saveAutoTopup = useSaveDataBundleAutoTopup();
  const disableAutoTopup = useDisableDataBundleAutoTopup();
  const saveSpendingLimit = useSaveDataBundleSpendingLimit();
  const disableSpendingLimit = useDisableDataBundleSpendingLimit();

  const [
    open,
    setOpen,
  ] = useState(false);
  const [
    autoOpen,
    setAutoOpen,
  ] = useState(false);
  const [
    limitOpen,
    setLimitOpen,
  ] = useState(false);
  const [
    allocOpen,
    setAllocOpen,
  ] = useState(false);
  const [
    viewOpen,
    setViewOpen,
  ] = useState(false);
  const [
    viewAlloc,
    setViewAlloc,
  ] = useState<any | null>(null);
  const [
    topupAmount,
    setTopupAmount,
  ] = useState<number | "">("");
  const [
    topupMomo,
    setTopupMomo,
  ] = useState("");
  const [
    allocCarrier,
    setAllocCarrier,
  ] = useState<string>("");
  const [
    allocCycle,
    setAllocCycle,
  ] = useState<string>("");
  const [
    allocBundle,
    setAllocBundle,
  ] = useState<string>("");
  const [
    allocNumbers,
    setAllocNumbers,
  ] = useState<string>("");

  const [
    auto,
    setAuto,
  ] = useState<AutoTopupSettings>({
    enabled: false,
    triggerBalance: 500,
    topupAmount: 5000,
    momoPhone: "",
  });
  const [
    limit,
    setLimit,
  ] = useState<SpendingLimitSettings>({
    enabled: false,
    monthlyLimit: 50000,
    resetDay: 1,
    alertEmail: "",
  });

  useEffect(
    () => {
      if (!autoTopup)
        return;
      setAuto({
        enabled: autoTopup.enabled,
        triggerBalance: autoTopup.thresholdAmount,
        topupAmount: autoTopup.topUpAmount,
        momoPhone: autoTopup.mobileNumber,
      });
    },
    [autoTopup],
  );

  useEffect(
    () => {
      if (!spendingLimit)
        return;
      setLimit({
        enabled: spendingLimit.enabled,
        monthlyLimit: spendingLimit.monthlyLimit,
        resetDay: spendingLimit.resetDayOfMonth,
        alertEmail: spendingLimit.alertEmail,
      });
    },
    [spendingLimit],
  );

  const allocations = useMemo(
    () => {
      return (allocationsQuery.data?.data.items ?? []).map(item => ({
        id: item.id,
        msisdn: item.mobileNumber,
        bundle_code: item.bundle.code,
        bundle: item.bundle,
        data_mb_total: item.dataTotalMb,
        data_mb_used: item.dataUsedMb,
        usage_percentage: item.usagePercentage,
        status: item.status,
        expires_at: item.expiresAt,
        created_at: item.activatedAt,
        days_left: item.daysLeft,
      }));
    },
    [allocationsQuery.data],
  );

  const topups = useMemo(
    () => {
      return (transactionsQuery.data?.data.items ?? []).map(item => ({
        id: item.id,
        created_at: item.date,
        msisdn: item.mobileNumber,
        bundle_code: item.bundle.code,
        bundle: item.bundle,
        status: String(item.status).toUpperCase(),
        amount_ngn: item.amount,
        payment_reference: item.paymentReference,
        failure_reason: item.failureReason,
      }));
    },
    [transactionsQuery.data],
  );

  const expiringSoon = useMemo(
    () => allocations.filter((a) => {
      const days = (new Date(a.expires_at).getTime() - Date.now()) / 86400000;
      return days <= 7 && days > 0;
    }),
    [allocations],
  );
  const expired = useMemo(
    () => allocations.filter(a => new Date(a.expires_at).getTime() < Date.now()),
    [allocations],
  );

  // KPIs
  const usedDataMb = allocations.reduce(
    (s, a) => s + (a.data_mb_used || 0),
    0,
  );

  const successTopups = useMemo(
    () => topups.filter((t: { status: string }) => t.status === "SUCCESS"),
    [topups],
  );

  const totalToppedUp = useMemo(
    () =>
      successTopups.reduce(
        (sum, t: { bundle_code: string }) => {
          const b = catalog.find(c => c.code === t.bundle_code);
          return sum + (b ? Number(b.price_ngn) : 0);
        },
        0,
      ),
    [
      successTopups,
      catalog,
    ],
  );

  const monthSpend = useMemo(
    () => {
      const start = new Date();
      start.setDate(1);
      start.setHours(
        0,
        0,
        0,
        0,
      );
      return successTopups
        .filter((t: { created_at: string }) => new Date(t.created_at) >= start)
        .reduce(
          (sum, t: { bundle_code: string }) => {
            const b = catalog.find(c => c.code === t.bundle_code);
            return sum + (b ? Number(b.price_ngn) : 0);
          },
          0,
        );
    },
    [
      successTopups,
      catalog,
    ],
  );

  const monthTopupCount = useMemo(
    () => {
      const start = new Date();
      start.setDate(1);
      start.setHours(
        0,
        0,
        0,
        0,
      );
      return successTopups.filter((t: { created_at: string }) => new Date(t.created_at) >= start).length;
    },
    [successTopups],
  );

  const currentBalance = useMemo(
    () => {
      return allocations.reduce(
        (sum, a) => {
          const b = catalog.find(c => c.code === a.bundle_code);
          if (!b || !b.data_mb)
            return sum;
          const remainingPct = Math.max(
            0,
            (a.data_mb_total - a.data_mb_used) / a.data_mb_total,
          );
          return sum + Number(b.price_ngn) * remainingPct;
        },
        0,
      );
    },
    [
      allocations,
      catalog,
    ],
  );

  const statValues = {
    totalDataUsed: dataBundleSummary ? formatDataUsedGb(dataBundleSummary.totalDataUsedGb) : formatBundleSize(usedDataMb),
    currentBalance: fmtCurrency(walletBalance?.balance ?? dataBundleSummary?.walletBalance ?? currentBalance),
    monthlySpend: fmtCurrency(dataBundleSummary?.monthlySpend ?? monthSpend),
    topUpsThisMonth: dataBundleSummary?.topUpsThisMonth ?? monthTopupCount,
    activeBundles: dataBundleSummary?.activeAllocations ?? allocations.length,
  };

  const topupSummaryValues = {
    totalAmount: dataBundleSummary?.totalAmountToppedUp ?? totalToppedUp,
    successfulTransactions: dataBundleSummary?.successfulTopUpTransactions ?? successTopups.length,
  };

  const bundleAlertCounts = {
    expired: dataBundleSummary?.expiredAllocations ?? expired.length,
    expiringSoon: dataBundleSummary?.expiringWithinSevenDays ?? expiringSoon.length,
  };

  const handleTopup = async () => {
    if (!topupAmount || !topupMomo)
      return;
    await walletTopup.mutateAsync({
      data: {
        amount: Number(topupAmount),
        mobileMoneyProvider: "MTN",
        mobileNumber: topupMomo,
      },
    });
    setOpen(false);
    setTopupAmount("");
    setTopupMomo("");
  };

  const parsedAllocNumbers = useMemo(
    () => allocNumbers.split(/[\s,;]+/).map(n => n.trim()).filter(Boolean),
    [allocNumbers],
  );
  const allocBundleObj = useMemo(
    () => catalog.find(b => b.code === allocBundle),
    [
      catalog,
      allocBundle,
    ],
  );
  const allocTotalCost = allocBundleObj ? Number(allocBundleObj.price_ngn) : 0;

  const handleAllocate = async () => {
    if (!tenantId || !allocBundle || parsedAllocNumbers.length === 0)
      return;
    for (const num of parsedAllocNumbers) {
      try {
        await topup.mutateAsync({
          tenant_id: tenantId, msisdn: num, bundle_code: allocBundle,
        });
      }
      catch { /* continue allocating remaining numbers */ }
    }
    setAllocOpen(false);
    setAllocCarrier("");
    setAllocCycle("");
    setAllocBundle("");
    setAllocNumbers("");
  };

  const saveAuto = async () => {
    await saveAutoTopup.mutateAsync({
      data: {
        thresholdAmount: auto.triggerBalance,
        topUpAmount: auto.topupAmount,
        paymentProvider: "MTN",
        mobileNumber: auto.momoPhone,
      },
    });
    setAuto(current => ({
      ...current, enabled: true,
    }));
    setAutoOpen(false);
  };

  const disableAuto = async () => {
    await disableAutoTopup.mutateAsync();
    setAuto(current => ({
      ...current, enabled: false,
    }));
    setAutoOpen(false);
  };

  const saveLimit = async () => {
    await saveSpendingLimit.mutateAsync({
      data: {
        monthlyLimit: limit.monthlyLimit,
        resetDayOfMonth: limit.resetDay,
        alertEmail: limit.alertEmail,
        notifyAtPercentages: [
          80,
          100,
        ],
      },
    });
    setLimit(current => ({
      ...current, enabled: true,
    }));
    setLimitOpen(false);
  };

  const disableLimit = async () => {
    await disableSpendingLimit.mutateAsync();
    setLimit(current => ({
      ...current, enabled: false,
    }));
    setLimitOpen(false);
  };

  const openAllocateDialog = (init?: {
    carrier?: string; cycle?: string; bundleCode?: string; numbers?: string;
  }) => {
    setAllocCarrier(init?.carrier ?? "");
    setAllocCycle(init?.cycle ?? "");
    setAllocBundle(init?.bundleCode ?? "");
    setAllocNumbers(init?.numbers ?? "");
    setAllocOpen(true);
  };

  const openViewAllocation = (alloc: any) => {
    setViewAlloc(alloc);
    setViewOpen(true);
  };

  const ctx: DataBundlesLayoutContext = {
    openAllocateDialog,
    openViewAllocation,
  };

  const isPageLoading
    = dataBundleSummaryQuery.isLoading
      || walletBalanceQuery.isLoading
      || allocationsQuery.isLoading
      || transactionsQuery.isLoading
      || catalogQuery.isLoading;

  if (isPageLoading) {
    return (
      <div
        className="space-y-6"
        aria-busy="true"
        aria-label="Loading data bundles"
      >
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from(
            { length: 5 },
            (_, index) => (
              <Skeleton
                key={index}
                className="h-48 w-full"
              />
            ),
          )}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Data Bundles</h1>
          <p className="text-sm text-muted-foreground">
            Manage bundle allocations, top-ups, auto-renewal and spending limits
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setLimitOpen(true)}
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            {" "}
            Spending Limits
          </Button>
          <Button
            variant="outline"
            onClick={() => setAutoOpen(true)}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            {" "}
            Auto Top-up
          </Button>
          <Dialog
            open={open}
            onOpenChange={setOpen}
          >
            <DialogTrigger asChild>
              <Button variant="gradient">
                <Plus className="h-4 w-4 mr-2" />
                {" "}
                Top-up Bundle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  {" "}
                  Top Up Wallet
                </DialogTitle>
                <DialogDescription>
                  Add funds to your wallet using MTN Mobile Money
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quick Amounts</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      5000,
                      10000,
                      25000,
                      50000,
                      100000,
                    ].map(v => (
                      <Button
                        key={v}
                        type="button"
                        variant={topupAmount === v ? "gradient" : "outline"}
                        size="sm"
                        onClick={() => setTopupAmount(v)}
                      >
                        ₦
                        {v.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Amount (₦)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={topupAmount}
                    onChange={e => setTopupAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">MTN Mobile Number</Label>
                  <Input
                    placeholder="e.g., 08031234567"
                    value={topupMomo}
                    onChange={e => setTopupMomo(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    You'll receive a prompt on this number to approve the payment
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="gradient"
                  onClick={handleTopup}
                  disabled={!topupAmount || !topupMomo || walletTopup.isPending}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {walletTopup.isPending ? "Processing..." : "Pay with MoMo"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Total Topped Up — own container */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Total Amount Topped Up</p>
            <p className="text-xl font-bold truncate">{fmtCurrency(topupSummaryValues.totalAmount)}</p>
            <p className="text-xs text-muted-foreground">
              Across
              {topupSummaryValues.successfulTransactions}
              {" "}
              successful transactions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Data Used"
          value={statValues.totalDataUsed}
          icon={Activity}
        />
        <StatCard
          title="Current Balance"
          value={statValues.currentBalance}
          icon={Wallet}
        />
        <StatCard
          title="Total Spend This Month"
          value={statValues.monthlySpend}
          icon={TrendingUp}
        />
        <StatCard
          title="Top-ups This Month"
          value={statValues.topUpsThisMonth}
          icon={ArrowUpRight}
        />
        <StatCard
          title="Active Bundles"
          value={statValues.activeBundles}
          icon={Database}
        />
      </div>

      {/* Alerts */}
      {bundleAlertCounts.expired > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {bundleAlertCounts.expired}
            {" "}
            bundle(s) expired
          </AlertTitle>
          <AlertDescription>These SIMs are no longer carrying data. Top up to restore service.</AlertDescription>
        </Alert>
      )}
      {bundleAlertCounts.expiringSoon > 0 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>
            {bundleAlertCounts.expiringSoon}
            {" "}
            bundle(s) expiring within 7 days
          </AlertTitle>
          <AlertDescription>Renew now or enable auto top-up to avoid interruption.</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <nav
          aria-label="Data bundle sections"
          className="bg-muted/50 text-muted-foreground inline-flex w-auto justify-start gap-1 rounded-md p-1"
        >
          {DATA_BUNDLE_TABS.map(t => (
            <NavLink
              key={t.to}
              to={t.to}
              end
              className={({ isActive }) => cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all duration-150",
                "hover:text-foreground/80",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive && "bg-background text-foreground shadow-sm border-b-2 border-primary",
              )}
            >
              {t.label}
            </NavLink>
          ))}
        </nav>

        <Outlet context={ctx} />
      </div>

      {/* Allocate Bundle Dialog */}
      <Dialog
        open={allocOpen}
        onOpenChange={setAllocOpen}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              {" "}
              Allocate Bundle
            </DialogTitle>
            <DialogDescription>
              Push a data bundle to one or more SIMs in your fleet. Each number gets the selected bundle credited to it instantly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {(() => {
              const carrierOptions = Array.from(new Set(catalog.filter(b => b.is_active).map(b => b.carrier)));
              const cycleOptions = Array.from(new Set(
                catalog.filter(b => b.is_active && (!allocCarrier || b.carrier === allocCarrier)).map(b => b.billing_cycle),
              ));
              const sizeOptions = catalog.filter(b =>
                b.is_active
                && (!allocCarrier || b.carrier === allocCarrier)
                && (!allocCycle || b.billing_cycle === allocCycle));
              return (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Carrier</Label>
                    <Select
                      value={allocCarrier}
                      onValueChange={(v) => {
                        setAllocCarrier(v);
                        setAllocCycle("");
                        setAllocBundle("");
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select carrier" /></SelectTrigger>
                      <SelectContent>
                        {carrierOptions.map(c => (
                          <SelectItem
                            key={c}
                            value={c}
                          >
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Plan Type</Label>
                    <Select
                      value={allocCycle}
                      onValueChange={(v) => {
                        setAllocCycle(v);
                        setAllocBundle("");
                      }}
                      disabled={!allocCarrier}
                    >
                      <SelectTrigger><SelectValue placeholder={allocCarrier ? "Select plan type" : "Pick carrier first"} /></SelectTrigger>
                      <SelectContent>
                        {cycleOptions.map(c => (
                          <SelectItem
                            key={c}
                            value={c}
                            className="capitalize"
                          >
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Bundle Size</Label>
                    <Select
                      value={allocBundle}
                      onValueChange={setAllocBundle}
                      disabled={!allocCycle}
                    >
                      <SelectTrigger><SelectValue placeholder={allocCycle ? "Select size" : "Pick plan type"} /></SelectTrigger>
                      <SelectContent>
                        {sizeOptions.map(b => (
                          <SelectItem
                            key={b.code}
                            value={b.code}
                          >
                            {formatBundleSize(b.data_mb)}
                            {" "}
                            —
                            {fmtCurrency(Number(b.price_ngn))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })()}

            {allocBundleObj && parsedAllocNumbers.length > 0 && (
              <div className="rounded-md border bg-muted/40 p-3 flex items-center justify-between">
                <div className="text-sm">
                  <p className="font-medium">{allocBundleObj.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmtCurrency(Number(allocBundleObj.price_ngn))}
                  </p>
                </div>
                <p className="text-base font-semibold">{fmtCurrency(allocTotalCost)}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAllocOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleAllocate}
              disabled={!allocBundle || parsedAllocNumbers.length === 0 || topup.isPending}
            >
              <Zap className="h-4 w-4 mr-2" />
              {topup.isPending ? "Allocating..." : "Allocate Bundle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Allocation Dialog */}
      <Dialog
        open={viewOpen}
        onOpenChange={setViewOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-primary" />
              {" "}
              Allocation Details
            </DialogTitle>
            <DialogDescription>Full details for this bundle allocation.</DialogDescription>
          </DialogHeader>
          {viewAlloc && (() => {
            const b = viewAlloc.bundle ?? catalog.find(c => c.code === viewAlloc.bundle_code);
            const pct = viewAlloc.data_mb_total > 0 ? (viewAlloc.data_mb_used / viewAlloc.data_mb_total) * 100 : 0;
            const days = viewAlloc.days_left ?? Math.ceil((new Date(viewAlloc.expires_at).getTime() - Date.now()) / 86400000);
            const status = String(viewAlloc.status).toUpperCase();
            const isExpired = status === "EXPIRED" || days <= 0;
            const remainingMb = Math.max(
              0,
              viewAlloc.data_mb_total - viewAlloc.data_mb_used,
            );
            return (
              <div className="space-y-4 py-2 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Mobile Number</p>
                    <p className="font-medium">{formatMobile(viewAlloc.msisdn)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    {isExpired
                      ? <Badge variant="destructive">Expired</Badge>
                      : <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>{status}</Badge>}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bundle</p>
                    <p className="font-medium">{b?.name ?? viewAlloc.bundle_code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Carrier</p>
                    <p className="font-medium">{b?.carrier ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Plan Type</p>
                    <p className="font-medium capitalize">{b?.billingCycle ?? b?.billing_cycle ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-medium">{b ? fmtCurrency(Number(b.price ?? b.price_ngn)) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Activated</p>
                    <p className="font-medium">{formatDate(viewAlloc.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expires</p>
                    <p className="font-medium">
                      {formatDate(viewAlloc.expires_at)}
                      {!isExpired && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (
                          {days}
                          d left)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Data Usage</p>
                    <p className="text-xs font-medium">
                      {pct.toFixed(1)}
                      %
                    </p>
                  </div>
                  <Progress
                    value={pct}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formatBundleSize(viewAlloc.data_mb_used)}
                    {" "}
                    used ·
                    {formatBundleSize(remainingMb)}
                    {" "}
                    remaining of
                    {formatBundleSize(viewAlloc.data_mb_total)}
                  </p>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="gradient"
              onClick={() => {
                if (!viewAlloc)
                  return;
                const b = viewAlloc.bundle ?? catalog.find(c => c.code === viewAlloc.bundle_code);
                setAllocCarrier(b?.carrier ?? "");
                setAllocCycle(b?.billingCycle ?? b?.billing_cycle ?? "");
                setAllocBundle(viewAlloc.bundle_code);
                setAllocNumbers(formatMobile(viewAlloc.msisdn));
                setViewOpen(false);
                setAllocOpen(true);
              }}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              {" "}
              Allocate Bundle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto Top-up Dialog */}
      <Dialog
        open={autoOpen}
        onOpenChange={setAutoOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              {" "}
              {auto.enabled ? "Auto Top-Up" : "Enable Auto Top-Up"}
            </DialogTitle>
            <DialogDescription>
              Automatically add funds when your balance drops below a threshold
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                {" "}
                How it works
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                When your wallet balance drops below
                {" "}
                {fmtCurrency(auto.triggerBalance)}
                , we'll automatically top up
                {" "}
                {fmtCurrency(auto.topupAmount)}
                {" "}
                using MTN MoMo.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Top-up when balance drops below</Label>
              <div className="grid grid-cols-4 gap-2">
                {TRIGGER_PRESETS.map(v => (
                  <Button
                    key={v}
                    type="button"
                    variant={auto.triggerBalance === v ? "gradient" : "outline"}
                    size="sm"
                    onClick={() => setAuto({
                      ...auto, triggerBalance: v,
                    })}
                  >
                    ₦
                    {v.toLocaleString()}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                min={0}
                value={auto.triggerBalance}
                onChange={e => setAuto({
                  ...auto, triggerBalance: Number(e.target.value),
                })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Amount to add each time</Label>
              <div className="grid grid-cols-4 gap-2">
                {AMOUNT_PRESETS.map(v => (
                  <Button
                    key={v}
                    type="button"
                    variant={auto.topupAmount === v ? "gradient" : "outline"}
                    size="sm"
                    onClick={() => setAuto({
                      ...auto, topupAmount: v,
                    })}
                  >
                    ₦
                    {v.toLocaleString()}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                min={0}
                value={auto.topupAmount}
                onChange={e => setAuto({
                  ...auto, topupAmount: Number(e.target.value),
                })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">MTN MoMo Phone Number</Label>
              <Input
                placeholder="e.g., 0803 123 4567"
                value={auto.momoPhone}
                onChange={e => setAuto({
                  ...auto, momoPhone: e.target.value,
                })}
              />
              <p className="text-xs text-muted-foreground">
                Payment will be automatically collected from this number
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAutoOpen(false)}
            >
              Cancel
            </Button>
            {auto.enabled && (
              <Button
                variant="outline"
                onClick={disableAuto}
                disabled={disableAutoTopup.isPending || saveAutoTopup.isPending}
              >
                Disable
              </Button>
            )}
            <Button
              variant="gradient"
              onClick={saveAuto}
              disabled={!auto.momoPhone || saveAutoTopup.isPending || disableAutoTopup.isPending}
            >
              <Zap className="h-4 w-4 mr-2" />
              {saveAutoTopup.isPending ? "Saving..." : auto.enabled ? "Save Auto Top-Up" : "Enable Auto Top-Up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Spending Limits Dialog */}
      <Dialog
        open={limitOpen}
        onOpenChange={setLimitOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {" "}
              {limit.enabled ? "Spending Limit" : "Enable Spending Limit"}
            </DialogTitle>
            <DialogDescription>
              Cap your monthly communication costs and get notified before you hit the limit
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                {" "}
                How it works
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Communications will be blocked once your monthly spending reaches the limit you set. You'll be notified at 80% and 100% usage.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Monthly Limit (₦)</Label>
              <Input
                type="number"
                min={0}
                value={limit.monthlyLimit}
                onChange={e => setLimit({
                  ...limit, monthlyLimit: Number(e.target.value),
                })}
              />
              <p className="text-xs text-muted-foreground">
                Spent this month:
                {fmtCurrency(spendingLimit?.spentThisMonth ?? monthSpend)}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reset Day of Month</Label>
              <Select
                value={String(limit.resetDay)}
                onValueChange={v => setLimit({
                  ...limit, resetDay: Number(v),
                })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from(
                    { length: 28 },
                    (_, i) => i + 1,
                  ).map(d => (
                    <SelectItem
                      key={d}
                      value={String(d)}
                    >
                      Day
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Usage counter resets on this day each month</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {" "}
                Alert Email
              </Label>
              <Input
                type="email"
                placeholder="alerts@company.com"
                value={limit.alertEmail}
                onChange={e => setLimit({
                  ...limit, alertEmail: e.target.value,
                })}
              />
              <p className="text-xs text-muted-foreground">Receive email notifications at 80% and 100% of your limit</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLimitOpen(false)}
            >
              Cancel
            </Button>
            {limit.enabled && (
              <Button
                variant="outline"
                onClick={disableLimit}
                disabled={disableSpendingLimit.isPending || saveSpendingLimit.isPending}
              >
                Disable
              </Button>
            )}
            <Button
              variant="gradient"
              onClick={saveLimit}
              disabled={!limit.alertEmail || saveSpendingLimit.isPending || disableSpendingLimit.isPending}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              {saveSpendingLimit.isPending ? "Saving..." : limit.enabled ? "Save Spending Limit" : "Enable Spending Limit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DataBundlesLayout;
