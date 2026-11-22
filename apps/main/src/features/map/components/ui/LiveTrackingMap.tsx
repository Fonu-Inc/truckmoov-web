import type {
  Geofence, TrackingStatus, TrackingVehicle,
} from "@truckmoov/api/fleet";
import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  MAP_ATTRIBUTION, MAP_TILES_LIGHT,
} from "@truckmoov/reusables/lib/map";
import L from "leaflet";
import {
  useEffect, useRef,
} from "react";
import {
  zoneCategoryKey, zoneTypeColors,
} from "@/features/fleet/utils/geofenceZones";
import "leaflet/dist/leaflet.css";

const STATUS_COLOR: Record<TrackingStatus, string> = {
  active: "#22c55e",
  in_progress: "#3b82f6",
  idle: "#f59e0b",
  offline: "#94a3b8",
};

const STATUS_LABEL: Record<TrackingStatus, string> = {
  active: "Active",
  in_progress: "In progress",
  idle: "Idle",
  offline: "Offline",
};

const SATELLITE_TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SATELLITE_ATTRIBUTION = "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics";

const LAGOS: L.LatLngExpression = [
  6.5244,
  3.3792,
];

// Sizes, borders and the selected pulse ring match fleetflow's FleetMap marker.
function vehicleIcon(status: TrackingStatus, heading: number | null, selected: boolean) {
  const size = selected ? 48 : 36;
  const iconSize = selected ? 24 : 18;
  const color = STATUS_COLOR[status];
  const border = selected ? "4px solid #facc15" : "3px solid #ffffff";
  const shadow = selected ? "0 4px 16px rgba(250,204,21,.5),0 2px 8px rgba(0,0,0,.3)" : "0 2px 8px rgba(0,0,0,.3)";
  const pulse = selected
    ? `<div style="position:absolute;top:50%;left:50%;width:${size + 20}px;height:${size + 20}px;border-radius:50%;background:rgba(250,204,21,.3);animation:selectedPulse 1.5s ease-out infinite"></div><style>@keyframes selectedPulse{0%{transform:translate(-50%,-50%) scale(.8);opacity:1}100%{transform:translate(-50%,-50%) scale(1.5);opacity:0}}</style>`
    : "";
  return L.divIcon({
    className: "live-vehicle-marker",
    html: `<div style="position:relative;width:${size}px;height:${size}px">${pulse}<div style="position:relative;z-index:10;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${border};box-shadow:${shadow};display:flex;align-items:center;justify-content:center;transform:rotate(${heading ?? 0}deg)"><svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="white"><path d="M12 2L4 14h16L12 2z"/></svg></div></div>`,
    iconSize: [
      size,
      size,
    ],
    iconAnchor: [
      size / 2,
      size / 2,
    ],
  });
}

// Tooltips and popups take HTML; plates, names and addresses are tenant-typed text.
function esc(value: unknown) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    c => `&#${c.charCodeAt(0)};`,
  );
}

function vehicleLabel(v: TrackingVehicle) {
  return v.plateNumber || v.registrationNumber || v.vehicleId.slice(
    0,
    8,
  );
}

// Fleetflow's FleetMap popup, minus the network/battery row we have no data for.
function vehiclePopup(v: TrackingVehicle) {
  const model = [
    v.make,
    v.model,
  ].filter(Boolean).join(" ");
  const pill: Record<TrackingStatus, [string, string]> = {
    active: [
      "#dcfce7",
      "#166534",
    ],
    in_progress: [
      "#dbeafe",
      "#1e40af",
    ],
    idle: [
      "#fef3c7",
      "#92400e",
    ],
    offline: [
      "#f1f5f9",
      "#475569",
    ],
  };
  const [
    bg,
    fg,
  ] = pill[v.status];
  const fuel = v.fuelLevelPercent ?? v.fuelLevel;
  const job = v.job;
  return `
    <div style="min-width:240px;padding:6px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">
        <div style="display:flex;flex-direction:column;gap:1px;min-width:0;">
          <div style="font-weight:700;font-size:15px;">${esc(model || vehicleLabel(v))}</div>
          <div style="font-size:11px;color:#64748b;">${esc(vehicleLabel(v))}</div>
        </div>
        <span style="font-size:11px;padding:2px 8px;background:${bg};color:${fg};border-radius:9999px;white-space:nowrap;">${STATUS_LABEL[v.status]}</span>
      </div>
      <div style="font-size:13px;color:#334155;margin-bottom:10px;"><strong>Driver:</strong> ${esc(v.driverName || "Unassigned")}</div>
      ${job
        ? `<div style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;font-size:12px;color:#475569;">
            <div style="color:#94a3b8;">Job</div><div style="font-weight:600;color:#3b82f6;">${esc(job.reference)}</div>
            <div style="color:#94a3b8;">Start</div><div style="font-weight:500;">${esc(job.pickupAddress || "—")}</div>
            <div style="color:#94a3b8;">End</div><div style="font-weight:500;">${esc(job.deliveryAddress || job.dropoffAddress || "—")}</div>
          </div>`
        : ""}
      <div style="display:flex;gap:10px;margin-top:10px;padding-top:8px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;flex-wrap:wrap;">
        <div>🚗 ${v.position?.speedKph != null ? `${Math.round(v.position.speedKph)} km/h` : "—"}</div>
        ${fuel != null ? `<div>⛽ ${esc(fuel)}%</div>` : ""}
        <div>⏱ ${v.position ? esc(formatRelative(v.position.fixedAt)) : "Never reported"}</div>
      </div>
    </div>`;
}

