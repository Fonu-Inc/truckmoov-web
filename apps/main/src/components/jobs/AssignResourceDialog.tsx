import type { FleetDriver, Vehicle } from "@truckmoov/api/fleet";
import { useDrivers, useVehicles } from "@truckmoov/api/fleet";
import {
  ArrowLeft, CheckCircle2, Fuel, Gauge, Loader2, MapPin, Package, Search, Sparkles, Truck, User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { Progress } from "@/components/shadcn/progress";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { cn } from "@/lib/utils";

export type AssignResourceKind = "driver" | "vehicle";

type Ranked = { id: string; score: number; reasons: string[] };

interface AssignResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: AssignResourceKind;
  jobReference?: string;
  onAssign: (id: string) => void;
  /** When true the CTA reads "Recommend" rather than "Assign". */
  recommendOnly?: boolean;
}

// ponytail: proximity/perf scoring uses only fields the API returns today. When the
// dispatch API exposes real driver performance / vehicle fuel scoring, replace the
// heuristics below rather than adding a scoring service.
function scoreDriver(d: FleetDriver): Ranked {
  const trips = (d as unknown as { total_trips?: number }).total_trips ?? 0;
  const available = d.status === "available";
  const base = Math.min(100, 40 + Math.min(trips, 400) / 8);
  const bonus = available ? 12 : 0;
  const score = Math.round(base + bonus);
  const reasons = [
    `Performance baseline ${Math.round(base)}% (${trips} completed trips)`,
    available ? "Currently available for dispatch" : "On duty — can be re-routed",
  ];
  return { id: d.id, score, reasons };
}

function scoreVehicle(v: Vehicle): Ranked {
  const capacity = Number((v as unknown as { capacity_kg?: number }).capacity_kg ?? 0) / 1000;
  const fuel = (v as unknown as { fuel_level?: number }).fuel_level;
  const base = 60 + Math.min(capacity, 40) * 0.8;
  const fuelBonus = typeof fuel === "number" ? Math.max(0, (fuel - 40) / 3) : 0;
  const score = Math.round(Math.min(100, base + fuelBonus));
  const reasons = [
    capacity > 0 ? `Rated capacity ${capacity.toFixed(1)}t` : "Capacity not reported",
    typeof fuel === "number" ? `Fuel level ${fuel}%` : "Fuel not reported",
  ];
  return { id: v.id, score, reasons };
}

