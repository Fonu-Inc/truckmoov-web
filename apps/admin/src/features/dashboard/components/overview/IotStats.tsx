import { useQuery } from "@tanstack/react-query";
import {
  getSystemDevicesSummaryQueryOptions,
  getSystemSimDataUsageQueryOptions,
  getSystemSimsSummaryQueryOptions,
} from "@truckmoov/api/auth";
import { Cpu, Database, Radio, Smartphone, TrendingUp } from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import { DATA_USAGE_REFRESH_MS, formatCount, formatDataMb } from "./overviewFormat";
import { MetricCard } from "./MetricCard";

const LIVE_WINDOW_MS = DATA_USAGE_REFRESH_MS * 2;
const OVERVIEW_USAGE_DAYS = 7;
const SUCCESS_BADGE = "bg-success/10 text-success border-success/30 text-xs";

export function IotStats() {
  const sims = useQuery(getSystemSimsSummaryQueryOptions());
  const devices = useQuery(getSystemDevicesSummaryQueryOptions());
  const usage = useQuery({
    ...getSystemSimDataUsageQueryOptions(OVERVIEW_USAGE_DAYS),
    refetchInterval: DATA_USAGE_REFRESH_MS,
  });
  const isLive = !usage.isError && usage.dataUpdatedAt > Date.now() - LIVE_WINDOW_MS;
  const activeSims = sims.data?.data.active;
  const onlineDevices = devices.data?.data.onlineNowDevices;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
      <MetricCard
        title="Total IoT SIMs"
        value={formatCount(sims.data?.data.total)}
        icon={Smartphone}
        tileClassName="bg-success/10"
        iconClassName="text-success"
        isLoading={sims.isLoading}
        isError={sims.isError}
        onRetry={sims.refetch}
        badge={activeSims == null ? null : <Badge className={SUCCESS_BADGE}>{`${activeSims.toLocaleString()} Active`}</Badge>}
      />
      <MetricCard
        title="Total IoT Devices"
        value={formatCount(devices.data?.data.totalDevices)}
        icon={Cpu}
        tileClassName="bg-primary/10"
        iconClassName="text-primary"
        isLoading={devices.isLoading}
        isError={devices.isError}
        onRetry={devices.refetch}
        badge={onlineDevices == null ? null : <Badge className={SUCCESS_BADGE}>{`${onlineDevices.toLocaleString()} Online`}</Badge>}
      />
      <MetricCard
        title="Data Usage Today"
        value={formatDataMb(usage.data?.data.todayMb)}
        icon={Radio}
        tileClassName="bg-warning/10"
        iconClassName="text-warning"
        isLoading={usage.isLoading}
        isError={usage.isError}
        onRetry={usage.refetch}
        badge={isLive
          ? (
              <Badge
                variant="outline"
                className="text-xs"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Live
              </Badge>
            )
          : null}
      />
      <MetricCard
        title="Total Data Bought"
        value={formatDataMb(usage.data?.data.totalBoughtMb)}
        icon={Database}
        tileClassName="bg-muted"
        iconClassName="text-muted-foreground"
        isLoading={usage.isLoading}
        isError={usage.isError}
        onRetry={usage.refetch}
        badge={(
          <Badge
            variant="outline"
            className="text-xs"
          >
            Across all bundles
          </Badge>
        )}
      />
    </div>
  );
}
