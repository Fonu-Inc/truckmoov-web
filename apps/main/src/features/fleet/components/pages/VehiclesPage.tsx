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
import { useNavigate } from "react-router";
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
import { Skeleton } from "@/components/shadcn/skeleton";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { BulkUploadDialog } from "@/features/fleet/components/ui/BulkUploadDialog";
import { FleetTablePager } from "@/features/fleet/components/ui/FleetTablePager";
import { GeofenceManagementDialog } from "@/features/fleet/components/ui/GeofenceManagementDialog";
import { VehicleDetailsSheet } from "@/features/fleet/components/ui/VehicleDetailsSheet";
import { VehicleFormDialog } from "@/features/fleet/components/ui/VehicleFormDialog";
import {
  buildDefaultVehiclesFilterValue,
  countActiveVehicleFilters,
} from "@/features/fleet/components/ui/vehiclesFilter";
import { VehiclesFilterDialog } from "@/features/fleet/components/ui/VehiclesFilterDialog";
import { useClientPage } from "@/features/fleet/utils/useClientPage";
import { useRequireSubscription } from "@/hooks/useRequireSubscription";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/shared/components/layout/PageHeader";

const LOADING_ROWS = [
  "a",
  "b",
  "c",
  "d",
  "e",
];

/** `/fleet` — the design app's Vehicles tab. */
export default function VehiclesPage() {
  const { requireSubscription } = useRequireSubscription();
  // ponytail: single-role check inline; extract to a helper if a third role or fourth page needs it
  const role = useAuthStore(s => s.user?.role);
  const isAggregatorAdmin = role === "AGGREGATOR_ADMIN";
  const navigate = useNavigate();
  const [
    limitReachedOpen,
    setLimitReachedOpen,
  ] = useState(false);
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
  // The server refuses vehicles past the plan's allowance; at the limit, Add and Upload
  // open the upgrade prompt instead (the design app's 10-vehicle Owner-Operator cap).
  const allowance = vehiclesSummaryResp?.data?.allowance;
  const atVehicleLimit = Boolean(allowance && !allowance.unlimited && allowance.remaining === 0);
  const whenUnderLimit = (open: () => void) => () => (atVehicleLimit ? setLimitReachedOpen(true) : open());
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
  const vehiclePage = useClientPage(filteredVehicles);

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

  const tileClass = "rounded-2xl surface-sleek text-card-foreground";
  const statusLabel = (status: string) => (status === "maintenance" ? "In maintenance" : status);

  return (
    <>
      <PageHeader
        title="Vehicles"
        description="Vehicle records, fleet membership, and operational details."
        actions={!isAggregatorAdmin && (
          <>
            <Button
              variant="outline"
              onClick={whenUnderLimit(() => setIsBulkUploadOpen(true))}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Vehicle
            </Button>
            <Button onClick={whenUnderLimit(requireSubscription(() => setIsAddDialogOpen(true)))}>
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </>
        )}
      />

      <div className="mt-3 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 space-y-6">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <div className={tileClass}>
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Total Vehicles</p>
                  <p className="text-xl font-bold mt-1 truncate">{statusCounts.all}</p>
                </div>
              </div>
            </div>
          </div>
          <div className={tileClass}>
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 shrink-0">
                  <MapPin className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold mt-1 text-success">{statusCounts.active}</p>
                </div>
              </div>
            </div>
          </div>
          <div className={tileClass}>
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 shrink-0">
                  <Wrench className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Maintenance</p>
                  <p className="text-2xl font-bold mt-1 text-warning">{statusCounts.maintenance}</p>
                </div>
              </div>
            </div>
          </div>
          <div className={tileClass}>
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inactive</p>
                  <p className="text-2xl font-bold mt-1 text-muted-foreground">{statusCounts.inactive}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={tileClass}>
          <div className="flex flex-col p-6 pb-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold leading-none tracking-tight text-foreground font-display flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  {`Vehicles (${filteredVehicles.length})`}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">All vehicles in your fleet — registration, assigned driver, and operational status at a glance.</p>
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
                <SelectTrigger className="h-10 rounded-xl px-3.5 w-full sm:w-[170px] bg-card/50 border-border/50">
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
          </div>
          <div className="p-6 pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-3 pr-6 font-medium">Registration No.</th>
                    <th className="pb-3 pr-6 font-medium">Make</th>
                    <th className="pb-3 pr-6 font-medium">Model</th>
                    <th className="pb-3 pr-6 font-medium">Type</th>
                    <th className="pb-3 pr-6 font-medium">Year</th>
                    <th className="pb-3 pr-6 font-medium">Status</th>
                    <th className="pb-3 pr-6 font-medium">Fuel</th>
                    <th className="pb-3 pr-6 font-medium">Fleet</th>
                    <th className="pb-3 pr-6 font-medium">Date Added</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading
                    ? LOADING_ROWS.map(key => (
                        <tr key={key}>
                          <td
                            colSpan={10}
                            className="py-4"
                          >
                            <Skeleton className="h-4 w-full" />
                          </td>
                        </tr>
                      ))
                    : filteredVehicles.length === 0
                      ? (
                          <tr>
                            <td
                              colSpan={10}
                              className="py-8 text-center text-muted-foreground"
                            >
                              {hasActiveFilters ? "No vehicles match your search or filters." : "No vehicles have been added yet."}
                            </td>
                          </tr>
                        )
                      : vehiclePage.pageRows.map((vehicle) => {
                          const pct = vehicle.fuelLevelPercent;
                          return (
                            <tr
                              key={vehicle.id}
                              className="group transition-colors hover:bg-secondary/30"
                            >
                              <td className="py-4 pr-6">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                    <Truck className="h-4 w-4 text-primary" />
                                  </div>
                                  <span className="rounded bg-secondary px-2 py-1 font-mono text-xs">{vehicle.registrationNumber || "—"}</span>
                                </div>
                              </td>
                              <td className="py-4 pr-6 font-medium text-sm">{vehicle.make || "—"}</td>
                              <td className="py-4 pr-6 font-medium text-sm">{vehicle.model || "—"}</td>
                              <td className="py-4 pr-6 capitalize">{vehicle.type || "—"}</td>
                              <td className="py-4 pr-6">{vehicle.year ?? "—"}</td>
                              <td className="py-4 pr-6">
                                <span
                                  className={cn(
                                    "rounded-full px-2.5 py-1 text-[11px] font-medium",
                                    vehicle.status === "active" && "bg-success/10 text-success",
                                    vehicle.status === "inactive" && "bg-muted text-muted-foreground",
                                    vehicle.status === "maintenance" && "bg-warning/10 text-warning",
                                    vehicle.status === "decommissioned" && "bg-destructive/10 text-destructive",
                                  )}
                                >
                                  {statusLabel(vehicle.status)}
                                </span>
                              </td>
                              <td className="py-4 pr-6">
                                {pct === null || pct === undefined
                                  ? <span className="text-[11px] text-muted-foreground">—</span>
                                  : (
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
                                        <span className="text-[11px] text-muted-foreground">{`${pct}%`}</span>
                                      </div>
                                    )}
                              </td>
                              {/* ponytail: no endpoint returns a vehicle's fleet membership — wire when one lands */}
                              <td className="py-4 pr-6">
                                <span className="text-sm text-foreground">-</span>
                              </td>
                              {/* ponytail: the vehicles endpoint returns no created/added date — wire when it does */}
                              <td className="py-4 pr-6">
                                <span className="text-sm text-muted-foreground">-</span>
                              </td>
                              <td className="py-4 text-right">
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
                              </td>
                            </tr>
                          );
                        })}
                </tbody>
              </table>
            </div>
            <FleetTablePager
              page={vehiclePage.page}
              pageSize={vehiclePage.pageSize}
              total={vehiclePage.total}
              onPageChange={vehiclePage.setPage}
            />
          </div>
        </div>
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

      <AlertDialog
        open={limitReachedOpen}
        onOpenChange={setLimitReachedOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vehicle limit reached</AlertDialogTitle>
            <AlertDialogDescription>
              {role === "OWNER_OPERATOR"
                ? `Owner Operator / Individual accounts can have a maximum of ${allowance?.limit ?? 10} vehicles. Upgrade to an Enterprise Customer account to add more than ${allowance?.limit ?? 10} vehicles.`
                : `Your plan allows ${allowance?.limit ?? 0} active vehicles and all of them are in use. Upgrade your plan to add more.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not now</AlertDialogCancel>
            <Button onClick={() => {
              setLimitReachedOpen(false);
              navigate("/settings/upgrade");
            }}
            >
              Upgrade
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
