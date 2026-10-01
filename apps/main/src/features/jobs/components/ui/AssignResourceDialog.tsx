import type { DispatchJob } from "@truckmoov/api/dispatch";
import type {
  FleetDriver, Vehicle,
} from "@truckmoov/api/fleet";
import { useQuery } from "@tanstack/react-query";
import {
  getNearestVehiclesQueryOptions,
  getRecommendDriversQueryOptions,
  useDrivers,
  useVehicles,
} from "@truckmoov/api/fleet";
import {
  ArrowLeft, CheckCircle2, Fuel, Gauge, Loader2, MapPin, Package, Search, Sparkles, Truck, User,
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

type Ranked = {
  id: string; score: number; reasons: string[];
};

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
  return d.performanceScore ?? d.behaviorScore ?? null;
}

function vehicleCapacityTonnes(v: Vehicle) {
  return v.capacityWeightKg ? v.capacityWeightKg / 1000 : v.capacity;
}

function sentence(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ponytail: fleet has no vehicle-recommendation endpoint (only recommend-drivers), so
// capacity fit + fuel are scored here — fleetflow's getVehicleSuitabilityScore weights.
// Proximity is real (GET /fleet/vehicles/nearest). Replace with the server ranking once it exists.
function scoreVehicle(v: Vehicle, requiredTonnes: number | undefined, requiredType: string | undefined, distance: number | null): Ranked {
  const typeMismatch = Boolean(requiredType && v.type && v.type !== requiredType);
  let score = 40 + (v.status === "active" ? 20 : 0) - (typeMismatch ? 30 : 0);
  const fuel = v.fuelLevelPercent;
  score += Math.min(
    (fuel ?? 60) / 100,
    1,
  ) * 15;
  const capacity = vehicleCapacityTonnes(v);
  if (requiredTonnes && capacity) {
    const ratio = requiredTonnes / capacity;
    score += ratio <= 1 ? (1 - Math.abs(0.75 - ratio)) * 15 : -25;
  }
  else {
    score += 8;
  }
  score += distance === null ? 4 : Math.max(
    0,
    1 - Math.min(
      distance,
      120,
    ) / 120,
  ) * 10;
  return {
    id: v.id,
    score: Math.max(
      0,
      Math.min(
        100,
        Math.round(score),
      ),
    ),
    reasons: [
      ...(typeMismatch ? [`${sentence(v.type ?? "")} — job needs a ${requiredType}`] : []),
      requiredTonnes ? `Capacity ${capacity ?? "—"}t vs ${requiredTonnes}t cargo` : `Rated capacity ${capacity ?? "—"}t`,
      typeof fuel === "number" ? `Fuel level ${fuel}%` : "Fuel level not reported",
      distance !== null ? `≈ ${distance} km from pickup point` : "Location not reported — proximity unscored",
    ],
  };
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
    view,
    setView,
  ] = useState<"list" | "ai">("list");
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
        setView("list");
        setQuery("");
        setSelectedId(null);
      }
    },
    [
      open,
      kind,
    ],
  );

  const pickupLat = job?.pickup?.latitude;
  const pickupLng = job?.pickup?.longitude;
  const hasPickup = typeof pickupLat === "number" && typeof pickupLng === "number";
  const requiredTonnes = job?.load_weight_kg ? job.load_weight_kg / 1000 : undefined;
  const vehicleType = job?.required_vehicle_type as Vehicle["type"] | undefined;

  const driversQuery = useDrivers();
  const vehiclesQuery = useVehicles();
  const recommendQuery = useQuery({
    ...getRecommendDriversQueryOptions({
      params: {
        pickupLat,
        pickupLng,
        requiredCapacity: requiredTonnes,
        vehicleType: vehicleType ?? undefined,
        limit: 50,
      },
    }),
    enabled: open && kind === "driver",
  });
  const nearestQuery = useQuery({
    ...getNearestVehiclesQueryOptions({
      params: {
        lat: pickupLat ?? 0, lng: pickupLng ?? 0, limit: 50,
      },
    }),
    enabled: open && kind === "vehicle" && hasPickup,
  });

  const availableDrivers = useMemo(
    () => (driversQuery.data?.data ?? []).filter(d => d.status === "available" || d.status === "active"),
    [driversQuery.data?.data],
  );
  const availableVehicles = useMemo(
    () => (vehiclesQuery.data?.data ?? []).filter(v => v.status === "active"),
    [vehiclesQuery.data?.data],
  );
  const vehicleDistance = useMemo(
    () => new Map((nearestQuery.data?.data ?? []).map(n => [
      n.vehicleId,
      n.distanceKm,
    ])),
    [nearestQuery.data?.data],
  );

  // Driver ranking comes from GET /fleet/dispatch/recommend-drivers.
  const rankedDrivers: Ranked[] = useMemo(
    () => (recommendQuery.data?.data ?? [])
      .filter(r => availableDrivers.some(d => d.id === r.driverId))
      .map(r => ({
        id: r.driverId,
        score: Math.round(r.score),
        reasons: [
          ...r.reasons.map(sentence),
          r.distanceKm !== null ? `≈ ${r.distanceKm} km from pickup point` : "Location not reported — proximity unscored",
        ],
      }))
      .sort((a, b) => b.score - a.score),
    [
      recommendQuery.data?.data,
      availableDrivers,
    ],
  );

  const rankedVehicles: Ranked[] = useMemo(
    () => availableVehicles
      .map(v => scoreVehicle(
        v,
        requiredTonnes,
        job?.required_vehicle_type,
        vehicleDistance.get(v.id) ?? null,
      ))
      .sort((a, b) => b.score - a.score),
    [
      availableVehicles,
      requiredTonnes,
      job?.required_vehicle_type,
      vehicleDistance,
    ],
  );

  const ranked = kind === "driver" ? rankedDrivers : rankedVehicles;
  const isRanking = kind === "driver" ? recommendQuery.isLoading : nearestQuery.isLoading;
  const isListLoading = kind === "driver" ? driversQuery.isLoading : vehiclesQuery.isLoading;

  const runAI = () => {
    setView("ai");
    setSelectedId(ranked[0]?.id ?? null);
  };

  useEffect(
    () => {
      if (view === "ai" && !selectedId && ranked[0])
        setSelectedId(ranked[0].id);
    },
    [
      view,
      selectedId,
      ranked,
    ],
  );

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

  const renderReasons = (rank?: Ranked) => rank && (
    <ul className="mt-2 space-y-0.5">
      {rank.reasons.map(r => (
        <li
          key={r}
          className="text-[11px] text-muted-foreground flex items-start gap-1"
        >
          <CheckCircle2 className="h-3 w-3 mt-0.5 text-success shrink-0" />
          {r}
        </li>
      ))}
    </ul>
  );

  const renderRankBadge = (index?: number) => typeof index === "number" && (
    <span className="absolute -top-1 -left-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
      {index + 1}
    </span>
  );

  const rowClassName = (active: boolean) => cn(
    "w-full text-left rounded-xl border p-3 transition-all",
    active ? "border-primary bg-primary/5 shadow-sm" : "border-border/60 hover:border-primary/50 hover:bg-accent/30",
  );

  const renderDriverRow = (d: FleetDriver, rank?: Ranked, index?: number) => {
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
            {renderRankBadge(index)}
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
            {renderReasons(rank)}
          </div>
          {rank && (
            <Badge className="shrink-0 bg-primary/15 text-primary border-primary/30">
              {rank.score}
              % match
            </Badge>
          )}
        </div>
      </button>
    );
  };

  const renderVehicleRow = (v: Vehicle, rank?: Ranked, index?: number) => (
    <button
      key={v.id}
      type="button"
      onClick={() => setSelectedId(v.id)}
      className={rowClassName(selectedId === v.id)}
    >
      <div className="flex items-start gap-3">
        <div className="relative h-9 w-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
          <Truck className="h-4 w-4 text-primary" />
          {renderRankBadge(index)}
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
            {vehicleDistance.has(v.id) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Live location
              </span>
            )}
          </div>
          {renderReasons(rank)}
        </div>
        {rank && (
          <Badge className="shrink-0 bg-primary/15 text-primary border-primary/30">
            {rank.score}
            %
          </Badge>
        )}
      </div>
    </button>
  );

  const rankLabel = (id: string) => {
    if (kind === "driver")
      return availableDrivers.find(d => d.id === id)?.name;
    const v = availableVehicles.find(x => x.id === id);
    return v ? `${v.plateNumber} (${[
      v.make,
      v.model,
    ].filter(Boolean).join(" ")})` : undefined;
  };

  const emptyList = kind === "driver" ? listDrivers.length === 0 : listVehicles.length === 0;

  const renderAIView = () => {
    if (isRanking) {
      return (
        <div className="py-10 text-center space-y-3">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">
            Analysing
            {" "}
            {kind === "driver" ? "driver performance, availability and proximity" : "capacity, fuel, status and proximity"}
            …
          </p>
        </div>
      );
    }
    if (kind === "driver" && recommendQuery.isError) {
      return (
        <div className="py-10 text-center space-y-1">
          <p className="text-sm text-destructive">{recommendQuery.error.message}</p>
          <Button
            variant="link"
            onClick={() => void recommendQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      );
    }
    if (ranked.length === 0) {
      return (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No
          {" "}
          {kind === "driver" ? "drivers" : "vehicles"}
          {" "}
          to recommend.
        </p>
      );
    }
    return (
      <>
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Why this ranking
          </p>
          <ol className="mt-2 space-y-1.5">
            {ranked.slice(
              0,
              3,
            ).map((r, i) => (
              <li
                key={r.id}
                className="text-[11px] leading-relaxed"
              >
                <span className="font-medium">
                  #
                  {i + 1}
                  {" "}
                  {rankLabel(r.id)}
                  {" "}
                  —
                  {" "}
                  {r.score}
                  % match.
                </span>
                {" "}
                <span className="text-muted-foreground">{r.reasons.join(" · ")}</span>
              </li>
            ))}
          </ol>
        </div>
        {ranked.map((r, i) => {
          if (kind === "driver") {
            const d = availableDrivers.find(x => x.id === r.id);
            return d ? renderDriverRow(
              d,
              r,
              i,
            ) : null;
          }
          const v = availableVehicles.find(x => x.id === r.id);
          return v ? renderVehicleRow(
            v,
            r,
            i,
          ) : null;
        })}
      </>
    );
  };

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
            {view === "ai"
              ? kind === "driver" ? "AI Driver Recommendation" : "AI Vehicle Recommendation"
              : kind === "driver" ? "Recommend a Driver" : "Recommend a Vehicle"}
          </DialogTitle>
          <DialogDescription>
            {view === "ai"
              ? kind === "driver"
                ? "Ranked by performance score, availability and distance to pickup."
                : "Ranked by capacity fit, fuel level, status and distance to pickup."
              : `Available ${kind === "driver" ? "drivers" : "vehicles"}${job?.reference ? ` for ${job.reference}` : ""}. Drivers and vehicles are assigned independently.`}
          </DialogDescription>
        </DialogHeader>

        <div className="relative px-5">
          {view === "list" && (
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={kind === "driver" ? "Search drivers..." : "Search vehicles..."}
                className="pl-9"
              />
            </div>
          )}

          <ScrollArea className="h-[46vh] pr-3">
            <div className="space-y-2 pb-24">
              {view === "ai" ? renderAIView() : renderListView()}
            </div>
          </ScrollArea>

          {view === "list" && !emptyList && !isListLoading && (
            <Button
              type="button"
              onClick={runAI}
              className="absolute bottom-4 right-8 rounded-full shadow-lg"
              size="sm"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Recommendation
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border/60 p-4">
          {view === "ai"
            ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView("list")}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  {" "}
                  Back to list
                </Button>
              )
            : (
                <span className="text-xs text-muted-foreground">
                  {kind === "driver" ? listDrivers.length : listVehicles.length}
                  {" "}
                  available
                </span>
              )}
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
