import { useQuery } from "@tanstack/react-query";
import {
  getSystemDashboardQueryOptions,
  getSystemDeviceMessageRateQueryOptions,
  getSystemTenantsSummaryQueryOptions,
} from "@truckmoov/api/auth";
import { Building2, MapPin, Truck, Users, Wallet } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/shadcn/button";
import { formatCount, formatNgn } from "./overviewFormat";

const MESSAGE_RATE_REFRESH_MS = 60000;

function MessageRateNote({ isError, reachable, onRetry }: { isError: boolean; reachable: boolean; onRetry: () => void }) {
  if (isError) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-6 px-2 text-xs"
        onClick={onRetry}
      >
        Retry
      </Button>
    );
  }
  return (
    <span className="text-xs text-muted-foreground">
      {reachable ? "Since tracking restart" : "Tracking unreachable"}
    </span>
  );
}

export function OverviewStats() {
  const dashboard = useQuery(getSystemDashboardQueryOptions());
  const tenants = useQuery(getSystemTenantsSummaryQueryOptions());
  const messages = useQuery({
    ...getSystemDeviceMessageRateQueryOptions(),
    refetchInterval: MESSAGE_RATE_REFRESH_MS,
  });
  const rate = messages.data?.data;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
      <StatCard
        title="Total Tenants"
        value={formatCount(dashboard.data?.data.totalTenants)}
        icon={Building2}
        variant="success"
        loading={dashboard.isLoading}
      />
      <StatCard
        title="Total Vehicles"
        value={formatCount(dashboard.data?.data.totalVehicles)}
        icon={Truck}
        loading={dashboard.isLoading}
      />
      <StatCard
        title="Total Drivers"
        value={formatCount(dashboard.data?.data.totalDrivers)}
        icon={Users}
        loading={dashboard.isLoading}
      />
      <StatCard
        title="GPS Messages/hr"
        value={formatCount(rate?.lastHour)}
        icon={MapPin}
        loading={messages.isLoading}
        footer={(
          <MessageRateNote
            isError={messages.isError}
            reachable={rate?.gateReachable ?? false}
            onRetry={messages.refetch}
          />
        )}
      />
      <StatCard
        title="Collected This Month"
        value={formatNgn(tenants.data?.data.monthlyRevenueNgn)}
        icon={Wallet}
        loading={tenants.isLoading}
      />
    </div>
  );
}
