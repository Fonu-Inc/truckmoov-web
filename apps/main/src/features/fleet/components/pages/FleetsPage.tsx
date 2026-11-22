import type { FleetGroup } from "@truckmoov/api/fleet";
import {
  useCreateFleetGroup,
  useDeleteFleetGroup,
  useFleetGroups,
  useUpdateFleetGroup,
  useVehicles,
} from "@truckmoov/api/fleet";
import {
  Boxes,
  Edit,
  Layers,
  Plus,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  Truck,
} from "lucide-react";
import {
  useMemo, useState,
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
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { Switch } from "@/components/shadcn/switch";
import { Textarea } from "@/components/shadcn/textarea";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/shared/components/layout/PageHeader";

const TILE_CLASS = "rounded-2xl surface-sleek text-card-foreground";

type FleetFilter = "all" | "withVehicles" | "empty";

const FILTER_OPTIONS: {
  key: FleetFilter; label: string;
}[] = [
  {
    key: "all", label: "All fleets",
  },
  {
    key: "withVehicles", label: "Have vehicles assigned",
  },
  {
    key: "empty", label: "Have no vehicles",
  },
];

/** `/fleet/fleets` — the design app's Fleets tab. */
export default function FleetsPage() {
  const role = useAuthStore(s => s.user?.role);
  // Fleets can be changed by those the server lets manage them; others only see them.
  const mayManage = role === "ENTERPRISE_ADMIN" || role === "OWNER_OPERATOR" || role === "OPERATIONS_MANAGER";

  const fleetsQuery = useFleetGroups();
  const vehiclesQuery = useVehicles();
  const createFleet = useCreateFleetGroup();
  const updateFleet = useUpdateFleetGroup();
  const deleteFleet = useDeleteFleetGroup();

  const fleets = useMemo(
    () => fleetsQuery.data?.data ?? [],
    [fleetsQuery.data],
  );
  const vehicles = useMemo(
    () => vehiclesQuery.data?.data ?? [],
    [vehiclesQuery.data],
  );

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    isFilterOpen,
    setIsFilterOpen,
  ] = useState(false);
  const [
    fleetFilter,
    setFleetFilter,
  ] = useState<FleetFilter>("all");

  const [
    isFormOpen,
    setIsFormOpen,
  ] = useState(false);
  const [
    editingFleet,
    setEditingFleet,
  ] = useState<FleetGroup | null>(null);
  const [
    name,
    setName,
  ] = useState("");
  const [
    description,
    setDescription,
  ] = useState("");
  const [
    vehicleIds,
    setVehicleIds,
  ] = useState<string[]>([]);
  const [
    violationsEnabled,
    setViolationsEnabled,
  ] = useState(false);
  const [
    vehiclePickerSearch,
    setVehiclePickerSearch,
  ] = useState("");
  const [
    deleteConfirmId,
    setDeleteConfirmId,
  ] = useState<string | null>(null);

  const vehicleById = useMemo(
    () => new Map(vehicles.map(v => [
      v.id,
      v,
    ])),
    [vehicles],
  );

  const search = searchQuery.toLowerCase();
  const filteredFleets = fleets.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(search) || (f.description ?? "").toLowerCase().includes(search);
    const matchesFilter = fleetFilter === "all"
      || (fleetFilter === "withVehicles" && f.vehicleCount > 0)
      || (fleetFilter === "empty" && f.vehicleCount === 0);
    return matchesSearch && matchesFilter;
  });

  const totalVehiclesAssigned = new Set(fleets.flatMap(f => f.vehicleIds)).size;
  const avgPerFleet = fleets.length > 0 ? Math.round((totalVehiclesAssigned / fleets.length) * 10) / 10 : 0;
  const loaded = !fleetsQuery.isLoading;

  const kpis = [
    {
      label: "Total Fleets", value: fleets.length, icon: Boxes, chip: "bg-primary/10", iconClass: "text-primary",
    },
    {
      label: "Vehicles Assigned", value: totalVehiclesAssigned, icon: Truck, chip: "bg-success/10", iconClass: "text-success",
    },
    {
      label: "Avg Vehicles / Fleet", value: avgPerFleet, icon: Layers, chip: "bg-warning/10", iconClass: "text-warning",
    },
    {
      label: "Unassigned Vehicles",
      value: Math.max(
        0,
        vehicles.length - totalVehiclesAssigned,
      ),
      icon: ShieldAlert,
      chip: "bg-muted",
      iconClass: "text-muted-foreground",
    },
  ];

  const openCreate = () => {
    setEditingFleet(null);
    setName("");
    setDescription("");
    setVehicleIds([]);
    setViolationsEnabled(false);
    setVehiclePickerSearch("");
    setIsFormOpen(true);
  };

  const openEdit = (fleet: FleetGroup) => {
    setEditingFleet(fleet);
    setName(fleet.name);
    setDescription(fleet.description ?? "");
    setVehicleIds(fleet.vehicleIds);
    setViolationsEnabled(fleet.violationsEnabled);
    setVehiclePickerSearch("");
    setIsFormOpen(true);
  };

  const toggleVehicle = (id: string) => {
    setVehicleIds(prev => (prev.includes(id) ? prev.filter(v => v !== id) : [
      ...prev,
      id,
    ]));
  };

  const saving = createFleet.isPending || updateFleet.isPending;

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Fleet name is required");
      return;
    }
    const data = {
      name: name.trim(), description: description.trim() || null, vehicleIds, violationsEnabled,
    };
    const done = {
      onSuccess: () => {
        toast.success(editingFleet ? "Fleet updated" : "Fleet created");
        setIsFormOpen(false);
      },
      onError: (error: { message: string }) => { toast.error(error.message); },
    };
    if (editingFleet) {
      updateFleet.mutate(
        {
          id: editingFleet.id, data,
        },
        done,
      );
    }
    else {
      createFleet.mutate(
        { data },
        done,
      );
    }
  };

  const handleDelete = (id: string) => {
    deleteFleet.mutate(
      { id },
      {
        onSuccess: () => toast.success("Fleet deleted"),
        onError: (error: { message: string }) => { toast.error(error.message); },
        onSettled: () => setDeleteConfirmId(null),
      },
    );
  };

  const pickerSearch = vehiclePickerSearch.toLowerCase();
  const filteredPickerVehicles = vehicles.filter(v =>
    (v.registrationNumber || v.plateNumber || "").toLowerCase().includes(pickerSearch)
    || `${v.make ?? ""} ${v.model}`.toLowerCase().includes(pickerSearch));

  const plateOf = (id: string) => {
    const v = vehicleById.get(id);
    return v ? v.registrationNumber || v.plateNumber : id;
  };

  return (
    <>
      <PageHeader
        title="Fleets"
        description="Vehicle records, fleet membership, and operational details."
        actions={mayManage && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Fleet
          </Button>
        )}
      />

      <div className="mt-3 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {kpis.map(tile => (
              <div
                key={tile.label}
                className={TILE_CLASS}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tile.chip} shrink-0`}>
                      <tile.icon className={`h-5 w-5 ${tile.iconClass}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground">{tile.label}</p>
                      <p className="text-xl font-bold mt-1 truncate">{loaded ? tile.value : "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={TILE_CLASS}>
            <div className="flex flex-col p-6 pb-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold leading-none tracking-tight text-foreground font-display flex items-center gap-2">
                    <Boxes className="h-5 w-5 text-primary" />
                    Fleets (
                    {loaded ? filteredFleets.length : "-"}
                    )
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Group your vehicles into fleets for easier management and reporting.</p>
                </div>
                <ExportButton
                  filename="fleets"
                  rows={filteredFleets}
                  columns={[
                    {
                      header: "Fleet Name", accessor: "name",
                    },
                    {
                      header: "Description", accessor: (f: FleetGroup) => f.description ?? "",
                    },
                    {
                      header: "Vehicle Count", accessor: (f: FleetGroup) => f.vehicleCount,
                    },
                    {
                      header: "Violations", accessor: (f: FleetGroup) => (f.violationsEnabled ? "Enabled" : "Disabled"),
                    },
                    {
                      header: "Vehicles", accessor: (f: FleetGroup) => f.vehicleIds.map(plateOf).join("; "),
                    },
                    {
                      header: "Created", accessor: (f: FleetGroup) => new Date(f.createdAt).toLocaleDateString(),
                    },
                  ]}
                />
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search fleets by name or description..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 bg-card/50 border-border/50"
                  />
                </div>
                <Popover
                  open={isFilterOpen}
                  onOpenChange={setIsFilterOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-card/50 border-border/50 relative"
                    >
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filter
                      {fleetFilter !== "all" && (
                        <Badge
                          variant="secondary"
                          className="ml-2 h-5 min-w-5 px-1.5 text-[10px] bg-primary/20 text-primary border border-primary/30"
                        >
                          1
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-64 p-3 rounded-xl"
                  >
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium px-0.5">Only show fleets that...</h4>
                      {FILTER_OPTIONS.map(opt => (
                        <label
                          key={opt.key}
                          className="flex items-center gap-2 cursor-pointer select-none"
                        >
                          <Checkbox
                            checked={fleetFilter === opt.key}
                            onCheckedChange={() => setFleetFilter(opt.key)}
                            className="h-3.5 w-3.5"
                          />
                          <span className="text-xs font-medium">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="p-6 pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="pb-3 pr-6 font-medium">Fleet</th>
                      <th className="pb-3 pr-6 font-medium">Description</th>
                      <th className="pb-3 pr-6 font-medium">Vehicles</th>
                      <th className="pb-3 pr-6 font-medium">Violations</th>
                      <th className="pb-3 pr-6 font-medium">Created</th>
                      {mayManage && <th className="pb-3 font-medium text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredFleets.map(fleet => (
                      <tr
                        key={fleet.id}
                        className="group transition-colors hover:bg-secondary/30"
                      >
                        <td className="py-4 pr-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                              <Boxes className="h-4 w-4 text-primary" />
                            </div>
                            <p className="font-medium text-sm">{fleet.name}</p>
                          </div>
                        </td>
                        <td className="py-4 pr-6 max-w-[280px] truncate text-muted-foreground">{fleet.description || "—"}</td>
                        <td className="py-4 pr-6">
                          <Badge variant="outline">
                            {fleet.vehicleCount}
                            {" "}
                            vehicle
                            {fleet.vehicleCount === 1 ? "" : "s"}
                          </Badge>
                        </td>
                        <td className="py-4 pr-6">
                          <Badge variant={fleet.violationsEnabled ? "default" : "outline"}>
                            {fleet.violationsEnabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </td>
                        <td className="py-4 pr-6 text-muted-foreground">{new Date(fleet.createdAt).toLocaleDateString()}</td>
                        {mayManage && (
                          <td className="py-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label={`Edit ${fleet.name}`}
                                onClick={() => openEdit(fleet)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                aria-label={`Delete ${fleet.name}`}
                                onClick={() => setDeleteConfirmId(fleet.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {loaded && filteredFleets.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Boxes className="h-12 w-12 mb-4 opacity-30" />
                    <p>{fleetsQuery.isError ? "We couldn't load fleets" : "No fleets found"}</p>
                    <p className="text-sm">
                      {fleetsQuery.isError ? "Please try again shortly" : "Try adjusting your search or filters"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      >
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFleet ? "Edit Fleet" : "Create Fleet"}</DialogTitle>
            <DialogDescription>
              {editingFleet ? "Update the fleet details and vehicle assignments." : "Group vehicles together for easier management."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fleet-name">Fleet Name</Label>
              <Input
                id="fleet-name"
                value={name}
                maxLength={80}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Lagos Mainland Fleet"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fleet-description">Description</Label>
              <Textarea
                id="fleet-description"
                value={description}
                maxLength={240}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe this fleet's purpose or routes"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Assign Vehicles (
                {vehicleIds.length}
                {" "}
                selected)
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search vehicles..."
                  value={vehiclePickerSearch}
                  onChange={e => setVehiclePickerSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="max-h-56 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                {filteredPickerVehicles.map(v => (
                  <label
                    key={v.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/40",
                      vehicleIds.includes(v.id) && "bg-primary/5",
                    )}
                  >
                    <Checkbox
                      checked={vehicleIds.includes(v.id)}
                      onCheckedChange={() => toggleVehicle(v.id)}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{v.registrationNumber || v.plateNumber}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[
                          v.make,
                          v.model,
                        ].filter(Boolean).join(" ")}
                        {v.year ? ` (${v.year})` : ""}
                      </p>
                    </div>
                  </label>
                ))}
                {filteredPickerVehicles.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No vehicles match your search</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
              <div className="space-y-0.5">
                <Label htmlFor="fleet-violations">Enable Violations</Label>
                <p className="text-xs text-muted-foreground">Track and report violations for vehicles in this fleet.</p>
              </div>
              <Switch
                id="fleet-violations"
                checked={violationsEnabled}
                onCheckedChange={setViolationsEnabled}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {editingFleet ? "Save Changes" : "Create Fleet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={o => !o && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete fleet?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the fleet grouping. Vehicles themselves will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteFleet.isPending}
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
