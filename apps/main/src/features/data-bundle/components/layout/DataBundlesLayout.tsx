import { useQuery } from "@tanstack/react-query";
import {
  getDataBundleAllocationsQueryOptions,
  getDataBundleCarriersQueryOptions,
  getDataBundleDashboardSummaryQueryOptions,
} from "@truckmoov/api/auth";
import { formatDate } from "@truckmoov/app-core/utils/time-utils";
import {
  Activity, AlertTriangle, Clock, Database, Plus, Smartphone, TrendingUp, Wallet, Wifi,
} from "lucide-react";
import { useState } from "react";
import {
  Link, NavLink, Outlet,
} from "react-router";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  Alert, AlertDescription, AlertTitle,
} from "@/components/shadcn/alert";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Progress } from "@/components/shadcn/progress";
import { Skeleton } from "@/components/shadcn/skeleton";
import { TopUpBundleDialog } from "@/features/data-bundle/components/ui/TopUpBundleDialog";
import {
  formatBundleSize,
  formatDataUsedGb,
  formatMobile,
  formatNgn,
  useCarrierName,
  useDataBundleCatalog,
} from "@/features/data-bundle/utils/dataBundle";
import { DATA_BUNDLE_TABS } from "@/features/data-bundle/utils/dataBundleNav";
import { InstallationGate } from "@/features/get-started/components/ui/InstallationGate";
import { useInstallationPending } from "@/features/get-started/hooks/useInstallationPending";
import { cn } from "@/lib/utils";

export type DataBundlesLayoutContext = {
  openTopUp: (mobileNumber?: string) => void;
  openViewAllocation: (alloc: any) => void;
};

// ponytail: the design (fleetflow DataBundles.tsx) defines Auto Top-up and Spending Limit
// dialogs but nothing on the page opens them, so neither is shown here. The API hooks
// (useSaveDataBundleAutoTopup / useSaveDataBundleSpendingLimit) remain in packages/api.
export function DataBundlesLayout() {
  const { catalog } = useDataBundleCatalog();
  const installationPending = useInstallationPending();
  const carriersQuery = useQuery(getDataBundleCarriersQueryOptions());
  const carrierName = useCarrierName(carriersQuery.data?.data.carriers);
  const summaryQuery = useQuery(getDataBundleDashboardSummaryQueryOptions());
  const summary = summaryQuery.data?.data;
  // Only the total is needed here — the summary has no "all allocations" count.
  const allocationsQuery = useQuery(getDataBundleAllocationsQueryOptions({
    params: {
      page: 1, limit: 1,
    },
  }));

  const [
    topUpOpen,
    setTopUpOpen,
  ] = useState(false);
  const [
    topUpNumber,
    setTopUpNumber,
  ] = useState<string | undefined>();
  const [
    viewAlloc,
    setViewAlloc,
  ] = useState<any | null>(null);

  const openTopUp = (mobileNumber?: string) => {
    setTopUpNumber(mobileNumber);
    setTopUpOpen(true);
  };

  const ctx: DataBundlesLayoutContext = {
    openTopUp,
    openViewAllocation: setViewAlloc,
  };

  const stats = {
    total: allocationsQuery.data?.data?.total ?? 0,
    active: summary?.activeAllocations ?? 0,
    expiring: summary?.expiringWithinSevenDays ?? 0,
    expired: summary?.expiredAllocations ?? 0,
    dataUsed: formatDataUsedGb(summary?.totalDataUsedGb ?? 0),
  };

  if (summaryQuery.isLoading || allocationsQuery.isLoading) {
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {Array.from(
            { length: 5 },
            (_, index) => (
              <Skeleton
                key={index}
                className="h-28 w-full"
              />
            ),
          )}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const error = summaryQuery.error ?? allocationsQuery.error;
  if (error) {
    return (
      <div role="alert">
        {error.message}
        <Button
          variant="link"
          onClick={() => {
            summaryQuery.refetch();
            allocationsQuery.refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Data Bundles</h1>
          <p className="text-sm text-muted-foreground">
            Manage bundle allocations, top-ups, auto-renewal and spending limits
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/wallet"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/60 bg-card/50 px-3.5 text-sm hover:bg-muted/40"
            title="Wallet balance shared by bundles and communications — fund it on the Wallet page"
          >
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Wallet</span>
            <span className="font-semibold">{formatNgn(summary?.walletBalance ?? 0)}</span>
          </Link>
          <InstallationGate pending={installationPending}>
            <Button
              variant="gradient"
              disabled={installationPending}
              onClick={() => openTopUp()}
            >
              <Plus className="h-4 w-4 mr-2" />
              {" "}
              Top Up Bundle
            </Button>
          </InstallationGate>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Bundles"
          value={stats.total}
          icon={Database}
        />
        <StatCard
          title="Active Bundles"
          value={stats.active}
          icon={Activity}
          variant="success"
        />
        <StatCard
          title="Bundles Expiring Soon"
          value={stats.expiring}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Bundles Expired"
          value={stats.expired}
          icon={AlertTriangle}
          variant="danger"
        />
        <StatCard
          title="Total Data Used"
          value={stats.dataUsed}
          icon={TrendingUp}
        />
      </div>

      {stats.expired > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {stats.expired}
            {" "}
            bundle(s) expired
          </AlertTitle>
          <AlertDescription>These SIMs are no longer carrying data. Top up to restore service.</AlertDescription>
        </Alert>
      )}
      {stats.expiring > 0 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>
            {stats.expiring}
            {" "}
            bundle(s) expiring within 7 days
          </AlertTitle>
          <AlertDescription>Renew now or enable auto top-up to avoid interruption.</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <nav
          aria-label="Data bundle sections"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-muted/60 p-1 text-muted-foreground"
        >
          {DATA_BUNDLE_TABS.map(t => (
            <NavLink
              key={t.to}
              to={t.to}
              end
              className={({ isActive }) => cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium ring-offset-background transition-all duration-150",
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

      <TopUpBundleDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        initialMobileNumber={topUpNumber}
      />

      <Dialog
        open={Boolean(viewAlloc)}
        onOpenChange={open => !open && setViewAlloc(null)}
      >
        <DialogContent className="max-w-md sm:rounded-2xl">
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
            const carrierId = viewAlloc.bundle?.carrier ?? b?.carrierId;
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
                    <p className="font-medium">{carrierId ? carrierName(carrierId) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Plan Type</p>
                    <p className="font-medium capitalize">{b?.billingCycle ?? b?.billing_cycle ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-medium">{b ? formatNgn(Number(b.price ?? b.price_ngn)) : "—"}</p>
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
                    {" used · "}
                    {formatBundleSize(remainingMb)}
                    {" remaining of "}
                    {formatBundleSize(viewAlloc.data_mb_total)}
                  </p>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewAlloc(null)}
            >
              Close
            </Button>
            <Button
              variant="gradient"
              onClick={() => {
                const number = viewAlloc?.msisdn;
                setViewAlloc(null);
                openTopUp(number);
              }}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              {" "}
              Top Up Bundle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
