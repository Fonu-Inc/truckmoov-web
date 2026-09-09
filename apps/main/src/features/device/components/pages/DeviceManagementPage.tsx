import type {
  DeviceTrackerType, FleetDevice,
} from "@truckmoov/api/fleet";
import type { DeviceWithTelemetry } from "@/hooks/useDeviceTelemetry";
import type { IoTDevice } from "@/types";
import {
  downloadDeviceImportTemplate,
  exportDevices,

  getValidateDeviceAssignmentQueryOptions,
  useAssignDevice,
  useCreateDevice,
  useCreateDeviceSetupRequest,
  useDeleteDevice,
  useDevice,
  useDevices,
  useImportDevices,
  useUnassignDevice,
  useUpdateDevice,
  useUpdateDeviceFirmware,
  useUpdateDeviceLifecycle,
  useVehicles,
} from "@truckmoov/api/fleet";
import { queryClient } from "@truckmoov/api/lib/query-client";
import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  CheckCircle2,
  Cpu,
  Download,
  Edit,
  Eye,
  Link,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  Signal,
  SlidersHorizontal,
  Trash2,
  Unlink,
  Upload,
} from "lucide-react";
import {
  useCallback, useEffect, useMemo, useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
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
import { useAuthStore } from "@/features/auth/stores/authStore";
import { AssignDeviceDialogWithLifecycle } from "@/features/device/components/ui/AssignDeviceDialogWithLifecycle";
import { DeviceBulkUploadDialog } from "@/features/device/components/ui/DeviceBulkUploadDialog";
import { DeviceDetailsSheet } from "@/features/device/components/ui/DeviceDetailsSheet";
import { DeviceFormDialog } from "@/features/device/components/ui/DeviceFormDialog";
import { DeviceRequestsTracker } from "@/features/device/components/ui/DeviceRequestsTracker";
import { DeviceSetupRequestDialog } from "@/features/device/components/ui/DeviceSetupRequestDialog";
import { useDevicePermissions } from "@/hooks/useDevicePermissions";
import { useRequireSubscription } from "@/hooks/useRequireSubscription";
import { cn } from "@/lib/utils";

const KNOWN_DEVICE_MANUFACTURERS = [
  "Teltonika",
  "Queclink",
  "Meitrack",
  "CalAmp",
  "Digital Matter",
  "Geotab",
  "Concox",
  "Coban",
];

export default function DeviceManagement() {
  const { requireSubscription } = useRequireSubscription();
  // ponytail: single-role check inline; extract to a helper if a third role or fourth page needs it
  const isAggregatorAdmin = useAuthStore(s => s.user?.role) === "AGGREGATOR_ADMIN";
  const { canManage } = useDevicePermissions();

  const uploadFile = async (_file: File, _requestId: string, _type: "device_photo" | "receipt") => null;

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
  ] = useState<string>("all");
  const [
    manufacturerFilters,
    setManufacturerFilters,
  ] = useState<string[]>([]);
  const [
    lastSeenFilters,
    setLastSeenFilters,
  ] = useState<string[]>([]);
  const [
    isAddDialogOpen,
    setIsAddDialogOpen,
  ] = useState(false);
  const [
    isEditDialogOpen,
    setIsEditDialogOpen,
  ] = useState(false);
  const [
    isBulkUploadOpen,
    setIsBulkUploadOpen,
  ] = useState(false);
  const [
    isRequestDialogOpen,
    setIsRequestDialogOpen,
  ] = useState(false);
  const [
    isAssignDialogOpen,
    setIsAssignDialogOpen,
  ] = useState(false);
  const [
    selectedDevice,
    setSelectedDevice,
  ] = useState<DeviceWithTelemetry | null>(null);
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
  ] = useState<DeviceWithTelemetry | null>(null);
  const [
    firmwareVersion,
    setFirmwareVersion,
  ] = useState("");
  const [
    devicePendingDeletion,
    setDevicePendingDeletion,
  ] = useState<DeviceWithTelemetry | null>(null);

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

  const apiStatus = statusFilter !== "all" && statusFilter !== "assignable"
    ? statusFilter as FleetDevice["status"]
    : undefined;
  const lifecycleStatus = statusFilter === "assignable" ? statusFilter : undefined;
  const apiManufacturer = manufacturerFilters.length === 1 ? manufacturerFilters[0] : undefined;
  const {
    data: devicesResponse, isLoading: loading,
  } = useDevices({
    params: {
      query: debouncedSearch.trim() || undefined,
      status: apiStatus,
      lifecycleStatus,
      manufacturer: apiManufacturer,
    },
  });
  const { data: vehiclesResponse } = useVehicles();
  const { data: availableVehiclesResponse } = useVehicles({ params: { assigned: false } });
  const { data: deviceResponse } = useDevice(selectedDevice?.id ?? "");
  const createDevice = useCreateDevice();
  const createDeviceSetupRequest = useCreateDeviceSetupRequest();
  const updateDevice = useUpdateDevice();
  const deleteDevice = useDeleteDevice();
  const importDevices = useImportDevices();
  const updateLifecycle = useUpdateDeviceLifecycle();
  const updateFirmware = useUpdateDeviceFirmware();
  const assignDevice = useAssignDevice();
  const unassignDevice = useUnassignDevice();

  const devices = useMemo<DeviceWithTelemetry[]>(
    () => (devicesResponse?.data ?? []).map(device => ({
      id: device.id,
      imei: device.imei,
      manufacturer: device.manufacturer,
      model: device.model,
      status: device.status,
      vehicle_id: device.vehicleId,
      tenant_id: device.tenantId,
      last_seen: device.lastSeen,
      signal_strength: device.signalStrength,
      battery_level: device.batteryLevel,
      protocol: "",
      lifecycle_status: device.lifecycleStatus,
      assigned_at: device.assignedAt,
      firmware_version: device.firmwareVersion,
    })),
    [devicesResponse],
  );
  const vehicles = vehiclesResponse?.data ?? [];
  const availableVehicles = availableVehiclesResponse?.data ?? [];
  const detailDevice = deviceResponse?.data;

  /**
   * Fold the raw `status` + `lifecycle_status` fields into the 6 buckets
   * fleetflow's `/admin/devices` displays, so the badge, filter and stats
   * all agree. Ported verbatim from fleetflow's `normalizeStatus` (see
   * `fleetflow-pro-main/src/pages/admin/DeviceManagement.tsx` line 121).
   */
  const normalizeStatus = (device: DeviceWithTelemetry): string => {
    const lifecycle = (device.lifecycle_status || "") as string;
    const legacy = (device.status || "") as string;
    if (legacy === "active")
      return "active";
    if (lifecycle === "assigned" || legacy === "assigned" || device.vehicle_id)
      return "assigned";
    if (lifecycle === "assignable" || lifecycle === "verified_online")
      return "unassigned";
    if (lifecycle === "configured" || lifecycle === "config_pending" || legacy === "configured")
      return "configured";
    if (lifecycle === "registered" || legacy === "registered")
      return "registered";
    return "unregistered";
  };

  const filteredDevices = useMemo(
    () => {
      const now = Date.now();
      return devices.filter((device) => {
        const matchesSearch = true;
        const matchesStatus = statusFilter === "all" || normalizeStatus(device) === statusFilter;
        const matchesManufacturer = manufacturerFilters.length === 0 || manufacturerFilters.includes(device.manufacturer);

        let matchesLastSeen = true;
        if (lastSeenFilters.length > 0) {
          const ls = device.last_seen ? new Date(device.last_seen).getTime() : 0;
          const ageMs = ls ? now - ls : Number.POSITIVE_INFINITY;
          const MIN = 60 * 1000;
          const HOUR = 60 * MIN;
          const DAY = 24 * HOUR;
          matchesLastSeen = lastSeenFilters.some((f) => {
            if (f === "5m")
              return ageMs <= 5 * MIN;
            if (f === "1h")
              return ageMs <= HOUR;
            if (f === "24h")
              return ageMs <= DAY;
            if (f === "7d")
              return ageMs <= 7 * DAY;
            if (f === "never")
              return !device.last_seen;
            return false;
          });
        }

        return matchesSearch && matchesStatus && matchesManufacturer && matchesLastSeen;
      });
    },
    [
      devices,
      manufacturerFilters,
      lastSeenFilters,
      statusFilter,
    ],
  );

  const manufacturers = useMemo(
    () => [
      ...new Set([
        ...KNOWN_DEVICE_MANUFACTURERS,
        ...devices.map(device => device.manufacturer),
      ]),
    ],
    [devices],
  );

  const stats = useMemo(
    () => {
      const buckets = devices.map(normalizeStatus);
      return {
        total: devices.length,
        active: buckets.filter(s => s === "active").length,
        registered: buckets.filter(s => s === "registered").length,
        assigned: buckets.filter(s => s === "assigned").length,
        unassigned: buckets.filter(s => s === "unassigned").length,
        configured: buckets.filter(s => s === "configured").length,
      };
    },
    [devices],
  );

  // Lifecycle status counts

  // Convert DeviceWithTelemetry to IoTDevice for the details sheet
  const convertToIoTDevice = (device: DeviceWithTelemetry): IoTDevice => ({
    id: device.id,
    imei: device.imei,
    manufacturer: device.manufacturer,
    model: device.model || "",
    status: device.status as IoTDevice["status"],
    firmwareVersion: device.firmware_version || "",
    vehicleId: device.vehicle_id || undefined,
    lastSeen: device.last_seen ? new Date(device.last_seen) : undefined,
    signalStrength: device.signal_strength || undefined,
    batteryLevel: device.battery_level || undefined,
  });

  // Handle adding device with catalog selection
  const handleAddDevice = async (newDevice: Partial<IoTDevice>) => {
    try {
      await createDevice.mutateAsync({
        data: {
          imei: newDevice.imei!,
          manufacturer: newDevice.manufacturer!,
          model: newDevice.model!,
          firmwareVersion: newDevice.firmwareVersion || undefined,
        },
      });
      toast.success("Device registered");
      setIsAddDialogOpen(false);
    }
    catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to register device");
    }
  };

  const handleEditDevice = async (updatedDevice: Partial<IoTDevice>) => {
    if (!selectedDevice)
      return;
    try {
      await updateDevice.mutateAsync({
        id: selectedDevice.id, data: {
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

  const handleDeleteDevice = async (deviceId: string) => {
    try {
      await deleteDevice.mutateAsync({ id: deviceId });
      toast.success("Device deleted");
      setDevicePendingDeletion(null);
    }
    catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete device");
    }
  };

  // Mark device as configured (transitions to config_pending -> configured)
  const handleMarkConfigured = async (deviceId: string) => {
    try {
      await updateLifecycle.mutateAsync({
        id: deviceId, data: { lifecycleStatus: "configured" },
      });
      toast.success(
        "Device marked as configured",
        { description: "Waiting for first valid telemetry to verify device." },
      );
    }
    catch (err) {
      console.error(
        "Error marking device configured:",
        err,
      );
      toast.error("Failed to update device status");
    }
  };

  // Assign device to vehicle (with lifecycle validation)
  const handleAssignDevice = async (deviceId: string, vehicleId: string) => {
    try {
      await assignDevice.mutateAsync({
        id: deviceId, data: { vehicleId },
      });
      toast.success("Device assigned to vehicle");
    }
    catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign device");
      throw err;
    }
  };

  const handleUnassignDevice = async (device: DeviceWithTelemetry) => {
    if (!device.vehicle_id) {
      toast.info("Device is not assigned to a vehicle");
      return;
    }

    try {
      await unassignDevice.mutateAsync({ id: device.id });
      toast.success("Device unassigned from vehicle");
    }
    catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to unassign device");
    }
  };

  const openFirmwareDialog = (device: DeviceWithTelemetry) => {
    setFirmwareDevice(device);
    setFirmwareVersion(device.firmware_version || "");
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

  const handleBulkUpload = async (newDevices: Partial<IoTDevice>[]) => {
    try {
      const result = await importDevices.mutateAsync({
        data: {
          items: newDevices.map(device => ({
            imei: device.imei,
            manufacturer: device.manufacturer,
            model: device.model,
            firmwareVersion: device.firmwareVersion,
          })),
        },
      });
      toast.success(`${result.data.created} created, ${result.data.updated} updated`);
      setIsBulkUploadOpen(false);
    }
    catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to import devices");
    }
  };

  const handleCreateDeviceSetupRequest = async (data: {
    manufacturer: string;
    model?: string;
    trackerType: DeviceTrackerType;
    quantity: number;
    simRequired: boolean;
    carrierId?: string;
    planType?: string;
    bundleId?: string;
    vehicleId?: string;
    state?: string;
    city?: string;
    preferredDate?: string;
    preferredTime?: string;
    useCase: string;
    notes?: string;
  }) => {
    try {
      const result = await createDeviceSetupRequest.mutateAsync({ data });
      toast.success("Device setup request submitted");
      return result;
    }
    catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit device setup request");
      return null;
    }
  };

  const handleExportDevices = async () => {
    try {
      setIsExporting(true);
      // Send the current on-screen filters so the download matches the table (§ 5).
      const blob = await exportDevices({
        params: {
          query: debouncedSearch.trim() || undefined,
          status: apiStatus,
          lifecycleStatus,
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

  const handleValidateAssignment = useCallback(
    async (deviceId: string, vehicleId: string) => {
      const response = await queryClient.fetchQuery(getValidateDeviceAssignmentQueryOptions({
        id: deviceId,
        params: { vehicleId },
      }));
      return response.data;
    },
    [],
  );

  const getVehicleInfo = (vehicleId?: string | null) => {
    if (!vehicleId)
      return null;
    return vehicles.find(v => v.id === vehicleId);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Top-right actions */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {!isAggregatorAdmin && (
            <Button
              variant="outline"
              onClick={() => setIsBulkUploadOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Bulk Import
            </Button>
          )}
          <Button
            variant="outline"
            onClick={requireSubscription(() => setIsRequestDialogOpen(true))}
          >
            <Cpu className="mr-2 h-4 w-4" />
            Request Device
          </Button>
          {!isAggregatorAdmin && (
            <Button onClick={requireSubscription(() => setIsAddDialogOpen(true))}>
              <Plus className="mr-2 h-4 w-4" />
              Add Device
            </Button>
          )}
        </div>

        {/* KPI stats */}
        {!isAggregatorAdmin && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Cpu className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground">Total Devices</p>
                    <p className="mt-1 truncate text-xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="mt-1 truncate text-xl font-bold text-success">{stats.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground">Registered</p>
                    <p className="mt-1 truncate text-xl font-bold">{stats.registered}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info/10">
                    <Link className="h-5 w-5 text-info" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground">Assigned</p>
                    <p className="mt-1 truncate text-xl font-bold text-info">{stats.assigned}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                    <Signal className="h-5 w-5 text-warning" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground">Unassigned</p>
                    <p className="mt-1 truncate text-xl font-bold text-warning">{stats.unassigned}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info/10">
                    <Settings className="h-5 w-5 text-info" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground">Configured</p>
                    <p className="mt-1 truncate text-xl font-bold text-info">{stats.configured}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Device List */}
        {!isAggregatorAdmin && (
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-primary" />
                    Devices (
                    {filteredDevices.length}
                    )
                  </CardTitle>
                  <CardDescription className="mt-1">All trackers in your fleet — monitor lifecycle status, signal health, and last-seen timestamps.</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportDevices}
                  disabled={isExporting}
                >
                  {isExporting
                    ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )
                    : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
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
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-full sm:w-[170px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    <SelectItem value="configured">Configured</SelectItem>
                    <SelectItem value="registered">Registered</SelectItem>
                    <SelectItem value="unregistered">Unregistered</SelectItem>
                  </SelectContent>
                </Select>
                <Popover>
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
                              checked={manufacturerFilters.includes(m)}
                              onCheckedChange={(c) => {
                                setManufacturerFilters(prev =>
                                  c
                                    ? [
                                        ...prev,
                                        m,
                                      ]
                                    : prev.filter(x => x !== m));
                              }}
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
                        {[
                          {
                            v: "5m", l: "Last 5 minutes",
                          },
                          {
                            v: "1h", l: "Last hour",
                          },
                          {
                            v: "24h", l: "Last 24 hours",
                          },
                          {
                            v: "7d", l: "Last 7 days",
                          },
                          {
                            v: "never", l: "Never seen",
                          },
                        ].map(opt => (
                          <label
                            key={opt.v}
                            className="flex items-center gap-2 cursor-pointer select-none"
                          >
                            <Checkbox
                              checked={lastSeenFilters.includes(opt.v)}
                              onCheckedChange={(c) => {
                                setLastSeenFilters(prev =>
                                  c
                                    ? [
                                        ...prev,
                                        opt.v,
                                      ]
                                    : prev.filter(x => x !== opt.v));
                              }}
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
              {loading
                ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )
                : filteredDevices.length === 0
                  ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Cpu className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No devices found</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {searchQuery || statusFilter !== "all" || manufacturerFilters.length > 0
                            ? "Try adjusting your filters"
                            : "Add your first device to get started"}
                        </p>
                        {canManage && !searchQuery && statusFilter === "all" && (
                          <Button
                            className="mt-4"
                            onClick={() => setIsAddDialogOpen(true)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Device
                          </Button>
                        )}
                      </div>
                    )
                  : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border text-left text-sm text-muted-foreground">
                              <th className="pb-3 font-medium">Device ID</th>
                              <th className="pb-3 font-medium">Device</th>
                              <th className="pb-3 font-medium">IMEI</th>
                              <th className="pb-3 font-medium">Status</th>
                              <th className="pb-3 font-medium">Vehicle</th>
                              <th className="pb-3 font-medium">Signal</th>
                              <th className="pb-3 font-medium">Last Seen</th>
                              <th className="pb-3 font-medium text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {filteredDevices.map((device) => {
                              const vehicle = getVehicleInfo(device.vehicle_id);
                              return (
                                <tr
                                  key={device.id}
                                  className="group transition-colors hover:bg-secondary/30"
                                >
                                  <td className="py-4">
                                    <span
                                      className="rounded bg-secondary px-2 py-1 font-mono text-xs"
                                      title={device.id}
                                    >
                                      {device.id.slice(0, 8)}
                                    </span>
                                  </td>
                                  <td className="py-4">
                                    <div className="flex items-center gap-3">
                                      <div className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-lg",
                                        device.status === "active"
                                          ? "bg-success/10"
                                          : device.status === "faulty"
                                            ? "bg-destructive/10"
                                            : "bg-secondary",
                                      )}
                                      >
                                        <Cpu className={cn(
                                          "h-5 w-5",
                                          device.status === "active"
                                            ? "text-success"
                                            : device.status === "faulty"
                                              ? "text-destructive"
                                              : "text-muted-foreground",
                                        )}
                                        />
                                      </div>
                                      <div>
                                        <p className="font-medium">{device.manufacturer}</p>
                                        <p className="text-xs text-muted-foreground">{device.model || "—"}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4">
                                    <span className="rounded bg-secondary px-2 py-1 font-mono text-sm">
                                      {device.imei}
                                    </span>
                                  </td>
                                  <td className="py-4">
                                    {(() => {
                                      const s = normalizeStatus(device);
                                      return (
                                        <span className={cn(
                                          "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                                          s === "active" && "bg-success/10 text-success",
                                          s === "assigned" && "bg-info/10 text-info",
                                          s === "unassigned" && "bg-warning/10 text-warning",
                                          s === "configured" && "bg-info/10 text-info",
                                          s === "registered" && "bg-muted text-muted-foreground",
                                          s === "unregistered" && "bg-secondary text-muted-foreground",
                                        )}
                                        >
                                          {s}
                                        </span>
                                      );
                                    })()}
                                  </td>
                                  <td className="py-4">
                                    {vehicle
                                      ? (
                                          <span className="text-sm">{vehicle.registrationNumber}</span>
                                        )
                                      : (
                                          <span className="text-muted-foreground">—</span>
                                        )}
                                  </td>
                                  <td className="py-4">
                                    {device.signal_strength !== undefined && device.signal_strength !== null
                                      ? (
                                          <div className="flex items-center gap-2">
                                            <Signal className={cn(
                                              "h-4 w-4",
                                              device.signal_strength > 70
                                                ? "text-success"
                                                : device.signal_strength > 40 ? "text-warning" : "text-destructive",
                                            )}
                                            />
                                            <span className="text-sm">
                                              {device.signal_strength}
                                              %
                                            </span>
                                          </div>
                                        )
                                      : (
                                          <span className="text-muted-foreground">—</span>
                                        )}
                                  </td>
                                  <td className="py-4 text-sm text-muted-foreground">
                                    {device.last_seen
                                      ? formatRelative(device.last_seen)
                                      : "Never"}
                                  </td>
                                  <td className="py-4 text-right">
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
                                        {(device.lifecycle_status === "registered" || device.status === "registered") && (
                                          <DropdownMenuItem onClick={() => handleMarkConfigured(device.id)}>
                                            <Settings className="mr-2 h-4 w-4" />
                                            Mark as Configured
                                          </DropdownMenuItem>
                                        )}
                                        {device.vehicle_id
                                          ? (
                                              <DropdownMenuItem onClick={() => handleUnassignDevice(device)}>
                                                <Unlink className="mr-2 h-4 w-4" />
                                                Unassign Vehicle
                                              </DropdownMenuItem>
                                            )
                                          : (
                                              <DropdownMenuItem onClick={() => {
                                                setSelectedDevice(device);
                                                setIsAssignDialogOpen(true);
                                              }}
                                              >
                                                <Link className="mr-2 h-4 w-4" />
                                                Assign to Vehicle
                                              </DropdownMenuItem>
                                            )}
                                        <DropdownMenuItem onClick={() => openFirmwareDialog(device)}>
                                          <RefreshCw className="mr-2 h-4 w-4" />
                                          Update Firmware
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-destructive focus:text-destructive"
                                          onClick={() => setDevicePendingDeletion(device)}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete Device
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
            </CardContent>
          </Card>
        )}

        <DeviceRequestsTracker />
      </div>

      {/* Dialogs */}
      <DeviceFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddDevice}
        title="Register New Device"
        isSubmitting={createDevice.isPending}
      />

      <DeviceSetupRequestDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        onSubmit={handleCreateDeviceSetupRequest}
        onUploadFile={uploadFile}
        manufacturers={manufacturers}
        vehicles={vehicles.map(vehicle => ({
          id: vehicle.id,
          registrationNumber: vehicle.registrationNumber,
          make: vehicle.make,
          model: vehicle.model,
        }))}
      />

      <DeviceFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleEditDevice}
        title="Edit Device"
        device={selectedDevice ? convertToIoTDevice(selectedDevice) : undefined}
        isSubmitting={updateDevice.isPending}
      />

      <Dialog
        open={!!devicePendingDeletion}
        onOpenChange={(open) => {
          if (!open && !deleteDevice.isPending) {
            setDevicePendingDeletion(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete Device</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete
              {" "}
              {devicePendingDeletion?.manufacturer}
              {" "}
              {devicePendingDeletion?.model}
              {devicePendingDeletion?.imei ? ` (${devicePendingDeletion.imei})` : ""}
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDevicePendingDeletion(null)}
              disabled={deleteDevice.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (devicePendingDeletion) {
                  void handleDeleteDevice(devicePendingDeletion.id);
                }
              }}
              disabled={deleteDevice.isPending}
            >
              {deleteDevice.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <Label htmlFor="firmware-version">Firmware Version</Label>
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
              {updateFirmware.isPending
                ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )
                : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
              Update Firmware
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeviceBulkUploadDialog
        open={isBulkUploadOpen}
        onOpenChange={setIsBulkUploadOpen}
        onUpload={handleBulkUpload}
        onDownloadTemplate={downloadDeviceImportTemplate}
      />

      <AssignDeviceDialogWithLifecycle
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        device={selectedDevice
          ? {
              id: selectedDevice.id,
              imei: selectedDevice.imei,
              manufacturer: selectedDevice.manufacturer,
              model: selectedDevice.model,
              lifecycle_status: selectedDevice.lifecycle_status,
              status: selectedDevice.status,
              vehicle_id: selectedDevice.vehicle_id,
            }
          : null}
        vehicles={availableVehicles.map(v => ({
          id: v.id,
          registrationNumber: v.registrationNumber,
          make: v.make ?? "",
          model: v.model,
          year: v.year ?? new Date().getFullYear(),
          status: String(v.status),
        }))}
        onAssign={handleAssignDevice}
        onValidate={handleValidateAssignment}
      />

      {selectedDevice && (() => {
        const vehicleData = getVehicleInfo(selectedDevice.vehicle_id);
        return (
          <DeviceDetailsSheet
            open={isDetailsOpen}
            onOpenChange={setIsDetailsOpen}
            device={convertToIoTDevice(detailDevice
              ? {
                  ...selectedDevice,
                  imei: detailDevice.imei,
                  manufacturer: detailDevice.manufacturer,
                  model: detailDevice.model,
                  status: detailDevice.status,
                  vehicle_id: detailDevice.vehicleId,
                  last_seen: detailDevice.lastSeen,
                  signal_strength: detailDevice.signalStrength,
                  battery_level: detailDevice.batteryLevel,
                  lifecycle_status: detailDevice.lifecycleStatus,
                  firmware_version: detailDevice.firmwareVersion,
                }
              : selectedDevice)}
            vehicle={vehicleData
              ? {
                  id: vehicleData.id,
                  vin: vehicleData.vin,
                  registrationNumber: vehicleData.registrationNumber,
                  make: vehicleData.make,
                  model: vehicleData.model,
                  year: vehicleData.year,
                  type: vehicleData.type as "truck" | "van" | "trailer",
                  status: vehicleData.status,
                  capacity: vehicleData.capacity || 0,
                }
              : undefined}
          />
        );
      })()}
    </>
  );
}
