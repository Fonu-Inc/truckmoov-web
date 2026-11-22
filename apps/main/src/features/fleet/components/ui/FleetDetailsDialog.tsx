import type {
  FleetGroup, Vehicle,
} from "@truckmoov/api/fleet";
import type { CheckboxFilterValue } from "@/features/fleet/utils/checkboxFilter";
import type { Vehicle as FormVehicle } from "@/types";
import {
  useDeleteVehicle, useUpdateFleetGroup, useUpdateVehicle,
} from "@truckmoov/api/fleet";
import {
  CalendarDays, CheckCircle2, Edit, Eye, Layers, MoreHorizontal, Plus, PowerOff, Search, ShieldAlert, Trash2, Truck, Wrench,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { CheckboxGroupsFilter } from "@/features/fleet/components/ui/CheckboxGroupsFilter";
import { VehicleDetailsSheet } from "@/features/fleet/components/ui/VehicleDetailsSheet";
import { VehicleFormDialog } from "@/features/fleet/components/ui/VehicleFormDialog";
import { passesFilter } from "@/features/fleet/utils/checkboxFilter";
import {
  toVehicleFormValue, toVehicleUpdate,
} from "@/features/fleet/utils/vehicleForm";
import { cn } from "@/lib/utils";

const CARD_CLASS = "rounded-2xl surface-sleek text-card-foreground";
const FUEL_BANDS = [
  "Above 50%",
  "26–50%",
  "25% or below",
  "Unknown",
];

function statusLabel(s: string) {
  return s === "maintenance" ? "In maintenance" : s.charAt(0).toUpperCase() + s.slice(1);
}

function fuelBand(f?: number | null) {
  if (f == null)
    return "Unknown";
  if (f > 50)
    return "Above 50%";
  return f > 25 ? "26–50%" : "25% or below";
}

function plateOf(v: Vehicle) {
  return v.registrationNumber || v.plateNumber;
}

function onError(error: { message: string }) {
  toast.error(error.message);
}

/** View Details on the Fleets tab: the fleet's vehicles, with add, view, edit and delete. */
export function FleetDetailsDialog({
  fleet, fleets, vehicles, mayManage, onClose,
}: {
  fleet: FleetGroup | null;
  fleets: FleetGroup[];
  vehicles: Vehicle[];
  mayManage: boolean;
  onClose: () => void;
}) {
  const [
    query,
    setQuery,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState("all");
  const [
    filters,
    setFilters,
  ] = useState<CheckboxFilterValue>({});
  const [
    selectedVehicle,
    setSelectedVehicle,
  ] = useState<Vehicle | null>(null);
  const [
    editVehicle,
    setEditVehicle,
  ] = useState<Vehicle | null>(null);
  const [
    deleteId,
    setDeleteId,
  ] = useState<string | null>(null);
  const [
    addOpen,
    setAddOpen,
  ] = useState(false);
  const [
    picked,
    setPicked,
  ] = useState<string[]>([]);
  const [
    addQuery,
    setAddQuery,
  ] = useState("");
  const updateFleet = useUpdateFleetGroup();
  const updateVehicle = useUpdateVehicle();
  const deleteVehicle = useDeleteVehicle();

  const assignedVehicles = useMemo(
    () => vehicles.filter(v => fleet?.vehicleIds.includes(v.id)),
    [
      vehicles,
      fleet,
    ],
  );
  const types = useMemo(
    () => [...new Set(assignedVehicles.map(v => String(v.type ?? "unknown")))].sort(),
    [assignedVehicles],
  );
  const years = useMemo(
    () => [...new Set(assignedVehicles.map(v => String(v.year ?? "Unknown")))].sort().reverse(),
    [assignedVehicles],
  );

  const q = query.toLowerCase();
  const filtered = assignedVehicles.filter(v =>
    `${v.make ?? ""} ${v.model} ${plateOf(v)} ${v.type ?? ""}`.toLowerCase().includes(q)
    && (status === "all" || status === v.status)
    && passesFilter(
      filters,
      "Vehicle Type",
      String(v.type ?? "unknown"),
    )
    && passesFilter(
      filters,
      "Year",
      String(v.year ?? "Unknown"),
    )
    && passesFilter(
      filters,
      "Fuel Level",
      fuelBand(v.fuelLevelPercent),
    ));

  // A vehicle can only belong to one fleet.
  const fleetOf = (vehicleId: string) => fleets.find(f => f.id !== fleet?.id && f.vehicleIds.includes(vehicleId));
  const aq = addQuery.toLowerCase();
  const candidates = vehicles.filter(v =>
    !fleet?.vehicleIds.includes(v.id)
    && `${v.make ?? ""} ${v.model} ${plateOf(v)} ${v.type ?? ""}`.toLowerCase().includes(aq));

  const confirmAdd = () => {
    if (!fleet || !picked.length)
      return;
    const addable = picked.filter(id => !fleetOf(id));
    if (!addable.length) {
      toast.error("Selected vehicles already belong to another fleet");
      return;
    }
    updateFleet.mutate(
      {
        id: fleet.id, data: {
          vehicleIds: [
            ...fleet.vehicleIds,
            ...addable,
          ],
        },
      },
      {
        onSuccess: () => {
          toast.success(`${addable.length} vehicle${addable.length === 1 ? "" : "s"} added to ${fleet.name}`);
          setAddOpen(false);
          setPicked([]);
          setAddQuery("");
        },
        onError,
      },
    );
  };

  const count = (s: string) => assignedVehicles.filter(v => v.status === s).length;
  const kpis = [
    {
      label: "Total Vehicles", value: assignedVehicles.length, icon: Layers, tone: "bg-primary/10 text-primary",
    },
    {
      label: "Active", value: count("active"), icon: CheckCircle2, tone: "bg-success/10 text-success",
    },
    {
      label: "In Maintenance", value: count("maintenance"), icon: Wrench, tone: "bg-warning/10 text-warning",
    },
    {
      label: "Inactive", value: count("inactive"), icon: PowerOff, tone: "bg-muted text-muted-foreground",
    },
  ];

  const reset = () => {
    setQuery("");
    setStatus("all");
    setFilters({});
    setSelectedVehicle(null);
  };

  const handleEdit = (updated: Partial<FormVehicle>) => {
    if (!editVehicle)
      return;
    updateVehicle.mutate(
      {
        id: editVehicle.id, data: toVehicleUpdate(updated),
      },
      {
        onSuccess: () => {
          toast.success("Vehicle updated");
          setEditVehicle(null);
        },
        onError,
      },
    );
  };

  const handleDelete = () => {
    if (!deleteId)
      return;
    deleteVehicle.mutate(
      { id: deleteId },
      {
        onSuccess: () => toast.success("Vehicle deleted"),
        onError,
        onSettled: () => setDeleteId(null),
      },
    );
  };

  return (
    <>
      <Dialog
        open={Boolean(fleet)}
        onOpenChange={(open) => {
          if (!open) {
            onClose();
            reset();
          }
        }}
      >
        <DialogContent className="w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block truncate">{fleet?.name}</span>
                <span className="block text-sm font-normal text-muted-foreground truncate">{fleet?.description || "Fleet overview and assigned vehicles"}</span>
              </div>
            </DialogTitle>
            <DialogDescription
              asChild
            >
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full gap-1",
                    fleet?.violationsEnabled ? "border-success/40 text-success" : "text-muted-foreground",
                  )}
                >
                  <ShieldAlert className="h-3 w-3" />
                  {" "}
                  Violations
                  {" "}
                  {fleet?.violationsEnabled ? "Enabled" : "Disabled"}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full gap-1 text-muted-foreground"
                >
                  <CalendarDays className="h-3 w-3" />
                  {" "}
                  Created
                  {" "}
                  {fleet ? new Date(fleet.createdAt).toLocaleDateString() : "—"}
                </Badge>
              </div>
            </DialogDescription>
          </DialogHeader>

          {mayManage && (
            <div className="flex justify-end">
              <Button onClick={() => {
                setPicked([]);
                setAddQuery("");
                setAddOpen(true);
              }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {" "}
                Add Vehicle
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map(k => (
              <div
                key={k.label}
                className={`${CARD_CLASS} transition-transform hover:-translate-y-0.5`}
              >
                <div className="flex items-center gap-3 p-4">
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    k.tone,
                  )}
                  >
                    <k.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{k.label}</p>
                    <p className="text-xl font-semibold truncate">{k.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={CARD_CLASS}>
            <div className="flex flex-col p-6 pb-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold leading-none tracking-tight">Fleet Vehicles</h3>
                  <p className="text-sm text-muted-foreground mt-1.5">All vehicles in this fleet. Search, filter, view, edit or delete them.</p>
                </div>
                <ExportButton
                  filename="fleet-vehicles"
                  rows={filtered}
                  columns={[
                    {
                      header: "Registration No.", accessor: (v: Vehicle) => plateOf(v),
                    },
                    {
                      header: "Make", accessor: (v: Vehicle) => v.make ?? "",
                    },
                    {
                      header: "Model", accessor: "model",
                    },
                    {
                      header: "Type", accessor: (v: Vehicle) => v.type ?? "",
                    },
                    {
                      header: "Year", accessor: (v: Vehicle) => v.year ?? "",
                    },
                    {
                      header: "Status", accessor: (v: Vehicle) => statusLabel(v.status),
                    },
                    {
                      header: "Fuel Level (%)", accessor: (v: Vehicle) => v.fuelLevelPercent ?? "",
                    },
                  ]}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    aria-label="Search fleet vehicles"
                    placeholder="Search by registration, make, model..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={status}
                  onValueChange={setStatus}
                >
                  <SelectTrigger className="w-full sm:w-[170px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">In Maintenance</SelectItem>
                  </SelectContent>
                </Select>
                <CheckboxGroupsFilter
                  value={filters}
                  onChange={setFilters}
                  groups={[
                    {
                      title: "Vehicle Type", options: types,
                    },
                    {
                      title: "Year", options: years,
                    },
                    {
                      title: "Fuel Level", options: FUEL_BANDS,
                    },
                  ]}
                />
              </div>
            </div>
            <div className="p-6 pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      {[
                        "Registration No.",
                        "Make",
                        "Model",
                        "Type",
                        "Year",
                        "Status",
                        "Fuel",
                      ].map(h => (
                        <th
                          key={h}
                          className="pb-3 pr-6 font-medium"
                        >
                          {h}
                        </th>
                      ))}
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map(v => (
                      <tr
                        key={v.id}
                        className="group transition-colors hover:bg-secondary/30"
                      >
                        <td className="py-4 pr-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><Truck className="h-4 w-4 text-primary" /></div>
                            <span className="rounded bg-secondary px-2 py-1 font-mono text-xs">{plateOf(v)}</span>
                          </div>
                        </td>
                        <td className="py-4 pr-6 font-medium text-sm">{v.make || "—"}</td>
                        <td className="py-4 pr-6 font-medium text-sm">{v.model}</td>
                        <td className="py-4 pr-6 capitalize">{v.type ?? "—"}</td>
                        <td className="py-4 pr-6">{v.year ?? "—"}</td>
                        <td className="py-4 pr-6">
                          <span className={cn(
                            "rounded-full px-2.5 py-1 text-[11px] font-medium capitalize",
                            v.status === "active" && "bg-success/10 text-success",
                            v.status === "inactive" && "bg-muted text-muted-foreground",
                            v.status === "maintenance" && "bg-warning/10 text-warning",
                            v.status === "decommissioned" && "bg-destructive/10 text-destructive",
                          )}
                          >
                            {v.status === "maintenance" ? "In maintenance" : v.status}
                          </span>
                        </td>
                        <td className="py-4 pr-6">
                          {v.fuelLevelPercent != null
                            ? (
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-14 rounded-full bg-secondary">
                                    <div
                                      className={cn(
                                        "h-full rounded-full",
                                        v.fuelLevelPercent > 50 ? "bg-success" : v.fuelLevelPercent > 25 ? "bg-warning" : "bg-destructive",
                                      )}
                                      style={{ width: `${v.fuelLevelPercent}%` }}
                                    />
                                  </div>
                                  <span className="text-[11px] text-muted-foreground">
                                    {v.fuelLevelPercent}
                                    %
                                  </span>
                                </div>
                              )
                            : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Actions for ${plateOf(v)}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedVehicle(v)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {mayManage && (
                                <>
                                  <DropdownMenuItem onClick={() => setEditVehicle(v)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteId(v.id)}
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
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Truck className="h-12 w-12 mb-4 opacity-30" />
                    <p>{assignedVehicles.length ? "No vehicles found" : "No vehicles assigned to this fleet"}</p>
                    {assignedVehicles.length > 0 && <p className="text-sm">Try adjusting your search or filters</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <VehicleDetailsSheet
        open={Boolean(selectedVehicle)}
        onOpenChange={(open) => {
          if (!open)
            setSelectedVehicle(null);
        }}
        vehicle={selectedVehicle}
        driverName={selectedVehicle?.assignedDriverName ?? null}
      />

      <VehicleFormDialog
        open={Boolean(editVehicle)}
        onOpenChange={o => !o && setEditVehicle(null)}
        vehicle={editVehicle ? toVehicleFormValue(editVehicle) : null}
        title="Edit Vehicle"
        isSubmitting={updateVehicle.isPending}
        onSubmit={handleEdit}
      />

      <Dialog
        open={addOpen}
        onOpenChange={setAddOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Add Vehicle to
              {" "}
              {fleet?.name}
            </DialogTitle>
            <DialogDescription>Select existing vehicles to assign. A vehicle can only belong to one fleet.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 rounded-xl"
              placeholder="Search by registration, make or model..."
              value={addQuery}
              onChange={e => setAddQuery(e.target.value)}
            />
          </div>
          <div className="max-h-72 overflow-y-auto space-y-1 rounded-xl border p-2">
            {candidates.length === 0
              ? <p className="py-6 text-center text-sm text-muted-foreground">No other vehicles available.</p>
              : candidates.map((v) => {
                  const other = fleetOf(v.id);
                  return (
                    <label
                      key={v.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg p-2",
                        other ? "opacity-60 cursor-not-allowed" : "hover:bg-muted/50 cursor-pointer",
                      )}
                    >
                      <Checkbox
                        disabled={Boolean(other)}
                        checked={picked.includes(v.id)}
                        onCheckedChange={c => setPicked(p => (c ? [
                          ...p,
                          v.id,
                        ] : p.filter(x => x !== v.id)))}
                      />
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10"><Truck className="h-4 w-4 text-primary" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {[
                            v.make,
                            v.model,
                          ].filter(Boolean).join(" ")}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">{plateOf(v)}</p>
                      </div>
                      {other && (
                        <Badge
                          variant="outline"
                          className="rounded-full text-[10px] text-muted-foreground shrink-0"
                        >
                          In
                          {" "}
                          {other.name}
                        </Badge>
                      )}
                    </label>
                  );
                })}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              disabled={!picked.length || updateFleet.isPending}
              onClick={confirmAdd}
            >
              Add
              {" "}
              {picked.length || ""}
              {" "}
              Vehicle
              {picked.length === 1 ? "" : "s"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={o => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete vehicle?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently remove the vehicle from your fleet.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteVehicle.isPending}
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