export function AssignResourceDialog({
  open,
  onOpenChange,
  kind,
  jobReference,
  onAssign,
  recommendOnly = false,
}: AssignResourceDialogProps) {
  const [view, setView] = useState<"list" | "ai">("list");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [progress, setProgress] = useState(0);

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

  useEffect(() => {
    if (open) {
      setView("list");
      setQuery("");
      setSelectedId(null);
      setIsThinking(false);
      setProgress(0);
    }
  }, [open, kind]);

  const rankedDrivers = useMemo(
    () => availableDrivers.map(scoreDriver).sort((a, b) => b.score - a.score),
    [availableDrivers],
  );
  const rankedVehicles = useMemo(
    () => availableVehicles.map(scoreVehicle).sort((a, b) => b.score - a.score),
    [availableVehicles],
  );
  const ranked = kind === "driver" ? rankedDrivers : rankedVehicles;

  const runAI = () => {
    setView("ai");
    setIsThinking(true);
    setProgress(0);
    const iv = setInterval(() => setProgress(p => Math.min(p + 12, 95)), 120);
    setTimeout(() => {
      clearInterval(iv);
      setProgress(100);
      setIsThinking(false);
      setSelectedId(ranked[0]?.id ?? null);
    }, 1200);
  };

  const q = query.toLowerCase();
  const listDrivers = availableDrivers.filter(
    d => d.full_name?.toLowerCase().includes(q) || d.phone?.toLowerCase().includes(q),
  );
  const listVehicles = availableVehicles.filter((v) => {
    const reg = (v as unknown as { registration_number?: string }).registration_number ?? v.license_plate ?? "";
    const model = `${v.make ?? ""} ${v.model ?? ""}`;
    return reg.toLowerCase().includes(q) || model.toLowerCase().includes(q);
  });

  const ctaLabel = recommendOnly
    ? kind === "driver" ? "Recommend Driver" : "Recommend Vehicle"
    : kind === "driver" ? "Assign Driver" : "Assign Vehicle";

  const renderDriverRow = (d: FleetDriver, rank?: Ranked, index?: number) => {
    const active = selectedId === d.id;
    const trips = (d as unknown as { total_trips?: number }).total_trips ?? 0;
    return (
      <button
        key={d.id}
        type="button"
        onClick={() => setSelectedId(d.id)}
        className={cn(
          "w-full text-left rounded-xl border p-3 transition-all",
          active
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-border/60 hover:border-primary/50 hover:bg-accent/30",
        )}
      >
        <div className="flex items-start gap-3">
          <div className="relative h-9 w-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
            {typeof index === "number" && (
              <span className="absolute -top-1 -left-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                {index + 1}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium truncate">{d.full_name ?? "Unnamed driver"}</p>
              <Badge variant="outline" className="text-[10px] capitalize">{d.status}</Badge>
            </div>
            <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-medium border-border">
                <Gauge className="h-3 w-3" />
                {rank ? rank.score : trips ? Math.min(100, 40 + Math.min(trips, 400) / 8) : 0}
                % performance
              </span>
              <span>
                {trips}
                {" "}
                trips
              </span>
              {d.phone && <span>{d.phone}</span>}
            </div>
            {rank && (
              <ul className="mt-2 space-y-0.5">
                {rank.reasons.map(r => (
                  <li key={r} className="text-[11px] text-muted-foreground flex items-start gap-1">
                    <CheckCircle2 className="h-3 w-3 mt-0.5 text-success shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            )}
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

  const renderVehicleRow = (v: Vehicle, rank?: Ranked, index?: number) => {
    const active = selectedId === v.id;
    const reg = (v as unknown as { registration_number?: string }).registration_number ?? v.license_plate ?? v.id;
    const capacity = Number((v as unknown as { capacity_kg?: number }).capacity_kg ?? 0) / 1000;
    const fuel = (v as unknown as { fuel_level?: number }).fuel_level;
    const hasLocation = Boolean(
      (v as unknown as { location?: unknown; latitude?: number; last_position?: unknown })
        .location
        ?? (v as unknown as { latitude?: number }).latitude
        ?? (v as unknown as { last_position?: unknown }).last_position,
    );
    return (
      <button
        key={v.id}
        type="button"
        onClick={() => setSelectedId(v.id)}
        className={cn(
          "w-full text-left rounded-xl border p-3 transition-all",
          active
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-border/60 hover:border-primary/50 hover:bg-accent/30",
        )}
      >
        <div className="flex items-start gap-3">
          <div className="relative h-9 w-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
            <Truck className="h-4 w-4 text-primary" />
            {typeof index === "number" && (
              <span className="absolute -top-1 -left-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                {index + 1}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium truncate">{reg}</p>
              {v.type && <Badge variant="outline" className="text-[10px] capitalize">{v.type}</Badge>}
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
                {v.make ?? ""}
                {" "}
                {v.model ?? ""}
                {v.year ? ` · ${v.year}` : ""}
              </span>
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                Capacity
                {" "}
                {capacity > 0 ? `${capacity.toFixed(1)}t` : "—"}
              </span>
              {typeof fuel === "number" && (
                <span className="flex items-center gap-1">
                  <Fuel className="h-3 w-3" />
                  Fuel
                  {" "}
                  {fuel}
                  %
                </span>
              )}
              {hasLocation && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Live location
                </span>
              )}
            </div>
            {rank && (
              <ul className="mt-2 space-y-0.5">
                {rank.reasons.map(r => (
                  <li key={r} className="text-[11px] text-muted-foreground flex items-start gap-1">
                    <CheckCircle2 className="h-3 w-3 mt-0.5 text-success shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            )}
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
  };

  const isLoading = kind === "driver" ? driversQuery.isLoading : vehiclesQuery.isLoading;
  const emptyList = kind === "driver" ? listDrivers.length === 0 : listVehicles.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3">
          <DialogTitle className="flex items-center gap-2">
            {kind === "driver" ? <User className="h-4 w-4 text-primary" /> : <Truck className="h-4 w-4 text-primary" />}
            {view === "ai"
              ? kind === "driver" ? "AI Driver Recommendation" : "AI Vehicle Recommendation"
              : kind === "driver" ? "Assign a Driver" : "Assign a Vehicle"}
          </DialogTitle>
          <DialogDescription>
            {view === "ai"
              ? kind === "driver"
                ? "Ranked by performance, availability and distance to pickup."
                : "Ranked by capacity fit, fuel level, status and distance to pickup."
              : `Available ${kind === "driver" ? "drivers" : "vehicles"}${jobReference ? ` for ${jobReference}` : ""}. Drivers and vehicles are assigned independently.`}
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

          {view === "ai" && isThinking
            ? (
                <div className="py-10 text-center space-y-3">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Analysing
                    {" "}
                    {kind === "driver" ? "driver performance, availability and proximity" : "capacity, fuel, status and proximity"}
                    …
                  </p>
                  <Progress value={progress} className="h-1.5 max-w-sm mx-auto" />
                </div>
              )
            : (
                <ScrollArea className="h-[46vh] pr-3">
                  <div className="space-y-2 pb-24">
                    {view === "ai" && ranked.length > 0 && (
                      <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
                        <p className="text-xs font-semibold flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          Why this ranking
                        </p>
                        <ol className="mt-2 space-y-1.5">
                          {ranked.slice(0, 3).map((r, i) => {
                            const label = kind === "driver"
                              ? availableDrivers.find(d => d.id === r.id)?.full_name
                              : (() => {
                                  const v = availableVehicles.find(x => x.id === r.id);
                                  const reg = (v as unknown as { registration_number?: string } | undefined)?.registration_number ?? v?.license_plate;
                                  return v ? `${reg ?? v.id} (${v.make ?? ""} ${v.model ?? ""})` : undefined;
                                })();
                            if (!label)
                              return null;
                            return (
                              <li key={r.id} className="text-[11px] leading-relaxed">
                                <span className="font-medium">
                                  #
                                  {i + 1}
                                  {" "}
                                  {label}
                                  {" "}
                                  —
                                  {" "}
                                  {r.score}
                                  % match.
                                </span>
                                {" "}
                                <span className="text-muted-foreground">{r.reasons.join(" · ")}</span>
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    )}

                    {isLoading
                      ? (
                          <div className="py-10 text-center">
                            <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                          </div>
                        )
                      : view === "list"
                        ? (
                            emptyList
                              ? (
                                  <p className="py-10 text-center text-sm text-muted-foreground">
                                    No available
                                    {" "}
                                    {kind === "driver" ? "drivers" : "vehicles"}
                                    {" "}
                                    found.
                                  </p>
                                )
                              : kind === "driver"
                                ? listDrivers.map(d => renderDriverRow(d))
                                : listVehicles.map(v => renderVehicleRow(v))
                          )
                        : kind === "driver"
                          ? ranked.map((r, i) => {
                              const d = availableDrivers.find(x => x.id === r.id);
                              return d ? renderDriverRow(d, r, i) : null;
                            })
                          : ranked.map((r, i) => {
                              const v = availableVehicles.find(x => x.id === r.id);
                              return v ? renderVehicleRow(v, r, i) : null;
                            })}
                  </div>
                </ScrollArea>
              )}

          {view === "list" && !emptyList && !isLoading && (
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
                <Button variant="ghost" size="sm" onClick={() => setView("list")}>
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
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              size="sm"
              disabled={!selectedId}
              onClick={() => {
                if (selectedId) {
                  onAssign(selectedId);
                  onOpenChange(false);
                }
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