function alertIcon() {
  return L.divIcon({
    className: "geofence-alert-marker",
    html: `<div style="width:28px;height:28px;background:#ef4444;border-radius:50%;display:flex;align-items:center;justify-content:center;animation:alertPulse 1.5s infinite;box-shadow:0 0 0 rgba(239,68,68,.4)"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 22h20L12 2zm0 6v6m0 4h.01"/></svg></div><style>@keyframes alertPulse{0%{box-shadow:0 0 0 0 rgba(239,68,68,.4)}70%{box-shadow:0 0 0 15px rgba(239,68,68,0)}100%{box-shadow:0 0 0 0 rgba(239,68,68,0)}}</style>`,
    iconSize: [
      28,
      28,
    ],
    iconAnchor: [
      14,
      14,
    ],
  });
}

export type MapRoute = {
  vehicleId: string;
  points: [number, number][];
  moving: boolean;
};

export type MapAlertPin = {
  id: string;
  position: [number, number];
  title: string;
  vehicle: string;
  time: string;
};

type Props = {
  vehicles: TrackingVehicle[];
  geofences: Geofence[];
  showGeofences: boolean;
  tileStyle: "map" | "satellite";
  routes: MapRoute[];
  alertPins: MapAlertPin[];
  selectedVehicleId: string | null;
  followVehicleId: string | null;
  onVehicleSelect: (vehicleId: string) => void;
  onMapReady?: (map: L.Map) => void;
};

/**
 * Leaflet map for /map. Markers are keyed by vehicleId and moved in place, so a
 * 5-second socket frame only touches the vehicles in it. Bounds fit once, on the
 * first paint that has positions — never per frame, so it doesn't fight the user.
 */
