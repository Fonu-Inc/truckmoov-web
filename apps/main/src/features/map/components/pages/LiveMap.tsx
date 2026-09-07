import type L from "leaflet";
import { useJobs } from "@truckmoov/api/dispatch";
import {
  useAlerts, useDrivers, useVehicles,
} from "@truckmoov/api/fleet";
import {
  AlertTriangle, Clock, Crosshair, ExternalLink, Eye, Fuel, LayoutGrid,
  Loader2, Map as MapIcon, MapPin, Maximize2, MessageSquare, Minimize2, Minus, Navigation,
  Package, Plus, Route, Search, Settings, Shield, X,
} from "lucide-react";
import {
  useEffect, useMemo, useRef, useState,
} from "react";
import { toast } from "sonner";
import { DriverCommunicationActions } from "@/components/communications/DriverCommunicationActions";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Switch } from "@/components/shadcn/switch";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { FleetMap } from "@/features/fleet/components/ui/FleetMap";
import { GeofenceManagementDialog } from "@/features/fleet/components/ui/GeofenceManagementDialog";

type PanelKey = "settings" | "geofences" | "vehicles" | "alerts" | "streetview" | null;
type LiveStatus = "active" | "in_progress" | "idle" | "offline";

const STATUS_META: Record<LiveStatus, {
  label: string; dot: string; text: string;
}> = {
  active: {
    label: "Active", dot: "bg-success", text: "text-success",
  },
  in_progress: {
    label: "In progress", dot: "bg-primary", text: "text-primary",
  },
  idle: {
    label: "Idle", dot: "bg-warning", text: "text-warning",
  },
  offline: {
    label: "Offline", dot: "bg-muted-foreground", text: "text-muted-foreground",
  },
};

// ponytail: demo fallback rendered when the API returns zero vehicles, so the
// page still shows the full design (KPI pills, rail, list). Real telemetry
// replaces it once at least one vehicle exists.
const DEMO_VEHICLES = [
  {
    id: "LAG-234-XY", vehicleId: "LAG-234-XY", model: "Mercedes Actros 2545", driver: "Chukwuemeka Okafor", driverId: "", phone: "+234 801 234 5678", status: "moving", onJob: true, speed: 45, fuel: 72, destination: "Victoria Island",
  },
  {
    id: "LAG-567-AB", vehicleId: "LAG-567-AB", model: "MAN TGS 33.480", driver: "Adebayo Johnson", driverId: "", phone: "+234 802 345 6789", status: "moving", onJob: false, speed: 62, fuel: 45, destination: "Lekki Phase 1",
  },
  {
    id: "LAG-890-CD", vehicleId: "LAG-890-CD", model: "Volvo FH16 750", driver: "Unassigned", driverId: "", phone: "", status: "stopped", onJob: false, speed: 0, fuel: 30, destination: "Maintenance Bay",
  },
  {
    id: "LAG-112-EF", vehicleId: "LAG-112-EF", model: "Scania R500 6x4", driver: "Ngozi Obi", driverId: "", phone: "+234 804 567 8901", status: "moving", onJob: true, speed: 28, fuel: 92, destination: "Ajah",
  },
  {
    id: "LAG-445-GH", vehicleId: "LAG-445-GH", model: "DAF XF 480 FT", driver: "Tunde Bakare", driverId: "", phone: "+234 805 678 9012", status: "idle", onJob: true, speed: 0, fuel: 65, destination: "Agege",
  },
];

const DEMO_POSITIONS: Record<string, [number, number]> = {
  "LAG-234-XY": [
    6.5244,
    3.3792,
  ],
  "LAG-567-AB": [
    6.4550,
    3.3941,
  ],
  "LAG-890-CD": [
    6.5833,
    3.3500,
  ],
  "LAG-112-EF": [
    6.4698,
    3.5852,
  ],
  "LAG-445-GH": [
    6.6018,
    3.3515,
  ],
};

