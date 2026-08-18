import type { MouseEvent as ReactMouseEvent } from "react";
import type {
  FleetMapVehicle, HarshEvent,
} from "@/components/fleet/FleetMap";
import { formatTime } from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle, Briefcase, Clock, Fuel, History,
  Loader2, LogIn, LogOut, MapPin, Maximize2,
  Navigation, Plus, RefreshCw, Search, Send, Shield, Truck, User, X,
} from "lucide-react";
import {
  useEffect, useMemo, useRef, useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DriverCommunicationActions } from "@/components/communications/DriverCommunicationActions";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FleetMap } from "@/components/fleet/FleetMap";
import { GeofenceManagementDialog } from "@/components/fleet/GeofenceManagementDialog";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { JobFormDialog } from "@/components/jobs/JobFormDialog";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Separator } from "@/components/shadcn/separator";
import { cn } from "@/lib/utils";

type VehicleStatusKey = "moving" | "idle" | "stopped" | "offline";

const STATUS_CHIPS: {
  key: VehicleStatusKey | "all"; label: string;
}[] = [
  {
    key: "all", label: "All",
  },
  {
    key: "moving", label: "Moving",
  },
  {
    key: "idle", label: "Idle",
  },
  {
    key: "stopped", label: "Stopped",
  },
  {
    key: "offline", label: "Offline",
  },
];

const FILTER_STORAGE_KEY = "supervisor.liveMap.statusFilters";