export function LiveTrackingMap({
  vehicles, geofences, showGeofences, tileStyle, routes, alertPins, selectedVehicleId, followVehicleId, onVehicleSelect, onMapReady,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef(new Map<string, L.Marker>());
  const geofenceLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const alertLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const fittedRef = useRef(false);
  const selectRef = useRef(onVehicleSelect);
  useEffect(() => {
    selectRef.current = onVehicleSelect;
  });

  // Create / destroy the map exactly once.
  useEffect(
    () => {
      if (!containerRef.current)
        return;
      const map = L.map(
        containerRef.current,
        { zoomControl: false },
      ).setView(
        LAGOS,
        11,
      );
      geofenceLayerRef.current = L.layerGroup().addTo(map);
      routeLayerRef.current = L.layerGroup().addTo(map);
      alertLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      onMapReady?.(map);
      const markers = markersRef.current;
      return () => {
        markers.clear();
        geofenceLayerRef.current = null;
        routeLayerRef.current = null;
        alertLayerRef.current = null;
        tileLayerRef.current = null;
        mapRef.current = null;
        map.remove();
      };
    },
    [],
  );

  useEffect(
    () => {
      const map = mapRef.current;
      if (!map)
        return;
      tileLayerRef.current?.remove();
      tileLayerRef.current = L.tileLayer(
        tileStyle === "satellite" ? SATELLITE_TILES : MAP_TILES_LIGHT,
        {
          attribution: tileStyle === "satellite" ? SATELLITE_ATTRIBUTION : MAP_ATTRIBUTION, maxZoom: 19,
        },
      ).addTo(map).bringToBack();
    },
    [tileStyle],
  );

  // Sync markers: add new, move/restyle existing, drop vehicles that left the list.
  useEffect(
    () => {
      const map = mapRef.current;
      if (!map)
        return;
      const markers = markersRef.current;
      const seen = new Set<string>();
      for (const v of vehicles) {
        if (!v.position)
          continue; // never reported — nothing to place
        seen.add(v.vehicleId);
        const latLng: L.LatLngExpression = [
          v.position.lat,
          v.position.lng,
        ];
        const icon = vehicleIcon(
          v.status,
          v.position.heading,
          v.vehicleId === selectedVehicleId,
        );
        const label = esc(vehicleLabel(v));
        const popup = vehiclePopup(v);
        const zIndexOffset = v.vehicleId === selectedVehicleId ? 1000 : 0;
        const existing = markers.get(v.vehicleId);
        if (existing) {
          existing.setLatLng(latLng);
          existing.setIcon(icon);
          existing.setTooltipContent(label);
          existing.setPopupContent(popup);
          existing.setZIndexOffset(zIndexOffset);
        }
        else {
          const marker = L.marker(
            latLng,
            {
              icon, zIndexOffset,
            },
          )
            .bindPopup(popup)
            .bindTooltip(
              label,
              {
                direction: "top", offset: [
                  0,
                  -14,
                ],
              },
            )
            .on(
              "click",
              () => selectRef.current(v.vehicleId),
            )
            .addTo(map);
          markers.set(
            v.vehicleId,
            marker,
          );
        }
      }
      for (const [
        id,
        marker,
      ] of markers) {
        if (!seen.has(id)) {
          marker.remove();
          markers.delete(id);
        }
      }
      if (!fittedRef.current && seen.size > 0) {
        fittedRef.current = true;
        const bounds = L.latLngBounds([...seen].map(id => markers.get(id)!.getLatLng()));
        map.fitBounds(
          bounds,
          {
            padding: [
              60,
              60,
            ], maxZoom: 14,
          },
        );
      }
    },
    [
      vehicles,
      selectedVehicleId,
    ],
  );

  // Picking a vehicle (list or marker) flies to it once — never per frame.
  const vehiclesRef = useRef(vehicles);
  useEffect(() => {
    vehiclesRef.current = vehicles;
  });
  useEffect(
    () => {
      const map = mapRef.current;
      const position = vehiclesRef.current.find(v => v.vehicleId === selectedVehicleId)?.position;
      if (!map || !selectedVehicleId || !position)
        return;
      map.flyTo(
        [
          position.lat,
          position.lng,
        ],
        Math.max(
          map.getZoom(),
          14,
        ),
        { duration: 0.8 },
      );
      markersRef.current.get(selectedVehicleId)?.openPopup();
    },
    [selectedVehicleId],
  );

  useEffect(
    () => {
      const layer = routeLayerRef.current;
      if (!layer)
        return;
      layer.clearLayers();
      for (const r of routes) {
        if (r.points.length < 2)
          continue;
        L.polyline(
          r.points,
          {
            color: r.moving ? "#3b82f6" : "#94a3b8", weight: 3, opacity: 0.7, dashArray: "10, 5",
          },
        ).addTo(layer);
      }
    },
    [routes],
  );

  useEffect(
    () => {
      const layer = alertLayerRef.current;
      if (!layer)
        return;
      layer.clearLayers();
      for (const a of alertPins) {
        L.marker(
          a.position,
          { icon: alertIcon() },
        ).bindPopup(`
          <div style="min-width:200px;padding:8px;">
            <div style="font-size:14px;font-weight:600;margin-bottom:4px;color:#b91c1c;">Alert</div>
            <div style="font-size:12px;color:#4b5563;margin-bottom:4px;">${esc(a.title)}</div>
            <div style="display:flex;justify-content:space-between;gap:8px;font-size:11px;color:#9ca3af;">
              <span>${esc(a.vehicle)}</span>
              <span>${esc(a.time)}</span>
            </div>
          </div>`).addTo(layer);
      }
    },
    [alertPins],
  );

  // Follow a vehicle: re-centre whenever its position changes (i.e. per socket frame).
  const followed = followVehicleId ? vehicles.find(v => v.vehicleId === followVehicleId)?.position : null;
  useEffect(
    () => {
      const map = mapRef.current;
      if (!map || !followed)
        return;
      map.setView(
        [
          followed.lat,
          followed.lng,
        ],
        Math.max(
          map.getZoom(),
          15,
        ),
        { animate: true },
      );
    },
    [
      followed?.lat,
      followed?.lng,
      followed,
    ],
  );

  // Geofence layer.
  useEffect(
    () => {
      const layer = geofenceLayerRef.current;
      if (!layer)
        return;
      layer.clearLayers();
      if (!showGeofences)
        return;
      for (const g of geofences) {
        const style = {
          color: zoneTypeColors[zoneCategoryKey(g.category)], weight: 2, fillOpacity: 0.15,
        };
        const tip = `${esc(g.name)}${g.vehiclesInside !== undefined ? ` · ${g.vehiclesInside} inside` : ""}`;
        if (g.shape === "CIRCLE" && g.center && g.radiusMeters) {
          L.circle(
            [
              g.center.latitude,
              g.center.longitude,
            ],
            {
              ...style, radius: g.radiusMeters,
            },
          ).bindTooltip(tip).addTo(layer);
        }
        else if (g.shape === "POLYGON" && g.coordinates.length > 2) { // stored GeoJSON-style [lng, lat]
          L.polygon(
            g.coordinates.map(([
              lng,
              lat,
            ]) => [
              lat,
              lng,
            ] as L.LatLngTuple),
            style,
          ).bindTooltip(tip).addTo(layer);
        }
      }
    },
    [
      geofences,
      showGeofences,
    ],
  );

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-border">
      <div
        ref={containerRef}
        className="w-full h-full"
      />
    </div>
  );
}
