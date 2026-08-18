import { useQuery } from "@tanstack/react-query";
import { getSystemDevicesSummaryQueryOptions } from "@truckmoov/api/auth";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Cpu,
  Satellite,
  Signal,
  WifiOff,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { DeviceCatalogManager } from "@/components/devices/DeviceCatalogManager";
import { DeviceProvisioningQueue } from "@/components/devices/DeviceProvisioningQueue";
import { PlatformDeviceManagement } from "@/components/devices/PlatformDeviceManagement";
import { PlatformDeviceTrackingContent } from "@/components/devices/PlatformDeviceTracking";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { useDeviceTelemetry } from "@/hooks/useDeviceTelemetry";

export default function PlatformDevices() {
  const [
    activeTab,
    setActiveTab,
  ] = useState("management");
  const summaryQuery = useQuery(getSystemDevicesSummaryQueryOptions());

  // Single source of truth for device data
  const {
    devices,
    recentEvents,
    loading,
    error,
    refetch,
    isSimulating,
    startSimulation,
    stopSimulation,
    trailHistory,
    clearTrailHistory,
  } = useDeviceTelemetry(
    undefined,
    true,
  );

  // Stats are sourced from the system summary endpoint.
  const stats = useMemo(
    () => {
      const summary = summaryQuery.data?.data;

      return {
        total: summary?.totalDevices ?? "N/A",
        verified: summary?.verifiedActiveDevices ?? "N/A",
        pending: summary?.pendingConfigDevices ?? "N/A",
        online: summary?.onlineNowDevices ?? "N/A",
        faulty: summary?.faultyDevices ?? "N/A",
      };
    },
    [summaryQuery.data],
  );

  return (
    <DashboardLayout
      title="Device Management"
      subtitle="Manage and track all devices across tenants"
    >
      <div className="space-y-6">
        {/* Stats - Same data for both tabs */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {loading
            ? (
                Array.from({ length: 5 }).fill(0).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-24"
                  />
                ))
              )
            : (
                <>
                  <StatCard
                    title="Total Devices"
                    value={stats.total}
                    icon={Satellite}
                    changeLabel="Registered devices"
                  />
                  <StatCard
                    title="Verified / Active"
                    value={stats.verified}
                    icon={Activity}
                    changeLabel="Ready for assignment"
                  />
                  <StatCard
                    title="Pending Config"
                    value={stats.pending}
                    icon={WifiOff}
                    changeLabel="Awaiting verification"
                  />
                  <StatCard
                    title="Online Now"
                    value={stats.online}
                    icon={Signal}
                    changeLabel="Last 5 minutes"
                  />
                  <StatCard
                    title="Faulty"
                    value={stats.faulty}
                    icon={AlertTriangle}
                    changeLabel="Needs attention"
                  />
                </>
              )}
        </div>

        {/* Tabs for Management, Tracking, and Catalog */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <div className="flex justify-center">
            <TabsList>
              <TabsTrigger
                value="management"
                className="flex items-center gap-2"
              >
                <Cpu className="h-4 w-4" />
                Device Inventory
              </TabsTrigger>
              {/* <TabsTrigger value="tracking" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Live Tracking
              </TabsTrigger>
              <TabsTrigger value="approval" className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Approval Queue
              </TabsTrigger> */}
              <TabsTrigger
                value="catalog"
                className="flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Device Catalog
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="management"
            className="mt-4"
          >
            <PlatformDeviceManagement />
          </TabsContent>

          <TabsContent
            value="tracking"
            className="mt-4"
          >
            <PlatformDeviceTrackingContent
              devices={devices}
              recentEvents={recentEvents}
              loading={loading}
              error={error}
              onRefresh={refetch}
              isSimulating={isSimulating}
              startSimulation={startSimulation}
              stopSimulation={stopSimulation}
              trailHistory={trailHistory}
              clearTrailHistory={clearTrailHistory}
              geofences={[]}
            />
          </TabsContent>

          <TabsContent
            value="approval"
            className="mt-4"
          >
            <DeviceProvisioningQueue />
          </TabsContent>

          <TabsContent
            value="catalog"
            className="mt-4"
          >
            <DeviceCatalogManager />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
