import type {
  TrackingAlert,
  TrackingCounts,
  TrackingGeofenceEvent,
  TrackingPositionsFrame,
  TrackingSnapshotResponse,
  TrackingStatus,
  TrackingVehicle,
} from "@truckmoov/api/fleet";
import type L from "leaflet";
import { useQueryClient } from "@tanstack/react-query";
import {
  FLEET_QUERY_KEY,
  useGeofences,
  useShareVehicleLocation,
  useTrackingAlerts,
  useTrackingLive,
  useTrackingVehicles,
} from "@truckmoov/api/fleet";
import { debounce } from "@truckmoov/app-core/utils/general-utils";
import {
  formatDateTime,
  formatRelative,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle, Clock, Crosshair, ExternalLink, Eye, Fuel, LayoutGrid,
  Loader2, Map as MapIcon, MapPin, Maximize2, Minimize2, Minus, Navigation,
  Package, Plus, Route, Search, Settings, Shield, Truck, Wifi, WifiOff, X,
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
import { EmptyState } from "@/features/dashboard/components/ui/EmptyState";
import { GeofenceManagementDialog } from "@/features/fleet/components/ui/GeofenceManagementDialog";
import { zoneTypeColors } from "@/features/fleet/utils/geofenceZones";
import { LiveTrackingMap } from "@/features/map/components/ui/LiveTrackingMap";
import {
  useRealtimeEvent, useRealtimeStatus,
} from "@/features/map/hooks/useRealtime";

type PanelKey = "settings" | "vehicles" | "alerts" | null;

const STATUS_META: Record<TrackingStatus, {
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

const ALERT_LIMIT = 50;

const LEGEND_ZONES = [
  [
    "depot",
    "Depot zone",
  ],
  [
    "delivery",
    "Delivery zone",
  ],
  [
    "restricted",
    "Restricted zone",
  ],
  [
    "custom",
    "Custom zone",
  ],
] as const;

function WhatsAppIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.002 2C6.488 2 2 6.394 2 11.81c0 1.68.465 3.284 1.27 4.67L2 22l5.666-1.232A9.85 9.85 0 0 0 12.002 22c5.514 0 10-4.394 10-9.81S17.516 2 12.002 2zm.003 17.79a7.98 7.98 0 0 1-4.12-1.142l-.296-.176-3.45.75.745-3.354-.177-.282A7.95 7.95 0 0 1 4 11.81c0-4.42 3.582-8.01 8.005-8.01 4.42 0 8.005 3.59 8.005 8.01s-3.585 8.01-8.005 8.01zm4.49-6.22c-.246-.123-1.46-.72-1.686-.802-.226-.082-.39-.123-.554.123-.164.246-.636.802-.78.967-.144.164-.288.185-.533.062-.246-.123-1.04-.384-1.98-1.224-.732-.653-1.226-1.46-1.37-1.705-.144-.246-.015-.38.108-.503.11-.11.246-.288.37-.432.122-.144.164-.246.246-.41.082-.164.041-.307-.02-.43-.062-.123-.554-1.335-.76-1.828-.2-.48-.405-.415-.554-.422l-.472-.01c-.164 0-.43.062-.656.307-.226.246-.867.846-.867 2.062 0 1.216.886 2.39 1.01 2.554.123.164 1.747 2.666 4.234 3.738.592.256 1.054.41 1.415.525.595.19 1.136.163 1.562.1.476-.07 1.46-.596 1.665-1.172.205-.575.205-1.068.144-1.172-.062-.103-.226-.164-.472-.287z"
        fill="#25D366"
      />
    </svg>
  );
}

const REFUSED_COPY: Record<string, string> = {
  origin_not_allowed: "Live updates blocked for this origin",
  capacity_reached: "Live updates are at capacity — try again shortly",
  unauthenticated: "Live updates need you to sign in again",
};

function vehicleLabel(v: TrackingVehicle) {
  return v.plateNumber || v.registrationNumber || v.vehicleId.slice(
    0,
    8,
  );
}

function isNewer(next: string, current?: string | null) {
  return !current || Date.parse(next) > Date.parse(current);
}

