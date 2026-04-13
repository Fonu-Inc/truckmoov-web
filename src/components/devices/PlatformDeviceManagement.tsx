import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { SystemDeviceInventoryItem, SystemDeviceInventoryQuery } from "@/features/auth/api/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  Cpu,
  Download,
  Eye,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Search,
  Signal,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface PlatformDeviceManagementProps {
  devices: SystemDeviceInventoryItem[];
  total: number;
  loading: boolean;
  isRefreshing?: boolean;
  isExporting?: boolean;
  filters: SystemDeviceInventoryQuery;
  onRefresh: () => void | Promise<void>;
  onExport: () => void | Promise<unknown>;
  onFilterChange: (key: keyof SystemDeviceInventoryQuery, value: string | undefined) => void;
}

const lifecycleStatuses = [
  { value: "all", label: "All Statuses" },
  { value: "registered", label: "Registered" },
  { value: "config_pending", label: "Config Pending" },
  { value: "configured", label: "Configured" },
  { value: "verified_online", label: "Verified Online" },
  { value: "assignable", label: "Assignable" },
  { value: "assigned", label: "Assigned" },
  { value: "faulty", label: "Faulty" },
  { value: "decommissioned", label: "Decommissioned" },
];

const operationalStatuses = [
  { value: "all", label: "All Operational States" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "faulty", label: "Faulty" },
  { value: "offline", label: "Offline" },
];

function formatLastSeen(lastSeen: string | null) {
  if (!lastSeen) return "Never";
  const date = new Date(lastSeen);
  return Number.isNaN(date.getTime()) ? "Never" : date.toLocaleString();
}

