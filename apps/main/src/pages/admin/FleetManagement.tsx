import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
type VehicleData = any;
import {
  Truck,
  Plus,
  Search,
  SlidersHorizontal as Filter,
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
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/shadcn/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
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
import {
  VehiclesFilterDialog,
  buildDefaultVehiclesFilterValue,
  countActiveVehicleFilters,
  type VehiclesFilterValue,
} from "@/components/fleet/VehiclesFilterDialog";
import { Badge } from "@/components/shadcn/badge";
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
import { Vehicle } from "@/types";
import { ExportButton } from "@/components/shadcn/export-button";
import { useRequireSubscription } from "@/hooks/useRequireSubscription";
import {
  useVehicles,
  useCreateVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
  useImportVehicles,
} from "@truckmoov/api/fleet";

interface FleetManagementProps {
  vehiclesOnly?: boolean;
  title?: string;
  subtitle?: string;
}

export default function FleetManagement({ vehiclesOnly = false, title, subtitle }: FleetManagementProps = {}) {
  const { requireSubscription } = useRequireSubscription();
  const isAggregator = false;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterValue, setFilterValue] = useState<VehiclesFilterValue>(() => buildDefaultVehiclesFilterValue());
  const activeFilterCount = countActiveVehicleFilters(filterValue);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isGeofenceDialogOpen, setIsGeofenceDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const apiStatus =
    statusFilter === "active" || statusFilter === "inactive"
      ? (statusFilter as "active" | "inactive")
      : undefined;

  const { data: vehiclesResp, isLoading } = useVehicles({
    params: { query: searchQuery || undefined, status: apiStatus },
  });
  const { mutateAsync: createVehicleMutation } = useCreateVehicle();
  const { mutateAsync: updateVehicleMutation } = useUpdateVehicle();
  const { mutateAsync: deleteVehicleMutation } = useDeleteVehicle();
  const { mutateAsync: importVehiclesMutation } = useImportVehicles();

  const dbVehicles = vehiclesResp?.data ?? [];

  // Convert API vehicles to the local Vehicle shape used by child components
  const vehicles: Vehicle[] = dbVehicles.map((v) => ({
    id: v.id,
    plateNumber: v.plateNumber,
    vin: v.vin ?? "",
    registrationNumber: v.registrationNumber,
    make: v.make ?? "",
    model: v.model,
    year: v.year ?? new Date().getFullYear(),
    type: (String(v.type) as Vehicle["type"]) || "truck",
    status: (String(v.status) as Vehicle["status"]) || "active",
    capacity: v.capacity ?? 0,
    currentDriver: v.assignedDriverId ?? undefined,
  }));

  // search + active|inactive status go to the API; maintenance/all status and type/year are client-side
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesStatus =
      !apiStatus && (statusFilter === "all" || vehicle.status === statusFilter);
    const matchesType =
      !filterValue.typeEnabled ||
      filterValue.type === "all" ||
      vehicle.type === filterValue.type;
    const [yMin, yMax] = filterValue.yearRange;
    const matchesYear =
      !filterValue.yearEnabled ||
      ((yMin <= 0 || vehicle.year >= yMin) && (yMax <= 0 || vehicle.year <= yMax));
    return (apiStatus ? true : matchesStatus) && matchesType && matchesYear;
  });

  const handleAddVehicle = async (newVehicle: Partial<Vehicle>) => {
    await createVehicleMutation({
      data: {
        plateNumber: newVehicle.plateNumber!,
        registrationNumber: newVehicle.registrationNumber!,
        vin: newVehicle.vin!,
        make: newVehicle.make!,
        model: newVehicle.model!,
        year: newVehicle.year!,
        type: newVehicle.type!,
        capacity: newVehicle.capacity,
        status: "active",
      },
    });
    setIsAddDialogOpen(false);
  };

  const handleEditVehicle = async (updatedVehicle: Partial<Vehicle>) => {
    if (!selectedVehicle) return;
    await updateVehicleMutation({
      id: selectedVehicle.id,
      data: {
        plateNumber: updatedVehicle.plateNumber,
        registrationNumber: updatedVehicle.registrationNumber,
        vin: updatedVehicle.vin,
        make: updatedVehicle.make,
        model: updatedVehicle.model,
        year: updatedVehicle.year,
        type: updatedVehicle.type,
        capacity: updatedVehicle.capacity,
      },
    });
    setIsEditDialogOpen(false);
    setSelectedVehicle(null);
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    await deleteVehicleMutation({ id: vehicleId });
  };

  const handleBulkUpload = async (newVehicles: Partial<Vehicle>[]) => {
    await importVehiclesMutation({
      data: {
        items: newVehicles.map((v) => ({
          plateNumber: v.plateNumber ?? v.registrationNumber ?? "",
          registrationNumber: v.registrationNumber ?? "",
          vin: v.vin ?? "",
          make: v.make ?? "",
          model: v.model ?? "",
          year: v.year ?? new Date().getFullYear(),
          type: v.type ?? "truck",
          capacity: v.capacity,
          status: "active",
        })),
      },
    });
    setIsBulkUploadOpen(false);
  };

  const statusCounts = {
    all: vehicles.length,
    active: vehicles.filter((v) => v.status === "active").length,
    inactive: vehicles.filter((v) => v.status === "inactive").length,
    maintenance: vehicles.filter((v) => v.status === "maintenance").length,
  };

  return (
    <DashboardLayout title={title ?? "Fleet Management"} subtitle={subtitle ?? "Manage your vehicles, maintenance, and fuel"}>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        {!vehiclesOnly && (
          <div className="flex justify-center">
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
          </div>
        )}

        <TabsContent value="vehicles" className="space-y-6" forceMount={vehiclesOnly ? true : undefined}>
        {/* Primary actions - only on Vehicles tab. Aggregators cannot add vehicles. */}
        {!isAggregator && (
          <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Bulk Import
              </Button>
              <Button onClick={requireSubscription(() => setIsAddDialogOpen(true))}>
                <Plus className="mr-2 h-4 w-4" />
                Add Vehicle
              </Button>
            </div>
        )}

        {/* KPIs */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Vehicles</p>
                  <p className="text-2xl font-bold mt-1">{statusCounts.all}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 shrink-0">
                  <MapPin className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold mt-1 text-success">{statusCounts.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 shrink-0">
                  <Wrench className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Maintenance</p>
                  <p className="text-2xl font-bold mt-1 text-warning">{statusCounts.maintenance}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inactive</p>
                  <p className="text-2xl font-bold mt-1 text-muted-foreground">{statusCounts.inactive}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vehicle List */}
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Vehicles ({filteredVehicles.length})
                </CardTitle>
                <CardDescription className="mt-1">All vehicles in your fleet — registration, assigned driver, and operational status at a glance.</CardDescription>
              </div>
              <ExportButton
                filename="vehicles"
                rows={filteredVehicles}
                columns={[
                  { header: "Make", accessor: "make" },
                  { header: "Model", accessor: "model" },
                  { header: "Year", accessor: "year" },
                  { header: "Registration", accessor: "registrationNumber" },
                  { header: "VIN", accessor: "vin" },
                  { header: "Type", accessor: "type" },
                  { header: "Status", accessor: "status" },
                  { header: "Driver", accessor: (v: any) => v.driver ?? v.driverName ?? "" },
                  { header: "Fuel Level (%)", accessor: (v: any) => v.fuelLevel ?? "" },
                  { header: "Capacity", accessor: (v: any) => v.capacity ?? "" },
                ]}
              />
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by registration, make, model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card/50 border-border/50"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[170px] bg-card/50 border-border/50">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">In Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <VehiclesFilterDialog
                open={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                value={filterValue}
                onApply={(v) => setFilterValue(v)}
                onReset={() => setFilterValue(buildDefaultVehiclesFilterValue())}
                trigger={
                  <Button variant="outline" className="bg-card/50 border-border/50 relative">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filter
                    {activeFilterCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-2 h-5 min-w-5 px-1.5 text-[10px] bg-primary/20 text-primary border border-primary/30"
                      >
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                }
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-3 pr-6 font-medium">Vehicle</th>
                    <th className="pb-3 pr-6 font-medium">Registration</th>
                    <th className="pb-3 pr-6 font-medium">Type</th>
                    <th className="pb-3 pr-6 font-medium">Year</th>
                    <th className="pb-3 pr-6 font-medium">Driver</th>
                    <th className="pb-3 pr-6 font-medium">Status</th>
                    <th className="pb-3 pr-6 font-medium">Fuel</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                      </td>
                    </tr>
                  ) : null}
                  {!isLoading && filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="group transition-colors hover:bg-secondary/30">
                      <td className="py-4 pr-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                            <Truck className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {vehicle.make} {vehicle.model}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{vehicle.year}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-6">
                        <span className="rounded bg-secondary px-2 py-1 font-mono text-xs">
                          {vehicle.registrationNumber}
                        </span>
                      </td>
                      <td className="py-4 pr-6 capitalize">{vehicle.type}</td>
                      <td className="py-4 pr-6">{vehicle.year}</td>
                      <td className="py-4 pr-6">
                        <span className="text-muted-foreground">Unassigned</span>
                      </td>
                      <td className="py-4 pr-6">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11px] font-medium",
                            vehicle.status === "active" && "bg-success/10 text-success",
                            vehicle.status === "inactive" && "bg-muted text-muted-foreground",
                            vehicle.status === "maintenance" && "bg-warning/10 text-warning",
                            vehicle.status === "decommissioned" && "bg-destructive/10 text-destructive"
                          )}
                        >
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="py-4 pr-6">
                        {vehicle.fuelLevel !== undefined ? (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-14 rounded-full bg-secondary">
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
                            <span className="text-[11px] text-muted-foreground">{vehicle.fuelLevel}%</span>
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
                                setSelectedVehicle(dbVehicle ?? {
                                  id: vehicle.id,
                                  vin: vehicle.vin,
                                  registrationNumber: vehicle.registrationNumber,
                                  make: vehicle.make,
                                  model: vehicle.model,
                                  year: vehicle.year,
                                  type: vehicle.type,
                                  status: vehicle.status as VehicleData["status"],
                                  capacity: vehicle.capacity ?? 0,
                                  currentDriverId: vehicle.currentDriver ?? null,
                                  deviceId: vehicle.deviceId ?? null,
                                  fuelLevel: vehicle.fuelLevel ?? null,
                                } as VehicleData);
                                setIsDetailsOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                const dbVehicle = dbVehicles.find(v => v.id === vehicle.id);
                                setSelectedVehicle(dbVehicle ?? {
                                  id: vehicle.id,
                                  vin: vehicle.vin,
                                  registrationNumber: vehicle.registrationNumber,
                                  make: vehicle.make,
                                  model: vehicle.model,
                                  year: vehicle.year,
                                  type: vehicle.type,
                                  status: vehicle.status as VehicleData["status"],
                                  capacity: vehicle.capacity ?? 0,
                                  currentDriverId: vehicle.currentDriver ?? null,
                                  deviceId: vehicle.deviceId ?? null,
                                  fuelLevel: vehicle.fuelLevel ?? null,
                                } as VehicleData);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteConfirmId(vehicle.id)}
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

              {!isLoading && filteredVehicles.length === 0 && (
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

        {!vehiclesOnly && (
          <>
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
          </>
        )}
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
          plateNumber: selectedVehicle.plateNumber ?? "",
          vin: selectedVehicle.vin ?? "",
          registrationNumber: selectedVehicle.registrationNumber,
          make: selectedVehicle.make ?? "",
          model: selectedVehicle.model,
          year: selectedVehicle.year ?? new Date().getFullYear(),
          type: (String(selectedVehicle.type) as Vehicle["type"]) || "truck",
          status: (String(selectedVehicle.status) as Vehicle["status"]) || "active",
          capacity: selectedVehicle.capacity || 0,
          currentDriver: selectedVehicle.assignedDriverId ?? selectedVehicle.currentDriverId ?? undefined,
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
        driverName={null}
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

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the vehicle from your fleet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteConfirmId) {
                  await handleDeleteVehicle(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
