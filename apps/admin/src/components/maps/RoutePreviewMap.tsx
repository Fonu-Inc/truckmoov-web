import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

export interface RoutePoint {
  lat: number;
  lng: number;
  label: string;
  type: "pickup" | "delivery" | "stop";
}

interface RoutePreviewMapProps {
  points: RoutePoint[];
  className?: string;
  heightClassName?: string;
  /** Draw a connecting polyline between points. Defaults to true. */
  showRoute?: boolean;
  /** When true, renders the route in red to signal it's an applied optimized route. */
  isOptimized?: boolean;
}

const COLORS: Record<RoutePoint["type"], string> = {
  pickup: "#22c55e",
  delivery: "#ef4444",
  stop: "#f59e0b",
};

function createNumberedPin(index: number, type: RoutePoint["type"], optimized: boolean) {
  const color = optimized ? "#ef4444" : COLORS[type];
  const ring = optimized ? "#fecaca" : "white";
  return L.divIcon({
    className: "route-preview-pin",
    html: `
      <div style="position:relative;width:34px;height:44px;">
        <svg viewBox="0 0 32 42" width="34" height="44" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.2 0 0 7.2 0 16c0 11 16 26 16 26s16-15 16-26C32 7.2 24.8 0 16 0z" fill="${color}" stroke="${ring}" stroke-width="2"/>
        </svg>
        <span style="position:absolute;top:8px;left:0;right:0;text-align:center;color:white;font-weight:700;font-size:13px;font-family:sans-serif;">${index + 1}</span>
      </div>
    `,
    iconSize: [34, 44],
    iconAnchor: [17, 44],
  });
}

export function RoutePreviewMap({
  points,
  className,
  heightClassName = "h-[260px]",
  showRoute = true,
  isOptimized = false,
}: RoutePreviewMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // Init
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([6.5244, 3.3792], 6);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Render points
  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;
    layerRef.current.clearLayers();

    const valid = points.filter((p) => p.lat && p.lng);
    if (valid.length === 0) return;

    valid.forEach((p, i) => {
      const m = L.marker([p.lat, p.lng], { icon: createNumberedPin(i, p.type, isOptimized) });
      m.bindPopup(
        `<div style="font-family:sans-serif;font-size:12px;"><strong>${i + 1}. ${p.type.toUpperCase()}</strong><br/>${p.label}</div>`
      );
      layerRef.current!.addLayer(m);
    });

    if (showRoute && valid.length >= 2) {
      const line = L.polyline(
        valid.map((p) => [p.lat, p.lng] as [number, number]),
        isOptimized
          ? { color: "#ef4444", weight: 5, opacity: 0.95 }
          : { color: "#3b82f6", weight: 4, opacity: 0.85, dashArray: "8 6" }
      );
      layerRef.current.addLayer(line);
    }

    const bounds = L.latLngBounds(valid.map((p) => [p.lat, p.lng] as [number, number]));
    mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: valid.length === 1 ? 13 : 14 });
  }, [points, showRoute, isOptimized]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full rounded-md overflow-hidden border border-border bg-muted",
        heightClassName,
        className
      )}
    />
  );
}



