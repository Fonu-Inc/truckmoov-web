import type {
  LatLngExpression, LatLngTuple, Map as LeafletMap,
} from "leaflet";
import { formatHumanDuration } from "@truckmoov/app-core/utils/time-utils";
import L from "leaflet";
import {
  Check, Loader2, Minus, Plus, Sparkles,
} from "lucide-react";
import {
  useEffect, useRef, useState,
} from "react";
import { getBrowserCoordinates } from "@/lib/browserLocation";
import "leaflet/dist/leaflet.css";

export type RoutePreviewMapProps = {
  center?: LatLngExpression;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  attributionControl?: boolean;
  className?: string;
  tileUrl?: string;
  tileAttribution?: string;
  markers?: RoutePreviewMapMarker[];
  fitMarkers?: boolean;
  routeCoordinates?: LatLngExpression[];
  routeWaypoints?: LatLngTuple[];
  routeStart?: LatLngTuple;
  routeEnd?: LatLngTuple;
  routeColor?: string;
  showRouteOptimizer?: boolean;
  onMapReady?: (map: LeafletMap) => void;
  onRouteSelected?: (route: RoutePreviewMapRoute) => void;
};

export type RoutePreviewMapMarker = {
  position: LatLngExpression;
  label?: string;
  color?: string;
};

export type RoutePreviewMapRoute = {
  coordinates: LatLngTuple[];
  distanceKm: number;
  durationMinutes: number;
};

type OsrmRouteResponse = {
  code: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: { coordinates: Array<[number, number]> };
  }>;
};

const DEFAULT_CENTER: LatLngExpression = [
  6.5244,
  3.3792,
];
const LIGHT_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OPEN_STREET_MAP_ATTRIBUTION
  = "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors";
const OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving";

function createLocationPin(color: string) {
  return L.divIcon({
    className: "route-preview-map-location-pin",
    html: `
      <svg viewBox="0 0 32 42" width="32" height="42" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M16 1C7.72 1 1 7.72 1 16c0 10.31 15 24.5 15 24.5S31 26.31 31 16C31 7.72 24.28 1 16 1Z" fill="${color}" stroke="#ffffff" stroke-width="2" />
        <circle cx="16" cy="16" r="5.5" fill="#ffffff" />
      </svg>
    `,
    iconSize: [
      32,
      42,
    ],
    iconAnchor: [
      16,
      42,
    ],
    popupAnchor: [
      0,
      -42,
    ],
  });
}

/**
 * Locked Leaflet route preview with light tiles, markers, route drawing, and
 * optional route optimization when routeStart and routeEnd are provided.
 */
