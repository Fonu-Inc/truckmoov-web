import { useState } from "react";
import {
  Navigation,
  RefreshCw,
  Truck,
  MapPin,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type VehicleStatus = "moving" | "idle" | "offline";

interface PlaceholderVehicle {
  id: string;
  registration: string;
  status: VehicleStatus;
  driver: string;
  speed: number;
  pickup: string;
  delivery: string;
  eta: string;
  lat: number;
  lng: number;
  /** Percentage-based overlay position on the iframe */
  overlayLeft: string;
  overlayTop: string;
}

const PLACEHOLDER_VEHICLES: PlaceholderVehicle[] = [
  {
    id: "v1",
    registration: "TMV-401",
    status: "moving",
    driver: "Chukwuemeka Obi",
    speed: 62,
    pickup: "Apapa Port, Lagos",
    delivery: "Ikeja Distribution Hub",
    eta: "18 min",
    lat: 6.449,
    lng: 3.374,
    overlayLeft: "35%",
    overlayTop: "45%",
  },
  {
    id: "v2",
    registration: "TMV-118",
    status: "moving",
    driver: "Adebayo Rauf",
    speed: 48,
    pickup: "Tin Can Island",
    delivery: "Ojota Market",
    eta: "32 min",
    lat: 6.537,
    lng: 3.358,
    overlayLeft: "55%",
    overlayTop: "35%",
  },
  {
    id: "v3",
    registration: "TMV-233",
    status: "idle",
    driver: "Fatima Usman",
    speed: 0,
    pickup: "Mile 2 Depot",
    delivery: "Surulere Yard",
    eta: "—",
    lat: 6.468,
    lng: 3.386,
    overlayLeft: "45%",
    overlayTop: "62%",
  },
  {
    id: "v4",
    registration: "TMV-509",
    status: "moving",
    driver: "Yusuf Lawal",
    speed: 71,
    pickup: "Ikorodu Terminal",
    delivery: "Lagos Island",
    eta: "41 min",
    lat: 6.612,
    lng: 3.509,
    overlayLeft: "67%",
    overlayTop: "28%",
  },
  {
    id: "v5",
    registration: "TMV-772",
    status: "idle",
    driver: "Ngozi Eze",
    speed: 0,
    pickup: "Ogba Warehouse",
    delivery: "Lekki Phase 1",
    eta: "—",
    lat: 6.543,
    lng: 3.345,
    overlayLeft: "30%",
    overlayTop: "68%",
  },
  {
    id: "v6",
    registration: "TMV-334",
    status: "offline",
    driver: "Bayo Adeleke",
    speed: 0,
    pickup: "—",
    delivery: "—",
    eta: "—",
    lat: 6.524,
    lng: 3.379,
    overlayLeft: "60%",
    overlayTop: "55%",
  },
];

const STATUS_COLORS: Record<VehicleStatus, string> = {
  moving: "bg-emerald-500",
  idle: "bg-amber-500",
  offline: "bg-muted-foreground",
};

const STATUS_LABEL_STYLES: Record<VehicleStatus, string> = {
  moving: "bg-emerald-50 text-emerald-700 border-emerald-200",
  idle: "bg-amber-50 text-amber-700 border-amber-200",
  offline: "bg-muted text-muted-foreground border-border",
};

const LAGOS_LAT = 6.5244;
const LAGOS_LNG = 3.3792;

const MAP_URL = `https://www.openstreetmap.org/export/embed.html?bbox=${LAGOS_LNG - 0.18}%2C${LAGOS_LAT - 0.12}%2C${LAGOS_LNG + 0.18}%2C${LAGOS_LAT + 0.12}&layer=mapnik`;

export default function Map() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const selectedVehicle = PLACEHOLDER_VEHICLES.find((v) => v.id === selectedId) ?? null;
  const activeCount = PLACEHOLDER_VEHICLES.filter((v) => v.status !== "offline").length;

  function handleRefresh() {
    setIsRefreshing(true);
    setLastRefreshed(new Date());
    setTimeout(() => setIsRefreshing(false), 900);
  }

  return (
    <section className="flex gap-4 h-[calc(100vh-9rem)]">
      {/* Left: vehicle list panel */}
      <div className="w-72 shrink-0 flex flex-col gap-3">
        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              Fleet ({PLACEHOLDER_VEHICLES.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full px-4 pb-4">
              <div className="space-y-2">
                {PLACEHOLDER_VEHICLES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedId(v.id === selectedId ? null : v.id)}
                    className={cn(
                      "w-full text-left rounded-lg border p-3 transition-all",
                      selectedId === v.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-2.5 w-2.5 rounded-full shrink-0",
                            STATUS_COLORS[v.status]
                          )}
                        />
                        <span className="font-semibold text-sm">{v.registration}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("text-xs capitalize", STATUS_LABEL_STYLES[v.status])}
                      >
                        {v.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{v.driver}</p>
                    {v.status !== "offline" && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        → {v.delivery}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right: map area */}
      <div className="flex-1 flex flex-col gap-0">
        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader className="border-b border-border py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Navigation className="h-4 w-4 text-primary" />
                Live Fleet Map
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Updated: {lastRefreshed.toLocaleTimeString()}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="ml-1"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 relative overflow-hidden">
            {/* OpenStreetMap iframe */}
            <iframe
              title="Live Fleet Map"
              src={MAP_URL}
              className="absolute inset-0 w-full h-full border-0"
              style={{ filter: "saturate(0.88) contrast(1.04)" }}
              loading="lazy"
            />

            {/* Pointer-events overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Vehicle markers */}
              {PLACEHOLDER_VEHICLES.filter((v) => v.status !== "offline").map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedId(v.id === selectedId ? null : v.id)}
                  className={cn(
                    "pointer-events-auto absolute transform -translate-x-1/2 -translate-y-1/2 z-10 group transition-all duration-150",
                    selectedId === v.id && "scale-125 z-20"
                  )}
                  style={{ left: v.overlayLeft, top: v.overlayTop }}
                >
                  <div
                    className={cn(
                      "relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-white shadow-lg transition-transform group-hover:scale-110",
                      STATUS_COLORS[v.status]
                    )}
                  >
                    <Truck className="h-4 w-4 text-white" />
                    {v.status === "moving" && (
                      <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background border border-border text-[9px] font-bold text-foreground shadow">
                        {v.speed}
                      </div>
                    )}
                  </div>
                  <div className="mt-0.5 whitespace-nowrap rounded bg-background/95 px-1.5 py-0.5 text-[10px] font-semibold shadow border border-border">
                    {v.registration}
                  </div>
                  {v.status === "moving" && (
                    <div
                      className={cn(
                        "absolute top-0 left-1/2 -translate-x-1/2 h-10 w-10 rounded-full animate-ping opacity-25",
                        STATUS_COLORS[v.status]
                      )}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Active vehicle count — top left */}
            <div className="absolute top-3 left-3 rounded-lg bg-background/95 backdrop-blur-sm border border-border px-3 py-1.5 z-20 shadow">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold">{activeCount} active vehicles</span>
              </div>
            </div>

            {/* Selected vehicle detail — bottom left */}
            {selectedVehicle && (
              <div className="absolute bottom-4 left-4 w-72 z-20">
                <Card className="bg-background/97 backdrop-blur-sm shadow-xl border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full shadow",
                            STATUS_COLORS[selectedVehicle.status]
                          )}
                        >
                          <Truck className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{selectedVehicle.registration}</p>
                          <p className="text-xs text-muted-foreground">{selectedVehicle.driver}</p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("capitalize text-xs", STATUS_LABEL_STYLES[selectedVehicle.status])}
                      >
                        {selectedVehicle.status === "moving"
                          ? `${selectedVehicle.speed} km/h`
                          : selectedVehicle.status}
                      </Badge>
                    </div>
                    <div className="space-y-1.5 text-xs border-t border-border pt-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pickup</span>
                        <span className="font-medium truncate max-w-[160px]">{selectedVehicle.pickup}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Delivery</span>
                        <span className="font-medium truncate max-w-[160px]">{selectedVehicle.delivery}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ETA</span>
                        <span className="font-medium">{selectedVehicle.eta}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Coordinates</span>
                        <span className="font-mono text-[10px]">
                          {selectedVehicle.lat.toFixed(4)}, {selectedVehicle.lng.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Legend — bottom right */}
            <div className="absolute bottom-4 right-4 rounded-lg bg-background/95 backdrop-blur-sm border border-border p-3 z-20 shadow">
              <p className="text-xs font-semibold mb-2">Vehicle Status</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs">Moving</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs">Idle</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />
                  <span className="text-xs">Offline</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