// ponytail: frames carry no status, so this mirrors the server's rules (ticket §2, in order) to keep
// markers honest between snapshots. Swap for a server field if frames ever carry status.
function resolveStatus(
  v: TrackingVehicle,
  activeJobStatuses: string[],
  offlineAfterMinutes: number,
  now = Date.now(),
): TrackingStatus {
  const fixedAt = v.position?.fixedAt;
  if (!fixedAt || now - Date.parse(fixedAt) > offlineAfterMinutes * 60_000)
    return "offline";
  if (v.job && activeJobStatuses.includes(v.job.status))
    return "in_progress";
  return (v.position?.speedKph ?? 0) > 5 ? "active" : "idle";
}

const OFFLINE_SWEEP_MS = 30_000;

export default function LiveMap() {
  const queryClient = useQueryClient();
  const liveQuery = useTrackingLive();
  const snapshot = liveQuery.data?.data;
  const vehicles = useMemo(
    () => snapshot?.vehicles ?? [],
    [snapshot],
  );
  const counts = snapshot?.counts;

  const [
    selectedVehicle,
    setSelectedVehicle,
  ] = useState<string | null>(null);
  const [
    trackedVehicle,
    setTrackedVehicle,
  ] = useState<string | null>(null);
  const [
    showGeofences,
    setShowGeofences,
  ] = useState(true);
  // ponytail: parity switches from fleetflow — no route or alert map layer consumes these yet.
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
    searchInput,
    setSearchInput,
  ] = useState("");
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    geofenceDialogOpen,
    setGeofenceDialogOpen,
  ] = useState(false);
  const [
    streetView,
    setStreetView,
  ] = useState<{
    lat: number; lng: number; heading: number;
  } | null>(null);
  const [
    panel,
    setPanel,
  ] = useState<PanelKey>(null);
  const [
    isFullscreen,
    setIsFullscreen,
  ] = useState(false);
  const [
    lastFrameAt,
    setLastFrameAt,
  ] = useState<string | null>(null);
  const mapInstance = useRef<L.Map | null>(null);

  const debouncedSetSearch = useMemo(
    () => debounce(
      (v: string) => setSearch(v.trim()),
      300,
    ),
    [],
  );
  useEffect(
    () => () => debouncedSetSearch.cancel(),
    [debouncedSetSearch],
  );

  // Search goes to the server as typed (it ignores plate punctuation). Its counts are
  // fleet-wide too, but the status bar keeps reading the live snapshot either way.
  const searchQuery = useTrackingVehicles(search ? { params: { query: search } } : undefined);
  const searchIds = useMemo(
    () => (search ? new Set((searchQuery.data?.data?.vehicles ?? []).map(v => v.vehicleId)) : null),
    [
      search,
      searchQuery.data,
    ],
  );
  // List the live rows (current positions) for whichever ids the search matched.
  const listedVehicles = searchIds ? vehicles.filter(v => searchIds.has(v.vehicleId)) : vehicles;

  const alertsQuery = useTrackingAlerts(
    { params: { limit: ALERT_LIMIT } },
    panel === "alerts",
  );
  const alerts = alertsQuery.data?.data?.items ?? [];
  const geofencesQuery = useGeofences({ params: { status: "ACTIVE" } });
  const geofences = geofencesQuery.data?.data ?? [];

  const share = useShareVehicleLocation();
  const [
    sharingId,
    setSharingId,
  ] = useState<string | null>(null);
  const realtime = useRealtimeStatus();

  // After a dropped connection, frames missed in the gap are gone — repaint from REST once.
  const wasDisconnectedRef = useRef(false);
  useEffect(
    () => {
      if (realtime.state === "connected") {
        if (wasDisconnectedRef.current)
          queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.trackingLive });
        wasDisconnectedRef.current = false;
      }
      else if (realtime.state !== "idle" && realtime.state !== "connecting") {
        wasDisconnectedRef.current = true;
      }
    },
    [
      realtime.state,
      queryClient,
    ],
  );

  // ─── Socket → cache. REST painted once; these move it. Nothing polls. ─────────
  const patchSnapshot = (fn: (s: NonNullable<typeof snapshot>) => NonNullable<typeof snapshot>) =>
    queryClient.setQueryData<TrackingSnapshotResponse>(
      FLEET_QUERY_KEY.trackingLive,
      old =>
        old?.data ? {
          ...old, data: fn(old.data),
        } : old,
    );

  useRealtimeEvent<TrackingPositionsFrame>(
    "tracking.positions",
    (frame) => {
      const byId = new Map(frame.positions.map(p => [
        p.vehicleId,
        p,
      ]));
      // A vehicle we've never seen (added since first paint) needs the snapshot's row, not just a fix.
      if (snapshot && frame.positions.some(p => !snapshot.vehicles.some(v => v.vehicleId === p.vehicleId)))
        queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.trackingLive });
      // A vehicle absent from the frame had no new fix — leave it exactly where it is.
      // fixedAt is authoritative, so an older fix never overwrites a newer one.
      patchSnapshot(s => ({
        ...s,
        vehicles: s.vehicles.map((v) => {
          const p = byId.get(v.vehicleId);
          if (!p || !isNewer(
            p.fixedAt,
            v.position?.fixedAt,
          )) {
            return v;
          }
          const {
            vehicleId: _id, ...position
          } = p;
          const next = {
            ...v, position,
          };
          return {
            ...next,
            status: resolveStatus(
              next,
              s.activeJobStatuses,
              s.offlineAfterMinutes,
            ),
          };
        }),
      }));
      setLastFrameAt(new Date().toISOString());
    },
  );

  // A vehicle that stops reporting sends no frame — age it out locally. No API call, so not polling.
  useEffect(
    () => {
      const id = setInterval(
        () => queryClient.setQueryData<TrackingSnapshotResponse>(
          FLEET_QUERY_KEY.trackingLive,
          (old) => {
            const s = old?.data;
            if (!old || !s)
              return old;
            const aged = s.vehicles.map(v => (v.status !== "offline" && resolveStatus(
              v,
              s.activeJobStatuses,
              s.offlineAfterMinutes,
            ) === "offline"
              ? {
                  ...v, status: "offline" as const,
                }
              : v));
            return aged.some((v, i) => v !== s.vehicles[i])
              ? {
                  ...old,
                  data: {
                    ...s, vehicles: aged,
                  },
                }
              : old;
          },
        ),
        OFFLINE_SWEEP_MS,
      );
      return () => clearInterval(id);
    },
    [queryClient],
  );

  useRealtimeEvent<TrackingCounts>(
    "tracking.counts",
    (next) => {
      patchSnapshot(s => ({
        ...s, counts: next,
      }));
    },
  );

  useRealtimeEvent<TrackingAlert>(
    "alert.triggered",
    (alert) => {
      queryClient.setQueryData<{
        data: {
          total: number; items: TrackingAlert[];
        };
      }>(
        FLEET_QUERY_KEY.trackingAlerts({ params: { limit: ALERT_LIMIT } }),
        old => (old?.data ? {
          ...old,
          data: {
            total: old.data.total + 1,
            items: [
              alert,
              ...old.data.items,
            ].slice(
              0,
              ALERT_LIMIT,
            ),
          },
        } : old),
      );
      toast.warning(alert.title || alert.message || alert.type);
    },
  );

  const onGeofenceEvent = (verb: string) => (e: TrackingGeofenceEvent) => {
    const v = vehicles.find(x => x.vehicleId === e.vehicleId);
    toast.info(`${v ? vehicleLabel(v) : "A vehicle"} ${verb} ${e.geofenceName ?? "a geofence"}`);
    // vehiclesInside changed — refresh that one list, on the event, not on a timer.
    queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.geofencesRoot });
  };
  useRealtimeEvent<TrackingGeofenceEvent>(
    "vehicle.geofence.entered",
    onGeofenceEvent("entered"),
  );
  useRealtimeEvent<TrackingGeofenceEvent>(
    "vehicle.geofence.exited",
    onGeofenceEvent("left"),
  );
  useRealtimeEvent<TrackingGeofenceEvent>(
    "vehicle.geofence.dwelled",
    onGeofenceEvent("is dwelling in"),
  );

  const selected = vehicles.find(v => v.vehicleId === selectedVehicle) ?? null;

  const togglePanel = (key: Exclude<PanelKey, null>) => setPanel(p => (p === key ? null : key));

  const handleShare = (v: TrackingVehicle) => {
    // Open the tab on the click itself so popup blockers allow it; point it at WhatsApp once the link exists.
    const win = window.open(
      "about:blank",
      "_blank",
    );
    if (win)
      win.opener = null;
    setSharingId(v.vehicleId);
    share.mutate(
      { id: v.vehicleId },
      {
        onSuccess: async ({ data }) => {
          if (data.alreadyShared || !data.url) {
            win?.close();
            // One live link per vehicle; its URL was shown once to whoever minted it.
            toast.info(
              `A live link is already out for ${vehicleLabel(v)}`,
              { description: `It expires ${formatDateTime(data.expiresAt)}. The link itself can't be shown again.` },
            );
            return;
          }
          let copied = false;
          try {
            await navigator.clipboard.writeText(data.url);
            copied = true;
          }
          catch {}
          const text = `Track ${data.jobReference ? `delivery ${data.jobReference}` : "your delivery"} live: ${data.url}`;
          const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
          if (win) {
            win.location.href = waUrl;
          }
          else {
            window.open(
              waUrl,
              "_blank",
              "noopener",
            );
          }
          // The URL is shown once and never again — if the clipboard refused it, show it here instead.
          toast.success(
            copied ? "Tracking link copied and WhatsApp opened" : "WhatsApp opened — the link couldn't be copied",
            {
              description: copied
                ? `This is the only time the link is shown. Expires ${formatDateTime(data.expiresAt)}.`
                : `${data.url} — it won't be shown again. Expires ${formatDateTime(data.expiresAt)}.`,
              duration: copied ? undefined : 30_000,
            },
          );
        },
        onError: (error) => {
          win?.close();
          toast.error(error.statusCode === 404 ? "This vehicle can't be shared" : error.message);
        },
        onSettled: () => setSharingId(null),
      },
    );
  };

  if (liveQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (snapshot && vehicles.length === 0) {
    return (
      <EmptyState
        icon={Truck}
        title="No vehicles to track"
        description="Add vehicles to your fleet to see them on the live map"
        actionLabel="Add Vehicle"
        actionHref="/fleet"
      />
    );
  }

  const railItems: {
    key: Exclude<PanelKey, null> | "geofences" | "streetview" | "viewall"; icon: typeof Settings; label: string; onClick: () => void;
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
      key: "streetview",
      icon: Eye,
      label: selected?.position ? "Street view" : "Street view (select a vehicle with a position)",
      onClick: () => selected?.position && setStreetView({
        lat: selected.position.lat, lng: selected.position.lng, heading: selected.position.heading ?? 0,
      }),
    },
    {
      key: "viewall", icon: LayoutGrid, label: "View all vehicles", onClick: () => setSelectedVehicle(null),
    },
  ];

  const liveBadge = realtime.state === "connected"
    ? {
        icon: Wifi, text: "Live", className: "text-success", dot: "bg-success animate-pulse",
      }
    : realtime.state === "refused"
      ? {
          icon: WifiOff, text: REFUSED_COPY[realtime.reason] ?? `Live updates refused (${realtime.reason})`, className: "text-destructive", dot: "bg-destructive",
        }
      : {
          icon: WifiOff, text: "Connecting...", className: "text-warning", dot: "bg-warning",
        };
  const LiveIcon = liveBadge.icon;

  const mapSurface = (
    <div className={isFullscreen ? "fixed inset-0 z-40 bg-background" : "absolute inset-0 isolate"}>
      {liveQuery.isError
        ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              <p>Unable to load live tracking.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => liveQuery.refetch()}
              >
                Try again
              </Button>
            </div>
          )
        : (
            <LiveTrackingMap
              vehicles={vehicles}
              geofences={geofences}
              showGeofences={showGeofences}
              selectedVehicleId={selectedVehicle}
              followVehicleId={trackedVehicle}
              onVehicleSelect={(id) => {
                setSelectedVehicle(id);
                setPanel("vehicles");
              }}
              onMapReady={(m) => {
                mapInstance.current = m;
              }}
            />
          )}

      {/* Connection badge — FleetMap's realtime badge. */}
      <div
        className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border shadow-lg z-[1000] flex items-center gap-2"
        title={snapshot ? `Frames every ${Math.round(snapshot.frameIntervalMs / 1000)}s · offline after ${snapshot.offlineAfterMinutes} min without a fix` : undefined}
      >
        <LiveIcon className={`h-3.5 w-3.5 ${liveBadge.className}`} />
        <div className={`h-2 w-2 rounded-full ${liveBadge.dot}`} />
        <span className="text-xs font-medium">{liveBadge.text}</span>
        {realtime.state === "connected" && lastFrameAt && (
          <span className="text-xs text-muted-foreground ml-1">{formatRelative(lastFrameAt)}</span>
        )}
      </div>

      {trackedVehicle && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 rounded-full border border-primary/30 bg-card/95 px-3 py-1.5 shadow-lg backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="text-xs font-medium">
            {`Tracking ${(() => {
              const v = vehicles.find(x => x.vehicleId === trackedVehicle);
              return v ? vehicleLabel(v) : trackedVehicle;
            })()}`}
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
              {panel === "vehicles" && `Vehicles (${listedVehicles.length})`}
              {panel === "alerts" && "Alerts"}
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
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      debouncedSetSearch(e.target.value);
                    }}
                  />
                  {search && searchQuery.isFetching && (
                    <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-1.5">
                  {listedVehicles.map((vehicle) => {
                    const meta = STATUS_META[vehicle.status];
                    const isSelected = selectedVehicle === vehicle.vehicleId;
                    return (
                      <div
                        key={vehicle.vehicleId}
                        className={`p-2.5 rounded-xl cursor-pointer transition-all ${isSelected ? "bg-primary/10 border border-primary/30" : "bg-muted/30 hover:bg-muted/50 border border-transparent"}`}
                        onClick={() => setSelectedVehicle(vehicle.vehicleId)}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`h-2 w-2 rounded-full shrink-0 ${meta.dot}`} />
                            <div className="min-w-0">
                              <span className="font-medium text-sm block truncate">{vehicleLabel(vehicle)}</span>
                              <span className="text-[10px] text-muted-foreground block truncate">
                                {[
                                  vehicle.make,
                                  vehicle.model,
                                ].filter(Boolean).join(" ") || "-"}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[10px] shrink-0 ${meta.text}`}
                          >
                            {meta.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1.5 truncate">{vehicle.driverName || "Unassigned"}</p>
                        {vehicle.job && (
                          <div className="mb-1.5 rounded-lg bg-primary/5 border border-primary/20 px-2 py-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
                              <Package className="h-3 w-3" />
                              {vehicle.job.reference}
                            </div>
                            {(vehicle.job.pickupAddress || vehicle.job.deliveryAddress || vehicle.job.dropoffAddress) && (
                              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                                {`${vehicle.job.pickupAddress ?? "-"} → ${vehicle.job.deliveryAddress ?? vehicle.job.dropoffAddress ?? "-"}`}
                              </p>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Navigation className="h-3 w-3" />
                            {vehicle.position?.speedKph != null ? `${Math.round(vehicle.position.speedKph)} km/h` : "-"}
                          </span>
                          {(vehicle.fuelLevelPercent ?? vehicle.fuelLevel) != null && (
                            <span className="flex items-center gap-1">
                              <Fuel className="h-3 w-3" />
                              {`${vehicle.fuelLevelPercent ?? vehicle.fuelLevel}%`}
                            </span>
                          )}
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3" />
                            {vehicle.position ? formatRelative(vehicle.position.fixedAt) : "Never reported"}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="mt-2 pt-2 border-t border-border/30 space-y-2">
                            {vehicle.driverId && (
                              <DriverCommunicationActions
                                driverId={vehicle.driverId}
                                driverName={vehicle.driverName ?? ""}
                                driverPhone={vehicle.driverPhone ?? ""}
                                variant="inline"
                                size="sm"
                              />
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs gap-1.5"
                              disabled={!vehicle.position}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (vehicle.position) {
                                  window.open(
                                    `https://www.google.com/maps/dir/?api=1&destination=${vehicle.position.lat},${vehicle.position.lng}`,
                                    "_blank",
                                    "noopener",
                                  );
                                }
                              }}
                            >
                              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                              Navigate to Vehicle via Google Map
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs gap-1.5"
                              disabled={sharingId === vehicle.vehicleId}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShare(vehicle);
                              }}
                            >
                              {sharingId === vehicle.vehicleId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <WhatsAppIcon />}
                              Share location via WhatsApp
                            </Button>
                            <Button
                              variant={trackedVehicle === vehicle.vehicleId ? "gradient" : "outline"}
                              size="sm"
                              className="w-full text-xs gap-1.5"
                              disabled={!vehicle.position}
                              onClick={(e) => {
                                e.stopPropagation();
                                setTrackedVehicle(t => (t === vehicle.vehicleId ? null : vehicle.vehicleId));
                              }}
                            >
                              <Crosshair className="h-3.5 w-3.5" />
                              {trackedVehicle === vehicle.vehicleId ? "Stop tracking" : "Track vehicle"}
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {listedVehicles.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      {search ? "No vehicles match your search" : "No vehicles yet"}
                    </p>
                  )}
                </div>
              </>
            )}

            {panel === "alerts" && (
              alertsQuery.isLoading
                ? <Loader2 className="mx-auto my-6 h-5 w-5 animate-spin text-muted-foreground" />
                : alertsQuery.isError
                  ? <p className="text-xs text-destructive text-center py-6">Unable to load alerts.</p>
                  : alerts.length === 0
                    ? <p className="text-xs text-muted-foreground text-center py-6">No recent alerts</p>
                    : (
                        <div className="space-y-1.5">
                          {alerts.map(alert => (
                            <div
                              key={alert.id}
                              className={`p-2.5 rounded-xl text-xs ${alert.severity === "critical" || alert.severity === "high" ? "bg-destructive/10" : alert.severity === "medium" ? "bg-warning/10" : "bg-muted/30"}`}
                            >
                              <div className="min-w-0">
                                <p className="font-medium">{alert.title || alert.message || alert.type}</p>
                                <p className="text-muted-foreground mt-0.5 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatRelative(alert.createdAt)}
                                </p>
                              </div>
                              {alert.vehicleId && (
                                <div className="flex justify-end mt-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="shrink-0 h-6 text-[10px] px-2 gap-1 border border-border"
                                    onClick={() => {
                                      setSelectedVehicle(alert.vehicleId ?? null);
                                      setTrackedVehicle(alert.vehicleId ?? null);
                                      setPanel(null);
                                    }}
                                  >
                                    <MapPin className="h-3 w-3" />
                                    Track vehicle
                                  </Button>
                                </div>
                              )}
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

      {/* Fleet-wide counts from the server (snapshot, then tracking.counts) — never from the list or the search. */}
      {counts && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 rounded-2xl border border-border bg-card/95 backdrop-blur-md px-3 py-2 shadow-lg">
          {(Object.keys(STATUS_META) as TrackingStatus[]).map(key => (
            <div
              key={key}
              className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-muted/40"
            >
              <span className={`h-2 w-2 rounded-full ${STATUS_META[key].dot}`} />
              <span className={`text-sm font-semibold ${STATUS_META[key].text}`}>{counts[key] ?? 0}</span>
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">{STATUS_META[key].label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Legend — FleetMap's; zone dots use the same colours the circles are drawn with. */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg border border-border p-3 shadow-lg z-[1000]">
          <p className="text-xs font-medium mb-2">Legend</p>
          <div className="space-y-1.5">
            {(Object.keys(STATUS_META) as TrackingStatus[]).map(key => (
              <div
                key={key}
                className="flex items-center gap-2"
              >
                <div className={`h-3 w-3 rounded-full ${STATUS_META[key].dot}`} />
                <span className="text-xs text-muted-foreground">{STATUS_META[key].label}</span>
              </div>
            ))}
            {showGeofences && (
              <>
                <div className="h-px bg-border my-1.5" />
                {LEGEND_ZONES.map(([
                  category,
                  label,
                ]) => (
                  <div
                    key={category}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="h-3 w-3 rounded-full border-2"
                      style={{
                        borderColor: zoneTypeColors[category],
                        background: `${zoneTypeColors[category]}33`,
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

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

      {/* ponytail: street view is client-side per spec §8 — Google's keyless embed, pointed with the fix's heading. */}
      <Dialog
        open={!!streetView}
        onOpenChange={o => !o && setStreetView(null)}
      >
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle>Street View</DialogTitle>
            <DialogDescription>
              {streetView ? `${streetView.lat.toFixed(5)}, ${streetView.lng.toFixed(5)}` : ""}
            </DialogDescription>
          </DialogHeader>
          {streetView && (
            <iframe
              title="Street view"
              className="h-[60vh] w-full border-0"
              loading="lazy"
              allowFullScreen
              src={`https://maps.google.com/maps?q=&layer=c&cbll=${streetView.lat},${streetView.lng}&cbp=11,${Math.round(streetView.heading)},0,0,0&output=svembed`}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
