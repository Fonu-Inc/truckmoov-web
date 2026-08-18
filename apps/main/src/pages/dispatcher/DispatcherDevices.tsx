import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDeviceTelemetry, DeviceWithTelemetry } from "@/hooks/useDeviceTelemetry";
type DeviceLifecycleStatus = any;
import {
  Cpu,
  Plus,
  Search,
  SlidersHorizontal as Filter,
  Upload,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Link,
  Unlink,
  RefreshCw,
  Wifi,
  Signal,
  ShieldAlert,
  Loader2,
  Settings,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import { Label } from "@/components/shadcn/label";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";
import { ExportButton } from "@/components/shadcn/export-button";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { cn } from "@/lib/utils";
import { DeviceFormDialogWithCatalog } from "@/components/devices/DeviceFormDialogWithCatalog";
import { DeviceFormDialog } from "@/components/devices/DeviceFormDialog";
import { DeviceSetupRequestDialog } from "@/components/devices/DeviceSetupRequestDialog";
import { DeviceRequestsTracker } from "@/components/devices/DeviceRequestsTracker";
import { DeviceDetailsSheet } from "@/components/devices/DeviceDetailsSheet";
import { DeviceBulkUploadDialog } from "@/components/devices/DeviceBulkUploadDialog";
import { AssignDeviceDialogWithLifecycle } from "@/components/devices/AssignDeviceDialogWithLifecycle";
import { DeviceLifecycleBadge } from "@/components/devices/DeviceLifecycleBadge";
import { toast } from "sonner";
import { useDevicePermissions } from "@/hooks/useDevicePermissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/shadcn/alert";
import { Skeleton } from "@/components/shadcn/skeleton";
import { useAuthStore } from "@/stores/authStore";
import { IoTDevice } from "@/types";
import { useActiveOrgStore } from "@/stores/activeOrgStore";
import { DeviceSetupRequestsQueue } from "@/components/devices/DeviceSetupRequestsQueue";
import { useRequireSubscription } from "@/hooks/useRequireSubscription";

export default function DispatcherDevices() {
  const { requireSubscription } = useRequireSubscription();
  const { canView, canManage, canEdit, canDelete, role } = useDevicePermissions();
  const { user } = useAuthStore();
  const tenantId = user?.tenantId;
  const markAsConfigured = async (...args: any[]) => ({ success: false });
  const isAssignable = (...args: any[]) => false;

  // Org context for aggregator detection
  const { resolveActiveOrg } = useActiveOrgStore();
  const activeOrg: any = null;
  const isAggregator = activeOrg?.orgType === 'AGGREGATOR';

  // Use real database data
  const { devices, loading, error, refetch } = useDeviceTelemetry(tenantId || undefined);
  const vehicles: any[] = [];

  // Device setup requests (used by aggregator view)
  const setupRequests: any[] = [];
  const setupLoading = false;
  const refetchSetup = async (...args: any[]) => {};
  const updateRequestStatus = async (...args: any[]) => {};
  const createRequest = async (...args: any[]) => null;
  const uploadFile = async (...args: any[]) => null;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceWithTelemetry | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesSearch =
        device.imei.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (device.model?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      
      // Support both lifecycle_status and legacy status
      const deviceStatus = device.lifecycle_status || device.status;
      const matchesStatus = statusFilter === "all" || deviceStatus === statusFilter;
      const matchesManufacturer = manufacturerFilter === "all" || device.manufacturer === manufacturerFilter;
      return matchesSearch && matchesStatus && matchesManufacturer;
    });
  }, [devices, searchQuery, statusFilter, manufacturerFilter]);

  const manufacturers = useMemo(() => [...new Set(devices.map((d) => d.manufacturer))], [devices]);

  // Lifecycle status counts
  const statusCounts = useMemo(() => {
    const getLifecycleStatus = (d: DeviceWithTelemetry) => d.lifecycle_status || d.status;
    return {
      all: devices.length,
      registered: devices.filter((d) => getLifecycleStatus(d) === "registered").length,
      config_pending: devices.filter((d) => getLifecycleStatus(d) === "config_pending").length,
      configured: devices.filter((d) => getLifecycleStatus(d) === "configured").length,
      verified_online: devices.filter((d) => getLifecycleStatus(d) === "verified_online").length,
      assignable: devices.filter((d) => getLifecycleStatus(d) === "assignable").length,
      // Assigned: lifecycle assigned but NOT operationally active (e.g., vehicle in maintenance)
      assigned: devices.filter((d) => getLifecycleStatus(d) === "assigned" && d.status !== "active").length,
      faulty: devices.filter((d) => getLifecycleStatus(d) === "faulty").length,
      // Active: devices with operational status 'active' (assigned devices that are running)
      active: devices.filter((d) => d.status === "active").length,
    };
  }, [devices]);

  // Convert DeviceWithTelemetry to IoTDevice for the details sheet
  const convertToIoTDevice = (device: DeviceWithTelemetry): IoTDevice => ({
    id: device.id,
    imei: device.imei,
    manufacturer: device.manufacturer,
    model: device.model || "",
    status: device.status as IoTDevice["status"],
    firmwareVersion: "1.0.0",
    vehicleId: device.vehicle_id || undefined,
    lastSeen: device.last_seen ? new Date(device.last_seen) : undefined,
    signalStrength: device.signal_strength || undefined,
    batteryLevel: device.battery_level || undefined,
  });

  // Handle adding device with catalog selection
  const handleAddDevice = async (_newDevice: { imei: string; catalog_id: string; manufacturer: string; model: string }) => {
    toast.info('Coming soon');
    return;
  };

  const handleEditDevice = async (_updatedDevice: Partial<IoTDevice>) => {
    toast.info('Coming soon');
    return;
  };

  const handleDeleteDevice = async (_deviceId: string) => {
    toast.info('Coming soon');
    return;
  };

  // Mark device as configured (transitions to config_pending -> configured)
  const handleMarkConfigured = async (deviceId: string) => {
    try {
      const result = await markAsConfigured(deviceId);
      if (result.success) {
        toast.success("Device marked as configured", {
          description: "Waiting for first valid telemetry to verify device.",
        });
        refetch();
      }
    } catch (err) {
      console.error('Error marking device configured:', err);
      toast.error("Failed to update device status");
    }
  };

  // Assign device to vehicle (with lifecycle validation)
  const handleAssignDevice = async (_deviceId: string, _vehicleId: string) => {
    toast.info('Coming soon');
    return;
  };

  const handleUnassignDevice = async (_deviceId: string) => {
    toast.info('Coming soon');
    return;
  };

  const handleBulkUpload = async (_newDevices: Partial<IoTDevice>[]) => {
    toast.info('Coming soon');
    return;
  };

  const getVehicleInfo = (vehicleId?: string | null) => {
    if (!vehicleId) return null;
    return vehicles.find((v) => v.id === vehicleId);
  };

  // Access control - redirect if no view access
  if (!canView) {
    return (
      <DashboardLayout title="Access Denied" subtitle="You don't have permission to view devices">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Your role ({role}) does not have permission to access device management. 
            Contact your administrator if you believe this is an error.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  // Aggregator view: show only Device Setup Requests queue
  if (isAggregator) {
    return (
      <DashboardLayout
        title="Device Setup Requests"
        subtitle="Review and fulfill setup requests from your linked owner-operators"
      >
        <DeviceSetupRequestsQueue
          requests={setupRequests}
          loading={setupLoading}
          onRefresh={refetchSetup}
          onUpdateStatus={updateRequestStatus}
          isConfigurator={true}
        />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="IoT Device Management" subtitle="Provision and manage GPS tracking devices">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Error Loading Devices</AlertTitle>
          <AlertDescription>
            {error}. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="IoT Device Management" subtitle="Provision and manage GPS tracking devices">
      <div className="space-y-6">
        {/* Top-right actions */}
        {canManage && (
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Bulk Import
            </Button>
            <Button variant="outline" onClick={requireSubscription(() => setIsRequestDialogOpen(true))}>
              <Cpu className="mr-2 h-4 w-4" />
              Request Device
            </Button>
            <Button onClick={requireSubscription(() => setIsAddDialogOpen(true))}>
              <Plus className="mr-2 h-4 w-4" />
              Add Device
            </Button>
          </div>
        )}

        {/* Device List */}
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" />
                Devices ({filteredDevices.length})
              </CardTitle>
              <ExportButton
                filename="devices"
                rows={filteredDevices}
                columns={[
                  { header: "IMEI", accessor: "imei" },
                  { header: "Manufacturer", accessor: "manufacturer" },
                  { header: "Model", accessor: (d: any) => d.model ?? "" },
                  { header: "Status", accessor: (d: any) => d.lifecycle_status ?? d.status },
                  { header: "Vehicle", accessor: (d: any) => getVehicleInfo(d.vehicle_id)?.registrationNumber ?? "" },
                  { header: "Signal (%)", accessor: (d: any) => d.signal_strength ?? "" },
                  { header: "Last Seen", accessor: (d: any) => d.last_seen ?? "" },
                ]}
              />
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by IMEI, manufacturer, model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[170px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="registered">Registered</SelectItem>
                  <SelectItem value="configured">Configured</SelectItem>
                  <SelectItem value="assignable">Assignable</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="faulty">Faulty</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="relative">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filter
                    {manufacturerFilter !== "all" && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">1</Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 space-y-4">
                  <Label className="text-sm font-semibold">Show Devices</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="dev-flt-mfr"
                        checked={manufacturerFilter !== "all"}
                        onCheckedChange={(c) => { if (!c) setManufacturerFilter("all"); }}
                      />
                      <Label htmlFor="dev-flt-mfr" className="text-xs cursor-pointer">Manufacturer</Label>
                    </div>
                    <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All Manufacturers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Manufacturers</SelectItem>
                        {manufacturers.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setManufacturerFilter("all")}>
                    Show All
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredDevices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Cpu className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No devices found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery || statusFilter !== "all" || manufacturerFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Add your first device to get started"}
                </p>
                {canManage && !searchQuery && statusFilter === "all" && (
                  <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Device
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left text-sm text-muted-foreground">
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
                        <tr key={device.id} className="group transition-colors hover:bg-secondary/30">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-lg",
                                device.status === "active"
                                  ? "bg-success/10"
                                  : device.status === "faulty"
                                  ? "bg-destructive/10"
                                  : "bg-secondary"
                              )}>
                                <Cpu className={cn(
                                  "h-5 w-5",
                                  device.status === "active"
                                    ? "text-success"
                                    : device.status === "faulty"
                                    ? "text-destructive"
                                    : "text-muted-foreground"
                                )} />
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
                            <span className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-medium",
                              device.status === "active" && "bg-success/10 text-success",
                              device.status === "registered" && "bg-muted text-muted-foreground",
                              device.status === "configured" && "bg-info/10 text-info",
                              device.status === "inactive" && "bg-warning/10 text-warning",
                              device.status === "faulty" && "bg-destructive/10 text-destructive",
                            )}>
                              {device.status}
                            </span>
                          </td>
                          <td className="py-4">
                            {vehicle ? (
                              <span className="text-sm">{vehicle.registrationNumber}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-4">
                            {device.signal_strength !== undefined && device.signal_strength !== null ? (
                              <div className="flex items-center gap-2">
                                <Signal className={cn(
                                  "h-4 w-4",
                                  device.signal_strength > 70 ? "text-success" :
                                  device.signal_strength > 40 ? "text-warning" : "text-destructive"
                                )} />
                                <span className="text-sm">{device.signal_strength}%</span>
                              </div>
                            ) : (
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
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { 
                                  setSelectedDevice(device); 
                                  setIsDetailsOpen(true); 
                                }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {canEdit && (
                                  <DropdownMenuItem onClick={() => { 
                                    setSelectedDevice(device); 
                                    setIsEditDialogOpen(true); 
                                  }}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                {canManage && (
                                  <>
                                    <DropdownMenuSeparator />
                                    {(device.lifecycle_status === "registered" || device.status === "registered") && (
                                      <DropdownMenuItem onClick={() => handleMarkConfigured(device.id)}>
                                        <Settings className="mr-2 h-4 w-4" />
                                        Mark as Configured
                                      </DropdownMenuItem>
                                    )}
                                    {!device.vehicle_id && isAssignable((device.lifecycle_status || device.status) as DeviceLifecycleStatus) && (
                                      <DropdownMenuItem onClick={() => { 
                                        setSelectedDevice(device); 
                                        setIsAssignDialogOpen(true); 
                                      }}>
                                        <Link className="mr-2 h-4 w-4" />
                                        Assign to Vehicle
                                      </DropdownMenuItem>
                                    )}
                                    {device.vehicle_id && (
                                      <DropdownMenuItem onClick={() => handleUnassignDevice(device.id)}>
                                        <Unlink className="mr-2 h-4 w-4" />
                                        Unassign Vehicle
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem>
                                      <RefreshCw className="mr-2 h-4 w-4" />
                                      Update Firmware
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {canDelete && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => handleDeleteDevice(device.id)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Device
                                    </DropdownMenuItem>
                                  </>
                                )}
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

        <DeviceRequestsTracker />
      </div>

      {/* Dialogs */}
      <DeviceFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddDevice}
        title="Register New Device"
      />

      <DeviceSetupRequestDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        onSubmit={async (data) => {
          const res = await createRequest(data);
          if (res) {
            setIsRequestDialogOpen(false);
            refetchSetup();
          }
          return res;
        }}
        onUploadFile={uploadFile}
      />

      <DeviceFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleEditDevice}
        title="Edit Device"
        device={selectedDevice ? convertToIoTDevice(selectedDevice) : undefined}
      />

      <DeviceBulkUploadDialog
        open={isBulkUploadOpen}
        onOpenChange={setIsBulkUploadOpen}
        onUpload={handleBulkUpload}
      />

      <AssignDeviceDialogWithLifecycle
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        device={selectedDevice ? {
          id: selectedDevice.id,
          imei: selectedDevice.imei,
          manufacturer: selectedDevice.manufacturer,
          model: selectedDevice.model,
          lifecycle_status: selectedDevice.lifecycle_status,
          status: selectedDevice.status,
          vehicle_id: selectedDevice.vehicle_id,
        } : null}
        vehicles={vehicles.map(v => ({
          id: v.id,
          registrationNumber: v.registrationNumber,
          make: v.make,
          model: v.model,
          year: v.year,
          status: v.status,
        }))}
        onAssign={handleAssignDevice}
      />

      {selectedDevice && (() => {
        const vehicleData = getVehicleInfo(selectedDevice.vehicle_id);
        return (
          <DeviceDetailsSheet
            open={isDetailsOpen}
            onOpenChange={setIsDetailsOpen}
            device={convertToIoTDevice(selectedDevice)}
            vehicle={vehicleData ? {
              id: vehicleData.id,
              vin: vehicleData.vin,
              registrationNumber: vehicleData.registrationNumber,
              make: vehicleData.make,
              model: vehicleData.model,
              year: vehicleData.year,
              type: vehicleData.type as "truck" | "van" | "trailer",
              status: vehicleData.status,
              capacity: vehicleData.capacity || 0,
            } : undefined}
          />
        );
      })()}
    </DashboardLayout>
  );
}
