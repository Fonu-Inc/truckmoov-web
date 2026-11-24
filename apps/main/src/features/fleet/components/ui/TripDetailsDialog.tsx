import type { LatLngTuple } from "leaflet";
import { format } from "date-fns";
import {
  Clock, Flag, MapPin, Navigation, Route, Truck, User,
} from "lucide-react";
import { RoutePreviewMap } from "@/components/maps/RoutePreviewMap";
import { Badge } from "@/components/shadcn/badge";
import {
  Card, CardContent,
} from "@/components/shadcn/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Progress } from "@/components/shadcn/progress";
import { Separator } from "@/components/shadcn/separator";

export type TripStatus = "scheduled" | "active" | "completed" | "cancelled";

export type TripPoint = {
  address: string; lat?: number; lng?: number;
};

export type TripDetail = {
  id: string;
  reference: string;
  status: TripStatus;
  progress: number;
  date: string;
  vehicle: string;
  driver: string;
  pickup: TripPoint;
  delivery: TripPoint;
  stops: TripPoint[];
  deadline?: string;
  completedAt?: string;
  notes?: string;
};

function haversineKm(a: LatLngTuple, b: LatLngTuple) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toTuple(p: TripPoint): LatLngTuple | null {
  return typeof p.lat === "number" && typeof p.lng === "number" ? [
    p.lat,
    p.lng,
  ] : null;
}

function Row({
  icon: Icon, label, value,
}: {
  icon: React.ElementType; label: string; value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-muted-foreground text-xs">
        <Icon className="h-3.5 w-3.5" />
        {" "}
        {label}
      </span>
      <span className="text-sm text-right truncate max-w-[60%]">{value}</span>
    </div>
  );
}

function dateTime(iso: string) {
  return format(
    new Date(iso),
    "dd MMM yyyy, HH:mm",
  );
}

// ponytail: fleetflow animates a simulated "live" truck along the line; there is no
// vehicle telemetry for these jobs yet, so the map shows the planned route only.
// Wire a tracking position in once vehicles report GPS.
export function TripDetailsDialog({
  trip,
  open,
  onOpenChange,
}: {
  trip: TripDetail | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!trip)
    return null;

  const waypoints = [
    {
      ...trip.pickup, kind: "Pickup",
    },
    ...trip.stops.map(s => ({
      ...s, kind: "Intermediate stop",
    })),
    {
      ...trip.delivery, kind: "Delivery",
    },
  ].map((w, i) => ({
    ...w, label: String.fromCharCode(65 + i), pos: toTuple(w),
  }));
  const located = waypoints.filter((w): w is typeof w & { pos: LatLngTuple } => w.pos !== null);
  const legKm = (i: number) => {
    const a = waypoints[i - 1]?.pos;
    const b = waypoints[i]?.pos;
    return a && b ? haversineKm(
      a,
      b,
    ) : null;
  };
  const distanceKm = waypoints.reduce(
    (sum, _, i) => sum + (i > 0 ? legKm(i) ?? 0 : 0),
    0,
  );
  // 35 km/h average urban truck speed, same assumption as fleetflow.
  const etaMin = Math.round((distanceKm / 35) * 60);
  const lastIndex = waypoints.length - 1;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            Trip
            {" "}
            {trip.reference}
            <Badge
              variant={trip.status === "active" ? "default" : "secondary"}
              className="rounded-full capitalize"
            >
              {trip.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            The journey taken to complete this job: route, stops and progress
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                icon: Navigation, label: "Distance", value: located.length > 1 ? `${distanceKm.toFixed(1)} km` : "-",
              },
              {
                icon: Clock, label: trip.status === "completed" ? "Duration" : "Est. time", value: located.length > 1 ? `${Math.floor(etaMin / 60)}h ${etaMin % 60}m` : "-",
              },
              {
                icon: MapPin, label: "Stops", value: `${trip.stops.length}`,
              },
              {
                icon: Flag, label: "Progress", value: `${trip.progress}%`,
              },
            ].map(s => (
              <Card
                key={s.label}
                className="surface-sleek border-border/50"
              >
                <CardContent className="p-3 flex items-center gap-2">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                    <s.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground truncate">{s.label}</p>
                    <p className="text-base font-semibold truncate">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="w-full h-[320px] rounded-xl border border-border overflow-hidden z-0">
            <RoutePreviewMap
              className="h-full w-full"
              // A center stops the map from asking for the browser's location.
              center={located[0]?.pos}
              markers={located.map((w, i) => ({
                position: w.pos,
                label: `${w.label} · ${w.address}`,
                color: i === 0 ? "#16a34a" : i === located.length - 1 ? "#dc2626" : "#2563eb",
              }))}
              fitMarkers
              routeCoordinates={located.map(w => w.pos)}
              routeColor="#f5b301"
              showRouteOptimizer={false}
            />
          </div>

          {trip.status !== "cancelled" && (
            <div className="flex items-center gap-3">
              <Progress
                value={trip.progress}
                className="h-2 flex-1"
              />
              <span className="text-xs text-muted-foreground w-10 text-right">
                {trip.progress}
                %
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">Route taken</p>
                <span className="text-[11px] text-muted-foreground">
                  {trip.stops.length}
                  {" "}
                  intermediate
                  {" "}
                  {trip.stops.length === 1 ? "point" : "points"}
                </span>
              </div>
              <div className="space-y-3">
                {waypoints.map((w, i) => (
                  <div
                    key={w.label}
                    className="flex gap-3"
                  >
                    <div className="flex flex-col items-center">
                      <span className="h-6 w-6 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center">
                        {w.label}
                      </span>
                      {i < lastIndex && <span className="flex-1 w-px bg-border my-1" />}
                    </div>
                    <div className="pb-2 min-w-0">
                      <p className="text-xs text-muted-foreground">{w.kind}</p>
                      <p className="text-sm break-words">{w.address || "-"}</p>
                      {i > 0 && legKm(i) !== null && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {legKm(i)?.toFixed(1)}
                          {" "}
                          km from previous point
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-sm font-semibold">Journey details</p>
              <Separator />
              <Row
                icon={Truck}
                label="Vehicle"
                value={trip.vehicle}
              />
              <Row
                icon={User}
                label="Driver"
                value={trip.driver}
              />
              <Row
                icon={Clock}
                label="Started"
                value={dateTime(trip.date)}
              />
              {trip.completedAt && (
                <Row
                  icon={Flag}
                  label="Completed"
                  value={dateTime(trip.completedAt)}
                />
              )}
              {trip.deadline && (
                <Row
                  icon={Clock}
                  label="Deadline"
                  value={dateTime(trip.deadline)}
                />
              )}
              {trip.notes && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm">{trip.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
