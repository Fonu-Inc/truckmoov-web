import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { DataUsageCard } from "../overview/DataUsageCard";
import { DeviceManufacturersCard } from "../overview/DeviceManufacturersCard";
import { IotStats } from "../overview/IotStats";
import { OverviewStats } from "../overview/OverviewStats";
import { QuickActions } from "../overview/QuickActions";
import { RecentActivityCard } from "../overview/RecentActivityCard";
import { RevenueTrendCard } from "../overview/RevenueTrendCard";
import { SimCarrierCard } from "../overview/SimCarrierCard";
import { SystemHealthCard } from "../overview/SystemHealthCard";
import { TenantsByPlanCard } from "../overview/TenantsByPlanCard";
import { TopTenantsCard } from "../overview/TopTenantsCard";

export default function PlatformDashboard() {
  return (
    <div className="space-y-6">
      <QuickActions />
      <OverviewStats />
      <IotStats />

      <Tabs
        defaultValue="overview"
        className="space-y-4"
      >
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="overview">System Overview</TabsTrigger>
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="iot">IoT & SIMs</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="overview"
          className="space-y-6"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueTrendCard />
            <SystemHealthCard />
          </div>
          <RecentActivityCard />
        </TabsContent>

        <TabsContent
          value="tenants"
          className="space-y-6"
        >
          <div className="grid gap-6 lg:grid-cols-3">
            <TopTenantsCard />
            <TenantsByPlanCard />
          </div>
        </TabsContent>

        <TabsContent
          value="iot"
          className="space-y-6"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <DeviceManufacturersCard />
            <SimCarrierCard />
          </div>
          <DataUsageCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
