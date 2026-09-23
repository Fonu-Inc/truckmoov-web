import type {
  Geofence, TrackingStatus, TrackingVehicle,
} from "@truckmoov/api/fleet";
import L from "leaflet";
import {
  useEffect, useRef,
} from "react";
import "leaflet/dist/leaflet.css";

const STATUS_COLOR: Record<TrackingStatus, string> = {
  active: "#22c55e",
  in_progress: "#3b82f6",
  idle: "#f59e0b",
  offline: "#94a3b8",
};

const LAGOS: L.LatLngExpression = [
  6.5244,
  3.3792,
];

function vehicleIcon(status: TrackingStatus, heading: number | null, selected: boolean) {
  const size = selected ? 40 : 30;
  const color = STATUS_COLOR[status];
  const border = selected ? "#facc15" : "#ffffff";
  return L.divIcon({
    className: "live-vehicle-marker",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid ${border};box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;transform:rotate(${heading ?? 0}deg)"><svg width="${size / 2}" height="${size / 2}" viewBox="0 0 24 24" fill="white"><path d="M12 2L4 14h16L12 2z"/></svg></div>`,
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

type Props = {
  vehicles: TrackingVehicle[];
  geofences: Geofence[];
  showGeofences: boolean;
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
  vehicles, geofences, showGeofences, selectedVehicleId, followVehicleId, onVehicleSelect, onMapReady,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef(new Map<string, L.Marker>());
  const geofenceLayerRef = useRef<L.LayerGroup | null>(null);
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
      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
        },
      ).addTo(map);
      geofenceLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      onMapReady?.(map);
      const markers = markersRef.current;
      return () => {
        markers.clear();
        geofenceLayerRef.current = null;
        mapRef.current = null;
        map.remove();
      };
    },
    [],
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
        const label = v.plateNumber || v.registrationNumber || v.vehicleId.slice(
          0,
          8,
        );
        const existing = markers.get(v.vehicleId);
        if (existing) {
          existing.setLatLng(latLng);
          existing.setIcon(icon);
          existing.setTooltipContent(label);
        }
        else {
          const marker = L.marker(
            latLng,
            { icon },
          )
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
          color: "#8b5cf6", weight: 2, fillOpacity: 0.08,
        };
        const tip = `${g.name}${g.vehiclesInside !== undefined ? ` · ${g.vehiclesInside} inside` : ""}`;
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
    <div
      ref={containerRef}
      className="h-full w-full"
    />
  );
}