function getLifecycleBadge(status: string) {
  switch (status) {
    case "verified_online":
    case "assignable":
      return <Badge className="bg-success/10 text-success border-success/30">{status}</Badge>;
    case "config_pending":
    case "configured":
    case "registered":
      return <Badge className="bg-warning/10 text-warning border-warning/30">{status}</Badge>;
    case "faulty":
      return <Badge variant="destructive">faulty</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getOperationalBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge className="bg-success/10 text-success border-success/30">active</Badge>;
    case "faulty":
      return <Badge variant="destructive">faulty</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function PlatformDeviceManagement({
  devices,
  total,
  loading,
  isRefreshing = false,
  isExporting = false,
  filters,
  onRefresh,
  onExport,
  onFilterChange,
}: PlatformDeviceManagementProps) {
  const [selectedDevice, setSelectedDevice] = useState<SystemDeviceInventoryItem | null>(null);

  const manufacturers = useMemo(
    () => ["all", ...new Set(devices.map((device) => device.manufacturer).filter(Boolean))],
    [devices]
  );

  const stats = useMemo(
    () => ({
      total,
      online: devices.filter((device) => device.operationalStatus === "active").length,
      faulty: devices.filter((device) => device.lifecycleStatus === "faulty").length,
      assigned: devices.filter((device) => device.lifecycleStatus === "assigned").length,
    }),
    [devices, total]
  );

  const columns = useMemo<ColumnDef<SystemDeviceInventoryItem>[]>(
    () => [
      {
        accessorKey: "imei",
        header: "IMEI",
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.imei}</span>,
      },
      {
        id: "manufacturerModel",
        header: "Manufacturer / Model",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.manufacturer}</p>
            <p className="text-xs text-muted-foreground">{row.original.model}</p>
          </div>
        ),
      },
      {
        accessorKey: "tenantName",
        header: "Tenant",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{row.original.tenantName}</span>
          </div>
        ),
      },
      {
        id: "status",
        header: "Lifecycle / Operational",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            {getLifecycleBadge(row.original.lifecycleStatus)}
            {getOperationalBadge(row.original.operationalStatus)}
          </div>
        ),
      },
      {
        accessorKey: "signalStrength",
        header: "Signal",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Signal className="h-4 w-4 text-muted-foreground" />
            <span>{row.original.signalStrength ?? "-"}</span>
          </div>
        ),
      },
      {
        accessorKey: "lastSeen",
        header: "Last Seen",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatLastSeen(row.original.lastSeen)}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedDevice(row.original)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" />
                Device Inventory
              </CardTitle>
              <CardDescription>
                Platform-wide inventory from the system device API
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void onRefresh()}
                isLoading={isRefreshing}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void onExport()}
                isLoading={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="rounded-lg border bg-card p-3">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Devices in result set</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-2xl font-bold text-success">{stats.online}</p>
              <p className="text-xs text-muted-foreground">Operationally active</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-2xl font-bold text-primary">{stats.assigned}</p>
              <p className="text-xs text-muted-foreground">Assigned</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-2xl font-bold text-destructive">{stats.faulty}</p>
              <p className="text-xs text-muted-foreground">Faulty</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by IMEI, manufacturer, or tenant..."
                className="pl-10"
                value={filters.search ?? ""}
                onChange={(event) => onFilterChange("search", event.target.value)}
              />
            </div>
            <Select
              value={filters.manufacturer ?? "all"}
              onValueChange={(value) =>
                onFilterChange("manufacturer", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Manufacturer" />
              </SelectTrigger>
              <SelectContent>
                {manufacturers.map((manufacturer) => (
                  <SelectItem key={manufacturer} value={manufacturer}>
                    {manufacturer === "all" ? "All Manufacturers" : manufacturer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.lifecycleStatus ?? "all"}
              onValueChange={(value) =>
                onFilterChange("lifecycleStatus", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lifecycle" />
              </SelectTrigger>
              <SelectContent>
                {lifecycleStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.status ?? "all"}
              onValueChange={(value) => onFilterChange("status", value === "all" ? undefined : value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Operational" />
              </SelectTrigger>
              <SelectContent>
                {operationalStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={devices}
            isLoading={loading}
            noResultStatement="No devices match the current filters."
          />

          <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Platform Admin View:</strong> This tab now reads from the system inventory API.
              Live telemetry, simulator controls, and event streams remain on the tracking tab.
            </p>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selectedDevice} onOpenChange={(open) => !open && setSelectedDevice(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Cpu className="h-6 w-6 text-primary" />
              </div>
              <div>
                <span className="block">
                  {selectedDevice?.manufacturer} {selectedDevice?.model}
                </span>
                <span className="text-sm font-normal text-muted-foreground font-mono">
                  IMEI: {selectedDevice?.imei}
                </span>
              </div>
            </SheetTitle>
            <SheetDescription className="sr-only">System inventory device details</SheetDescription>
          </SheetHeader>

          {selectedDevice && (
            <div className="mt-6 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Device Status</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Lifecycle</p>
                    <div className="mt-1">{getLifecycleBadge(selectedDevice.lifecycleStatus)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Operational</p>
                    <div className="mt-1">{getOperationalBadge(selectedDevice.operationalStatus)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Seen</p>
                    <p className="mt-1 text-sm font-medium">{formatLastSeen(selectedDevice.lastSeen)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Signal Strength</p>
                    <p className="mt-1 text-sm font-medium">{selectedDevice.signalStrength ?? "N/A"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Assignment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tenant</span>
                    <span>{selectedDevice.tenantName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tenant ID</span>
                    <span className="font-mono">{selectedDevice.tenantId}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Vehicle ID</span>
                    <span className="font-mono">{selectedDevice.vehicleId ?? "Unassigned"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Assigned At</span>
                    <span>{formatLastSeen(selectedDevice.assignedAt)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Lifecycle Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">{formatLastSeen(selectedDevice.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Updated</span>
                    <span className="font-medium">{formatLastSeen(selectedDevice.updatedAt)}</span>
                  </div>
                  {selectedDevice.lifecycleStatus === "faulty" && (
                    <div className="flex items-center gap-3 text-sm">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="font-medium text-destructive">Marked faulty in lifecycle state</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/*
        Preserved telemetry-era inventory UI for later reuse.

        Legacy pieces intentionally commented instead of deleted:
        - Telemetry log sheet and per-device realtime metrics
        - Battery, speed, heading, GPS, and protocol details sourced from DeviceWithTelemetry
        - Tenant name fallback resolution using Supabase + tenant slug lookup
        - Telemetry-only row actions such as "View Telemetry Log"
      */}
    </>
  );
}
