import type {
  DeviceWithTelemetry, DriverBehaviorEvent,
} from "@/hooks/useDeviceTelemetry";
import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  Activity,
  AlertTriangle,
  Battery,
  Clock,
  Fuel,
  Gauge,
  Navigation,
  Signal,
  Zap,
} from "lucide-react";
import React from "react";
import { Badge } from "@/components/shadcn/badge";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Progress } from "@/components/shadcn/progress";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Separator } from "@/components/shadcn/separator";
import { DeviceHealthBadge } from "./DeviceHealthBadge";

type DeviceTelemetryPanelProps = {
  device: DeviceWithTelemetry | null;
  recentEvents: DriverBehaviorEvent[];
};

export function DeviceTelemetryPanel({
  device, recentEvents,
}: DeviceTelemetryPanelProps) {
  if (!device) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Select a device to view telemetry data
        </CardContent>
      </Card>
    );
  }

  const deviceEvents = recentEvents.filter(e => e.device_id === device.id);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-500",
      configured: "bg-blue-500",
      assigned: "bg-purple-500",
      registered: "bg-amber-500",
      faulty: "bg-red-500",
      decommissioned: "bg-gray-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: "bg-blue-500",
      medium: "bg-amber-500",
      high: "bg-orange-500",
      critical: "bg-red-500",
    };
    return colors[severity] || "bg-gray-500";
  };

  const formatEventType = (type: string) => {
    return type.split("_").map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <div className="space-y-4">
      {/* Device Header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{device.imei}</CardTitle>
            <div className="flex items-center gap-2">
              <DeviceHealthBadge
                healthStatus={device.health_status || null}
                lastSeen={device.last_seen}
                size="md"
              />
              <Badge className={`${getStatusColor(device.lifecycle_status || device.status)} text-white`}>
                {device.lifecycle_status || device.status}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {device.manufacturer}
            {" "}
            {device.model || ""}
            {" "}
            •
            {" "}
            {device.protocol?.toUpperCase() || "HTTP"}
          </p>
        </CardHeader>
        <CardContent>
          {device.last_seen && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last seen
              {" "}
              {formatRelative(device.last_seen)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Live Telemetry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Speed */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Speed</span>
            </div>
            <span className="font-mono text-lg">
              {device.speed?.toFixed(0) || "0"}
              {" "}
              <span className="text-sm text-muted-foreground">km/h</span>
            </span>
          </div>

          {/* Heading */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-green-500" />
              <span className="text-sm">Heading</span>
            </div>
            <span className="font-mono text-lg">
              {device.heading || 0}
              °
            </span>
          </div>

          <Separator />

          {/* Fuel Level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fuel className="h-4 w-4 text-amber-500" />
                <span className="text-sm">Fuel Level</span>
              </div>
              <span className="font-mono">
                {device.fuel_level?.toFixed(0) || 0}
                %
              </span>
            </div>
            <Progress
              value={device.fuel_level || 0}
              className="h-2"
            />
          </div>

          {/* Battery Level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Battery className="h-4 w-4 text-green-500" />
                <span className="text-sm">Device Battery</span>
              </div>
              <span className="font-mono">
                {device.battery_level || 0}
                %
              </span>
            </div>
            <Progress
              value={device.battery_level || 0}
              className={`h-2 ${(device.battery_level || 0) < 20 ? "bg-red-200" : ""}`}
            />
          </div>

          {/* Signal Strength */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Signal className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Signal Strength</span>
              </div>
              <span className="font-mono">
                {device.signal_strength || 0}
                %
              </span>
            </div>
            <Progress
              value={device.signal_strength || 0}
              className="h-2"
            />
          </div>

          {/* Engine Status */}
          {device.engine_status && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Engine</span>
              </div>
              <Badge variant={device.engine_status === "on" ? "default" : "secondary"}>
                {device.engine_status.toUpperCase()}
              </Badge>
            </div>
          )}

          {/* Location */}
          {device.latitude && device.longitude && (
            <div className="pt-2 border-t">
              <div className="text-sm text-muted-foreground">Location</div>
              <div className="font-mono text-sm">
                {device.latitude.toFixed(6)}
                ,
                {device.longitude.toFixed(6)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Driver Behavior Events */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Driver Behavior Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            {deviceEvents.length === 0
              ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent events
                  </p>
                )
              : (
                  <div className="space-y-3">
                    {deviceEvents.map(event => (
                      <div
                        key={event.id}
                        className="flex items-start justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className={`${getSeverityColor(event.severity)} text-white text-xs`}>
                              {event.severity}
                            </Badge>
                            <span className="text-sm font-medium">
                              {formatEventType(event.event_type)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {event.speed && `${event.speed.toFixed(0)} km/h`}
                            {event.latitude && event.longitude && (
                              <span>
                                {" "}
                                at
                                {event.latitude.toFixed(4)}
                                ,
                                {event.longitude.toFixed(4)}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatRelative(event.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