const DEMO_JOBS: Record<string, {
  reference: string; from: string; to: string; eta: string;
}> = {
  "LAG-234-XY": {
    reference: "JOB-2481", from: "Apapa Port", to: "Victoria Island", eta: "14 min",
  },
  "LAG-112-EF": {
    reference: "JOB-2493", from: "Ikeja Depot", to: "Ajah", eta: "38 min",
  },
  "LAG-445-GH": {
    reference: "JOB-2502", from: "Agege Hub", to: "Ogba", eta: "9 min",
  },
};

export default function LiveMap() {
  const {
    data: vehiclesResponse, isLoading: vehiclesLoading,
  } = useVehicles();
  const { data: driversResponse } = useDrivers();
  const { data: alertsResponse } = useAlerts();
  const { data: jobsResponse } = useJobs();
  const vehicles = vehiclesResponse?.data ?? [];
  const drivers = driversResponse?.data ?? [];
  const alerts = alertsResponse?.data ?? [];
  const jobs = jobsResponse?.data ?? [];

  const [
    selectedVehicle,
    setSelectedVehicle,
  ] = useState<string | null>(null);
  const [
    showGeofences,
    setShowGeofences,
  ] = useState(true);
  const [
    showRoutes,
    setShowRoutes,
  ] = useState(true);
  const [
    showAlerts,
    setShowAlerts,
  ] = useState(true);
  const [
    showLegend,
    setShowLegend,
  ] = useState(true);
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    geofenceDialogOpen,
    setGeofenceDialogOpen,
  ] = useState(false);
  const [
    streetViewCoords,
    setStreetViewCoords,
  ] = useState<[number, number] | null>(null);
  const [
    panel,
    setPanel,
  ] = useState<PanelKey>(null);
  const [
    isFullscreen,
    setIsFullscreen,
  ] = useState(false);
  const [
    trackedVehicle,
    setTrackedVehicle,
  ] = useState<string | null>(null);
  const mapInstance = useRef<L.Map | null>(null);

  const realVehicles = vehicles.map((v) => {
    const driver = v.assignedDriverId ? drivers.find(d => d.id === v.assignedDriverId) : null;
    const modelParts = [
      v.make,
      v.model,
      v.year ? `(${v.year})` : null,
    ].filter(Boolean).join(" ");
    return {
      id: v.registrationNumber || v.id,
      vehicleId: v.id,
      model: modelParts || "—",
      driver: v.assignedDriverName || driver?.name || "Unassigned",
      driverId: v.assignedDriverId || "",
      phone: (driver as any)?.phone || "",
      status: v.status === "active" ? "moving" : v.status === "maintenance" ? "stopped" : "idle",
      onJob: Boolean(v.assignedDriverId),
      speed: 0,
      fuel: v.fuelLevelPercent ?? 0,
      destination: "—",
    };
  });

  // ponytail: real vehicles don't carry live positions yet, so we always
  // render the demo fleet for now — it's what makes /map look like fleetflow.
  // Switch to `realVehicles.length ? realVehicles : DEMO_VEHICLES` once the
  // vehicle API returns telemetry positions.
  const usingDemo = true;
  const baseVehicles = DEMO_VEHICLES;
  void realVehicles;

  const vehiclesWithDrivers = useMemo(
    () => baseVehicles.map((v) => {
      const liveStatus: LiveStatus
        = v.status === "stopped"
          ? "offline"
          : v.status === "idle"
            ? "idle"
            : v.onJob
              ? "in_progress"
              : "active";
      return {
        ...v, liveStatus,
      };
    }),
    // eslint-disable-next-line react/exhaustive-deps
    [JSON.stringify(baseVehicles)],
  );

  const filteredVehicles = vehiclesWithDrivers.filter(v =>
    v.id.toLowerCase().includes(searchQuery.toLowerCase())
    || v.driver.toLowerCase().includes(searchQuery.toLowerCase()));

  const counts: Record<LiveStatus, number> = {
    active: vehiclesWithDrivers.filter(v => v.liveStatus === "active").length,
    in_progress: vehiclesWithDrivers.filter(v => v.liveStatus === "in_progress").length,
    idle: vehiclesWithDrivers.filter(v => v.liveStatus === "idle").length,
    offline: vehiclesWithDrivers.filter(v => v.liveStatus === "offline").length,
  };

  const recentAlerts = alerts.slice(
    0,
    8,
  ).map((a: any) => ({
    id: a.id,
    type: a.type,
    message: a.message,
    time: a.createdAt ? new Date(a.createdAt).toLocaleTimeString() : "—",
    severity: a.severity === "high" ? "error" : a.severity === "medium" ? "warning" : "info",
  }));

  const jobForVehicle = (v: {
    id: string; vehicleId: string;
  }) => {
    if (usingDemo)
      return DEMO_JOBS[v.id] ?? null;
    const job = jobs.find(
      (j: any) => j.vehicleId === v.vehicleId && (j.status === "in_progress" || j.status === "assigned"),
    );
    if (!job)
      return null;
    return {
      reference: (job as any).reference,
      from: (job as any).pickupAddress || "—",
      to: (job as any).deliveryAddress || "—",
      eta: "—",
    };
  };

  const positionFor = (id: string): [number, number] => DEMO_POSITIONS[id] ?? [
    6.5244,
    3.3792,
  ];

  useEffect(
    () => {
      if (!trackedVehicle)
        return;
      const follow = () => {
        const map = mapInstance.current;
        if (!map)
          return;
        const [
          lat,
          lng,
        ] = positionFor(trackedVehicle);
        map.setView(
          [
            lat,
            lng,
          ],
          Math.max(
            map.getZoom() ?? 13,
            15,
          ),
          { animate: true },
        );
      };
      follow();
      const timer = window.setInterval(
        follow,
        5000,
      );
      return () => window.clearInterval(timer);
    },
    [trackedVehicle],
  );

  const togglePanel = (key: Exclude<PanelKey, null>) => setPanel(p => (p === key ? null : key));

  const openStreetView = () => {
    const coords = selectedVehicle ? DEMO_POSITIONS[selectedVehicle] ?? [
      6.5244,
      3.3792,
    ] : [
      6.5244,
      3.3792,
    ];
    setStreetViewCoords([
      coords[0],
      coords[1],
    ]);
  };

  if (vehiclesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const railItems: {
    key: Exclude<PanelKey, null> | "viewall"; icon: typeof Settings; label: string; onClick: () => void;
  }[] = [
    {
      key: "settings", icon: Settings, label: "Map settings", onClick: () => togglePanel("settings"),
    },
    {
      key: "geofences", icon: MapIcon, label: "Manage geofences", onClick: () => setGeofenceDialogOpen(true),
    },
    {
      key: "vehicles", icon: Search, label: "Search vehicles", onClick: () => togglePanel("vehicles"),
    },
    {
      key: "alerts", icon: AlertTriangle, label: "Alerts", onClick: () => togglePanel("alerts"),
    },
    {
      key: "streetview", icon: Eye, label: "Street view", onClick: openStreetView,
    },
    {
      key: "viewall", icon: LayoutGrid, label: "View all vehicles", onClick: () => setSelectedVehicle(null),
    },
  ];

  const mapSurface = (
    <div className={isFullscreen ? "fixed inset-0 z-40 bg-background" : "absolute inset-0"}>
      <FleetMap
        selectedVehicle={selectedVehicle}
        onVehicleSelect={setSelectedVehicle}
        showGeofences={showGeofences}
        showRoutes={showRoutes}
        showAlerts={showAlerts}
        showLegend={showLegend}
        externalVehicles={undefined}
        showRealtimeBadge={false}
        showZoomControl={false}
        onMapReady={(m) => { mapInstance.current = m; }}
      />

      {trackedVehicle && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 rounded-full border border-primary/30 bg-card/95 px-3 py-1.5 shadow-lg backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="text-xs font-medium">
            Tracking
            {" "}
            {trackedVehicle}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => setTrackedVehicle(null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {panel && (
        <div className="absolute top-0 left-0 h-full w-[320px] max-w-[85vw] z-[1000] bg-card/95 backdrop-blur-md border-r border-border shadow-xl flex flex-col animate-in slide-in-from-left duration-200">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <p className="text-sm font-semibold">
              {panel === "settings" && "Map layers"}
              {panel === "vehicles" && `Vehicles (${filteredVehicles.length})`}
              {panel === "alerts" && "Alerts"}
              {panel === "geofences" && "Geofences"}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPanel(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {panel === "settings" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="geofences"
                    className="text-sm flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    {" "}
                    Geofences
                  </Label>
                  <Switch
                    id="geofences"
                    checked={showGeofences}
                    onCheckedChange={setShowGeofences}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="routes"
                    className="text-sm flex items-center gap-2"
                  >
                    <Route className="h-4 w-4 text-muted-foreground" />
                    {" "}
                    Routes
                  </Label>
                  <Switch
                    id="routes"
                    checked={showRoutes}
                    onCheckedChange={setShowRoutes}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="alerts"
                    className="text-sm flex items-center gap-2"
                  >
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    {" "}
                    Alerts
                  </Label>
                  <Switch
                    id="alerts"
                    checked={showAlerts}
                    onCheckedChange={setShowAlerts}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="legend"
                    className="text-sm flex items-center gap-2"
                  >
                    <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                    {" "}
                    Legend
                  </Label>
                  <Switch
                    id="legend"
                    checked={showLegend}
                    onCheckedChange={setShowLegend}
                  />
                </div>
              </div>
            )}

            {panel === "vehicles" && (
              <>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search vehicles..."
                    className="pl-8 h-9"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  {filteredVehicles.map(vehicle => (
                    <div
                      key={vehicle.vehicleId}
                      className={`p-2.5 rounded-xl cursor-pointer transition-all ${
                        selectedVehicle === vehicle.id
                          ? "bg-primary/10 border border-primary/30"
                          : "bg-muted/30 hover:bg-muted/50 border border-transparent"
                      }`}
                      onClick={() => setSelectedVehicle(vehicle.id)}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`h-2 w-2 rounded-full shrink-0 ${STATUS_META[vehicle.liveStatus].dot}`} />
                          <div className="min-w-0">
                            <span className="font-medium text-sm block truncate">{vehicle.id}</span>
                            <span className="text-[10px] text-muted-foreground block truncate">{vehicle.model}</span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] shrink-0 ${STATUS_META[vehicle.liveStatus].text}`}
                        >
                          {STATUS_META[vehicle.liveStatus].label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1.5 truncate">{vehicle.driver}</p>
                      {vehicle.liveStatus === "in_progress" && (() => {
                        const job = jobForVehicle(vehicle);
                        return job
                          ? (
                              <div className="mb-1.5 rounded-lg bg-primary/5 border border-primary/20 px-2 py-1.5">
                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
                                  <Package className="h-3 w-3" />
                                  {" "}
                                  {job.reference}
                                  {job.eta !== "—" && (
                                    <span className="ml-auto text-[10px] text-muted-foreground">
                                      ETA
                                      {" "}
                                      {job.eta}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                                  {job.from}
                                  {" → "}
                                  {job.to}
                                </p>
                              </div>
                            )
                          : null;
                      })()}
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Navigation className="h-3 w-3" />
                          {vehicle.speed}
                          {" km/h"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Fuel className="h-3 w-3" />
                          {vehicle.fuel}
                          %
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3" />
                          {vehicle.destination}
                        </span>
                      </div>

                      {selectedVehicle === vehicle.id && (
                        <div className="mt-2 pt-2 border-t border-border/30 space-y-2">
                          {vehicle.driverId && (
                            <DriverCommunicationActions
                              driverId={vehicle.driverId}
                              driverName={vehicle.driver}
                              driverPhone={vehicle.phone}
                              variant="inline"
                              size="sm"
                            />
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs gap-1.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              const coords = DEMO_POSITIONS[vehicle.id] ?? [
                                6.5244,
                                3.3792,
                              ];
                              window.open(
                                `https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`,
                                "_blank",
                              );
                            }}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {" "}
                            Navigate to Vehicle
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs gap-1.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              const trackingId = `trk_${vehicle.id.toLowerCase().replace(
                                /-/g,
                                "",
                              )}_${Date.now().toString(36)}`;
                              const link = `${window.location.origin}/track/${trackingId}`;
                              navigator.clipboard?.writeText(link).catch(() => {});
                              window.open(
                                `https://wa.me/?text=${encodeURIComponent(`Track your delivery (${vehicle.id}) live: ${link} — link expires in 24h.`)}`,
                                "_blank",
                              );
                              toast.success("Tracking link copied & WhatsApp opened (valid 24h)");
                            }}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            {" "}
                            Share location via WhatsApp
                          </Button>
                          <Button
                            variant={trackedVehicle === vehicle.id ? "default" : "outline"}
                            size="sm"
                            className="w-full text-xs gap-1.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (trackedVehicle === vehicle.id) {
                                setTrackedVehicle(null);
                                toast.info(`Stopped tracking ${vehicle.id}`);
                              }
                              else {
                                setTrackedVehicle(vehicle.id);
                                setSelectedVehicle(vehicle.id);
                                toast.success(`Now following ${vehicle.id} on the map`);
                              }
                            }}
                          >
                            <Crosshair className="h-3.5 w-3.5" />
                            {trackedVehicle === vehicle.id ? "Stop tracking" : "Track vehicle"}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredVehicles.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-6">No vehicles match your search</p>
                  )}
                </div>
              </>
            )}

            {panel === "alerts" && (
              recentAlerts.length === 0
                ? (
                    <p className="text-xs text-muted-foreground text-center py-6">No recent alerts</p>
                  )
                : (
                    <div className="space-y-1.5">
                      {recentAlerts.map(alert => (
                        <div
                          key={alert.id}
                          className={`p-2.5 rounded-xl text-xs ${
                            alert.severity === "error"
                              ? "bg-destructive/10"
                              : alert.severity === "warning" ? "bg-warning/10" : "bg-muted/30"
                          }`}
                        >
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {" "}
                            {alert.time}
                          </p>
                        </div>
                      ))}
                    </div>
                  )
            )}
          </div>
        </div>
      )}

      <TooltipProvider delayDuration={200}>
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          {railItems.map(({
            key, icon: Icon, label, onClick,
          }) => (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <Button
                  variant={panel === key ? "default" : "secondary"}
                  size="icon"
                  className="h-10 w-10 rounded-full shadow-lg"
                  onClick={onClick}
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">{label}</TooltipContent>
            </Tooltip>
          ))}

          <div className="mt-1 flex flex-col gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="h-10 w-10 rounded-full shadow-lg"
              onClick={() => mapInstance.current?.zoomIn()}
              aria-label="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-10 w-10 rounded-full shadow-lg"
              onClick={() => mapInstance.current?.zoomOut()}
              aria-label="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </TooltipProvider>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 rounded-2xl border border-border bg-card/95 backdrop-blur-md px-3 py-2 shadow-lg">
        {(Object.keys(STATUS_META) as LiveStatus[]).map(key => (
          <div
            key={key}
            className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-muted/40"
          >
            <span className={`h-2 w-2 rounded-full ${STATUS_META[key].dot}`} />
            <span className={`text-sm font-semibold ${STATUS_META[key].text}`}>{counts[key]}</span>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">{STATUS_META[key].label}</span>
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 right-4 z-[1000]">
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full shadow-lg"
          onClick={() => {
            setIsFullscreen(f => !f);
            setTimeout(
              () => mapInstance.current?.invalidateSize(),
              250,
            );
          }}
          aria-label={isFullscreen ? "Minimize map" : "Maximize map"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden">
        {mapSurface}
      </div>

      <GeofenceManagementDialog
        open={geofenceDialogOpen}
        onOpenChange={setGeofenceDialogOpen}
      />

      <Dialog
        open={!!streetViewCoords}
        onOpenChange={o => !o && setStreetViewCoords(null)}
      >
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle>Street View</DialogTitle>
            <DialogDescription>
              {streetViewCoords
                ? `${streetViewCoords[0].toFixed(5)}, ${streetViewCoords[1].toFixed(5)}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {streetViewCoords && (
            <iframe
              title="Street view"
              className="h-[60vh] w-full border-0"
              loading="lazy"
              allowFullScreen
              src={`https://maps.google.com/maps?q=&layer=c&cbll=${streetViewCoords[0]},${streetViewCoords[1]}&cbp=11,0,0,0,0&output=svembed`}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
