import type { DashboardPeriod } from "@/features/dashboard/utils/dashboardPeriod";
import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { PageTitle } from "@/shared/components/layout/PageTitle";
import { DataUsageCard } from "../overview/DataUsageCard";
import { DeviceManufacturersCard } from "../overview/DeviceManufacturersCard";
import { OverviewStats } from "../overview/OverviewStats";
import { PeriodSelect } from "../overview/PeriodSelect";
import { PlatformTotalsCard } from "../overview/PlatformTotalsCard";
import { QuickActions } from "../overview/QuickActions";
import { RecentActivityCard } from "../overview/RecentActivityCard";
import { RevenueTrendCard } from "../overview/RevenueTrendCard";
import { StakeholderOverviewTab } from "../overview/StakeholderOverviewTab";
import { VehiclesPerTenantCard } from "../overview/VehiclesPerTenantCard";

/** Fleetflow's PlatformDashboard (fleetflow-pro-fork-main `pages/platform/PlatformDashboard.tsx`). */
export default function PlatformDashboard() {
  // Period selector filters tenant-derived KPIs, charts and recent activity.
  const [
    period,
    setPeriod,
  ] = useState<DashboardPeriod>("overall");

  return (
    <div className="space-y-6">
      {/* Main Content Tabs */}
      <Tabs
        defaultValue="overview"
        className="space-y-4"
      >
        <PageTitle
          primaryActions={(
            <PeriodSelect
              value={period}
              onChange={setPeriod}
              inline
              options={[
                {
                  value: "thisWeek",
                  label: "This Week",
                },
                {
                  value: "lastWeek",
                  label: "Last Week",
                },
                {
                  value: "overall",
                  label: "Overall",
                },
              ]}
            />
          )}
        />

        {/* Quick Actions container with descriptive cards (horizontal scroll) */}
        <QuickActions />

        {/* Primary Stats Grid — the only KPIs on this dashboard */}
        <OverviewStats period={period} />

        <div className="flex justify-center">
          <TabsList className="h-auto max-w-full flex-wrap gap-1">
            <TabsTrigger value="overview">System Overview</TabsTrigger>
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="iot">Devices & SIMs</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="overview"
          className="space-y-6"
        >
          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueTrendCard />
            <PlatformTotalsCard period={period} />
          </div>

          <RecentActivityCard period={period} />
        </TabsContent>

        <TabsContent
          value="tenants"
          className="space-y-6"
        >
          <StakeholderOverviewTab />
          <VehiclesPerTenantCard period={period} />
        </TabsContent>

        <TabsContent
          value="iot"
          className="space-y-6"
        >
          <div className="grid gap-6">
            <DeviceManufacturersCard />
          </div>

          <DataUsageCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
