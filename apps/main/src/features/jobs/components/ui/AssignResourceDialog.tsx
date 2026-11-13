import type { DispatchJob } from "@truckmoov/api/dispatch";
import type {
  FleetDriver, Vehicle,
} from "@truckmoov/api/fleet";
import {
  useDrivers,
  useVehicles,
} from "@truckmoov/api/fleet";
import {
  Fuel, Gauge, Loader2, Package, Search, Truck, User,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { getPerformanceBand } from "@/features/drivers/utils/driverPerformance";
import { cn } from "@/lib/utils";

export type AssignResourceKind = "driver" | "vehicle";

type AssignResourceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: AssignResourceKind;
  job: DispatchJob | null;
  /** Called with the selected driver id or vehicle id. */
  onAssign: (id: string) => void;
  /** When true, the CTA reads "Recommend" instead of "Assign". */
  recommendOnly?: boolean;
};

const UNSCORED_BAND = "bg-muted text-muted-foreground border-border";

function driverPerformance(d: FleetDriver) {
  return d.behaviorScore ?? d.performanceScore ?? null;
}

function vehicleCapacityTonnes(v: Vehicle) {
  return v.capacityWeightKg ? v.capacityWeightKg / 1000 : v.capacity;
}

export function AssignResourceDialog({
  open,
  onOpenChange,
  kind,
  job,
  onAssign,
  recommendOnly = false,
}: AssignResourceDialogProps) {
  const [
    query,
    setQuery,
  ] = useState("");
  const [
    selectedId,
    setSelectedId,
  ] = useState<string | null>(null);

  useEffect(
    () => {
      if (open) {
        setQuery("");
        setSelectedId(null);
      }
    },
    [
      open,
      kind,
    ],
  );

  const driversQuery = useDrivers();
  const vehiclesQuery = useVehicles();

  const availableDrivers = useMemo(
    () => (driversQuery.data?.data ?? []).filter(d => d.status === "available" || d.status === "active"),
    [driversQuery.data?.data],
  );
  const availableVehicles = useMemo(
    () => (vehiclesQuery.data?.data ?? []).filter(v => v.status === "active"),
    [vehiclesQuery.data?.data],
  );

  const isListLoading = kind === "driver" ? driversQuery.isLoading : vehiclesQuery.isLoading;

  const q = query.toLowerCase();
  const listDrivers = availableDrivers.filter(
    d => d.name.toLowerCase().includes(q) || d.phone?.toLowerCase().includes(q),
  );
  const listVehicles = availableVehicles.filter(
    v => v.plateNumber.toLowerCase().includes(q) || `${v.make ?? ""} ${v.model}`.toLowerCase().includes(q),
  );

  const ctaLabel = recommendOnly
    ? kind === "driver" ? "Recommend Driver" : "Recommend Vehicle"
    : kind === "driver" ? "Assign Driver" : "Assign Vehicle";

  const rowClassName = (active: boolean) => cn(
    "w-full text-left rounded-xl border p-3 transition-all",
    active ? "border-primary bg-primary/5 shadow-sm" : "border-border/60 hover:border-primary/50 hover:bg-accent/30",
  );

  const renderDriverRow = (d: FleetDriver) => {
    const perf = driverPerformance(d);
    return (
      <button
        key={d.id}
        type="button"
        onClick={() => setSelectedId(d.id)}
        className={rowClassName(selectedId === d.id)}
      >
        <div className="flex items-start gap-3">
          <div className="relative h-9 w-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium truncate">{d.name}</p>
              <Badge
                variant="outline"
                className="text-[10px] capitalize"
              >
                {d.status}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
              <span className={cn(
                "flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-medium",
                perf === null ? UNSCORED_BAND : getPerformanceBand(perf).className,
              )}
              >
                <Gauge className="h-3 w-3" />
                {perf === null ? "Unscored" : `${Math.round(perf)}% performance`}
              </span>
              <span>
                {d.trips ?? 0}
                {" "}
                trips
              </span>
              {d.phone && <span>{d.phone}</span>}
            </div>
          </div>
        </div>
      </button>
    );
  };

  const renderVehicleRow = (v: Vehicle) => (
    <button
      key={v.id}
      type="button"
      onClick={() => setSelectedId(v.id)}
      className={rowClassName(selectedId === v.id)}
    >
      <div className="flex items-start gap-3">
        <div className="relative h-9 w-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
          <Truck className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium truncate">{v.plateNumber}</p>
            {v.type && (
              <Badge
                variant="outline"
                className="text-[10px] capitalize"
              >
                {v.type}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] capitalize",
                v.status === "active"
                  ? "bg-success/15 text-success border-success/30"
                  : v.status === "maintenance"
                    ? "bg-warning/15 text-warning border-warning/30"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {v.status === "active" ? "Available" : v.status}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
            <span>
              {[
                v.make,
                v.model,
              ].filter(Boolean).join(" ")}
              {v.year ? ` · ${v.year}` : ""}
            </span>
            {vehicleCapacityTonnes(v) !== null && (
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                Capacity
                {" "}
                {vehicleCapacityTonnes(v)}
                t
              </span>
            )}
            {typeof v.fuelLevelPercent === "number" && (
              <span className="flex items-center gap-1">
                <Fuel className="h-3 w-3" />
                Fuel
                {" "}
                {v.fuelLevelPercent}
                %
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );

  const emptyList = kind === "driver" ? listDrivers.length === 0 : listVehicles.length === 0;

  const renderListView = () => {
    if (isListLoading) {
      return (
        <div className="py-10 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (emptyList) {
      return (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No available
          {" "}
          {kind === "driver" ? "drivers" : "vehicles"}
          {" "}
          found.
        </p>
      );
    }
    return kind === "driver"
      ? listDrivers.map(d => renderDriverRow(d))
      : listVehicles.map(v => renderVehicleRow(v));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3">
          <DialogTitle className="flex items-center gap-2">
            {kind === "driver" ? <User className="h-4 w-4 text-primary" /> : <Truck className="h-4 w-4 text-primary" />}
            {kind === "driver" ? "Recommend a Driver" : "Recommend a Vehicle"}
          </DialogTitle>
          <DialogDescription>
            {`Available ${kind === "driver" ? "drivers" : "vehicles"}${job?.reference ? ` for ${job.reference}` : ""}. Drivers and vehicles are assigned independently.`}
          </DialogDescription>
        </DialogHeader>

        <div className="relative px-5">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={kind === "driver" ? "Search drivers..." : "Search vehicles..."}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[46vh] pr-3">
            <div className="space-y-2 pb-4">
              {renderListView()}
            </div>
          </ScrollArea>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border/60 p-4">
          <span className="text-xs text-muted-foreground">
            {kind === "driver" ? listDrivers.length : listVehicles.length}
            {" "}
            available
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!selectedId}
              onClick={() => {
                if (selectedId)
                  onAssign(selectedId);
              }}
            >
              {ctaLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
