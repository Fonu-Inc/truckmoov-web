import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDeviceTelemetry, DeviceWithTelemetry } from "@/hooks/useDeviceTelemetry";
import { useVehicles } from "@/hooks/useVehicles";
import { useDeviceLifecycle, DeviceLifecycleStatus } from "@/hooks/useDeviceLifecycle";
import {
  Cpu,
  Plus,
  Search,
  Filter,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DeviceFormDialogWithCatalog } from "@/components/devices/DeviceFormDialogWithCatalog";
import { DeviceFormDialog } from "@/components/devices/DeviceFormDialog";
import { DeviceDetailsSheet } from "@/components/devices/DeviceDetailsSheet";
import { DeviceBulkUploadDialog } from "@/components/devices/DeviceBulkUploadDialog";
import { AssignDeviceDialogWithLifecycle } from "@/components/devices/AssignDeviceDialogWithLifecycle";
import { DeviceLifecycleBadge } from "@/components/devices/DeviceLifecycleBadge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useDevicePermissions } from "@/hooks/useDevicePermissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { IoTDevice } from "@/types";
import { useOrgContext } from "@/hooks/useOrgContext";
import { useActiveOrgStore } from "@/stores/activeOrgStore";
import { useDeviceSetupRequests } from "@/hooks/useDeviceSetupRequests";
import { DeviceSetupRequestsQueue } from "@/components/devices/DeviceSetupRequestsQueue";

export default function DeviceManagement() {
  const { canView, canManage, canEdit, canDelete, role } = useDevicePermissions();
  const { user } = useAuthStore();
  const tenantId = user?.tenantId;
  const { markAsConfigured, isAssignable } = useDeviceLifecycle();
  
  // Org context for aggregator detection
  const orgCtx = useOrgContext();
  const { resolveActiveOrg } = useActiveOrgStore();
  const activeOrg = resolveActiveOrg(orgCtx.memberships);
  const isAggregator = activeOrg?.orgType === 'AGGREGATOR';

  // Use real database data
  const { devices, loading, error, refetch } = useDeviceTelemetry(tenantId || undefined);
  const { vehicles } = useVehicles();
  
  // Device setup requests (used by aggregator view)
  const {
    requests: setupRequests,
    loading: setupLoading,
    refetch: refetchSetup,
    updateRequestStatus,
  } = useDeviceSetupRequests();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
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
  const handleAddDevice = async (newDevice: { imei: string; catalog_id: string; manufacturer: string; model: string }) => {
    try {
      const { error: insertError } = await supabase
        .from('devices')
        .insert({
          imei: newDevice.imei,
          manufacturer: newDevice.manufacturer,
          model: newDevice.model,
          catalog_id: newDevice.catalog_id,
          lifecycle_status: "registered",
          status: "registered", // Keep legacy status for compatibility
          tenant_id: tenantId || "default",
        });

      if (insertError) throw insertError;
      
      toast.success("Device registered successfully", {
        description: "Device is now in Registered status. Configure it to proceed.",
      });
      setIsAddDialogOpen(false);
      refetch();
    } catch (err) {
      console.error('Error adding device:', err);
      toast.error("Failed to add device");
    }
  };

  const handleEditDevice = async (updatedDevice: Partial<IoTDevice>) => {
    if (!selectedDevice) return;
    
    try {
      const { error: updateError } = await supabase
        .from('devices')
        .update({
          imei: updatedDevice.imei,
          manufacturer: updatedDevice.manufacturer,
          model: updatedDevice.model,
          firmware_version: updatedDevice.firmwareVersion,
        })
        .eq('id', selectedDevice.id);

      if (updateError) throw updateError;
      
      toast.success("Device updated successfully");
      setIsEditDialogOpen(false);
      setSelectedDevice(null);
      refetch();
    } catch (err) {
      console.error('Error updating device:', err);
      toast.error("Failed to update device");
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('devices')
        .delete()
        .eq('id', deviceId);

      if (deleteError) throw deleteError;
      
      toast.success("Device deleted successfully");
      refetch();
    } catch (err) {
      console.error('Error deleting device:', err);
      toast.error("Failed to delete device");
    }
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
  const handleAssignDevice = async (deviceId: string, vehicleId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('devices')
        .update({ 
          vehicle_id: vehicleId,
          lifecycle_status: 'assigned',
          status: 'assigned',
          assigned_at: new Date().toISOString(),
        })
        .eq('id', deviceId);

      if (updateError) throw updateError;
      
      toast.success("Device assigned to vehicle");
      setIsAssignDialogOpen(false);
      refetch();
    } catch (err) {
      console.error('Error assigning device:', err);
      toast.error("Failed to assign device");
    }
  };

  const handleUnassignDevice = async (deviceId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('devices')
        .update({ 
          vehicle_id: null,
          lifecycle_status: 'assignable',
          status: 'active', // Legacy compatibility
          assigned_at: null,
        })
        .eq('id', deviceId);

      if (updateError) throw updateError;
      
      toast.success("Device unassigned from vehicle");
      refetch();
    } catch (err) {
      console.error('Error unassigning device:', err);
      toast.error("Failed to unassign device");
    }
  };

  const handleBulkUpload = async (newDevices: Partial<IoTDevice>[]) => {
    try {
      const devicesToInsert = newDevices.map((d) => ({
        imei: d.imei || "",
        manufacturer: d.manufacturer || "generic",
        model: d.model || null,
        firmware_version: d.firmwareVersion || "1.0.0",
        status: "registered",
        tenant_id: tenantId || "default",
      }));

      const { error: insertError } = await supabase
        .from('devices')
        .insert(devicesToInsert);

      if (insertError) throw insertError;
      
      toast.success(`${devicesToInsert.length} devices imported successfully`);
      setIsBulkUploadOpen(false);
      refetch();
    } catch (err) {
      console.error('Error bulk uploading devices:', err);
      toast.error("Failed to import devices");
    }
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
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
          {loading ? (
            Array(7).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))
          ) : (
            [
              { label: "All Devices", value: statusCounts.all, status: "all" },
              { label: "Registered", value: statusCounts.registered, status: "registered", color: "text-muted-foreground" },
              { label: "Configured", value: statusCounts.configured, status: "configured", color: "text-info" },
              { label: "Assignable", value: statusCounts.assignable, status: "assignable", color: "text-success" },
              { label: "Assigned", value: statusCounts.assigned, status: "assigned", color: "text-primary" },
              { label: "Active", value: statusCounts.active, status: "active", color: "text-success" },
              { label: "Faulty", value: statusCounts.faulty, status: "faulty", color: "text-destructive" },
            ].map((stat) => (
              <button
                key={stat.status}
                onClick={() => setStatusFilter(stat.status)}
                className={cn(
                  "rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50",
                  statusFilter === stat.status && "border-primary ring-1 ring-primary"
                )}
              >
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
              </button>
            ))
          )}
        </div>

        {/* Actions Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by IMEI, manufacturer, model..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
                  <SelectTrigger className="w-[160px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Manufacturer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Manufacturers</SelectItem>
                    {manufacturers.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {canManage && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Bulk Import
                  </Button>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Device
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Device List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              Devices ({filteredDevices.length})
            </CardTitle>
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
                              ? formatDistanceToNow(new Date(device.last_seen), { addSuffix: true }) 
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
      </div>

      {/* Dialogs */}
      <DeviceFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddDevice}
        title="Register New Device"
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
