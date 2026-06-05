import { useEffect, useState, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { Truck, AlertTriangle, Navigation, Clock, Fuel, Phone, Wifi, WifiOff } from "lucide-react";
import { useRealtimeTracking, RealtimeVehicleLocation } from "@/hooks/useRealtimeTracking";
import { useGeofences, type Geofence } from "@/hooks/useGeofences";
import { formatDistanceToNow } from "date-fns";

// Fix for default marker icons when using Leaflet directly
// (We rely on custom divIcons below, but keep this to avoid missing image warnings.)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom vehicle icons
const createVehicleIcon = (status: string, heading: number, isSelected: boolean = false) => {
  const color = status === "moving" ? "#22c55e" : status === "idle" ? "#f59e0b" : "#ef4444";
  const size = isSelected ? 48 : 36;
  const iconSize = isSelected ? 24 : 18;
  const borderWidth = isSelected ? 4 : 3;
  const borderColor = isSelected ? "#facc15" : "white"; // Yellow highlight for selected
  const pulseAnimation = isSelected ? `
    <div style="
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${size + 20}px;
      height: ${size + 20}px;
      border-radius: 50%;
      background: rgba(250, 204, 21, 0.3);
      animation: selectedPulse 1.5s ease-out infinite;
    "></div>
    <style>
      @keyframes selectedPulse {
        0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
      }
    </style>
  ` : '';

  return L.divIcon({
    className: `custom-vehicle-marker ${isSelected ? 'selected' : ''}`,
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px;">
        ${pulseAnimation}
        <div style="
          position: relative;
          z-index: 10;
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: ${isSelected ? '0 4px 16px rgba(250, 204, 21, 0.5), 0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.3)'};
          border: ${borderWidth}px solid ${borderColor};
          transform: rotate(${heading}deg);
        ">
          <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L4 14h16L12 2z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const createGeofenceAlertIcon = () => {
  return L.divIcon({
    className: "geofence-alert-marker",
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background: #ef4444;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 1.5s infinite;
        box-shadow: 0 0 0 rgba(239, 68, 68, 0.4);
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
          <path d="M12 2L2 22h20L12 2zm0 6v6m0 4h.01"/>
        </svg>
      </div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      </style>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

// Types
export interface FleetMapVehicle {
  id: string;
  driver: string;
  phone: string;
  position: [number, number];
  heading: number;
  speed: number;
  status: string;
  fuel: number;
  lastUpdate: string;
  route: [number, number][];
  startLocation: string;
  destination: string;
  eta: string;
  networkStatus: "online" | "degraded" | "offline";
  batteryVoltage: number | null;
  signalStrength: number | null;
}

// Internal alias
type Vehicle = FleetMapVehicle;

interface GeofenceZone {
  id: number;
  name: string;
  center: [number, number];
  radius: number;
  color: string;
  type: string;
}

interface GeofenceAlert {
  id: number;
  vehicleId: string;
  type: string;
  zone: string;
  position: [number, number];
  time: string;
  message: string;
}

export type HarshEventSeverity = "minor" | "moderate" | "severe";

export interface HarshEvent {
  id: string;
  vehicleId: string;
  vehicleRegistration: string;
  driverName: string;
  eventType: string; // Harsh Braking, Harsh Acceleration, Harsh Cornering
  severity: HarshEventSeverity;
  speedKph: number;
  timestamp: string; // ISO
  position: [number, number];
  roadName?: string;
}

const HARSH_SEVERITY_COLORS: Record<HarshEventSeverity, string> = {
  minor: "#eab308",      // yellow-500
  moderate: "#f97316",   // orange-500
  severe: "#ef4444",     // red-500
};

const createHarshEventIcon = (severity: HarshEventSeverity) => {
  const color = HARSH_SEVERITY_COLORS[severity];
  return L.divIcon({
    className: "harsh-event-marker",
    html: `
      <div style="
        width: 22px;
        height: 22px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      ">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
          <path d="M12 2L2 22h20L12 2zm0 6v6m0 4h.01"/>
        </svg>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};


// Helper to convert database geofence to map display format
const convertGeofenceToZone = (gf: Geofence): GeofenceZone => {
  const geometry = gf.geometry as { type: string; coordinates: unknown } | null;
  let center: [number, number] = [6.5244, 3.3792]; // Lagos default
  
  if (geometry?.type === 'Point' && Array.isArray(geometry.coordinates)) {
    // GeoJSON Point is [lng, lat], we need [lat, lng]
    const coords = geometry.coordinates as number[];
    center = [coords[1] ?? 0, coords[0] ?? 0];
  } else if (geometry?.type === 'Polygon' && Array.isArray(geometry.coordinates)) {
    // For polygon, calculate centroid from first ring
    const rings = geometry.coordinates as number[][][];
    const ring = rings[0];
    if (ring && ring.length > 0) {
      const sumLat = ring.reduce((sum, coord) => sum + (coord[1] ?? 0), 0);
      const sumLng = ring.reduce((sum, coord) => sum + (coord[0] ?? 0), 0);
      center = [sumLat / ring.length, sumLng / ring.length];
    }
  }
  
  return {
    id: gf.id as unknown as number, // For compatibility with existing code
    name: gf.name,
    center,
    radius: gf.radius_meters || 500,
    color: gf.color,
    type: gf.category as GeofenceZone['type'],
  };
};

// Mock geofence alerts (Lagos, Nigeria)
const geofenceAlerts: GeofenceAlert[] = [
  {
    id: 1,
    vehicleId: "LAG-890-CD",
    type: "exit",
    zone: "Lagos Depot",
    position: [6.5833, 3.3500],
    time: "10:32 AM",
    message: "Vehicle in maintenance zone",
  },
  {
    id: 2,
    vehicleId: "LAG-112-EF",
    type: "enter",
    zone: "Apapa Port Zone",
    position: [6.4698, 3.5852],
    time: "11:15 AM",
    message: "Vehicle entered port zone",
  },
];

interface FleetMapProps {
  selectedVehicle?: string | null;
  onVehicleSelect?: (vehicleId: string) => void;
  showGeofences?: boolean;
  showRoutes?: boolean;
  showAlerts?: boolean;
  /** External vehicle data from parent (real DB vehicles). When provided and non-empty, mock data is skipped. */
  externalVehicles?: Vehicle[];
  /** Harsh driving event pins to render on the map (filtered to recent events by parent) */
  harshEvents?: HarshEvent[];
  /** Called when the user clicks "View route playback" inside a harsh event popup */
  onHarshEventPlayback?: (event: HarshEvent) => void;
}

export function FleetMap({
  selectedVehicle,
  onVehicleSelect,
  showGeofences = true,
  showRoutes = true,
  showAlerts = true,
  externalVehicles,
  harshEvents,
  onHarshEventPlayback,
}: FleetMapProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(externalVehicles ?? []);

  // Fetch geofences from database
  const { geofences: dbGeofences } = useGeofences();
  
  // Convert database geofences to map display format
  const geofenceZones = useMemo(() => {
    return (dbGeofences || [])
      .filter(gf => gf.status === 'ACTIVE')
      .map(convertGeofenceToZone);
  }, [dbGeofences]);

  // Realtime tracking hook for live device locations
  const {
    locations: realtimeLocations,
    isConnected,
    lastUpdate,
  } = useRealtimeTracking();

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const routeRef = useRef<Map<string, L.Polyline>>(new Map());
  const geofenceCirclesRef = useRef<Map<number, L.Circle>>(new Map());
  const alertMarkersRef = useRef<Map<number, L.Marker>>(new Map());
  const harshEventMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const harshEventPlaybackRef = useRef<typeof onHarshEventPlayback>(onHarshEventPlayback);
  useEffect(() => { harshEventPlaybackRef.current = onHarshEventPlayback; }, [onHarshEventPlayback]);

  // Merge realtime locations with mock vehicle data
  const vehiclesWithRealtimeData = useMemo(() => {
    if (realtimeLocations.length === 0) {
      return vehicles;
    }

    // Map of locations by device
    const locationsByDevice = new Map<string, RealtimeVehicleLocation>();
    realtimeLocations.forEach((loc) => {
      locationsByDevice.set(loc.deviceId, loc);
    });

    return vehicles.map((vehicle, index) => {
      // Demo mapping: round-robin assign locations to vehicles
      const realtimeLocation = realtimeLocations[index % realtimeLocations.length];

      if (realtimeLocation) {
        const isMoving = realtimeLocation.speed > 5;
        return {
          ...vehicle,
          position: [realtimeLocation.latitude, realtimeLocation.longitude] as [number, number],
          heading: realtimeLocation.heading,
          speed: Math.round(realtimeLocation.speed),
          fuel: realtimeLocation.fuelLevel || vehicle.fuel,
          status: isMoving ? "moving" : realtimeLocation.speed > 0 ? "idle" : "stopped",
          lastUpdate: formatDistanceToNow(realtimeLocation.timestamp, { addSuffix: true }),
          batteryVoltage: realtimeLocation.batteryVoltage ?? vehicle.batteryVoltage,
          networkStatus: (isMoving || realtimeLocation.speed > 0) ? "online" as const : vehicle.networkStatus,
        };
      }
      return vehicle;
    });
  }, [vehicles, realtimeLocations]);

  // Sync external vehicles when prop changes
  useEffect(() => {
    if (externalVehicles && externalVehicles.length > 0) {
      setVehicles(externalVehicles);
    }
  }, [externalVehicles]);

  // Fallback simulation for demo when no realtime data and no external vehicles
  useEffect(() => {
    if (realtimeLocations.length > 0) return;
    // Only simulate for demo/mock vehicles, not real external data
    if (externalVehicles && externalVehicles.length > 0) return;

    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((vehicle) => {
          if (vehicle.status === "moving") {
            const newLat = vehicle.position[0] + (Math.random() - 0.5) * 0.002;
            const newLng = vehicle.position[1] + (Math.random() - 0.5) * 0.002;
            const newHeading = vehicle.heading + (Math.random() - 0.5) * 20;
            const newSpeed = Math.max(0, vehicle.speed + (Math.random() - 0.5) * 10);

            return {
              ...vehicle,
              position: [newLat, newLng] as [number, number],
              heading: newHeading,
              speed: Math.round(newSpeed),
              lastUpdate: "Just now",
            };
          }
          return vehicle;
        }),
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [realtimeLocations.length, externalVehicles]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Lagos, Nigeria coordinates
    const initialCenter: [number, number] = [6.5244, 3.3792];

    const map = L.map(mapContainerRef.current, { zoomControl: false }).setView(initialCenter, 11);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Fit bounds when vehicles change
  useEffect(() => {
    if (!mapRef.current || vehiclesWithRealtimeData.length === 0) return;
    const map = mapRef.current;

    const bounds = L.latLngBounds(vehiclesWithRealtimeData.map((v) => v.position));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [vehiclesWithRealtimeData]);

  // Update vehicle markers
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const existingIds = new Set(markersRef.current.keys());
    const currentIds = new Set(vehiclesWithRealtimeData.map((v) => v.id));

    // Remove markers for vehicles no longer present
    existingIds.forEach((id) => {
      if (!currentIds.has(id)) {
        const marker = markersRef.current.get(id);
        if (marker) {
          marker.remove();
          markersRef.current.delete(id);
        }
      }
    });

    // Add / update markers
    vehiclesWithRealtimeData.forEach((vehicle) => {
      let marker = markersRef.current.get(vehicle.id);
      const isSelected = selectedVehicle === vehicle.id;
      const icon = createVehicleIcon(vehicle.status, vehicle.heading, isSelected);

      const networkColor = vehicle.networkStatus === 'online' ? '#22c55e' : vehicle.networkStatus === 'degraded' ? '#f59e0b' : '#ef4444';
      const networkLabel = vehicle.networkStatus === 'online' ? 'Online' : vehicle.networkStatus === 'degraded' ? 'Degraded' : 'Offline';
      const networkIcon = vehicle.networkStatus === 'online' ? '📶' : vehicle.networkStatus === 'degraded' ? '📶' : '📵';
      const batteryPercent = vehicle.batteryVoltage != null ? Math.min(100, Math.max(0, Math.round(((vehicle.batteryVoltage - 10.5) / (14.4 - 10.5)) * 100))) : null;
      const batteryDisplay = vehicle.batteryVoltage != null ? `${vehicle.batteryVoltage.toFixed(1)}V` : '—';
      const batteryColor = batteryPercent != null ? (batteryPercent >= 60 ? '#22c55e' : batteryPercent >= 30 ? '#f59e0b' : '#ef4444') : '#94a3b8';

      const popupContent = `
        <div style="min-width: 260px; padding: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">
            <div style="font-weight: 700; font-size: 15px;">${vehicle.id}</div>
            <span style="font-size: 11px; padding: 2px 8px; background: ${vehicle.status === 'moving' ? '#dcfce7' : vehicle.status === 'idle' ? '#fef3c7' : '#fee2e2'}; color: ${vehicle.status === 'moving' ? '#166534' : vehicle.status === 'idle' ? '#92400e' : '#991b1b'}; border-radius: 9999px; text-transform: capitalize;">${vehicle.status}</span>
          </div>
          <div style="font-size: 13px; color: #334155; margin-bottom: 10px;">
            <strong>Driver:</strong> ${vehicle.driver}
          </div>
          <div style="display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; font-size: 12px; color: #475569;">
            <div style="color: #94a3b8;">Start</div>
            <div style="font-weight: 500;">${vehicle.startLocation}</div>
            <div style="color: #94a3b8;">End</div>
            <div style="font-weight: 500;">${vehicle.destination}</div>
            <div style="color: #94a3b8;">ETA</div>
            <div style="font-weight: 600; color: #3b82f6;">${vehicle.eta}</div>
          </div>
          <div style="display: flex; gap: 10px; margin-top: 10px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; flex-wrap: wrap;">
            <div>🚗 ${vehicle.speed} km/h</div>
            <div>⛽ ${vehicle.fuel}%</div>
            <div>⏱ ${vehicle.lastUpdate}</div>
          </div>
          <div style="display: flex; gap: 10px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 11px;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <span>${networkIcon}</span>
              <span style="color: ${networkColor}; font-weight: 600;">${networkLabel}</span>
              ${vehicle.signalStrength != null ? `<span style="color: #94a3b8;">(${vehicle.signalStrength}%)</span>` : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span>🔋</span>
              <span style="color: ${batteryColor}; font-weight: 600;">${batteryDisplay}</span>
              ${batteryPercent != null ? `<span style="color: #94a3b8;">(${batteryPercent}%)</span>` : ''}
            </div>
          </div>
        </div>
      `;

      if (!marker) {
        marker = L.marker(vehicle.position, { icon, zIndexOffset: isSelected ? 1000 : 0 }).addTo(map);
        marker.on("click", () => onVehicleSelect?.(vehicle.id));
        marker.bindPopup(popupContent);
        markersRef.current.set(vehicle.id, marker);
      } else {
        marker.setLatLng(vehicle.position);
        marker.setIcon(icon);
        marker.setPopupContent(popupContent);
        marker.setZIndexOffset(isSelected ? 1000 : 0);
      }
    });
  }, [vehiclesWithRealtimeData, onVehicleSelect, selectedVehicle]);

  // Pan and zoom to selected vehicle
  useEffect(() => {
    if (!mapRef.current || !selectedVehicle) return;
    const map = mapRef.current;

    const vehicle = vehiclesWithRealtimeData.find((v) => v.id === selectedVehicle);
    if (vehicle) {
      map.flyTo(vehicle.position, 14, {
        duration: 0.8,
      });

      // Open popup for selected vehicle
      const marker = markersRef.current.get(vehicle.id);
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedVehicle, vehiclesWithRealtimeData]);

  // Update route polylines
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Clear existing
    routeRef.current.forEach((polyline) => polyline.remove());
    routeRef.current.clear();

    if (!showRoutes) return;

    vehiclesWithRealtimeData
      .filter((v) => v.route.length > 1)
      .forEach((vehicle) => {
        const polyline = L.polyline(vehicle.route, {
          color: vehicle.status === "moving" ? "#3b82f6" : "#94a3b8",
          weight: 3,
          opacity: 0.7,
          dashArray: "10, 5",
        }).addTo(map);

        routeRef.current.set(vehicle.id, polyline);
      });
  }, [vehiclesWithRealtimeData, showRoutes]);

  // Update geofence circles
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    geofenceCirclesRef.current.forEach((circle) => circle.remove());
    geofenceCirclesRef.current.clear();

    if (!showGeofences) return;

    geofenceZones.forEach((zone) => {
      const circle = L.circle(zone.center, {
        radius: zone.radius,
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: 0.15,
        weight: 2,
        dashArray: zone.type === "restricted" ? "5, 5" : undefined,
      }).addTo(map);

      circle.bindPopup(`
        <div style="min-width: 150px; padding: 8px;">
          <div style="font-weight: 600; margin-bottom: 4px;">${zone.name}</div>
          <div style="font-size: 12px; color: #666;">
            <div>Type: ${zone.type}</div>
            <div>Radius: ${zone.radius}m</div>
          </div>
        </div>
      `);

      geofenceCirclesRef.current.set(zone.id, circle);
    });
  }, [showGeofences, geofenceZones]);

  // Update geofence alert markers
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    alertMarkersRef.current.forEach((marker) => marker.remove());
    alertMarkersRef.current.clear();

    if (!showAlerts) return;

    geofenceAlerts.forEach((alert) => {
      const marker = L.marker(alert.position, { icon: createGeofenceAlertIcon() }).addTo(map);

      marker.bindPopup(`
        <div style="min-width: 200px; padding: 8px;">
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px; color:#b91c1c;">
            <span style="font-size:14px; font-weight:600;">Geofence Alert</span>
          </div>
          <div style="font-size:12px; color:#4b5563; margin-bottom:4px;">${alert.message}</div>
          <div style="display:flex; justify-content:space-between; font-size:11px; color:#9ca3af;">
            <span>${alert.vehicleId}</span>
            <span>${alert.time}</span>
          </div>
        </div>
      `);

      alertMarkersRef.current.set(alert.id, marker);
    });
  }, [showAlerts]);

  // Update harsh driving event markers
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    harshEventMarkersRef.current.forEach((m) => m.remove());
    harshEventMarkersRef.current.clear();

    const events = harshEvents || [];
    if (events.length === 0) return;

    events.forEach((event) => {
      const marker = L.marker(event.position, { icon: createHarshEventIcon(event.severity) }).addTo(map);
      const sevColor = HARSH_SEVERITY_COLORS[event.severity];
      const ts = new Date(event.timestamp);
      const tsLabel = isNaN(ts.getTime()) ? event.timestamp : ts.toLocaleString();
      const playbackId = `harsh-playback-${event.id}`;
      marker.bindPopup(`
        <div style="min-width: 240px; padding: 4px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${sevColor};"></span>
            <span style="font-size:13px; font-weight:600;">${event.eventType}</span>
            <span style="margin-left:auto;font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:${sevColor};font-weight:600;">${event.severity}</span>
          </div>
          <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 8px;font-size:11px;color:#374151;">
            <span style="color:#6b7280;">Speed</span><span>${event.speedKph} km/h</span>
            <span style="color:#6b7280;">When</span><span>${tsLabel}</span>
            <span style="color:#6b7280;">Road</span><span>${event.roadName || "—"}</span>
            <span style="color:#6b7280;">Driver</span><span>${event.driverName}</span>
            <span style="color:#6b7280;">Vehicle</span><span>${event.vehicleRegistration}</span>
          </div>
          <button id="${playbackId}" style="margin-top:8px;width:100%;padding:6px 8px;border-radius:6px;border:1px solid #e5e7eb;background:#111827;color:white;font-size:11px;font-weight:500;cursor:pointer;">
            View route playback (−2 min)
          </button>
        </div>
      `);

      marker.on("popupopen", () => {
        const btn = document.getElementById(playbackId);
        if (btn) {
          btn.onclick = () => harshEventPlaybackRef.current?.(event);
        }
      });

      harshEventMarkersRef.current.set(event.id, marker);
    });
  }, [harshEvents]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-border">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg border border-border p-3 shadow-lg z-[1000]">
        <p className="text-xs font-medium mb-2">Legend</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-success" />
            <span className="text-xs text-muted-foreground">Moving</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-warning" />
            <span className="text-xs text-muted-foreground">Idle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive" />
            <span className="text-xs text-muted-foreground">Stopped</span>
          </div>
          {showGeofences && (
            <>
              <div className="h-px bg-border my-1.5" />
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full border-2 border-primary bg-primary/20" />
                <span className="text-xs text-muted-foreground">Depot</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full border-2 border-success bg-success/20" />
                <span className="text-xs text-muted-foreground">Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full border-2 border-destructive bg-destructive/20" />
                <span className="text-xs text-muted-foreground">Restricted</span>
              </div>
            </>
          )}
          {(harshEvents && harshEvents.length > 0) && (
            <>
              <div className="h-px bg-border my-1.5" />
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ background: "#eab308" }} />
                <span className="text-xs text-muted-foreground">Harsh — minor</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ background: "#f97316" }} />
                <span className="text-xs text-muted-foreground">Harsh — moderate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ background: "#ef4444" }} />
                <span className="text-xs text-muted-foreground">Harsh — severe</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Live indicator with connection status */}
      <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border shadow-lg z-[1000] flex items-center gap-2">
        {isConnected ? (
          <>
            <Wifi className="h-3.5 w-3.5 text-success" />
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium">Live</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3.5 w-3.5 text-warning" />
            <div className="h-2 w-2 rounded-full bg-warning" />
            <span className="text-xs font-medium">Connecting...</span>
          </>
        )}
        {lastUpdate && (
          <span className="text-xs text-muted-foreground ml-1">
            {formatDistanceToNow(lastUpdate, { addSuffix: true })}
          </span>
        )}
      </div>

      {/* Realtime data indicator */}
      {realtimeLocations.length > 0 && (
        <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg z-[1000] flex items-center gap-2">
          <span className="text-xs font-medium text-primary-foreground">
            {realtimeLocations.length} devices tracking
          </span>
        </div>
      )}
    </div>
  );
}
