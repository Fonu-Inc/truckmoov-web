import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/dashboard/StatCard';
import { DeviceRealtimeMap } from '@/components/devices/DeviceRealtimeMap';
import { DeviceTelemetryPanel } from '@/components/devices/DeviceTelemetryPanel';
import { DeviceList } from '@/components/devices/DeviceList';
import { useDeviceTelemetry } from '@/hooks/useDeviceTelemetry';
import {Satellite, Activity, AlertTriangle, Signal, RefreshCw, Settings, Plus, Play, Pause, Trash2, Download} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PlatformDeviceTracking() {
  const { devices, recentEvents, loading, error, refetch, isSimulating, startSimulation, stopSimulation, trailHistory, clearTrailHistory } = useDeviceTelemetry(undefined, true);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('map');

  const selectedDeviceData = devices.find(d => d.id === selectedDevice) || null;

  // Calculate statistics
  const stats = {
    total: devices.length,
    active: devices.filter(d => d.status === 'active').length,
    online: devices.filter(d => {
      if (!d.last_seen) return false;
      const lastSeen = new Date(d.last_seen);
      return Date.now() - lastSeen.getTime() < 5 * 60 * 1000; // 5 minutes
    }).length,
    faulty: devices.filter(d => d.status === 'faulty').length,
    events24h: recentEvents.filter(e => {
      const eventTime = new Date(e.created_at);
      return Date.now() - eventTime.getTime() < 24 * 60 * 60 * 1000;
    }).length };

  if (error) {
    return (
      <DashboardLayout title="Device Tracking" subtitle="Real-time monitoring">
        <div className="p-6 text-center text-red-500">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
          <p>Error loading devices: {error}</p>
          <Button onClick={refetch} className="mt-4">
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Device Tracking" subtitle="Real-time IoT monitoring and management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Device Tracking</h1>
            <p className="text-muted-foreground">
              Real-time monitoring and management of IoT devices
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={isSimulating ? "destructive" : "default"}
              onClick={isSimulating ? stopSimulation : startSimulation}
            >
              {isSimulating ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Simulation
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Simulation
                </>
              )}
            </Button>
            <Button variant="outline" onClick={clearTrailHistory} title="Clear trail history">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Trails
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          </div>
        </div>

        {/* Stats */}
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
                title="Active"
                value={stats.active}
                icon={Activity}
                changeLabel="Currently active"
                change={5}
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
                changeLabel="Need attention"
                variant="danger"
              />
              <StatCard
                title="Events (24h)"
                value={stats.events24h}
                icon={Activity}
                changeLabel="Driver behavior events"
              />
            </>
          )}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-center">
            <TabsList>
              <TabsTrigger value="map">Live Map</TabsTrigger>
              <TabsTrigger value="list">Device List</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="map" className="mt-4">
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
                    geofences={[]}
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
          </TabsContent>

          <TabsContent value="list" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>All Devices</CardTitle>
                <CardDescription>Every device on the platform with current telemetry, signal and battery health</CardDescription>
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
                      {devices.map((device) => (
                        <tr
                          key={device.id}
                          className="border-b hover:bg-muted/50 cursor-pointer"
                          onClick={() => {
                            setSelectedDevice(device.id);
                            setActiveTab('map');
                          }}
                        >
                          <td className="p-2 font-mono">{device.imei}</td>
                          <td className="p-2">{device.manufacturer} {device.model}</td>
                          <td className="p-2">
                            <Badge variant="outline">{device.status}</Badge>
                          </td>
                          <td className="p-2 uppercase text-xs">{device.protocol}</td>
                          <td className="p-2">{device.signal_strength ?? '-'}%</td>
                          <td className="p-2">{device.battery_level ?? '-'}%</td>
                          <td className="p-2">{device.speed?.toFixed(0) ?? '-'} km/h</td>
                          <td className="p-2 text-sm text-muted-foreground">
                            {device.last_seen
                              ? new Date(device.last_seen).toLocaleString()
                              : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="mt-4">
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
                          <tr key={event.id} className="border-b hover:bg-muted/50">
                            <td className="p-2 capitalize">
                              {event.event_type.replace('_', ' ')}
                            </td>
                            <td className="p-2">
                              <Badge
                                variant={
                                  event.severity === 'critical' || event.severity === 'high'
                                    ? 'destructive'
                                    : 'outline'
                                }
                              >
                                {event.severity}
                              </Badge>
                            </td>
                            <td className="p-2 font-mono text-sm">
                              {device?.imei || event.device_id.slice(0, 8)}
                            </td>
                            <td className="p-2">{event.speed?.toFixed(0) ?? '-'} km/h</td>
                            <td className="p-2 text-sm text-muted-foreground">
                              {event.latitude && event.longitude
                                ? `${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}`
                                : 'Unknown'}
                            </td>
                            <td className="p-2 text-sm text-muted-foreground">
                              {new Date(event.created_at).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                      {recentEvents.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            No events recorded
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
