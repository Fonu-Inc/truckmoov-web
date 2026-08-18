import type { GeofenceZone } from "@/components/devices/DeviceRealtimeMap";
import type {
  DeviceWithTelemetry,
  DriverBehaviorEvent,
} from "@/hooks/useDeviceTelemetry";
import {
  AlertTriangle,
  Download,
  Pause,
  Play,
  Trash2,

} from "lucide-react";
import { useState } from "react";
import { DeviceList } from "@/components/devices/DeviceList";
import { DeviceRealtimeMap } from "@/components/devices/DeviceRealtimeMap";
import { DeviceTelemetryPanel } from "@/components/devices/DeviceTelemetryPanel";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
// useGeofences deleted — using inline type alias
type Geofence = any;

type TrailPoint = {
  lat: number;
  lng: number;
  timestamp: string;
};

type PlatformDeviceTrackingContentProps = {
  devices: DeviceWithTelemetry[];
  recentEvents: DriverBehaviorEvent[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  isSimulating: boolean;
  startSimulation: () => void;
  stopSimulation: () => void;
  trailHistory: Map<string, TrailPoint[]>;
  clearTrailHistory: () => void;
  geofences?: Geofence[];
};

export function PlatformDeviceTrackingContent({
  devices,
  recentEvents,
  loading,
  error,
  onRefresh,
  isSimulating,
  startSimulation,
  stopSimulation,
  trailHistory,
  clearTrailHistory,
  geofences,

}: PlatformDeviceTrackingContentProps) {
  const [
    selectedDevice,
    setSelectedDevice,
  ] = useState<string | null>(null);
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");
  const [
    activeView,
    setActiveView,
  ] = useState<"map" | "list" | "events">("map");

  const selectedDeviceData = devices.find(d => d.id === selectedDevice) || null;

  if (error) {
    return (
      <div className="p-6 text-center text-destructive">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
        <p>
          Error loading devices:
          {error}
        </p>
        <Button
          onClick={onRefresh}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tracking Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <Button
            variant={activeView === "map" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("map")}
          >
            Live Map
          </Button>
          <Button
            variant={activeView === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("list")}
          >
            Device List
          </Button>
          <Button
            variant={activeView === "events" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("events")}
          >
            Events
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={isSimulating ? "destructive" : "default"}
            size="sm"
            onClick={isSimulating ? stopSimulation : startSimulation}
          >
            {isSimulating
              ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    <span className="truncate">Stop Simulation</span>
                  </>
                )
              : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    <span className="truncate">Start Simulation</span>
                  </>
                )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearTrailHistory}
            title="Clear trail history"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            <span className="truncate">Clear Trails</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            <span className="truncate">Export Data</span>
          </Button>
        </div>
      </div>

      {/* Map View */}
      {activeView === "map" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Device List Sidebar */}
          <div className="lg:col-span-1">
            <DeviceList
              devices={devices}
              selectedDevice={selectedDevice}
              onSelectDevice={setSelectedDevice}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            {loading ? (
              <Skeleton className="h-[600px]" />
            ) : (
              <DeviceRealtimeMap
                devices={devices}
                selectedDevice={selectedDevice}
                onSelectDevice={setSelectedDevice}
                trailHistory={trailHistory}
                geofences={(geofences || []).map((gf) => {
                  // Convert database Geofence to map GeofenceZone
                  const geometry = gf.geometry as {
                    type: string;
                    coordinates: [number, number];
                  } | null;
                  const center: [number, number] = geometry?.coordinates || [
                    0,
                    0,
                  ];
                  return {
                    id: gf.id,
                    name: gf.name,
                    center,
                    radius: gf.radius_meters || 500,
                    color: gf.color || "#3b82f6",
                    type: (gf.category as GeofenceZone["type"]) || "custom",
                    isActive: gf.status === "ACTIVE",
                  };
                })}
              />
            )}
          </div>

          {/* Telemetry Panel */}
          <div className="lg:col-span-1">
            <DeviceTelemetryPanel
              device={selectedDeviceData}
              recentEvents={recentEvents}
            />
          </div>
        </div>
      )}

      {/* List View */}
      {activeView === "list" && (
        <Card>
          <CardHeader>
            <CardTitle>All Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">IMEI</th>
                    <th className="text-left p-2">Manufacturer</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Protocol</th>
                    <th className="text-left p-2">Signal</th>
                    <th className="text-left p-2">Battery</th>
                    <th className="text-left p-2">Speed</th>
                    <th className="text-left p-2">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.length === 0
                    ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="p-8 text-center text-muted-foreground"
                          >
                            No devices found. Run the simulator to create test devices.
                          </td>
                        </tr>
                      )
                    : (
                        devices.map(device => (
                          <tr
                            key={device.id}
                            className="border-b hover:bg-muted/50 cursor-pointer"
                            onClick={() => {
                              setSelectedDevice(device.id);
                              setActiveView("map");
                            }}
                          >
                            <td className="p-2 font-mono">{device.imei}</td>
                            <td className="p-2">
                              {device.manufacturer}
                              {" "}
                              {device.model}
                            </td>
                            <td className="p-2">
                              <Badge variant="outline">{device.status}</Badge>
                            </td>
                            <td className="p-2 uppercase text-xs">{device.protocol}</td>
                            <td className="p-2">
                              {device.signal_strength ?? "-"}
                              %
                            </td>
                            <td className="p-2">
                              {device.battery_level ?? "-"}
                              %
                            </td>
                            <td className="p-2">
                              {device.speed?.toFixed(0) ?? "-"}
                              {" "}
                              km/h
                            </td>
                            <td className="p-2 text-sm text-muted-foreground">
                              {device.last_seen
                                ? new Date(device.last_seen).toLocaleString()
                                : "Never"}
                            </td>
                          </tr>
                        ))
                      )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events View */}
      {activeView === "events" && (
        <Card>
          <CardHeader>
            <CardTitle>Driver Behavior Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Event Type</th>
                    <th className="text-left p-2">Severity</th>
                    <th className="text-left p-2">Device</th>
                    <th className="text-left p-2">Speed</th>
                    <th className="text-left p-2">Location</th>
                    <th className="text-left p-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((event) => {
                    const device = devices.find(d => d.id === event.device_id);
                    return (
                      <tr
                        key={event.id}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="p-2 capitalize">
                          {event.event_type.replace(
                            "_",
                            " ",
                          )}
                        </td>
                        <td className="p-2">
                          <Badge
                            variant={
                              event.severity === "critical" || event.severity === "high"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {event.severity}
                          </Badge>
                        </td>
                        <td className="p-2 font-mono text-sm">
                          {device?.imei || event.device_id.slice(
                            0,
                            8,
                          )}
                        </td>
                        <td className="p-2">
                          {event.speed?.toFixed(0) ?? "-"}
                          {" "}
                          km/h
                        </td>
                        <td className="p-2 text-sm text-muted-foreground">
                          {event.latitude && event.longitude
                            ? `${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}`
                            : "Unknown"}
                        </td>
                        <td className="p-2 text-sm text-muted-foreground">
                          {new Date(event.created_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                  {recentEvents.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-muted-foreground"
                      >
                        No events recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
