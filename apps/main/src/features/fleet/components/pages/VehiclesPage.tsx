import type { ColumnDef } from "@tanstack/react-table";
import type { Vehicle as FleetApiVehicle } from "@truckmoov/api/fleet";
import type { VehiclesFilterValue } from "@/features/fleet/components/ui/VehiclesFilterDialog";
import type { Vehicle } from "@/types";
import {
  exportVehicles,

  useCreateVehicle,
  useDeleteVehicle,
  useUpdateVehicle,
  useVehicles,
  useVehiclesSummary,
} from "@truckmoov/api/fleet";
import {
  Download,
  Edit,
  Eye,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  SlidersHorizontal,
  Trash2,
  Truck,
  Upload,
  Wrench,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
import { toast } from "sonner";
import {
  AlertDialog,
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
import { DataTable } from "@/components/shadcn/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { BulkUploadDialog } from "@/features/fleet/components/ui/BulkUploadDialog";
import { GeofenceManagementDialog } from "@/features/fleet/components/ui/GeofenceManagementDialog";
import { VehicleDetailsSheet } from "@/features/fleet/components/ui/VehicleDetailsSheet";
import { VehicleFormDialog } from "@/features/fleet/components/ui/VehicleFormDialog";
import {
  buildDefaultVehiclesFilterValue,
  countActiveVehicleFilters,
} from "@/features/fleet/components/ui/vehiclesFilter";
import { VehiclesFilterDialog } from "@/features/fleet/components/ui/VehiclesFilterDialog";
import { useRequireSubscription } from "@/hooks/useRequireSubscription";
import { cn } from "@/lib/utils";

export default function VehiclesPage() {
  const { requireSubscription } = useRequireSubscription();
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
    isFilterOpen,
    setIsFilterOpen,
  ] = useState(false);
  const [
    filterValue,
    setFilterValue,
  ] = useState<VehiclesFilterValue>(() => buildDefaultVehiclesFilterValue());
  const activeFilterCount = countActiveVehicleFilters(filterValue);
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
    selectedVehicle,
    setSelectedVehicle,
  ] = useState<FleetApiVehicle | null>(null);
  const [
    isDetailsOpen,
    setIsDetailsOpen,
  ] = useState(false);
  const [
    isGeofenceDialogOpen,
    setIsGeofenceDialogOpen,
  ] = useState(false);
  const [
    deleteConfirmId,
    setDeleteConfirmId,
  ] = useState<string | null>(null);
  const [
    isExporting,
    setIsExporting,
  ] = useState(false);

  useEffect(
    () => {
      const timer = window.setTimeout(
        () => setDebouncedSearch(searchQuery.trim()),
        300,
      );
      return () => window.clearTimeout(timer);
    },
    [searchQuery],
  );

  const [
    yearFrom,
    yearTo,
  ] = filterValue.yearRange;
  const vehicleQueryParams = {
    query: debouncedSearch || undefined,
    status:
      filterValue.statusEnabled && filterValue.status !== "all"
        ? (filterValue.status as "active" | "inactive" | "maintenance" | "decommissioned")
        : undefined,
    assigned:
      filterValue.assignedEnabled && filterValue.assigned !== "all"
        ? filterValue.assigned === "true"
        : undefined,
    type:
      filterValue.typeEnabled && filterValue.type !== "all"
        ? (filterValue.type as "truck" | "van" | "trailer")
        : undefined,
    yearFrom: filterValue.yearEnabled && yearFrom > 0 ? yearFrom : undefined,
    yearTo: filterValue.yearEnabled && yearTo > 0 ? yearTo : undefined,
  };

  const {
    data: vehiclesResp, isLoading,
  } = useVehicles({ params: vehicleQueryParams });
  const { data: vehiclesSummaryResp } = useVehiclesSummary();
  const createVehicleMutation = useCreateVehicle();
  const updateVehicleMutation = useUpdateVehicle();
  const deleteVehicleMutation = useDeleteVehicle();

  const vehicles = vehiclesResp?.data ?? [];

  const selectedVehicleFormValue = useMemo<Vehicle | null>(
    () => {
      if (!selectedVehicle)
        return null;

      return {
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
        capacityUnit: (selectedVehicle.capacityUnit ?? undefined) as Vehicle["capacityUnit"],
        currentDriver: selectedVehicle.assignedDriverName ?? selectedVehicle.assignedDriverId ?? undefined,
      };
    },
    [selectedVehicle],
  );

  const filteredVehicles = vehicles;

  const handleAddVehicle = async (newVehicle: Partial<Vehicle>) => {
    try {
      await createVehicleMutation.mutateAsync({
        data: {
          plateNumber: newVehicle.plateNumber!,
          registrationNumber: newVehicle.registrationNumber!,
          vin: newVehicle.vin!,
          make: newVehicle.make!,
          model: newVehicle.model!,
          year: newVehicle.year!,
          type: newVehicle.type!,
          capacity: newVehicle.capacity,
          capacityUnit: newVehicle.capacityUnit,
          status: "active",
        },
      });
      toast.success("Vehicle added");
      setIsAddDialogOpen(false);
    }
    catch (error) {
      const err = error as {
        statusCode?: number; message?: string;
      };
      const msg = err?.message ?? "Failed to add vehicle";
      if (err?.statusCode === 409) {
        toast.error(
          msg,
          { description: "Plan limit reached" },
        );
      }
      else {
        toast.error(msg);
      }
    }
  };

  const handleEditVehicle = async (updatedVehicle: Partial<Vehicle>) => {
    if (!selectedVehicle)
      return;
    try {
      await updateVehicleMutation.mutateAsync({
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
          capacityUnit: updatedVehicle.capacityUnit,
        },
      });
      toast.success("Vehicle updated");
      setIsEditDialogOpen(false);
      setSelectedVehicle(null);
    }
    catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update vehicle");
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      await deleteVehicleMutation.mutateAsync({ id: vehicleId });
      toast.success("Vehicle deleted");
      setDeleteConfirmId(null);
    }
    catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete vehicle");
    }
  };

  const localStatusCounts = {
    all: vehicles.length,
    active: vehicles.filter(v => v.status === "active").length,
    inactive: vehicles.filter(v => v.status === "inactive").length,
    maintenance: vehicles.filter(v => v.status === "maintenance").length,
    decommissioned: vehicles.filter(v => v.status === "decommissioned").length,
  };

  const statusCounts = {
    all: vehiclesSummaryResp?.data?.total ?? localStatusCounts.all,
    active: vehiclesSummaryResp?.data?.active ?? localStatusCounts.active,
    inactive: vehiclesSummaryResp?.data?.inactive ?? localStatusCounts.inactive,
    maintenance: vehiclesSummaryResp?.data?.maintenance ?? localStatusCounts.maintenance,
    decommissioned: vehiclesSummaryResp?.data?.decommissioned ?? localStatusCounts.decommissioned,
  };

  const allowance = vehiclesSummaryResp?.data?.allowance ?? null;

  const handleExportVehicles = async () => {
    setIsExporting(true);
    try {
      const data = await exportVehicles({ params: vehicleQueryParams });
      const blob = data instanceof Blob
        ? data
        : new Blob(
            [data],
            { type: "text/csv;charset=utf-8;" },
          );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "vehicles.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Vehicles export downloaded");
    }
    catch {
      toast.error("Vehicle export failed");
    }
    finally {
      setIsExporting(false);
    }
  };

  const hasActiveFilters = !!debouncedSearch || activeFilterCount > 0;

  const columns: ColumnDef<FleetApiVehicle>[] = [
    {
      id: "vehicle",
      header: "Vehicle",
      cell: ({ row }) => {
        const v = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Truck className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">
                {v.make}
                {" "}
                {v.model}
              </p>
              <p className="text-[11px] text-muted-foreground">{v.year}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: "vehicleId",
      header: "Vehicle ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.id.slice(
            0,
            8,
          )}
        </span>
      ),
    },
    {
      accessorKey: "registrationNumber",
      header: "Registration No.",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="rounded bg-secondary px-2 py-1 font-mono text-xs">
          {row.original.registrationNumber}
        </span>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      enableSorting: false,
      meta: { className: "capitalize" },
    },
    {
      accessorKey: "year",
      header: "Year",
      enableSorting: false,
    },
    {
      id: "driver",
      header: "Driver",
      cell: ({ row }) => {
        const v = row.original;
        const name = v.assignedDriverName ?? v.assignedDriverId;
        return (
          <span className={cn(!name && "text-muted-foreground")}>
            {name ?? "Unassigned"}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => (
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-medium",
            row.original.status === "active" && "bg-success/10 text-success",
            row.original.status === "inactive" && "bg-muted text-muted-foreground",
            row.original.status === "maintenance" && "bg-warning/10 text-warning",
            row.original.status === "decommissioned" && "bg-destructive/10 text-destructive",
          )}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      id: "fuel",
      header: "Fuel",
      cell: ({ row }) => {
        const pct = row.original.fuelLevelPercent;
        if (pct === null || pct === undefined)
          return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-14 rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full",
                  pct > 50 ? "bg-success" : pct > 25 ? "bg-warning" : "bg-destructive",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground">
              {pct}
              %
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      meta: { className: "w-[60px] text-right" },
      cell: ({ row }) => {
        const vehicle = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedVehicle(vehicle);
                  setIsDetailsOpen(true);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {!isAggregatorAdmin && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedVehicle(vehicle);
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
                </>
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
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsBulkUploadOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Vehicle
            </Button>
            <Button onClick={requireSubscription(() => setIsAddDialogOpen(true))}>
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </div>
        )}

        {/* ponytail: steps at xl, not md — the fixed w-64 sidebar makes this
            container ~300px narrower than the viewport md: measures. */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Total Vehicles</p>
                  <p className="text-2xl font-bold mt-1">{statusCounts.all}</p>
                  {allowance && (
                    allowance.unlimited || allowance.limit === null
                      ? (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {`${allowance.used} used`}
                          </p>
                        )
                      : (
                          <div className="mt-1 space-y-1">
                            <p className="text-[11px] text-muted-foreground">
                              {`${allowance.used} / ${allowance.limit} used · ${allowance.usedPercent ?? 0}%`}
                            </p>
                            <div className="h-1.5 w-full rounded-full bg-secondary">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  (allowance.usedPercent ?? 0) >= 90 ? "bg-destructive" : (allowance.usedPercent ?? 0) >= 75 ? "bg-warning" : "bg-primary",
                                )}
                                style={{
                                  width: `${Math.min(
                                    allowance.usedPercent ?? 0,
                                    100,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        )
                  )}
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
                <div className="min-w-0">
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
                <div className="min-w-0">
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
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Inactive</p>
                  <p className="text-2xl font-bold mt-1 text-muted-foreground">{statusCounts.inactive}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Vehicles (
                  {filteredVehicles.length}
                  )
                </CardTitle>
                <CardDescription className="mt-1">All vehicles in your fleet — registration, assigned driver, and operational status at a glance.</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                loading={isExporting}
                onClick={handleExportVehicles}
                className="bg-transparent border-input"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by registration, make, model..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card/50 border-border/50"
                />
              </div>
              <Select
                value={filterValue.statusEnabled ? filterValue.status : "all"}
                onValueChange={v => setFilterValue({
                  ...filterValue,
                  status: v as VehiclesFilterValue["status"],
                  statusEnabled: v !== "all",
                })}
              >
                <SelectTrigger className="w-[160px] bg-card/50 border-border/50">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="decommissioned">Decommissioned</SelectItem>
                </SelectContent>
              </Select>
              <VehiclesFilterDialog
                open={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                value={filterValue}
                onApply={v => setFilterValue(v)}
                onReset={() => setFilterValue(buildDefaultVehiclesFilterValue())}
                trigger={(
                  <Button
                    variant="outline"
                    className="bg-card/50 border-border/50 relative"
                  >
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
                )}
              />
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <DataTable
              columns={columns}
              data={filteredVehicles}
              isLoading={isLoading}
              hasActiveFilters={hasActiveFilters}
              emptyState="No vehicles have been added yet."
              filteredEmptyState="No vehicles match your search or filters."
            />
          </CardContent>
        </Card>
      </div>

      <VehicleFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddVehicle}
        title="Add New Vehicle"
        isSubmitting={createVehicleMutation.isPending}
      />

      <VehicleFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleEditVehicle}
        vehicle={selectedVehicleFormValue}
        title="Edit Vehicle"
        isSubmitting={updateVehicleMutation.isPending}
      />

      <VehicleDetailsSheet
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        vehicle={selectedVehicle}
        driverName={selectedVehicle?.assignedDriverName ?? null}
      />

      <BulkUploadDialog
        open={isBulkUploadOpen}
        onOpenChange={setIsBulkUploadOpen}
      />

      <GeofenceManagementDialog
        open={isGeofenceDialogOpen}
        onOpenChange={setIsGeofenceDialogOpen}
      />

      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={o => !o && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the vehicle from your fleet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteVehicleMutation.isPending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              loading={deleteVehicleMutation.isPending}
              disabled={deleteVehicleMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteConfirmId) {
                  await handleDeleteVehicle(deleteConfirmId);
                }
              }}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
