import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useVehicles, VehicleData } from "@/hooks/useVehicles";
import { useDrivers } from "@/hooks/useDrivers";
import {
  Truck,
  Plus,
  Search,
  Filter,
  Upload,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Wrench,
  Fuel,
  Loader2,
  Shield,
  MapPin,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { VehicleFormDialog } from "@/components/fleet/VehicleFormDialog";
import { VehicleDetailsSheet } from "@/components/fleet/VehicleDetailsSheet";
import { BulkUploadDialog } from "@/components/fleet/BulkUploadDialog";
import { MaintenanceTab } from "@/components/fleet/MaintenanceTab";
import { MaintenanceProfilesTab } from "@/components/fleet/MaintenanceProfilesTab";
import { FuelTab } from "@/components/fleet/FuelTab";
import { ComplianceTab } from "@/components/fleet/ComplianceTab";
import { GeofenceManagementDialog } from "@/components/fleet/GeofenceManagementDialog";
import { FleetFinancialAnalytics } from "@/components/fleet/FleetFinancialAnalytics";
import { FleetAnalyticsTab } from "@/components/fleet/FleetAnalyticsTab";
import { Vehicle } from "@/types";

export default function FleetManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "vehicles");

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams(value === "vehicles" ? {} : { tab: value }, { replace: true });
  };
  const { vehicles: dbVehicles, isLoading, addVehicle, updateVehicle, deleteVehicle } = useVehicles();
  const { drivers } = useDrivers();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isGeofenceDialogOpen, setIsGeofenceDialogOpen] = useState(false);

  // Convert DB vehicles to legacy Vehicle format for existing components
  const vehicles: Vehicle[] = dbVehicles.map((v) => ({
    id: v.id,
    vin: v.vin,
    registrationNumber: v.registrationNumber,
    make: v.make,
    model: v.model,
    year: v.year,
    type: v.type as Vehicle["type"],
    status: v.status as Vehicle["status"],
    capacity: v.capacity || 0,
    currentDriver: v.currentDriverId || undefined,
    deviceId: v.deviceId || undefined,
    fuelLevel: v.fuelLevel || undefined,
  }));

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.vin.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
    const matchesType = typeFilter === "all" || vehicle.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleAddVehicle = async (newVehicle: Partial<Vehicle>) => {
    const success = await addVehicle({
      vin: newVehicle.vin,
      registrationNumber: newVehicle.registrationNumber,
      make: newVehicle.make,
      model: newVehicle.model,
      year: newVehicle.year,
      type: newVehicle.type,
      status: newVehicle.status || "active",
      capacity: newVehicle.capacity,
    });
    if (success) {
      setIsAddDialogOpen(false);
    }
  };

  const handleEditVehicle = async (updatedVehicle: Partial<Vehicle>) => {
    if (!selectedVehicle) return;
    const success = await updateVehicle(selectedVehicle.id, {
      vin: updatedVehicle.vin,
      registrationNumber: updatedVehicle.registrationNumber,
      make: updatedVehicle.make,
      model: updatedVehicle.model,
      year: updatedVehicle.year,
      type: updatedVehicle.type,
      status: updatedVehicle.status as VehicleData["status"],
      capacity: updatedVehicle.capacity,
    });
    if (success) {
      setIsEditDialogOpen(false);
      setSelectedVehicle(null);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    await deleteVehicle(vehicleId);
  };

  const handleBulkUpload = async (newVehicles: Partial<Vehicle>[]) => {
    for (const v of newVehicles) {
      await addVehicle({
        vin: v.vin,
        registrationNumber: v.registrationNumber,
        make: v.make,
        model: v.model,
        year: v.year,
        type: v.type,
        status: "active",
        capacity: v.capacity,
      });
    }
    setIsBulkUploadOpen(false);
  };

  const getDriverName = (driverId?: string | null) => {
    if (!driverId) return null;
    const driver = drivers.find((d) => d.id === driverId);
    return driver?.name || null;
  };

  const statusCounts = {
    all: vehicles.length,
    active: vehicles.filter((v) => v.status === "active").length,
    inactive: vehicles.filter((v) => v.status === "inactive").length,
    maintenance: vehicles.filter((v) => v.status === "maintenance").length,
  };

  return (
    <DashboardLayout title="Fleet Management" subtitle="Manage your vehicles, maintenance, and fuel">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-muted/50 flex-wrap">
          <TabsTrigger value="vehicles" className="gap-2">
            <Truck className="h-4 w-4" />
            Vehicles
          </TabsTrigger>
          <TabsTrigger value="schedules" className="gap-2">
            <Wrench className="h-4 w-4" />
            Schedules
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-2">
            <Wrench className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="fuel" className="gap-2">
            <Fuel className="h-4 w-4" />
            Fuel
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-2">
            <Shield className="h-4 w-4" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="financials" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Financials
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "All Vehicles", value: statusCounts.all, status: "all" },
            { label: "Active", value: statusCounts.active, status: "active", color: "text-success" },
            { label: "Inactive", value: statusCounts.inactive, status: "inactive", color: "text-muted-foreground" },
            { label: "In Maintenance", value: statusCounts.maintenance, status: "maintenance", color: "text-warning" },
          ].map((stat) => (
            <button
              key={stat.status}
              onClick={() => setStatusFilter(stat.status)}
              className={cn(
                "rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50",
                statusFilter === stat.status && "border-primary ring-1 ring-primary"
              )}
            >
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
            </button>
          ))}
        </div>

        {/* Actions Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by registration, make, model..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="trailer">Trailer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setIsGeofenceDialogOpen(true)}>
                  <MapPin className="mr-2 h-4 w-4" />
                  Geofences
                </Button>
                <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Import
                </Button>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Vehicle
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Vehicles ({filteredVehicles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Vehicle</th>
                    <th className="pb-3 font-medium">Registration</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Driver</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Fuel</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="group transition-colors hover:bg-secondary/30">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Truck className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {vehicle.make} {vehicle.model}
                            </p>
                            <p className="text-xs text-muted-foreground">{vehicle.year}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="rounded bg-secondary px-2 py-1 font-mono text-sm">
                          {vehicle.registrationNumber}
                        </span>
                      </td>
                      <td className="py-4 capitalize">{vehicle.type}</td>
                      <td className="py-4">
                        {getDriverName(vehicle.currentDriver) || (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium",
                            vehicle.status === "active" && "bg-success/10 text-success",
                            vehicle.status === "inactive" && "bg-muted text-muted-foreground",
                            vehicle.status === "maintenance" && "bg-warning/10 text-warning",
                            vehicle.status === "decommissioned" && "bg-destructive/10 text-destructive"
                          )}
                        >
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="py-4">
                        {vehicle.fuelLevel !== undefined ? (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 rounded-full bg-secondary">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  vehicle.fuelLevel > 50
                                    ? "bg-success"
                                    : vehicle.fuelLevel > 25
                                    ? "bg-warning"
                                    : "bg-destructive"
                                )}
                                style={{ width: `${vehicle.fuelLevel}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{vehicle.fuelLevel}%</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                const dbVehicle = dbVehicles.find(v => v.id === vehicle.id);
                                if (dbVehicle) {
                                  setSelectedVehicle(dbVehicle);
                                  setIsDetailsOpen(true);
                                }
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                const dbVehicle = dbVehicles.find(v => v.id === vehicle.id);
                                if (dbVehicle) {
                                  setSelectedVehicle(dbVehicle);
                                  setIsEditDialogOpen(true);
                                }
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteVehicle(vehicle.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredVehicles.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Truck className="h-12 w-12 mb-4 opacity-30" />
                  <p>No vehicles found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="schedules">
          <MaintenanceProfilesTab />
        </TabsContent>

        <TabsContent value="maintenance">
          <MaintenanceTab />
        </TabsContent>

        <TabsContent value="fuel">
          <FuelTab />
        </TabsContent>

        <TabsContent value="compliance">
          <ComplianceTab />
        </TabsContent>

        <TabsContent value="financials">
          <FleetFinancialAnalytics />
        </TabsContent>

        <TabsContent value="analytics">
          <FleetAnalyticsTab />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <VehicleFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddVehicle}
        title="Add New Vehicle"
      />

      <VehicleFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleEditVehicle}
        vehicle={selectedVehicle ? {
          id: selectedVehicle.id,
          vin: selectedVehicle.vin,
          registrationNumber: selectedVehicle.registrationNumber,
          make: selectedVehicle.make,
          model: selectedVehicle.model,
          year: selectedVehicle.year,
          type: selectedVehicle.type as Vehicle["type"],
          status: selectedVehicle.status,
          capacity: selectedVehicle.capacity || 0,
          currentDriver: selectedVehicle.currentDriverId || undefined,
          fuelLevel: selectedVehicle.fuelLevel || undefined,
        } : null}
        title="Edit Vehicle"
      />

      <VehicleDetailsSheet
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        vehicle={selectedVehicle ? {
          id: selectedVehicle.id,
          vin: selectedVehicle.vin,
          registrationNumber: selectedVehicle.registrationNumber,
          make: selectedVehicle.make,
          model: selectedVehicle.model,
          year: selectedVehicle.year,
          type: selectedVehicle.type as Vehicle["type"],
          status: selectedVehicle.status,
          capacity: selectedVehicle.capacity || 0,
          currentDriver: selectedVehicle.currentDriverId || undefined,
          fuelLevel: selectedVehicle.fuelLevel || undefined,
        } : null}
        driverName={getDriverName(selectedVehicle?.currentDriverId)}
      />

      <BulkUploadDialog
        open={isBulkUploadOpen}
        onOpenChange={setIsBulkUploadOpen}
        onUpload={handleBulkUpload}
      />

      <GeofenceManagementDialog
        open={isGeofenceDialogOpen}
        onOpenChange={setIsGeofenceDialogOpen}
      />
    </DashboardLayout>
  );
}
