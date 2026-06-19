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
  Signal,
  Battery,
  Settings,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
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

export function DeviceDetailsSheet({
  open,
  onOpenChange,
  device,
  vehicle,
  sim,
}: DeviceDetailsSheetProps) {
  if (!device) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
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
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
                Connectivity health and heartbeat configuration are not provided by the device endpoint.
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="telemetry" className="mt-4 space-y-4">
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
                Telemetry history and transmission metrics are not provided by the device endpoint.
              </CardContent></Card>
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
                  <p className="text-sm text-muted-foreground">Firmware history is not provided by the device endpoint.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
