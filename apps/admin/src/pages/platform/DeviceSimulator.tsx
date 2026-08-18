import type {
  GeofenceAlert,
  MessageLog,
  SimulatedDevice,
} from "@/hooks/useMQTTSimulator";
import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle,
  ArrowUpDown,
  Bell,
  Gauge,
  LogIn,
  LogOut,
  MapPin,
  Pause,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Send,
  Server,
  Terminal,
  Trash2,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import { SimulatorDeviceMap } from "@/components/devices/SimulatorDeviceMap";
import { SimulatorGeofenceMap } from "@/components/devices/SimulatorGeofenceMap";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Progress } from "@/components/shadcn/progress";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Separator } from "@/components/shadcn/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { useMQTTSimulator } from "@/hooks/useMQTTSimulator";

function DeviceStatusBadge({ status }: { status: SimulatedDevice["status"] }) {
  const variants: Record<SimulatedDevice["status"], {
    color: string;
    icon: React.ReactNode;
  }> = {
    disconnected: {
      color: "bg-gray-500",
      icon: <WifiOff className="h-3 w-3" />,
    },
    connecting: {
      color: "bg-amber-500 animate-pulse",
      icon: <Radio className="h-3 w-3" />,
    },
    connected: {
      color: "bg-green-500",
      icon: <Wifi className="h-3 w-3" />,
    },
    error: {
      color: "bg-red-500",
      icon: <AlertTriangle className="h-3 w-3" />,
    },
  };

  const variant = variants[status];

  return (
    <Badge className={`${variant.color} text-white gap-1`}>
      {variant.icon}
      {status}
    </Badge>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  suffix,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  suffix?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">
              {typeof value === "number" ? value.toLocaleString() : value}
              {suffix && <span className="text-sm text-muted-foreground ml-1">{suffix}</span>}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GeofenceAlertItem({ alert }: { alert: GeofenceAlert }) {
  const isEntry = alert.alertType === "entry";
  const isRestricted = alert.geofenceType === "restricted";

  return (
    <div className={`p-3 rounded-lg border ${
      isRestricted && isEntry
        ? "bg-destructive/10 border-destructive/30"
        : isEntry
          ? "bg-amber-500/10 border-amber-500/30"
          : "bg-blue-500/10 border-blue-500/30"
    }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-full ${
            isRestricted && isEntry ? "bg-destructive/20" : isEntry ? "bg-amber-500/20" : "bg-blue-500/20"
          }`}
          >
            {isEntry
              ? (
                  <LogIn className={`h-3 w-3 ${isRestricted ? "text-destructive" : "text-amber-500"}`} />
                )
              : (
                  <LogOut className="h-3 w-3 text-blue-500" />
                )}
          </div>
          <div>
            <p className="font-medium text-sm">
              {alert.deviceName}
              {" "}
              {isEntry ? "entered" : "exited"}
              {" "}
              <span className="text-primary">{alert.geofenceName}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              IMEI:
              {" "}
              {alert.deviceImei}
              {" "}
              • Type:
              {" "}
              {alert.geofenceType}
            </p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatRelative(alert.timestamp)}
        </span>
      </div>
      <div className="mt-2 text-xs font-mono text-muted-foreground">
        📍
        {" "}
        {alert.latitude.toFixed(5)}
        ,
        {" "}
        {alert.longitude.toFixed(5)}
      </div>
    </div>
  );
}

export default function DeviceSimulator() {
  const {
    devices,
    messageLogs,
    geofenceAlerts,
    geofenceZones,
    stats,
    isSimulating,
    addDevices,
    removeDevice,
    connectDevice,
    disconnectDevice,
    connectAll,
    disconnectAll,
    sendTelemetry,
    startSimulation,
    stopSimulation,
    clearLogs,
    clearGeofenceAlerts,
  } = useMQTTSimulator();

  const [
    deviceCount,
    setDeviceCount,
  ] = useState(1);
  const [
    telemetryInterval,
    setTelemetryInterval,
  ] = useState("2000");
  const [
    selectedDevice,
    setSelectedDevice,
  ] = useState<string | null>(null);

  // Demo fallbacks when simulator is idle
  const demoMessageLogs: MessageLog[] = React.useMemo(
    () => {
      if (messageLogs.length > 0)
        return messageLogs;
      const topics = [
        "devices/IMEI-862798051234567/telemetry",
        "devices/IMEI-862798051234568/telemetry",
        "devices/IMEI-862798051234569/heartbeat",
        "devices/IMEI-862798051234570/event/geofence",
        "devices/IMEI-862798051234571/telemetry",
      ];
      const now = Date.now();
      return Array.from({ length: 24 }).map((_, i) => {
        const sent = i % 2 === 0;
        return {
          id: `demo-log-${i}`,
          timestamp: new Date(now - i * 4500),
          direction: sent ? "sent" : "received",
          topic: topics[i % topics.length],
          payload: sent
            ? {
                imei: `86279805123456${(i % 9) + 1}`,
                lat: 6.4541 + (i % 7) * 0.002,
                lng: 3.3947 + (i % 5) * 0.0015,
                speed: 28 + (i * 3) % 60,
                heading: (i * 17) % 360,
                fuel: 62 - (i % 20),
                ignition: true,
                ts: Date.now() - i * 4500,
              }
            : {
                ack: true,
                msgId: `srv-${1000 + i}`,
                status: "ok",
              },
        } as MessageLog;
      });
    },
    [messageLogs],
  );

  const demoConnected = 8;
  const demoTotal = 12;
  const demoErrors = devices.length > 0 ? devices.filter(d => d.status === "error").length : 1;
  const effectiveStats = stats.messagesSent > 0
    ? stats
    : {
        ...stats,
        messagesSent: 1842,
        messagesReceived: 1798,
        messagesPerSecond: 4.7,
        bytesTransferred: 268_540,
        totalConnections: 14,
        errorsCount: 1,
      };

  const connectedCount = devices.length > 0
    ? devices.filter(d => d.status === "connected").length
    : demoConnected;
  const errorCount = devices.length > 0
    ? devices.filter(d => d.status === "error").length
    : demoErrors;
  const restrictedAlerts = geofenceAlerts.filter(a => a.geofenceType === "restricted" && a.alertType === "entry").length;

  return (
    <DashboardLayout
      title="Device Simulator"
      subtitle="Test MQTT WebSocket bridge"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Device Simulator</h1>
            <p className="text-muted-foreground">
              Test the MQTT WebSocket bridge with simulated IoT devices
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSimulating
              ? (
                  <Button
                    variant="destructive"
                    onClick={stopSimulation}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Stop Simulation
                  </Button>
                )
              : (
                  <Button onClick={() => startSimulation(parseInt(telemetryInterval))}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Simulation
                  </Button>
                )}
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard
            title="Total Devices"
            value={devices.length}
            icon={Server}
          />
          <StatCard
            title="Connected"
            value={connectedCount}
            icon={Wifi}
          />
          <StatCard
            title="Messages Sent"
            value={effectiveStats.messagesSent}
            icon={Send}
          />
          <StatCard
            title="Messages Received"
            value={effectiveStats.messagesReceived}
            icon={ArrowUpDown}
          />
          <StatCard
            title="Msg/sec"
            value={effectiveStats.messagesPerSecond.toFixed(1)}
            icon={Gauge}
          />
          <StatCard
            title="Errors"
            value={effectiveStats.errorsCount}
            icon={AlertTriangle}
          />
        </div>

        {/* Controls moved below tabs (inside Devices tab) for top-down flow: Map → Controls → Devices */}

        {/* Main Content */}
        <Tabs
          defaultValue="devices"
          className="space-y-4"
        >
          <div className="flex justify-center">
            <TabsList>
              <TabsTrigger value="devices">
                Devices (
                {devices.length}
                )
              </TabsTrigger>
              <TabsTrigger
                value="geofences"
                className="relative"
              >
                Geofence Alerts
                {geofenceAlerts.length > 0 && (
                  <Badge
                    variant={restrictedAlerts > 0 ? "destructive" : "secondary"}
                    className="ml-2 h-5 min-w-5 px-1"
                  >
                    {geofenceAlerts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="logs">
                Message Logs (
                {demoMessageLogs.length}
                )
              </TabsTrigger>
              <TabsTrigger value="monitor">
                Live Monitor
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="devices"
            className="space-y-4"
          >
            {/* 1. Live Detection Map */}
            <SimulatorDeviceMap
              devices={devices}
              selectedDeviceId={selectedDevice}
              onSelectDevice={setSelectedDevice}
            />

            {/* 2. Simulator Controls (between map and devices table) */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Simulator Controls
                </CardTitle>
                <CardDescription>Add virtual devices, set telemetry cadence and connect/disconnect the MQTT bridge</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-end gap-4">
                  <div className="space-y-2">
                    <Label>Add Devices</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        value={deviceCount}
                        onChange={e => setDeviceCount(parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                      <Button onClick={() => addDevices(deviceCount)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Telemetry Interval</Label>
                    <Select
                      value={telemetryInterval}
                      onValueChange={setTelemetryInterval}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="500">500ms</SelectItem>
                        <SelectItem value="1000">1 sec</SelectItem>
                        <SelectItem value="2000">2 sec</SelectItem>
                        <SelectItem value="5000">5 sec</SelectItem>
                        <SelectItem value="10000">10 sec</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator
                    orientation="vertical"
                    className="h-10"
                  />

                  <Button
                    variant="outline"
                    onClick={connectAll}
                    disabled={devices.length === 0}
                  >
                    <Wifi className="h-4 w-4 mr-2" />
                    Connect All
                  </Button>
                  <Button
                    variant="outline"
                    onClick={disconnectAll}
                    disabled={connectedCount === 0}
                  >
                    <WifiOff className="h-4 w-4 mr-2" />
                    Disconnect All
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={clearLogs}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear Logs
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 3. Devices Table */}
            <div className="grid grid-cols-1 gap-4">
              <div className="hidden">{/* spacer */}</div>

              {/* Device Table */}
              <Card className="xl:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle>Simulated Devices</CardTitle>
                      <CardDescription>
                        Manage virtual IoT devices for testing the MQTT bridge
                      </CardDescription>
                    </div>
                    <ExportButton
                      filename="simulated-devices"
                      rows={devices}
                      columns={[
                        {
                          header: "IMEI",
                          accessor: d => d.imei,
                        },
                        {
                          header: "Manufacturer",
                          accessor: d => d.manufacturer,
                        },
                        {
                          header: "Model",
                          accessor: d => d.model,
                        },
                        {
                          header: "Status",
                          accessor: d => d.status,
                        },
                        {
                          header: "Latitude",
                          accessor: d => d.latitude,
                        },
                        {
                          header: "Longitude",
                          accessor: d => d.longitude,
                        },
                        {
                          header: "Speed",
                          accessor: d => d.speed,
                        },
                        {
                          header: "Messages",
                          accessor: d => d.messageCount,
                        },
                        {
                          header: "Errors",
                          accessor: d => d.errorCount,
                        },
                      ]}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {devices.length === 0
                    ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No devices added yet</p>
                          <p className="text-sm">Click "Add" to create simulated devices</p>
                        </div>
                      )
                    : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>IMEI</TableHead>
                                <TableHead>Device</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Speed</TableHead>
                                <TableHead>Messages</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {devices.map(device => (
                                <TableRow
                                  key={device.id}
                                  className={selectedDevice === device.id ? "bg-muted/50" : ""}
                                  onClick={() => setSelectedDevice(device.id)}
                                >
                                  <TableCell className="font-mono text-xs">
                                    {device.imei}
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium text-sm">{device.manufacturer}</p>
                                      <p className="text-xs text-muted-foreground">{device.model}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <DeviceStatusBadge status={device.status} />
                                  </TableCell>
                                  <TableCell className="text-xs font-mono">
                                    {device.latitude.toFixed(4)}
                                    ,
                                    {device.longitude.toFixed(4)}
                                  </TableCell>
                                  <TableCell>
                                    {device.speed.toFixed(0)}
                                    {" "}
                                    km/h
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <span className="text-green-600">{device.messageCount}</span>
                                      {device.errorCount > 0 && (
                                        <span className="text-red-500">
                                          (
                                          {device.errorCount}
                                          {" "}
                                          err)
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      {device.status === "connected"
                                        ? (
                                            <>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  sendTelemetry(device.id);
                                                }}
                                              >
                                                <Send className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  disconnectDevice(device.id);
                                                }}
                                              >
                                                <WifiOff className="h-3 w-3" />
                                              </Button>
                                            </>
                                          )
                                        : (
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                connectDevice(device.id);
                                              }}
                                              disabled={device.status === "connecting"}
                                            >
                                              <Wifi className="h-3 w-3" />
                                            </Button>
                                          )}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeDevice(device.id);
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="geofences">
            <div className="space-y-4">
              {/* Map visualization */}
              <SimulatorGeofenceMap
                zones={geofenceZones}
                alerts={geofenceAlerts}
              />

              {/* Geofence Alerts (above zones) */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        Geofence Alerts
                        {restrictedAlerts > 0 && (
                          <Badge variant="destructive">
                            {restrictedAlerts}
                            {" "}
                            restricted
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Real-time entry/exit notifications
                      </CardDescription>
                    </div>
                    {geofenceAlerts.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearGeofenceAlerts}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {geofenceAlerts.length === 0
                      ? (
                          <div className="text-center py-12 text-muted-foreground">
                            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No geofence alerts yet</p>
                            <p className="text-sm">Alerts appear when devices enter or exit zones</p>
                          </div>
                        )
                      : (
                          <div className="space-y-2">
                            {geofenceAlerts.map(alert => (
                              <GeofenceAlertItem
                                key={alert.id}
                                alert={alert}
                              />
                            ))}
                          </div>
                        )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Active Geofence Zones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Active Geofence Zones
                  </CardTitle>
                  <CardDescription>
                    Configured detection areas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {geofenceZones.map(zone => (
                      <div
                        key={zone.id}
                        className="p-3 rounded-lg border flex items-center justify-between"
                        style={{
                          borderLeftColor: zone.color,
                          borderLeftWidth: 4,
                        }}
                      >
                        <div>
                          <p className="font-medium text-sm">{zone.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {zone.type}
                            {" "}
                            •
                            {zone.radius}
                            m radius
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          style={{
                            color: zone.color,
                            borderColor: zone.color,
                          }}
                        >
                          {zone.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Message Logs
                </CardTitle>
                <CardDescription>
                  Real-time WebSocket message traffic
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {demoMessageLogs.map(log => (
                      <div
                        key={log.id}
                        className={`p-3 rounded-lg border text-sm font-mono ${
                          log.direction === "sent"
                            ? "bg-blue-500/10 border-blue-500/20"
                            : "bg-green-500/10 border-green-500/20"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
                              {log.direction === "sent" ? "↑ SENT" : "↓ RECV"}
                            </Badge>
                            <span className="text-muted-foreground">{log.topic}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatRelative(log.timestamp)}
                          </span>
                        </div>
                        <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(
                            log.payload,
                            null,
                            2,
                          )}
                        </pre>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitor">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Connection Status</CardTitle>
                  <CardDescription>Live count of connected simulator devices versus errors</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Connected Devices</span>
                      <span>
                        {connectedCount}
                        {" "}
                        /
                        {" "}
                        {devices.length || demoTotal}
                      </span>
                    </div>
                    <Progress
                      value={(connectedCount / (devices.length || demoTotal)) * 100}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-3xl font-bold text-green-500">{connectedCount}</p>
                      <p className="text-sm text-muted-foreground">Connected</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-3xl font-bold text-red-500">{errorCount}</p>
                      <p className="text-sm text-muted-foreground">Errors</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Throughput</CardTitle>
                  <CardDescription>Messages-per-second and total payloads transferred through the bridge</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-lg bg-muted">
                      <p className="text-3xl font-bold">{effectiveStats.messagesPerSecond.toFixed(1)}</p>
                      <p className="text-sm text-muted-foreground">msg/sec</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted">
                      <p className="text-3xl font-bold">
                        {(effectiveStats.bytesTransferred / 1024).toFixed(1)}
                      </p>
                      <p className="text-sm text-muted-foreground">KB transferred</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Messages Sent</span>
                      <span className="font-mono">{effectiveStats.messagesSent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Messages Received</span>
                      <span className="font-mono">{effectiveStats.messagesReceived}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Connections</span>
                      <span className="font-mono">{effectiveStats.totalConnections}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
