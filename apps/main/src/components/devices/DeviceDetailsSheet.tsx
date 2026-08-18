import { formatRelative, formatTime, formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import { IoTDevice, Vehicle, SIMCard } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/shadcn/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Badge } from "@/components/shadcn/badge";
import { Progress } from "@/components/shadcn/progress";
import {
  Cpu,
  Truck,
  Wifi,
  WifiOff,
  Signal,
  Battery,
  Settings,
  RefreshCw,
  Activity,
  Clock,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useDeviceOverview,
  useDeviceConnectivity,
  useDeviceTelemetry,
  useDeviceFirmware,
} from "@truckmoov/api/tracking";
import type { DeviceHealth } from "@truckmoov/api/tracking";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
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

const healthTone: Record<DeviceHealth, string> = {
  online: "text-success",
  degraded: "text-warning",
  offline: "text-destructive",
  unknown: "text-muted-foreground",
};

function formatSeconds(seconds: number | null | undefined) {
  if (seconds == null) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const rem = Math.round(seconds % 60);
  return rem ? `${mins}m ${rem}s` : `${mins}m`;
}

export function DeviceDetailsSheet({
  open,
  onOpenChange,
  device,
  vehicle,
  sim,
}: DeviceDetailsSheetProps) {
  const deviceId = device?.id ?? "";
  const overviewQuery = useDeviceOverview(deviceId);
  const connectivityQuery = useDeviceConnectivity(deviceId);
  const telemetryQuery = useDeviceTelemetry(deviceId);
  const firmwareQuery = useDeviceFirmware(deviceId);

  if (!device) return null;

  const overview = overviewQuery.data;
  const connectivity = connectivityQuery.data;
  const telemetry = telemetryQuery.data;
  const firmware = firmwareQuery.data;

  // Overview values prefer the live endpoint, fall back to the prop while loading.
  const status = overview?.health ?? device.status;
  const lastSeen = device.last_seen ?? (device.lastSeen?.toISOString() ?? null);
  const signalStrength = device.signalStrength;
  const batteryLevel = device.batteryLevel;
  const averageIntervalSeconds = telemetry?.aggregates_24h.sample_count && telemetry.aggregates_24h.sample_count > 1
    ? (new Date(telemetry.aggregates_24h.window_end).getTime() - new Date(telemetry.aggregates_24h.window_start).getTime())
      / 1000 / (telemetry.aggregates_24h.sample_count - 1)
    : null;

  const chartData = (telemetry?.history ?? [])
    .slice()
    .sort((a, b) => new Date(a.observed_at).getTime() - new Date(b.observed_at).getTime())
    .map((p) => ({
      time: formatTime(p.observed_at),
      signal: p.signal_strength,
      battery: p.battery_level,
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              status === "active" || status === "assigned"
                ? "bg-success/10"
                : "bg-secondary"
            )}>
              <Cpu className={cn(
                "h-6 w-6",
                status === "active" || status === "assigned"
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
          </DialogTitle>
          <DialogDescription className="sr-only">Device details and telemetry</DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="connectivity">Connectivity</TabsTrigger>
              <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
              <TabsTrigger value="firmware">Firmware</TabsTrigger>
            </TabsList>

            {/* ─── Overview ─────────────────────────────────────────────── */}
            <TabsContent value="overview" className="mt-4 space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className={cn(
                        "mt-1",
                        status === "active" && "bg-success hover:bg-success",
                        status === "assigned" && "bg-primary hover:bg-primary",
                        status === "faulty" && "bg-destructive hover:bg-destructive"
                      )}>
                        {status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Seen</p>
                      <p className="text-sm font-medium mt-1">
                        {lastSeen ? formatRelative(lastSeen) : "Never"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {(signalStrength != null || batteryLevel != null) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Device Health</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {signalStrength != null && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Signal className="h-4 w-4 text-muted-foreground" />
                            <span>Signal Strength</span>
                          </div>
                          <span className={cn(
                            "font-medium",
                            signalStrength > 70 ? "text-success" :
                            signalStrength > 40 ? "text-warning" : "text-destructive"
                          )}>
                            {signalStrength}%
                          </span>
                        </div>
                        <Progress value={signalStrength} className="h-2" />
                      </div>
                    )}
                    {batteryLevel != null && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Battery className="h-4 w-4 text-muted-foreground" />
                            <span>Battery Level</span>
                          </div>
                          <span className={cn(
                            "font-medium",
                            batteryLevel > 50 ? "text-success" :
                            batteryLevel > 20 ? "text-warning" : "text-destructive"
                          )}>
                            {batteryLevel}%
                          </span>
                        </div>
                        <Progress value={batteryLevel} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

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

            {/* ─── Connectivity ─────────────────────────────────────────── */}
            <TabsContent value="connectivity" className="mt-4">
              {connectivityQuery.isLoading ? (
                <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading connectivity…</CardContent></Card>
              ) : !connectivity ? (
                <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No connectivity data available.</CardContent></Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Connectivity &amp; Telemetry
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <p className="text-sm font-medium mb-2">Connection Status</p>
                      <Badge variant="outline" className={cn("gap-1.5 capitalize", healthTone[connectivity.health])}>
                        {connectivity.health === "online" ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                        {connectivity.health}
                      </Badge>
                      {connectivity.health === "offline" && (
                        <p className="mt-3 text-sm text-muted-foreground">
                          No telemetry received beyond offline threshold. Check device connectivity.
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" /> Last Telemetry
                        </p>
                        <p className="text-sm font-medium mt-1">
                          {lastSeen
                            ? formatRelative(lastSeen)
                            : "Never"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5" /> Last Health Check
                        </p>
                        <p className="text-sm font-medium mt-1">
                          {connectivity.last_health_check?.at
                            ? `${formatRelative(connectivity.last_health_check.at)} (${connectivity.last_health_check.result})`
                            : "Pending"}
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-xs text-muted-foreground mb-3">Heartbeat Configuration</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-lg bg-secondary/50 p-3 text-center">
                          <p className="text-xs text-muted-foreground">Expected</p>
                          <p className="text-sm font-semibold mt-1">{formatSeconds(connectivity.status_timeout_seconds)}</p>
                        </div>
                        <div className="rounded-lg bg-warning/10 p-3 text-center">
                          <p className="text-xs text-warning">Online ≤</p>
                          {/* ponytail: online threshold not in API, derived as 3× reporting interval; use a real field if the backend adds one */}
                          <p className="text-sm font-semibold mt-1 text-warning">{formatSeconds(connectivity.heartbeat.online_threshold_seconds)}</p>
                        </div>
                        <div className="rounded-lg bg-destructive/10 p-3 text-center">
                          <p className="text-xs text-destructive">Offline &gt;</p>
                          <p className="text-sm font-semibold mt-1 text-destructive">{formatSeconds(connectivity.heartbeat.offline_threshold_seconds)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ─── Telemetry ────────────────────────────────────────────── */}
            <TabsContent value="telemetry" className="mt-4 space-y-4">
              {telemetryQuery.isLoading ? (
                <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading telemetry…</CardContent></Card>
              ) : !telemetry ? (
                <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No telemetry data available.</CardContent></Card>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        Signal &amp; Battery (24h)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {chartData.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">No telemetry history in the last 24h.</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={240}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <Tooltip
                              contentStyle={{
                                background: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: 8,
                                fontSize: 12,
                              }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="signal" name="Signal" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} connectNulls />
                            <Line type="monotone" dataKey="battery" name="Battery" stroke="hsl(var(--success))" strokeWidth={2} dot={false} connectNulls />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
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
                        <span className="font-medium">{telemetry.aggregates_24h.sample_count.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Avg. Interval</span>
                        <span className="font-medium">{formatSeconds(averageIntervalSeconds)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Data Quality</span>
                        <span className="font-medium text-success">{telemetry.aggregates_24h.data_quality_pct}%</span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* ─── Firmware ─────────────────────────────────────────────── */}
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
                    <span className="font-mono">{device.firmwareVersion || "Unknown"}</span>
                  </div>
                  {connectivity && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status Timeout</span>
                      <span className="font-medium">{formatSeconds(connectivity.status_timeout_seconds)}</span>
                    </div>
                  )}
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
                  {firmwareQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading firmware history…</p>
                  ) : !firmware?.history?.length ? (
                    <p className="text-sm text-muted-foreground">No firmware history available.</p>
                  ) : (
                    firmware.history.map((entry) => {
                      const isCurrent = entry.is_current || entry.version === device.firmwareVersion;
                      const seenAt = entry.installed_at || entry.first_seen || entry.last_seen;
                      return (
                        <div
                          key={`${entry.version}-${seenAt ?? "unknown"}`}
                          className={cn(
                            "flex items-center justify-between rounded-lg border p-3",
                            isCurrent && "border-primary/50 bg-primary/5"
                          )}
                        >
                          <div>
                            <p className="text-sm font-mono">{entry.version}</p>
                            {seenAt && (
                              <p className="text-xs text-muted-foreground">
                                {formatWithPattern(seenAt, "MMMM do, yyyy")}
                              </p>
                            )}
                          </div>
                          {isCurrent && <Badge className="bg-primary hover:bg-primary">Current</Badge>}
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
