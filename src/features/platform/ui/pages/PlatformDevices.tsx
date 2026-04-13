import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/dashboard/StatCard";
import { PlatformDeviceManagement } from "@/components/devices/PlatformDeviceManagement";
import { PlatformDeviceTrackingContent } from "@/components/devices/PlatformDeviceTracking";
import { DeviceCatalogManager } from "@/components/devices/DeviceCatalogManager";
import { useDeviceTelemetry } from "@/hooks/useDeviceTelemetry";
import { usePlatformDevices } from "@/features/platform/application/hooks/usePlatformDevices";
import {
  Cpu,
  MapPin,
  Activity,
  AlertTriangle,
  Signal,
  Satellite,
  BookOpen,
  WifiOff,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlatformDevices() {
  const [activeTab, setActiveTab] = useState("management");
  const {
    summary,
    inventory,
    catalog,
    catalogReferenceData,
    inventoryFilters,
    catalogFilters,
    setInventoryFilter,
    setCatalogFilter,
    refreshAll,
    exportInventory,
    createDeviceModel,
    updateDeviceModel,
    deleteDeviceModel,
    isSummaryLoading,
    isInventoryLoading,
    isCatalogLoading,
    isCatalogReferenceDataLoading,
    isRefreshing,
    isExportingInventory,
    isCreatingDeviceModel,
    isUpdatingDeviceModel,
    isDeletingDeviceModel,
  } = usePlatformDevices();

  // Tracking stays on the telemetry hook because the map, simulator, and events
  // still depend on realtime device data that is not part of the system inventory API.
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
  } = useDeviceTelemetry(undefined, true);

  /*
    Preserved legacy page-level device stats and tenant lookup for later use.

    const { tenants } = useTenants();

    const tenantNameMap = useMemo(() => {
      const map: Record<string, string> = {};
      tenants.forEach(tenant => {
        map[tenant.id] = tenant.name;
        if (tenant.slug) {
          map[tenant.slug] = tenant.name;
        }
      });
      return map;
    }, [tenants]);

    const stats = {
      total: devices.length,
      verified: devices.filter(d =>
        ['verified_online', 'assignable', 'assigned', 'active'].includes(d.lifecycle_status || d.status)
      ).length,
      pending: devices.filter(d =>
        ['registered', 'config_pending', 'configured'].includes(d.lifecycle_status || d.status)
      ).length,
      online: devices.filter(d => {
        if (!d.last_seen) return false;
        const lastSeen = new Date(d.last_seen);
        return Date.now() - lastSeen.getTime() < 5 * 60 * 1000;
      }).length,
      faulty: devices.filter(d => (d.lifecycle_status || d.status) === 'faulty').length,
      events24h: recentEvents.filter(e => {
        const eventTime = new Date(e.created_at);
        return Date.now() - eventTime.getTime() < 24 * 60 * 60 * 1000;
      }).length,
    };
  */

  return (
    <div className="space-y-6">
      {/* Stats - Same data for both tabs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {isSummaryLoading ? (
          Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))
        ) : (
          <>
            <StatCard
              title="Total Devices"
              value={summary?.totalDevices ?? 0}
              icon={Satellite}
              changeLabel="Registered devices"
            />
            <StatCard
              title="Verified / Active"
              value={summary?.verifiedActiveDevices ?? 0}
              icon={Activity}
              changeLabel="Ready for assignment"
            />
            <StatCard
              title="Pending Config"
              value={summary?.pendingConfigDevices ?? 0}
              icon={WifiOff}
              changeLabel="Awaiting verification"
            />
            <StatCard
              title="Online Now"
              value={summary?.onlineNowDevices ?? 0}
              icon={Signal}
              changeLabel="Last 5 minutes"
            />
            <StatCard
              title="Faulty"
              value={summary?.faultyDevices ?? 0}
              icon={AlertTriangle}
              changeLabel="Needs attention"
            />
          </>
        )}
      </div>

      {/* Tabs for Management, Tracking, and Catalog */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Device Inventory
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Live Tracking
          </TabsTrigger>
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Device Catalog
          </TabsTrigger>
        </TabsList>

        <TabsContent value="management" className="mt-4">
          <PlatformDeviceManagement
            devices={inventory?.devices ?? []}
            total={inventory?.total ?? 0}
            loading={isInventoryLoading}
            isRefreshing={isRefreshing}
            isExporting={isExportingInventory}
            filters={inventoryFilters}
            onRefresh={refreshAll}
            onExport={exportInventory}
            onFilterChange={setInventoryFilter}
          />
        </TabsContent>

        <TabsContent value="tracking" className="mt-4">
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

        <TabsContent value="catalog" className="mt-4">
          <DeviceCatalogManager
            catalog={catalog?.models ?? []}
            total={catalog?.total ?? 0}
            loading={isCatalogLoading || isCatalogReferenceDataLoading}
            isRefreshing={isRefreshing}
            isCreating={isCreatingDeviceModel}
            isUpdating={isUpdatingDeviceModel}
            isDeleting={isDeletingDeviceModel}
            filters={catalogFilters}
            referenceData={catalogReferenceData}
            onRefresh={refreshAll}
            onFilterChange={setCatalogFilter}
            onCreate={createDeviceModel}
            onUpdate={updateDeviceModel}
            onDelete={deleteDeviceModel}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
