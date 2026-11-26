import type { ColumnDef } from "@tanstack/react-table";
import type {
  DeviceTrackerType, FleetDevice,
} from "@truckmoov/api/fleet";
import type {
  IoTDevice, SIMCard,
} from "@/types";
import { useQuery } from "@tanstack/react-query";
import { getSimsQueryOptions } from "@truckmoov/api/auth";
import {
  exportDevices,
  useCreateDeviceSetupRequest,
  useDevice,
  useDevices,
  useDevicesFilters,
  useDevicesSummary,
  useReinstateDevice,
  useSuspendDevice,
  useUpdateDevice,
  useUpdateDeviceFirmware,
  useVehicles,
} from "@truckmoov/api/fleet";
import {
  formatRelative, formatWithPattern,
} from "@truckmoov/app-core/utils/time-utils";
import {
  CheckCircle2,
  Cpu,
  Download,
  Edit,
  Eye,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  Signal,
  SlidersHorizontal,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import { DataTable } from "@/components/shadcn/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { DeviceDetailsSheet } from "@/features/device/components/ui/DeviceDetailsSheet";
import { DeviceFormDialog } from "@/features/device/components/ui/DeviceFormDialog";
import { DeviceProvisionBadge } from "@/features/device/components/ui/DeviceProvisionBadge";
import { DeviceRequestsTracker } from "@/features/device/components/ui/DeviceRequestsTracker";
import { RequestDeviceDialog } from "@/features/device/components/ui/RequestDeviceDialog";
import { InstallationGate } from "@/features/get-started/components/ui/InstallationGate";
import { useInstallationPending } from "@/features/get-started/hooks/useInstallationPending";
import { onboardingInProgressMessage } from "@/features/get-started/utils/installationProgress";
import { useRequireSubscription } from "@/hooks/useRequireSubscription";
import { cn } from "@/lib/utils";

type DeviceState = "active" | "offline" | "suspended";

// ponytail: /fleet/devices/summary has no online/offline counts, so Active/Offline are
// derived from each device's real lastSeen — "online" = seen in the last 10 minutes, the
// same rule fleetflow uses. Switch to server counts once the summary carries them.
const ONLINE_WINDOW_MS = 10 * 60 * 1000;

function deviceState(device: FleetDevice, now: number): DeviceState {
  if (device.lifecycleStatus === "suspended" || String(device.status) === "suspended")
    return "suspended";
  const seen = device.lastSeen ? new Date(device.lastSeen).getTime() : 0;
  return seen && now - seen < ONLINE_WINDOW_MS ? "active" : "offline";
}

const STATE_BADGE: Record<DeviceState, string> = {
  active: "bg-success/10 text-success",
  offline: "bg-muted text-muted-foreground",
  suspended: "bg-warning/10 text-warning",
};

const LAST_SEEN_OPTIONS = [
  {
    v: "5m", l: "Last 5 minutes", ms: 5 * 60 * 1000,
  },
  {
    v: "1h", l: "Last hour", ms: 60 * 60 * 1000,
  },
  {
    v: "24h", l: "Last 24 hours", ms: 24 * 60 * 60 * 1000,
  },
  {
    v: "7d", l: "Last 7 days", ms: 7 * 24 * 60 * 60 * 1000,
  },
  {
    v: "never", l: "Never seen", ms: 0,
  },
];

function toIoTDevice(device: FleetDevice): IoTDevice {
  return {
    id: device.id,
    imei: device.imei,
    manufacturer: device.manufacturer,
    model: device.model || "",
    status: device.status as IoTDevice["status"],
    firmwareVersion: device.firmwareVersion || "",
    vehicleId: device.vehicleId || undefined,
    lastSeen: device.lastSeen ? new Date(device.lastSeen) : undefined,
    signalStrength: device.signalStrength ?? undefined,
    batteryLevel: device.batteryLevel ?? undefined,
  };
}

export default function DeviceManagement() {
  const { requireSubscription } = useRequireSubscription();
  const installationPending = useInstallationPending();
  // ponytail: single-role check inline; extract to a helper if a third role or fourth page needs it
  const isAggregatorAdmin = useAuthStore(s => s.user?.role) === "AGGREGATOR_ADMIN";

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<"all" | DeviceState>("all");
  // Draft values live in the popover until Apply; applied values drive the table.
  const [
    draftManufacturers,
    setDraftManufacturers,
  ] = useState<string[]>([]);
  const [
    draftLastSeen,
    setDraftLastSeen,
  ] = useState<string[]>([]);
  const [
    manufacturerFilters,
    setManufacturerFilters,
  ] = useState<string[]>([]);
  const [
    lastSeenFilters,
    setLastSeenFilters,
  ] = useState<string[]>([]);
  const [
    isFilterOpen,
    setIsFilterOpen,
  ] = useState(false);
  const [
    isEditDialogOpen,
    setIsEditDialogOpen,
  ] = useState(false);
  const [
    isRequestDialogOpen,
    setIsRequestDialogOpen,
  ] = useState(false);
  const [
    selectedDevice,
    setSelectedDevice,
  ] = useState<FleetDevice | null>(null);
  const [
    isDetailsOpen,
    setIsDetailsOpen,
  ] = useState(false);
  const [
    isExporting,
    setIsExporting,
  ] = useState(false);
  const [
    firmwareDevice,
    setFirmwareDevice,
  ] = useState<FleetDevice | null>(null);
  const [
    firmwareVersion,
    setFirmwareVersion,
  ] = useState("");
  const [
    devicePendingSuspend,
    setDevicePendingSuspend,
  ] = useState<FleetDevice | null>(null);

  useEffect(
    () => {
      const timer = window.setTimeout(
        setDebouncedSearch,
        300,
        searchQuery,
      );
      return () => window.clearTimeout(timer);
    },
    [searchQuery],
  );

  const apiManufacturer = manufacturerFilters.length === 1 ? manufacturerFilters[0] : undefined;
  const devicesQuery = useDevices({
    params: {
      query: debouncedSearch.trim() || undefined,
      manufacturer: apiManufacturer,
    },
  });
  const devicesSummaryQuery = useDevicesSummary();
  const devicesFiltersQuery = useDevicesFilters();
  const { data: vehiclesResponse } = useVehicles();
  const simsQuery = useQuery(getSimsQueryOptions({ params: { limit: 200 } }));
  const { data: deviceResponse } = useDevice(selectedDevice?.id ?? "");
  const createDeviceSetupRequest = useCreateDeviceSetupRequest();
  const updateDevice = useUpdateDevice();
  const suspendDevice = useSuspendDevice();
  const reinstateDevice = useReinstateDevice();
  const isSuspendPending = suspendDevice.isPending || reinstateDevice.isPending;
  const updateFirmware = useUpdateDeviceFirmware();

  const devices = useMemo(
    () => devicesQuery.data?.data ?? [],
    [devicesQuery.data?.data],
  );
  const summary = devicesSummaryQuery.data?.data ?? null;
  const kpiPending = devicesSummaryQuery.isLoading || devicesQuery.isLoading;
  const vehicles = useMemo(
    () => new Map((vehiclesResponse?.data ?? []).map(v => [
      v.id,
      v,
    ])),
    [vehiclesResponse?.data],
  );
  // The device record carries no SIM — SIMs point at their device instead.
  const simForDevice = useMemo(
    () => {
      const byKey = new Map<string, (typeof sims)[number]>();
      const sims = simsQuery.data?.data?.items ?? [];
      for (const sim of sims) {
        if (sim.assignedDevice) {
          byKey.set(
            sim.assignedDevice.id,
            sim,
          );
          byKey.set(
            sim.assignedDevice.imei,
            sim,
          );
        }
      }
      return (device: FleetDevice) => byKey.get(device.id) ?? byKey.get(device.imei);
    },
    [simsQuery.data?.data?.items],
  );

  const now = Date.now();
  const filteredDevices = devices.filter((device) => {
    const matchesStatus = statusFilter === "all" || deviceState(
      device,
      now,
    ) === statusFilter;
    const matchesManufacturer = manufacturerFilters.length === 0 || manufacturerFilters.includes(device.manufacturer);
    const seen = device.lastSeen ? new Date(device.lastSeen).getTime() : 0;
    const matchesLastSeen = lastSeenFilters.length === 0 || lastSeenFilters.some((value) => {
      if (value === "never")
        return !seen;
      const window = LAST_SEEN_OPTIONS.find(o => o.v === value)?.ms ?? 0;
      return Boolean(seen) && now - seen <= window;
    });
    return matchesStatus && matchesManufacturer && matchesLastSeen;
  });

  const manufacturers = [
    ...new Set([
      ...(devicesFiltersQuery.data?.data?.manufacturers ?? []),
      ...devices.map(device => device.manufacturer),
    ]),
  ];

  const states = devices.map(device => deviceState(
    device,
    now,
  ));
  const stats = {
    total: summary?.total ?? devices.length,
    active: summary?.online ?? states.filter(s => s === "active").length,
    offline: summary?.offline ?? states.filter(s => s === "offline").length,
    suspended: summary?.suspended ?? states.filter(s => s === "suspended").length,
  };

  const handleEditDevice = async (updatedDevice: Partial<IoTDevice>) => {
    if (!selectedDevice)
      return;
    try {
      await updateDevice.mutateAsync({
        id: selectedDevice.id,
        data: {
          name: (updatedDevice as IoTDevice & { deviceName?: string }).deviceName?.trim() || undefined,
          manufacturer: updatedDevice.manufacturer,
          model: updatedDevice.model,
          firmwareVersion: updatedDevice.firmwareVersion || undefined,
        },
      });
      toast.success("Device updated");
      setIsEditDialogOpen(false);
    }
    catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update device");
    }
  };

  // POST /fleet/devices/:id/suspend | reinstate. Suspending frees the vehicle; reinstating
  // restores the pre-suspension state. Platform suspensions can't be lifted here.
  const setSuspended = (device: FleetDevice, suspended: boolean) => {
    (suspended ? suspendDevice : reinstateDevice).mutate(
      { id: device.id },
      {
        onSuccess: () => {
          toast.success(suspended ? "Device suspended" : "Device reinstated");
          setDevicePendingSuspend(null);
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  const handleUpdateFirmware = async () => {
    if (!firmwareDevice)
      return;
    const nextVersion = firmwareVersion.trim();
    if (!nextVersion) {
      toast.error("Firmware version is required");
      return;
    }
    try {
      await updateFirmware.mutateAsync({
        id: firmwareDevice.id,
        data: { firmwareVersion: nextVersion },
      });
      toast.success("Firmware updated");
      setFirmwareDevice(null);
      setFirmwareVersion("");
    }
    catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update firmware");
    }
  };

  const handleCreateDeviceSetupRequest = async (data: {
    quantity: number;
    useCase: string;
    notes?: string;
    pickupLocationId: string;
    state?: string;
    city?: string;
    preferredDate?: string;
    preferredTime?: string;
    manufacturer?: string;
    trackerType?: DeviceTrackerType;
  }) => {
    try {
      const result = await createDeviceSetupRequest.mutateAsync({
        data: {
          ...data, simRequired: false,
        },
      });
      toast.success("Device request submitted");
      return result;
    }
    catch (err) {
      toast.error(onboardingInProgressMessage(err) ?? (err instanceof Error ? err.message : "Failed to submit device request"));
      return null;
    }
  };

  const handleExportDevices = async () => {
    try {
      setIsExporting(true);
      const blob = await exportDevices({
        params: {
          query: debouncedSearch.trim() || undefined,
          manufacturer: apiManufacturer,
        },
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `devices-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Devices export downloaded");
    }
    catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to export devices");
    }
    finally {
      setIsExporting(false);
    }
  };

  const toggle = (list: string[], value: string, on: boolean) => on
    ? [
        ...list,
        value,
      ]
    : list.filter(x => x !== value);

  const detailDevice = deviceResponse?.data ?? selectedDevice;
  const detailVehicle = detailDevice?.vehicleId ? vehicles.get(detailDevice.vehicleId) : undefined;
  const detailSim = detailDevice ? simForDevice(detailDevice) : undefined;
  const kpis = [
    {
      label: "Total Devices", value: stats.total, icon: Cpu, tone: "text-primary", bg: "bg-primary/10",
    },
    {
      label: "Devices Active", value: stats.active, icon: CheckCircle2, tone: "text-success", bg: "bg-success/10",
    },
    {
      label: "Devices Offline", value: stats.offline, icon: Signal, tone: "text-muted-foreground", bg: "bg-muted",
    },
    {
      label: "Devices Suspended", value: stats.suspended, icon: ShieldAlert, tone: "text-warning", bg: "bg-warning/10",
    },
  ];

  const deviceColumns: ColumnDef<FleetDevice>[] = [
    {
      id: "model",
      header: "Manufacturer / Model",
      accessorFn: device => device.name || device.manufacturer,
      cell: ({ row }) => {
        const device = row.original;
        const state = deviceState(
          device,
          now,
        );
        return (
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              state === "active" ? "bg-success/10" : "bg-secondary",
            )}
            >
              <Cpu className={cn(
                "h-5 w-5",
                state === "active" ? "text-success" : "text-muted-foreground",
              )}
              />
            </div>
            <div>
              <p className="font-medium">{device.name || device.manufacturer}</p>
              <p className="text-xs text-muted-foreground">
                {device.name ? `${device.manufacturer} · ${device.model || "-"}` : device.model || "-"}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "imei",
      header: "IMEI",
      cell: ({ row }) => <span className="rounded bg-secondary px-2 py-1 font-mono text-sm">{row.original.imei}</span>,
    },
    {
      id: "vehicle",
      header: "Vehicle Assigned",
      enableSorting: false,
      cell: ({ row }) => {
        const vehicle = row.original.vehicleId ? vehicles.get(row.original.vehicleId) : undefined;
        return vehicle
          ? (
              <>
                <p className="text-sm">{vehicle.plateNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {[
                    vehicle.make,
                    vehicle.model,
                  ].filter(Boolean).join(" ")}
                </p>
              </>
            )
          : <span className="text-muted-foreground">-</span>;
      },
    },
    {
      id: "sim",
      header: "SIM Card",
      enableSorting: false,
      cell: ({ row }) => {
        const sim = simForDevice(row.original);
        return sim
          ? (
              <>
                <p className="text-sm">{sim.mobileNumber}</p>
                <p className="text-xs text-muted-foreground">{sim.operator}</p>
              </>
            )
          : <span className="text-muted-foreground">-</span>;
      },
    },
    {
      id: "status",
      header: "Status",
      accessorFn: device => deviceState(
        device,
        now,
      ),
      cell: ({ row }) => {
        const state = deviceState(
          row.original,
          now,
        );
        return (
          <>
            <span className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
              STATE_BADGE[state],
            )}
            >
              {state}
            </span>
            <DeviceProvisionBadge
              device={row.original}
              className="mt-1.5 max-w-64"
            />
          </>
        );
      },
    },
    {
      id: "signal",
      header: "Signal",
      accessorFn: device => device.signalStrength ?? -1,
      cell: ({ row }) => {
        const signal = row.original.signalStrength;
        return signal !== null && signal !== undefined
          ? (
              <div className="flex items-center gap-2">
                <Signal className={cn(
                  "h-4 w-4",
                  signal > 70 ? "text-success" : signal > 40 ? "text-warning" : "text-destructive",
                )}
                />
                <span className="text-sm">
                  {signal}
                  %
                </span>
              </div>
            )
          : <span className="text-muted-foreground">-</span>;
      },
    },
    {
      id: "lastSeen",
      header: "Last Seen",
      accessorFn: device => device.lastSeen ?? "",
      meta: { className: "text-sm text-muted-foreground" },
      cell: ({ row }) => (row.original.lastSeen ? formatRelative(row.original.lastSeen) : "Never"),
    },
    {
      id: "dateAdded",
      header: "Date Added",
      accessorFn: device => device.createdAt,
      meta: { className: "text-sm text-muted-foreground" },
      cell: ({ row }) => formatWithPattern(
        row.original.createdAt,
        "d MMM yyyy, HH:mm",
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => {
        const device = row.original;
        const state = deviceState(
          device,
          now,
        );
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setSelectedDevice(device);
                setIsDetailsOpen(true);
              }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSelectedDevice(device);
                setIsEditDialogOpen(true);
              }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                setFirmwareDevice(device);
                setFirmwareVersion(device.firmwareVersion || "");
              }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Update Firmware
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {state === "suspended"
                ? device.suspendedBy !== "platform" && (
                  <DropdownMenuItem onClick={() => setSuspended(
                    device,
                    false,
                  )}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reinstate Device
                  </DropdownMenuItem>
                )
                : (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDevicePendingSuspend(device)}
                    >
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      Suspend Device
                    </DropdownMenuItem>
                  )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <div className="space-y-6">
        {!isAggregatorAdmin && (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {kpis.map(k => (
              <Card key={k.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                      k.bg,
                    )}
                    >
                      <k.icon className={cn(
                        "h-5 w-5",
                        k.tone,
                      )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground truncate">{k.label}</p>
                      {kpiPending
                        ? <Skeleton className="mt-1 h-7 w-12" />
                        : (
                            <p className={cn(
                              "text-xl font-bold mt-1 truncate",
                              k.tone,
                            )}
                            >
                              {k.value}
                            </p>
                          )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end">
          <InstallationGate pending={installationPending}>
            <Button
              disabled={installationPending}
              onClick={requireSubscription(() => setIsRequestDialogOpen(true))}
            >
              <Plus className="mr-2 h-4 w-4" />
              Request Device
            </Button>
          </InstallationGate>
        </div>

        {!isAggregatorAdmin && (
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-primary" />
                    Devices
                    {devicesQuery.isLoading ? <Skeleton className="h-4 w-8" /> : ` (${filteredDevices.length})`}
                  </CardTitle>
                  <CardDescription className="mt-1">All trackers in your fleet. Monitor lifecycle status, signal health, and last-seen timestamps.</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportDevices}
                  disabled={isExporting}
                >
                  {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  {isExporting ? "Exporting..." : "Export Data"}
                </Button>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by IMEI, manufacturer, model..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={value => setStatusFilter(value as typeof statusFilter)}
                >
                  <SelectTrigger className="w-full sm:w-[170px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Popover
                  open={isFilterOpen}
                  onOpenChange={(open) => {
                    setIsFilterOpen(open);
                    if (open) {
                      setDraftManufacturers(manufacturerFilters);
                      setDraftLastSeen(lastSeenFilters);
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="relative"
                    >
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filter
                      {(manufacturerFilters.length > 0 || lastSeenFilters.length > 0) && (
                        <Badge
                          variant="secondary"
                          className="ml-2 h-5 px-1.5 text-[10px]"
                        >
                          {manufacturerFilters.length + lastSeenFilters.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    sideOffset={8}
                    className="w-80 p-3 rounded-xl space-y-3 max-h-[70vh] overflow-y-auto"
                  >
                    <h4 className="text-xs font-medium text-foreground px-0.5">Only show devices by...</h4>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium">Manufacturer</p>
                      <div className="space-y-1.5 pl-0.5">
                        {manufacturers.map(m => (
                          <label
                            key={m}
                            className="flex items-center gap-2 cursor-pointer select-none"
                          >
                            <Checkbox
                              checked={draftManufacturers.includes(m)}
                              onCheckedChange={c => setDraftManufacturers(prev => toggle(
                                prev,
                                m,
                                Boolean(c),
                              ))}
                              className="h-3.5 w-3.5"
                            />
                            <span className="text-xs">{m}</span>
                          </label>
                        ))}
                        {manufacturers.length === 0 && (
                          <p className="text-xs text-muted-foreground">No manufacturers</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5 pt-2 border-t border-border">
                      <p className="text-xs font-medium">Last Seen</p>
                      <div className="space-y-1.5 pl-0.5">
                        {LAST_SEEN_OPTIONS.map(opt => (
                          <label
                            key={opt.v}
                            className="flex items-center gap-2 cursor-pointer select-none"
                          >
                            <Checkbox
                              checked={draftLastSeen.includes(opt.v)}
                              onCheckedChange={c => setDraftLastSeen(prev => toggle(
                                prev,
                                opt.v,
                                Boolean(c),
                              ))}
                              className="h-3.5 w-3.5"
                            />
                            <span className="text-xs">{opt.l}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setManufacturerFilters(draftManufacturers);
                          setLastSeenFilters(draftLastSeen);
                          setIsFilterOpen(false);
                        }}
                      >
                        Apply
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setManufacturerFilters([]);
                          setLastSeenFilters([]);
                          setIsFilterOpen(false);
                        }}
                      >
                        Show All
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <DataTable
                  columns={deviceColumns}
                  data={filteredDevices}
                  isLoading={devicesQuery.isLoading}
                  isError={devicesQuery.isError}
                  errorMessage={devicesQuery.error?.message}
                  onRetry={() => void devicesQuery.refetch()}
                  rowClassName={() => "group transition-colors hover:bg-secondary/30"}
                  hasActiveFilters={!!searchQuery || statusFilter !== "all" || manufacturerFilters.length > 0 || lastSeenFilters.length > 0}
                  emptyState={(
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <Cpu className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-foreground">No devices found</h3>
                      <p className="text-sm text-muted-foreground mt-1">Request your first device to get started</p>
                    </div>
                  )}
                  filteredEmptyState={(
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <Cpu className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-foreground">No devices found</h3>
                      <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
                    </div>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <DeviceRequestsTracker />
      </div>

      <RequestDeviceDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        onSubmit={handleCreateDeviceSetupRequest}
      />

      <DeviceFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleEditDevice}
        title="Edit Device"
        device={selectedDevice ? toIoTDevice(selectedDevice) : undefined}
        isSubmitting={updateDevice.isPending}
      />

      <AlertDialog
        open={Boolean(devicePendingSuspend)}
        onOpenChange={(open) => {
          if (!open && !isSuspendPending)
            setDevicePendingSuspend(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend this device?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend this device? Device
              {" "}
              {devicePendingSuspend?.imei || devicePendingSuspend?.id}
              {" "}
              will be released from its assigned vehicle and stay inactive until you reinstate it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSuspendPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSuspendPending}
              onClick={(event) => {
                event.preventDefault();
                if (devicePendingSuspend) {
                  setSuspended(
                    devicePendingSuspend,
                    true,
                  );
                }
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!firmwareDevice}
        onOpenChange={(open) => {
          if (!open) {
            setFirmwareDevice(null);
            setFirmwareVersion("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Update Firmware</DialogTitle>
            <DialogDescription>
              Set the firmware version for
              {" "}
              {firmwareDevice?.manufacturer}
              {" "}
              {firmwareDevice?.model}
              .
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label
              htmlFor="firmware-version"
              required
            >
              Firmware Version
            </Label>
            <Input
              id="firmware-version"
              value={firmwareVersion}
              onChange={event => setFirmwareVersion(event.target.value)}
              placeholder="e.g. 3.28.07"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFirmwareDevice(null);
                setFirmwareVersion("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpdateFirmware}
              disabled={updateFirmware.isPending}
            >
              {updateFirmware.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Update Firmware
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {detailDevice && (
        <DeviceDetailsSheet
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          device={toIoTDevice(detailDevice)}
          provisioning={detailDevice}
          vehicle={detailVehicle
            ? {
                id: detailVehicle.id,
                vin: detailVehicle.vin,
                registrationNumber: detailVehicle.registrationNumber,
                make: detailVehicle.make,
                model: detailVehicle.model,
                year: detailVehicle.year,
                type: detailVehicle.type as "truck" | "van" | "trailer",
                status: detailVehicle.status,
                capacity: detailVehicle.capacity || 0,
                currentDriver: detailVehicle.assignedDriverName ?? undefined,
              }
            : undefined}
          sim={detailSim
            ? {
                id: detailSim.id,
                iccid: detailSim.iccid,
                imsi: detailSim.imsi,
                mobileNumber: detailSim.mobileNumber,
                networkOperator: detailSim.operator,
                status: detailSim.status as SIMCard["status"],
                dataUsage: detailSim.dataUsedGb ?? 0,
                dataLimit: detailSim.dataLimitGb ?? 0,
                deviceId: detailSim.assignedDevice?.id,
                simType: detailSim.simType,
                simStatus: detailSim.status,
              }
            : null}
          onUpdateFirmware={() => {
            setFirmwareDevice(detailDevice);
            setFirmwareVersion(detailDevice.firmwareVersion || "");
          }}
        />
      )}
    </>
  );
}
