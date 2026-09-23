import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle, ArrowRight, CheckCircle2, Cpu, Download, SlidersHorizontal as Filter, MoreHorizontal, Radio, Search, Settings,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "../shadcn/badge";
import { Button } from "../shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "../shadcn/card";
import { Checkbox } from "../shadcn/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../shadcn/dropdown-menu";
import { Input } from "../shadcn/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../shadcn/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../shadcn/select";
import { Skeleton } from "../shadcn/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../shadcn/table";
import { DeviceLifecycleBadge } from "../device/DeviceLifecycleBadge";
import { cn } from "../../lib/utils";
import { DeviceSetupWizard } from "./DeviceSetupWizard";

type ConfigQueueDevice = any;
type DeviceCatalogEntry = any;
type DeviceLifecycleStatus = string;

type ConfigQueueProps = {
  devices: ConfigQueueDevice[];
  catalog: DeviceCatalogEntry[];
  loading: boolean;
  onRefresh: () => void;
  onMarkConfigured: (deviceId: string, notes?: string) => Promise<{ success: boolean }>;
  onReset: (deviceId: string, reason: string) => Promise<{ success: boolean }>;
  onTroubleshoot: (deviceId: string) => void;
  canConfigure: boolean;
  canReset: boolean;
};

export function ConfigQueue({
  devices,
  catalog,
  loading,
  onRefresh,
  onMarkConfigured,
  onReset,
  onTroubleshoot,
  canConfigure,
  canReset,
}: ConfigQueueProps) {
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<string>("all");
  const [
    deviceFilter,
    setDeviceFilter,
  ] = useState<string>("all");
  const [
    lastSeenFilter,
    setLastSeenFilter,
  ] = useState<string>("all");
  const [
    selectedDevice,
    setSelectedDevice,
  ] = useState<ConfigQueueDevice | null>(null);
  const [
    wizardOpen,
    setWizardOpen,
  ] = useState(false);

  const manufacturers = [...new Set(devices.map(d => d.manufacturer))];

  const matchesLastSeen = (device: ConfigQueueDevice) => {
    if (lastSeenFilter === "all")
      return true;
    if (!device.last_seen)
      return lastSeenFilter === "never";
    const ageMs = Date.now() - new Date(device.last_seen).getTime();
    const hours = ageMs / (1000 * 60 * 60);
    if (lastSeenFilter === "1h")
      return hours <= 1;
    if (lastSeenFilter === "24h")
      return hours <= 24;
    if (lastSeenFilter === "7d")
      return hours <= 24 * 7;
    if (lastSeenFilter === "older")
      return hours > 24 * 7;
    return true;
  };

  const filteredDevices = devices.filter((device) => {
    const matchesSearch
      = device.imei.toLowerCase().includes(searchQuery.toLowerCase())
        || device.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
        || (device.model?.toLowerCase() || "").includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || device.lifecycle_status === statusFilter;
    const matchesDevice = deviceFilter === "all" || device.manufacturer === deviceFilter;

    return matchesSearch && matchesStatus && matchesDevice && matchesLastSeen(device);
  });

  const exportData = () => {
    const headers = [
      "IMEI",
      "Manufacturer",
      "Model",
      "Status",
      "Protocol",
      "Last Seen",
    ];
    const rows = filteredDevices.map(d => [
      d.imei,
      d.manufacturer,
      d.model || "",
      d.lifecycle_status,
      d.protocol || "",
      d.last_seen || "",
    ]);
    const csv = [
      headers,
      ...rows,
    ].map(r => r.map(v => `"${String(v).replace(
      /"/g,
      "\"\"",
    )}"`).join(",")).join("\n");
    const blob = new Blob(
      [csv],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `config-queue-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCatalogEntry = (device: ConfigQueueDevice) => {
    return catalog.find(c =>
      c.manufacturer.toLowerCase() === device.manufacturer.toLowerCase()
      && c.model.toLowerCase() === (device.model || "").toLowerCase());
  };

  const getNextAction = (device: ConfigQueueDevice) => {
    const status = device.lifecycle_status as DeviceLifecycleStatus;
    switch (status) {
      case "registered":
      case "config_pending":
        return {
          label: "Setup Guide", icon: Settings, action: "setup",
        };
      case "configured":
        return {
          label: "Verify Signal", icon: Radio, action: "verify",
        };
      case "verified_online":
      case "assignable":
        return {
          label: "Ready to Assign", icon: ArrowRight, action: "assign",
        };
      default:
        return null;
    }
  };

  const handleOpenWizard = (device: ConfigQueueDevice) => {
    setSelectedDevice(device);
    setWizardOpen(true);
  };

  const handleWizardComplete = async () => {
    setWizardOpen(false);
    setSelectedDevice(null);
    onRefresh();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Config Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" />
                Configuration Queue
              </CardTitle>
              <CardDescription>
                Devices awaiting configuration and verification
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={exportData}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by IMEI, manufacturer, model..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 bg-transparent border-border"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px] bg-transparent border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="config_pending">Config Pending</SelectItem>
                <SelectItem value="configured">Configured</SelectItem>
                <SelectItem value="verified_online">Verified Online</SelectItem>
                <SelectItem value="assignable">Assignable</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                  {(deviceFilter !== "all" || lastSeenFilter !== "all") && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 px-1.5 text-[10px]"
                    >
                      {[
                        deviceFilter !== "all",
                        lastSeenFilter !== "all",
                      ].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={8}
                className="w-[280px] p-3 rounded-xl"
              >
                <div className="space-y-2.5">
                  <h4 className="text-xs font-medium text-foreground px-0.5">
                    Only show devices by...
                  </h4>

                  {/* Device */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <Checkbox
                        checked={deviceFilter !== "all"}
                        onCheckedChange={c => setDeviceFilter(c ? (manufacturers[0] ?? "all") : "all")}
                        className="h-3.5 w-3.5"
                      />
                      <span className={cn(
                        "text-xs font-medium",
                        deviceFilter === "all" && "text-muted-foreground",
                      )}
                      >
                        Device
                      </span>
                    </label>
                    <Select
                      value={deviceFilter === "all" ? "" : deviceFilter}
                      onValueChange={v => setDeviceFilter(v || "all")}
                      disabled={deviceFilter === "all"}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select device" />
                      </SelectTrigger>
                      <SelectContent>
                        {manufacturers.map(m => (
                          <SelectItem
                            key={m}
                            value={m}
                          >
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Last seen */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <Checkbox
                        checked={lastSeenFilter !== "all"}
                        onCheckedChange={c => setLastSeenFilter(c ? "24h" : "all")}
                        className="h-3.5 w-3.5"
                      />
                      <span className={cn(
                        "text-xs font-medium",
                        lastSeenFilter === "all" && "text-muted-foreground",
                      )}
                      >
                        Last seen
                      </span>
                    </label>
                    <Select
                      value={lastSeenFilter === "all" ? "" : lastSeenFilter}
                      onValueChange={v => setLastSeenFilter(v || "all")}
                      disabled={lastSeenFilter === "all"}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Any time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1h">Last hour</SelectItem>
                        <SelectItem value="24h">Last 24 hours</SelectItem>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="older">Older than 7 days</SelectItem>
                        <SelectItem value="never">Never seen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 h-8 text-xs"
                    >
                      Apply
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => {
                        setDeviceFilter("all");
                        setLastSeenFilter("all");
                      }}
                    >
                      Show All
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Device Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>IMEI</TableHead>
                  <TableHead>Protocol / Port</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Next Action</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.length === 0
                  ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          {devices.length === 0
                            ? "No devices in configuration pipeline"
                            : "No devices match your filters"}
                        </TableCell>
                      </TableRow>
                    )
                  : (
                      filteredDevices.map((device) => {
                        const catalogEntry = getCatalogEntry(device);
                        const nextAction = getNextAction(device);

                        return (
                          <TableRow key={device.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{device.manufacturer}</p>
                                <p className="text-xs text-muted-foreground">{device.model || "Unknown Model"}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{device.imei}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="uppercase text-xs"
                                >
                                  {catalogEntry?.protocol_type || device.protocol || "HTTP"}
                                </Badge>
                                {catalogEntry?.default_port && (
                                  <span className="text-xs text-muted-foreground">
                                    :
                                    {catalogEntry.default_port}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <DeviceLifecycleBadge status={device.lifecycle_status as DeviceLifecycleStatus} />
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {device.last_seen
                                ? formatRelative(device.last_seen)
                                : "Never"}
                            </TableCell>
                            <TableCell>
                              {nextAction && canConfigure && (
                                <Button
                                  size="sm"
                                  variant={nextAction.action === "setup" ? "default" : "outline"}
                                  onClick={() => handleOpenWizard(device)}
                                >
                                  <nextAction.icon className="h-4 w-4 mr-2" />
                                  {nextAction.label}
                                </Button>
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleOpenWizard(device)}>
                                    <Settings className="h-4 w-4 mr-2" />
                                    View Setup Guide
                                  </DropdownMenuItem>
                                  {canConfigure && device.lifecycle_status !== "configured" && (
                                    <DropdownMenuItem onClick={() => onMarkConfigured(device.id)}>
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Mark Configured
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => onTroubleshoot(device.id)}>
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    Troubleshoot
                                  </DropdownMenuItem>
                                  {canReset && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => onReset(
                                          device.id,
                                          "Manual reset by admin",
                                        )}
                                        className="text-destructive"
                                      >
                                        Reset to Config Pending
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Device Setup Wizard */}
      {selectedDevice && (
        <DeviceSetupWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          device={selectedDevice}
          catalogEntry={getCatalogEntry(selectedDevice)}
          onMarkConfigured={onMarkConfigured}
          onComplete={handleWizardComplete}
          canConfigure={canConfigure}
        />
      )}
    </>
  );
}
