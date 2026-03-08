import { IoTDevice, Vehicle, SIMCard } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Cpu,
  Truck,
  Wifi,
  Signal,
  Battery,
  Clock,
  Settings,
  Activity,
  Database,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DeviceConnectivityPanel } from "./DeviceConnectivityPanel";
import { DeviceHealthStatus } from "./DeviceHealthBadge";

interface ExtendedDevice extends IoTDevice {
  health_status?: DeviceHealthStatus | null;
  expected_heartbeat_seconds?: number;
  online_threshold_seconds?: number;
  offline_threshold_seconds?: number;
  last_health_check_at?: string | null;
  last_status_change_at?: string | null;
  last_seen?: string | null;
  lifecycle_status?: string;
}

interface DeviceDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: ExtendedDevice | null;
  vehicle?: Vehicle | null;
  sim?: SIMCard | null;
}

// Mock telemetry data
const mockTelemetryData = [
  { time: "00:00", signal: 82, battery: 100 },
  { time: "04:00", signal: 78, battery: 98 },
  { time: "08:00", signal: 85, battery: 95 },
  { time: "12:00", signal: 72, battery: 92 },
  { time: "16:00", signal: 88, battery: 88 },
  { time: "20:00", signal: 80, battery: 85 },
  { time: "Now", signal: 85, battery: 100 },
];

// Mock firmware history
const mockFirmwareHistory = [
  { version: "3.28.07", date: new Date("2024-11-15"), status: "current" },
  { version: "3.27.12", date: new Date("2024-09-20"), status: "previous" },
  { version: "3.26.05", date: new Date("2024-07-10"), status: "previous" },
];

export function DeviceDetailsSheet({
  open,
  onOpenChange,
  device,
  vehicle,
  sim,
}: DeviceDetailsSheetProps) {
  if (!device) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              device.status === "active" || device.status === "assigned"
                ? "bg-success/10"
                : "bg-secondary"
            )}>
              <Cpu className={cn(
                "h-6 w-6",
                device.status === "active" || device.status === "assigned"
                  ? "text-success"
                  : "text-muted-foreground"
              )} />
            </div>
            <div>
              <span className="block">{device.manufacturer} {device.model}</span>
              <span className="text-sm font-normal text-muted-foreground font-mono">
                IMEI: {device.imei}
              </span>
            </div>
          </SheetTitle>
          <SheetDescription className="sr-only">Device details and telemetry</SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="connectivity">Connectivity</TabsTrigger>
              <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
              <TabsTrigger value="firmware">Firmware</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              {/* Status Card */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className={cn(
                        "mt-1",
                        device.status === "active" && "bg-success hover:bg-success",
                        device.status === "assigned" && "bg-primary hover:bg-primary",
                        device.status === "faulty" && "bg-destructive hover:bg-destructive"
                      )}>
                        {device.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Seen</p>
                      <p className="text-sm font-medium mt-1">
                        {device.lastSeen ? formatDistanceToNow(device.lastSeen, { addSuffix: true }) : "Never"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Signal & Battery */}
              {(device.signalStrength !== undefined || device.batteryLevel !== undefined) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Device Health</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {device.signalStrength !== undefined && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Signal className="h-4 w-4 text-muted-foreground" />
                            <span>Signal Strength</span>
                          </div>
                          <span className={cn(
                            "font-medium",
                            device.signalStrength > 70 ? "text-success" :
                            device.signalStrength > 40 ? "text-warning" : "text-destructive"
                          )}>
                            {device.signalStrength}%
                          </span>
                        </div>
                        <Progress value={device.signalStrength} className="h-2" />
                      </div>
                    )}
                    {device.batteryLevel !== undefined && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Battery className="h-4 w-4 text-muted-foreground" />
                            <span>Battery Level</span>
                          </div>
                          <span className={cn(
                            "font-medium",
                            device.batteryLevel > 50 ? "text-success" :
                            device.batteryLevel > 20 ? "text-warning" : "text-destructive"
                          )}>
                            {device.batteryLevel}%
                          </span>
                        </div>
                        <Progress value={device.batteryLevel} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Assigned Vehicle */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    Assigned Vehicle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {vehicle ? (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Truck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{vehicle.registrationNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.make} {vehicle.model}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No vehicle assigned</p>
                  )}
                </CardContent>
              </Card>

              {/* Assigned SIM */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-primary" />
                    SIM Card
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sim ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Mobile Number</span>
                        <span className="font-medium">{sim.mobileNumber}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Operator</span>
                        <span>{sim.networkOperator}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Data Usage</span>
                        <span>{sim.dataUsage}/{sim.dataLimit} GB</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No SIM assigned</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="connectivity" className="mt-4">
              <DeviceConnectivityPanel
                healthStatus={device.health_status || null}
                lastSeen={device.last_seen || (device.lastSeen ? device.lastSeen.toISOString() : null)}
                lastHealthCheckAt={device.last_health_check_at || null}
                lastStatusChangeAt={device.last_status_change_at || null}
                expectedHeartbeatSeconds={device.expected_heartbeat_seconds || 60}
                onlineThresholdSeconds={device.online_threshold_seconds || 180}
                offlineThresholdSeconds={device.offline_threshold_seconds || 600}
                lifecycleStatus={device.lifecycle_status || device.status}
              />
            </TabsContent>

            <TabsContent value="telemetry" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Signal & Battery (24h)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={mockTelemetryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Line type="monotone" dataKey="signal" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="battery" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="mt-4 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                      <span className="text-xs text-muted-foreground">Signal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-success" />
                      <span className="text-xs text-muted-foreground">Battery</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    Data Transmission
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Today's Records</span>
                    <span className="font-medium">1,247</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg. Interval</span>
                    <span className="font-medium">30 seconds</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Data Quality</span>
                    <span className="font-medium text-success">98.5%</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="firmware" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    Current Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Firmware Version</span>
                    <span className="font-mono">{device.firmwareVersion}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reporting Interval</span>
                    <span>30 seconds</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Protocol</span>
                    <span>MQTT</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-primary" />
                    Firmware History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockFirmwareHistory.map((fw) => (
                    <div
                      key={fw.version}
                      className={cn(
                        "flex items-center justify-between rounded-lg border border-border p-3",
                        fw.status === "current" && "border-primary/50 bg-primary/5"
                      )}
                    >
                      <div>
                        <p className="font-mono text-sm">{fw.version}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(fw.date, "PPP")}
                        </p>
                      </div>
                      {fw.status === "current" && (
                        <Badge>Current</Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