export default function SupervisorLiveMap() {
  const navigate = useNavigate();
  const vehicles: any[] = [];
  const vehiclesLoading = false;
  const refetchVehicles = async (...args: any[]) => {};
  const drivers: any[] = [];
  const alerts: any[] = [];
  const jobs: any[] = [];
  const addJob = async (...args: any[]) => false;
  const geofenceEvents: any[] = [];
  const geofenceStats = {
    entries: 0, exits: 0,
  };

  const [
    selectedVehicleIds,
    setSelectedVehicleIds,
  ] = useState<string[]>([]);
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    registrationJump,
    setRegistrationJump,
  ] = useState("");
  const [
    geofenceDialogOpen,
    setGeofenceDialogOpen,
  ] = useState(false);
  const [
    statusFilters,
    setStatusFilters,
  ] = useState<VehicleStatusKey[]>(() => {
    if (typeof window === "undefined")
      return [];
    try {
      const raw = sessionStorage.getItem(FILTER_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    }
    catch {
      return [];
    }
  });
  const vehicleListRef = useRef<HTMLDivElement | null>(null);

  // Persist status filters across navigations during the same session
  useEffect(
    () => {
      try {
        sessionStorage.setItem(
          FILTER_STORAGE_KEY,
          JSON.stringify(statusFilters),
        );
      }
      catch {
      /* noop */
      }
    },
    [statusFilters],
  );

  // Map vehicles with driver info + derived address/last ping
  const vehiclesWithDrivers = useMemo(
    () => vehicles.map((v) => {
      const driver = v.currentDriverId ? drivers.find(d => d.id === v.currentDriverId) : null;
      const status: VehicleStatusKey
        = v.status === "active"
          ? "moving"
          : v.status === "maintenance"
            ? "stopped"
            : v.status === "inactive"
              ? "offline"
              : "idle";
      const activeJob = jobs.find(j => j.assignedVehicleId === v.id && j.status !== "completed" && j.status !== "cancelled");
      return {
        id: v.registrationNumber || v.id,
        vehicleId: v.id,
        registration: v.registrationNumber || v.id,
        driver: driver?.name || "Unassigned",
        driverId: driver?.id || "",
        phone: driver?.phone || "",
        status,
        speed: 0,
        fuel: v.fuelLevel ?? null,
        destination: "—",
        address: "Lagos, Nigeria",
        lastPing: new Date().toISOString(),
        activeJob: activeJob
          ? {
              id: activeJob.id,
              reference: (activeJob as any).reference || activeJob.id.slice(
                0,
                8,
              ),
              status: activeJob.status,
            }
          : null,
      };
    }),
    [
      vehicles,
      drivers,
      jobs,
    ],
  );

  // Status filter (no chip selected = show all)
  const statusFiltered = useMemo(
    () => {
      if (statusFilters.length === 0)
        return vehiclesWithDrivers;
      return vehiclesWithDrivers.filter(v => statusFilters.includes(v.status));
    },
    [
      vehiclesWithDrivers,
      statusFilters,
    ],
  );

  // Sidebar list search
  const filteredVehicles = useMemo(
    () => statusFiltered.filter(v =>
      v.id.toLowerCase().includes(searchQuery.toLowerCase())
      || v.driver.toLowerCase().includes(searchQuery.toLowerCase())),
    [
      statusFiltered,
      searchQuery,
    ],
  );

  // Build FleetMapVehicle[] for the map (post-filter)
  const mapVehicles: FleetMapVehicle[] = useMemo(
    () => statusFiltered.map(v => ({
      id: v.id,
      driver: v.driver,
      phone: v.phone,
      position: [
        6.5244,
        3.3792,
      ] as [number, number],
      heading: 0,
      speed: v.speed,
      status: v.status === "offline" ? "stopped" : v.status,
      fuel: v.fuel ?? 0,
      lastUpdate: "—",
      route: [],
      startLocation: "—",
      destination: v.destination,
      eta: "—",
      networkStatus: v.status === "offline" ? "offline" as const : "online" as const,
      batteryVoltage: null,
      signalStrength: null,
    })),
    [statusFiltered],
  );

  const counts = useMemo(
    () => ({
      moving: vehiclesWithDrivers.filter(v => v.status === "moving").length,
      idle: vehiclesWithDrivers.filter(v => v.status === "idle").length,
      stopped: vehiclesWithDrivers.filter(v => v.status === "stopped").length,
      offline: vehiclesWithDrivers.filter(v => v.status === "offline").length,
    }),
    [vehiclesWithDrivers],
  );

  const toggleStatusFilter = (key: VehicleStatusKey | "all") => {
    if (key === "all") {
      setStatusFilters([]);
      return;
    }
    setStatusFilters(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [
            ...prev,
            key,
          ]);
  };

  // Multi-select with Shift; click = single select; Shift+click = toggle in selection
  const handleVehicleClick = (
    vehicleListId: string,
    e?: ReactMouseEvent<HTMLDivElement> | { shiftKey?: boolean },
  ) => {
    const shift = !!e?.shiftKey;
    setSelectedVehicleIds((prev) => {
      if (shift) {
        return prev.includes(vehicleListId)
          ? prev.filter(id => id !== vehicleListId)
          : [
              ...prev,
              vehicleListId,
            ];
      }
      // single select; clicking the only selected one keeps it selected (panel stays open)
      return [vehicleListId];
    });
  };

  const handleMapVehicleSelect = (id: string | null) => {
    if (!id) {
      setSelectedVehicleIds([]);
      return;
    }
    handleVehicleClick(id);
  };

  const handleRegistrationJump = (e: React.FormEvent) => {
    e.preventDefault();
    const q = registrationJump.trim().toLowerCase();
    if (!q)
      return;
    const match = vehiclesWithDrivers.find(v =>
      v.registration.toLowerCase() === q || v.registration.toLowerCase().includes(q));
    if (match) {
      setSelectedVehicleIds([match.id]);
      // ensure visible in list
      setSearchQuery("");
    }
  };

  const closePanel = () => setSelectedVehicleIds([]);

  const selectedVehicles = useMemo(
    () => vehiclesWithDrivers.filter(v => selectedVehicleIds.includes(v.id)),
    [
      vehiclesWithDrivers,
      selectedVehicleIds,
    ],
  );

  const [
    isJobFormOpen,
    setIsJobFormOpen,
  ] = useState(false);
  const [
    jobFormPrefillVehicle,
    setJobFormPrefillVehicle,
  ] = useState<string | null>(null);

  const handleCreateJobForVehicle = (vehicleReg: string) => {
    setJobFormPrefillVehicle(vehicleReg);
    setIsJobFormOpen(true);
  };

  const handleJobSubmit = async (data: any) => {
    const success = await addJob({
      reference: data.reference,
      pickupAddress: data.pickupAddress,
      pickupLat: data.pickupLat,
      pickupLng: data.pickupLng,
      deliveryAddress: data.deliveryAddress,
      deliveryLat: data.deliveryLat,
      deliveryLng: data.deliveryLng,
      cargoType: data.cargoType,
      cargoWeight: data.cargoWeight,
      cargoDescription: data.cargoDescription,
      amountNgn: data.amount,
      deadline: data.deadline,
    });
    if (success) {
      setIsJobFormOpen(false);
      setJobFormPrefillVehicle(null);
    }
  };

  const handleShareLocationViaWhatsApp = (v: typeof vehiclesWithDrivers[number]) => {
    if (!v.phone) {
      toast.error("Driver has no phone number on file");
      return;
    }
    const lat = 6.5244;
    const lng = 3.3792;
    const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
    const text = encodeURIComponent(
      `Vehicle ${v.registration} (${v.driver}) — current location: ${v.address}\n${mapsUrl}`,
    );
    const phone = v.phone.replace(
      /\D/g,
      "",
    );
    window.open(
      `https://wa.me/${phone}?text=${text}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  // Build harsh-event pins from recent severe alerts (past 1 hour)
  const harshEvents: HarshEvent[] = useMemo(
    () => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const HARSH_TYPES = new Set([
        "harsh_braking",
        "harsh_acceleration",
        "harsh_cornering",
        "speeding",
      ]);
      return (alerts || [])
        .filter((a: any) => {
          const t = new Date(a.createdAt || a.created_at || a.timestamp || Date.now()).getTime();
          return t >= oneHourAgo;
        })
        .filter((a: any) => HARSH_TYPES.has(String(a.type || a.alertType || "").toLowerCase()) || /harsh/i.test(a.title || a.message || ""))
        .slice(
          0,
          25,
        )
        .map((a: any, idx: number): HarshEvent => {
          const sev = String(a.severity || "").toLowerCase();
          const severity: HarshEvent["severity"]
            = sev === "high" || sev === "critical" || sev === "severe"
              ? "severe"
              : sev === "medium" || sev === "moderate" ? "moderate" : "minor";
          const vehicleId = a.vehicleId || a.vehicle_id || "";
          const veh = vehiclesWithDrivers.find(v => v.vehicleId === vehicleId);
          // Spread mock pins around Lagos so they're visible during demo
          const baseLat = 6.5244; const baseLng = 3.3792;
          const pos: [number, number] = [
            baseLat + (Math.sin(idx) * 0.02),
            baseLng + (Math.cos(idx) * 0.02),
          ];
          const rawType = String(a.type || a.alertType || a.title || "Harsh event").replace(
            /_/g,
            " ",
          );
          return {
            id: String(a.id || idx),
            vehicleId,
            vehicleRegistration: veh?.registration || vehicleId || "—",
            driverName: veh?.driver || "—",
            eventType: rawType.replace(
              /\b\w/g,
              c => c.toUpperCase(),
            ),
            severity,
            speedKph: Number(a.speedKph || a.speed || 0),
            timestamp: a.createdAt || a.created_at || a.timestamp || new Date().toISOString(),
            position: pos,
            roadName: a.roadName || a.address || "Lagos, Nigeria",
          };
        });
    },
    [
      alerts,
      vehiclesWithDrivers,
    ],
  );

  const handleHarshEventPlayback = (event: HarshEvent) => {
    if (event.vehicleId) {
      navigate(`/admin/fleet/${event.vehicleId}/history?playbackFrom=${encodeURIComponent(event.timestamp)}&offsetMinutes=-2`);
    }
    else {
      toast.message(`Route playback for ${event.vehicleRegistration} from 2 minutes before event`);
    }
  };

  if (vehiclesLoading) {
    return (
      <DashboardLayout
        title="Live Map"
        subtitle="Real-time fleet tracking"
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (vehicles.length === 0) {
    return (
      <DashboardLayout
        title="Live Map"
        subtitle="Real-time fleet tracking"
      >
        <EmptyState
          icon={Truck}
          title="No vehicles to track"
          description="Add vehicles to your fleet to see them on the live map"
          actionLabel="View Fleet"
          actionHref="/admin/fleet"
        />
      </DashboardLayout>
    );
  }

  const filterCount = statusFilters.length === 0 ? vehiclesWithDrivers.length : statusFiltered.length;

  return (
    <DashboardLayout
      title="Live Map"
      subtitle="Real-time fleet tracking and monitoring"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-12rem)]">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4 flex flex-col">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="border-success/30 bg-success/5">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-success">{counts.moving}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-warning">{counts.idle}</p>
                <p className="text-xs text-muted-foreground">Idle</p>
              </CardContent>
            </Card>
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-destructive">{counts.stopped}</p>
                <p className="text-xs text-muted-foreground">Stopped</p>
              </CardContent>
            </Card>
          </div>

          {/* Geofence Activity */}
          <Card className="border-border/50">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Geofence Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center gap-2 p-2 bg-success/10 rounded">
                  <LogIn className="h-3 w-3 text-success" />
                  <span className="text-xs">
                    {geofenceStats.entries}
                    {" "}
                    entries
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-warning/10 rounded">
                  <LogOut className="h-3 w-3 text-warning" />
                  <span className="text-xs">
                    {geofenceStats.exits}
                    {" "}
                    exits
                  </span>
                </div>
              </div>
              <div className="space-y-2 max-h-24 overflow-y-auto">
                {geofenceEvents.slice(
                  0,
                  3,
                ).map(event => (
                  <div
                    key={event.id}
                    className="flex items-center gap-2 text-xs"
                  >
                    {event.event_type === "ENTER"
                      ? (
                          <LogIn className="h-3 w-3 text-success flex-shrink-0" />
                        )
                      : (
                          <LogOut className="h-3 w-3 text-warning flex-shrink-0" />
                        )}
                    <span className="truncate flex-1">
                      {(event.geofence as any)?.name || "Unknown zone"}
                    </span>
                    <span className="text-muted-foreground flex-shrink-0">
                      {formatTime(event.occurred_at)}
                    </span>
                  </div>
                ))}
                {geofenceEvents.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No recent geofence activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vehicle List */}
          <Card className="border-border/50 flex-1 flex flex-col min-h-0">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Vehicles (
                  {filteredVehicles.length}
                  )
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => refetchVehicles()}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vehicles..."
                  className="pl-8 h-8"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Tip: hold
                {" "}
                <kbd className="px-1 py-px rounded bg-muted">Shift</kbd>
                {" "}
                + click to select multiple
              </p>
            </CardHeader>
            <CardContent className="p-2 pt-0 flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div
                  className="space-y-1.5 pr-2"
                  ref={vehicleListRef}
                >
                  {filteredVehicles.map((vehicle) => {
                    const isSelected = selectedVehicleIds.includes(vehicle.id);
                    return (
                      <div
                        key={vehicle.vehicleId}
                        className={cn(
                          "p-2.5 rounded-lg cursor-pointer transition-all",
                          isSelected
                            ? "bg-primary/10 border border-primary/30"
                            : "bg-muted/30 hover:bg-muted/50 border border-transparent",
                        )}
                        onClick={e => handleVehicleClick(
                          vehicle.id,
                          e,
                        )}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "h-2 w-2 rounded-full",
                              vehicle.status === "moving"
                                ? "bg-success"
                                : vehicle.status === "idle"
                                  ? "bg-warning"
                                  : vehicle.status === "offline"
                                    ? "bg-muted-foreground"
                                    : "bg-destructive",
                            )}
                            />
                            <span className="font-medium text-sm">{vehicle.id}</span>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] capitalize",
                              vehicle.status === "moving"
                                ? "border-success/50 text-success"
                                : vehicle.status === "idle"
                                  ? "border-warning/50 text-warning"
                                  : vehicle.status === "offline"
                                    ? "border-muted-foreground/50 text-muted-foreground"
                                    : "border-destructive/50 text-destructive",
                            )}
                          >
                            {vehicle.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1.5">{vehicle.driver}</p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Navigation className="h-3 w-3" />
                            {vehicle.speed}
                            {" "}
                            km/h
                          </span>
                          <span className="flex items-center gap-1">
                            <Fuel className="h-3 w-3" />
                            {vehicle.fuel ?? "—"}
                            {vehicle.fuel != null ? "%" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {vehicle.destination}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card className="border-border/50">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              {alerts.length === 0
                ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No recent alerts</p>
                  )
                : (
                    <div className="space-y-1.5">
                      {alerts.slice(
                        0,
                        3,
                      ).map(alert => (
                        <div
                          key={alert.id}
                          className={cn(
                            "p-2 rounded-lg text-xs",
                            alert.severity === "high"
                              ? "bg-destructive/10"
                              : alert.severity === "medium"
                                ? "bg-warning/10"
                                : "bg-muted/30",
                          )}
                        >
                          <p className="font-medium line-clamp-1">{alert.message}</p>
                          <p className="text-muted-foreground mt-0.5">
                            {formatTime(alert.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <div
          className="lg:col-span-3 relative"
          onClick={(e) => {
          // Click on the map background (not on the panel/toolbar) closes panel
            if ((e.target as HTMLElement).closest("[data-vehicle-panel]"))
              return;
            if ((e.target as HTMLElement).closest("[data-map-toolbar]"))
              return;
            if (selectedVehicleIds.length > 0)
              closePanel();
          }}
        >
          <Card className="h-full border-border/50">
            <CardContent className="p-0 h-full">
              <FleetMap
                selectedVehicle={selectedVehicleIds[selectedVehicleIds.length - 1] ?? null}
                onVehicleSelect={handleMapVehicleSelect}
                showGeofences={true}
                showRoutes={false}
                showAlerts={true}
                externalVehicles={mapVehicles}
                harshEvents={harshEvents}
                onHarshEventPlayback={handleHarshEventPlayback}
              />
            </CardContent>
          </Card>

          {/* Map Toolbar: status chips + reg search + actions */}
          <div
            data-map-toolbar
            className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap items-center gap-2"
          >
            <div className="flex flex-wrap gap-1.5 bg-card/95 backdrop-blur shadow-lg rounded-md p-1.5 border border-border/50">
              {STATUS_CHIPS.map((chip) => {
                const active = chip.key === "all"
                  ? statusFilters.length === 0
                  : statusFilters.includes(chip.key);
                const count = chip.key === "all"
                  ? vehiclesWithDrivers.length
                  : counts[chip.key];
                return (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => toggleStatusFilter(chip.key)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background/50 text-muted-foreground border-border/50 hover:bg-muted",
                    )}
                  >
                    {chip.label}
                    {" "}
                    <span className="opacity-70 ml-1">{count}</span>
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={handleRegistrationJump}
              className="flex-1 min-w-[180px] max-w-xs"
            >
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={registrationJump}
                  onChange={e => setRegistrationJump(e.target.value)}
                  placeholder="Jump to registration #..."
                  className="pl-8 h-9 bg-card/95 backdrop-blur shadow-lg border-border/50"
                />
              </div>
            </form>

            <div className="ml-auto flex gap-2">
              {selectedVehicleIds.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="shadow-lg"
                  onClick={closePanel}
                >
                  <Maximize2 className="h-4 w-4 mr-2" />
                  View All
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="shadow-lg"
                onClick={() => setGeofenceDialogOpen(true)}
              >
                <Shield className="h-4 w-4 mr-2" />
                Geofences
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="shadow-lg"
                onClick={() => refetchVehicles()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Showing count */}
          <div className="absolute bottom-4 left-4 z-[1000]">
            <Badge
              variant="secondary"
              className="shadow-lg"
            >
              Showing
              {" "}
              {filterCount}
              {" "}
              of
              {" "}
              {vehiclesWithDrivers.length}
              {" "}
              vehicles
            </Badge>
          </div>

          {/* Vehicle Detail Side Panel (overlay on map) */}
          {selectedVehicles.length > 0 && (
            <div
              data-vehicle-panel
              className="absolute top-20 right-4 z-[1001] w-[360px] max-h-[calc(100%-6rem)] flex flex-col"
            >
              <Card className="shadow-2xl border-border/60 flex flex-col max-h-full">
                <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">
                      {selectedVehicles.length === 1
                        ? "Vehicle Details"
                        : `Comparing ${selectedVehicles.length} vehicles`}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedVehicles.length > 1 ? "Shift+click to add or remove" : "Click elsewhere to dismiss"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={closePanel}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0 flex-1 min-h-0">
                  <ScrollArea className="h-full max-h-[60vh]">
                    <div className="p-4 pt-0 space-y-3">
                      {selectedVehicles.map((v, idx) => (
                        <div
                          key={v.id}
                          className="space-y-3"
                        >
                          {idx > 0 && <Separator />}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4 text-primary" />
                              <span className="font-semibold">{v.registration}</span>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "capitalize text-[10px]",
                                v.status === "moving"
                                  ? "border-success/50 text-success"
                                  : v.status === "idle"
                                    ? "border-warning/50 text-warning"
                                    : v.status === "offline"
                                      ? "border-muted-foreground/50 text-muted-foreground"
                                      : "border-destructive/50 text-destructive",
                              )}
                            >
                              {v.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="truncate">{v.driver}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>
                                {v.speed}
                                {" "}
                                km/h
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Fuel className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{v.fuel != null ? `${v.fuel}%` : "No sensor"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{formatTime(v.lastPing)}</span>
                            </div>
                            <div className="col-span-2 flex items-start gap-2">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                              <span className="text-muted-foreground">{v.address}</span>
                            </div>
                            <div className="col-span-2 flex items-start gap-2">
                              <Briefcase className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                              <span className="text-muted-foreground">
                                {v.activeJob ? `Active job ${v.activeJob.reference} (${v.activeJob.status})` : "No active job"}
                              </span>
                            </div>
                          </div>

                          {v.driverId && (
                            <div className="pt-1">
                              <DriverCommunicationActions
                                driverId={v.driverId}
                                driverName={v.driver}
                                driverPhone={v.phone}
                                variant="inline"
                                size="sm"
                              />
                            </div>
                          )}

                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => navigate(`/supervisor?vehicleId=${v.vehicleId}`)}
                            >
                              <Send className="h-3.5 w-3.5 mr-1.5" />
                              Dispatch Job
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleCreateJobForVehicle(v.registration)}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1.5" />
                              Create Job
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleShareLocationViaWhatsApp(v)}
                              title="Share live location via WhatsApp"
                            >
                              <WhatsAppIcon className="h-3.5 w-3.5 mr-1.5 text-success" />
                              Share via WhatsApp
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => navigate(`/admin/fleet/${v.vehicleId}/history`)}
                            >
                              <History className="h-3.5 w-3.5 mr-1.5" />
                              View History
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <GeofenceManagementDialog
        open={geofenceDialogOpen}
        onOpenChange={setGeofenceDialogOpen}
      />

      <JobFormDialog
        open={isJobFormOpen}
        onOpenChange={(open) => {
          setIsJobFormOpen(open);
          if (!open)
            setJobFormPrefillVehicle(null);
        }}
        job={null}
        onSubmit={handleJobSubmit}
      />
    </DashboardLayout>
  );
}
