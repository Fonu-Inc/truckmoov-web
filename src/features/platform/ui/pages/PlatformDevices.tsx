import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/dashboard/StatCard";
import { PlatformDeviceManagement } from "@/components/devices/PlatformDeviceManagement";
import { PlatformDeviceTrackingContent } from "@/components/devices/PlatformDeviceTracking";
import { DeviceCatalogManager } from "@/components/devices/DeviceCatalogManager";
import { useDeviceTelemetry } from "@/hooks/useDeviceTelemetry";
import { useTenants } from "@/hooks/useTenants";
import {
  Cpu,
  WifiOff,
  MapPin,
  Activity,
  AlertTriangle,
  Signal,
  Satellite,
  BookOpen,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlatformDevices() {
  const [activeTab, setActiveTab] = useState("management");
  
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
  } = useDeviceTelemetry(undefined, true);

  // Fetch tenants for name lookup - useTenants has proper auth handling
  const { tenants } = useTenants();

  // Build tenant name lookup map (by id and slug)
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

  // Calculate stats from actual data (support both lifecycle_status and legacy status)
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
      return Date.now() - lastSeen.getTime() < 5 * 60 * 1000; // 5 minutes
    }).length,
    faulty: devices.filter(d => (d.lifecycle_status || d.status) === 'faulty').length,
    events24h: recentEvents.filter(e => {
      const eventTime = new Date(e.created_at);
      return Date.now() - eventTime.getTime() < 24 * 60 * 60 * 1000;
    }).length,
  };

  return (
    <DashboardLayout
      title="Device Management"
      subtitle="Manage and track all devices across tenants"
    >
      <div className="space-y-6">
        {/* Stats - Same data for both tabs */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {loading ? (
            Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))
          ) : (
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
              devices={devices}
              loading={loading}
              onRefresh={refetch}
              tenantNameMap={tenantNameMap}
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
            <DeviceCatalogManager />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