export function RoutePreviewMap({
  center,
  zoom = 12,
  minZoom = 3,
  maxZoom = 19,
  attributionControl = false,
  className,
  tileUrl = LIGHT_TILE_URL,
  tileAttribution = OPEN_STREET_MAP_ATTRIBUTION,
  markers = [],
  fitMarkers = false,
  routeCoordinates = [],
  routeWaypoints,
  routeStart,
  routeEnd,
  routeColor = "#2563eb",
  showRouteOptimizer = true,
  onMapReady,
  onRouteSelected,
}: RoutePreviewMapProps) {
  const initialCenter = center ?? DEFAULT_CENTER;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRefs = useRef<L.Marker[]>([]);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const routingAbortRef = useRef<AbortController | null>(null);
  const onMapReadyRef = useRef(onMapReady);
  const onRouteSelectedRef = useRef(onRouteSelected);
  const [
    optimizedRoutes,
    setOptimizedRoutes,
  ] = useState<RoutePreviewMapRoute[]>([]);
  const [
    selectedRouteIndex,
    setSelectedRouteIndex,
  ] = useState(0);
  const [
    isOptimizing,
    setIsOptimizing,
  ] = useState(false);
  const [
    routeError,
    setRouteError,
  ] = useState<string | null>(null);

  onMapReadyRef.current = onMapReady;
  onRouteSelectedRef.current = onRouteSelected;

  const selectedRoute = optimizedRoutes[selectedRouteIndex] ?? null;
  const displayedRouteCoordinates = selectedRoute?.coordinates ?? routeCoordinates;
  const optimizationPoints
    = routeWaypoints && routeWaypoints.length >= 2
      ? routeWaypoints
      : routeStart && routeEnd
        ? [
            routeStart,
            routeEnd,
          ]
        : [];
  const optimizationPointsKey = optimizationPoints
    .map(([
      lat,
      lng,
    ]) => `${lat},${lng}`)
    .join(";");
  const canOptimizeRoute = optimizationPoints.length >= 2;

  useEffect(
    () => {
      if (!containerRef.current || mapRef.current)
        return;

      const map = L.map(
        containerRef.current,
        {
          minZoom,
          maxZoom,
          zoomControl: false,
          dragging: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          touchZoom: false,
          boxZoom: false,
          keyboard: false,
          attributionControl,
        },
      ).setView(
        initialCenter,
        zoom,
      );

      L.tileLayer(
        tileUrl,
        {
          attribution: tileAttribution,
          minZoom,
          maxZoom,
        },
      ).addTo(map);

      mapRef.current = map;
      onMapReadyRef.current?.(map);
      const resizeFrame = window.requestAnimationFrame(() => map.invalidateSize());

      return () => {
        window.cancelAnimationFrame(resizeFrame);
        routingAbortRef.current?.abort();
        map.remove();
        mapRef.current = null;
        markerRefs.current = [];
        routeLayerRef.current = null;
      };
    // Map construction options are intentionally read only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [],
  );

  useEffect(
    () => {
      if (center) {
        mapRef.current?.setView(
          center,
          zoom,
        );
      }
    },
    [
      center,
      zoom,
    ],
  );

  useEffect(
    () => {
      if (center)
        return;

      let isActive = true;
      void getBrowserCoordinates().then((coordinates) => {
        if (isActive && coordinates && mapRef.current) {
          mapRef.current.setView(
            [
              coordinates.lat,
              coordinates.lng,
            ],
            zoom,
          );
        }
      });

      return () => {
        isActive = false;
      };
    },
    [
      center,
      zoom,
    ],
  );

  useEffect(
    () => {
      const map = mapRef.current;
      if (!map)
        return;

      markerRefs.current.forEach(marker => marker.remove());
      markerRefs.current = markers.map((markerConfig) => {
        const marker = L.marker(
          markerConfig.position,
          { icon: createLocationPin(markerConfig.color ?? "#16a34a") },
        ).addTo(map);

        if (markerConfig.label)
          marker.bindPopup(markerConfig.label);
        return marker;
      });

      if (fitMarkers && !selectedRoute) {
        if (markers.length === 1) {
          map.setView(
            markers[0].position,
            Math.max(
              zoom,
              15,
            ),
          );
        }
        else if (markers.length > 1) {
          map.fitBounds(
            L.latLngBounds(markers.map(marker => L.latLng(marker.position))),
            {
              padding: [
                60,
                60,
              ], maxZoom: 15,
            },
          );
        }
      }
    },
    [
      fitMarkers,
      markers,
      selectedRoute,
      zoom,
    ],
  );

  useEffect(
    () => {
      const map = mapRef.current;
      if (!map)
        return;

      routeLayerRef.current?.remove();
      routeLayerRef.current = null;

      if (displayedRouteCoordinates.length < 2)
        return;

      routeLayerRef.current = L.layerGroup([
        L.polyline(
          displayedRouteCoordinates,
          {
            color: "#ffffff",
            weight: 9,
            opacity: 0.9,
            lineCap: "round",
            lineJoin: "round",
          },
        ),
        L.polyline(
          displayedRouteCoordinates,
          {
            color: routeColor,
            weight: 5,
            opacity: 1,
            lineCap: "round",
            lineJoin: "round",
          },
        ),
      ]).addTo(map);

      map.fitBounds(
        L.latLngBounds(displayedRouteCoordinates),
        {
          padding: [
            70,
            70,
          ],
          maxZoom: 16,
        },
      );
    },
    [
      displayedRouteCoordinates,
      routeColor,
    ],
  );

  useEffect(
    () => {
      routingAbortRef.current?.abort();
      setOptimizedRoutes([]);
      setSelectedRouteIndex(0);
      setRouteError(null);
      setIsOptimizing(false);
    },
    [optimizationPointsKey],
  );

  const optimizeRoute = async () => {
    if (optimizationPoints.length < 2 || isOptimizing)
      return;

    routingAbortRef.current?.abort();
    const controller = new AbortController();
    routingAbortRef.current = controller;
    setIsOptimizing(true);
    setRouteError(null);
    setOptimizedRoutes([]);

    const coordinates = optimizationPoints
      .map(([
        lat,
        lng,
      ]) => `${lng},${lat}`)
      .join(";");
    const params = new URLSearchParams({
      alternatives: "3",
      overview: "full",
      geometries: "geojson",
      steps: "false",
    });

    try {
      const response = await fetch(
        `${OSRM_ROUTE_URL}/${coordinates}?${params.toString()}`,
        { signal: controller.signal },
      );
      if (!response.ok)
        throw new Error("Route request failed");

      const data = (await response.json()) as OsrmRouteResponse;
      if (data.code !== "Ok" || !data.routes?.length) {
        setRouteError("No driving route was found between these points.");
        return;
      }

      const routes = data.routes.map(route => ({
        coordinates: route.geometry.coordinates.map(
          ([
            lng,
            lat,
          ]) => [
            lat,
            lng,
          ] as LatLngTuple,
        ),
        distanceKm: route.distance / 1000,
        durationMinutes: Math.round(route.duration / 60),
      }));

      setOptimizedRoutes(routes);
      setSelectedRouteIndex(0);
      onRouteSelectedRef.current?.(routes[0]);
    }
    catch (error) {
      if ((error as Error).name !== "AbortError") {
        setRouteError("Unable to optimize routes right now.");
      }
    }
    finally {
      if (!controller.signal.aborted)
        setIsOptimizing(false);
    }
  };

  const selectRoute = (index: number) => {
    setSelectedRouteIndex(index);
    onRouteSelectedRef.current?.(optimizedRoutes[index]);
  };

  return (
    <div
      className={`relative overflow-hidden ${className ?? ""}`}
      style={{
        height: "100%", width: "100%", background: "#f8fafc",
      }}
    >
      <div
        ref={containerRef}
        className="absolute inset-0"
      />

      <div className="absolute left-3 top-3 z-[1000] overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-md">
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn()}
          className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-muted"
          aria-label="Zoom in"
          title="Zoom in"
        >
          <Plus className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut()}
          className="flex h-9 w-9 items-center justify-center border-t border-border transition-colors hover:bg-muted"
          aria-label="Zoom out"
          title="Zoom out"
        >
          <Minus className="h-5 w-5" />
        </button>
      </div>

      {showRouteOptimizer && canOptimizeRoute && (
        <div className="absolute right-3 top-3 z-[1000] flex max-w-[calc(100%-4.5rem)] flex-col items-end gap-2">
          {optimizedRoutes.length > 0 && (
            <div
              className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-border bg-card/95 p-1 text-card-foreground shadow-md backdrop-blur-sm"
              role="radiogroup"
              aria-label="Optimized route options"
            >
              {optimizedRoutes.map((route, index) => {
                const isSelected = selectedRouteIndex === index;
                return (
                  <button
                    key={`${route.distanceKm}-${route.durationMinutes}-${index}`}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => selectRoute(index)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/40 hover:bg-muted"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/50"
                      }`}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5" />}
                    </span>
                    <span>
                      <span className="block text-[11px] font-medium leading-tight">
                        {index === 0 ? "Recommended" : `Route ${index + 1}`}
                      </span>
                      <span className="block text-[10px] leading-tight text-muted-foreground">
                        {route.distanceKm.toFixed(1)}
                        {" "}
                        km &middot;
                        {" "}
                        {formatHumanDuration(route.durationMinutes * 60)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {routeError && (
            <p className="max-w-xs rounded-md bg-destructive px-2.5 py-1.5 text-xs text-destructive-foreground shadow-md">
              {routeError}
            </p>
          )}

          {optimizedRoutes.length === 0 && (
            <button
              type="button"
              onClick={optimizeRoute}
              disabled={isOptimizing}
              className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isOptimizing
                ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )
                : (
                    <Sparkles className="h-4 w-4" />
                  )}
              {isOptimizing ? "Optimizing routes..." : "Optimize route"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
