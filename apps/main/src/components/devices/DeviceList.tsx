import type { DeviceHealthStatus } from "./DeviceHealthBadge";
import type { DeviceWithTelemetry } from "@/hooks/useDeviceTelemetry";
import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  Battery, Filter, Gauge, MapPin, Search, Signal,
} from "lucide-react";
import React from "react";
import { Badge } from "@/components/shadcn/badge";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { DeviceHealthBadge } from "./DeviceHealthBadge";

type DeviceListProps = {
  devices: DeviceWithTelemetry[];
  selectedDevice: string | null;
  onSelectDevice: (deviceId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
};

export function DeviceList({
  devices,
  selectedDevice,
  onSelectDevice,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: DeviceListProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      // Lifecycle statuses
      registered: "bg-blue-500",
      config_pending: "bg-amber-500",
      configured: "bg-purple-500",
      verified_online: "bg-cyan-500",
      assignable: "bg-green-500",
      assigned: "bg-emerald-500",
      faulty: "bg-red-500",
      decommissioned: "bg-gray-500",
      // Legacy statuses
      active: "bg-green-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getSignalBars = (strength?: number | null) => {
    if (!strength)
      return 0;
    if (strength >= 80)
      return 4;
    if (strength >= 60)
      return 3;
    if (strength >= 40)
      return 2;
    if (strength >= 20)
      return 1;
    return 0;
  };

  const filteredDevices = devices.filter((device) => {
    const matchesSearch
      = device.imei.toLowerCase().includes(searchQuery.toLowerCase())
        || device.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
        || (device.model?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    // Use lifecycle_status if available, fall back to status
    const deviceStatus = (device as any).lifecycle_status || device.status;
    const matchesStatus = statusFilter === "all" || deviceStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Devices</CardTitle>
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search devices..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={onStatusFilterChange}
          >
            <SelectTrigger className="w-[120px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="assignable">Assignable</SelectItem>
              <SelectItem value="configured">Configured</SelectItem>
              <SelectItem value="registered">Registered</SelectItem>
              <SelectItem value="faulty">Faulty</SelectItem>
              <SelectItem value="decommissioned">Decommissioned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-1 p-2">
            {filteredDevices.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No devices found
              </div>
            ) : (
              filteredDevices.map(device => (
                <div
                  key={device.id}
                  onClick={() => onSelectDevice(device.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedDevice === device.id
                      ? "bg-primary/10 border border-primary"
                      : "bg-muted/50 hover:bg-muted border border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-mono text-sm font-medium">
                        {device.imei}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {device.manufacturer}
                        {" "}
                        {device.model || ""}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <DeviceHealthBadge
                        healthStatus={(device as any).health_status as DeviceHealthStatus || "offline"}
                        lastSeen={device.last_seen}
                        showLabel={true}
                        size="sm"
                      />
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5"
                      >
                        {(device as any).lifecycle_status || device.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {/* Signal */}
                    <div className="flex items-center gap-1">
                      <Signal className="h-3 w-3 text-muted-foreground" />
                      <div className="flex gap-0.5">
                        {[
                          1,
                          2,
                          3,
                          4,
                        ].map(bar => (
                          <div
                            key={bar}
                            className={`w-1 rounded-sm ${
                              bar <= getSignalBars(device.signal_strength)
                                ? "bg-green-500"
                                : "bg-gray-300"
                            }`}
                            style={{ height: `${bar * 3 + 4}px` }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Battery */}
                    <div className="flex items-center gap-1">
                      <Battery className="h-3 w-3 text-muted-foreground" />
                      <span className={device.battery_level && device.battery_level < 20 ? "text-red-500" : ""}>
                        {device.battery_level ?? "-"}
                        %
                      </span>
                    </div>

                    {/* Speed */}
                    <div className="flex items-center gap-1">
                      <Gauge className="h-3 w-3 text-muted-foreground" />
                      <span>{device.speed?.toFixed(0) ?? "-"}</span>
                    </div>

                    {/* Location indicator */}
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className={device.latitude && device.longitude ? "text-green-500" : "text-gray-400"}>
                        {device.latitude && device.longitude ? "GPS" : "N/A"}
                      </span>
                    </div>
                  </div>

                  {device.last_seen && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {formatRelative(device.last_seen)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
