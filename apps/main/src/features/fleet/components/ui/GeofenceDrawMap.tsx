import { NIGERIA_BBOX } from "@truckmoov/app-core/geo/nigeria";
import {
  MAP_ATTRIBUTION, MAP_TILES_LIGHT,
} from "@truckmoov/reusables/lib/map";
import L from "leaflet";
import {
  useEffect, useRef,
} from "react";
import "leaflet/dist/leaflet.css";

type Props = {
  shape: "CIRCLE" | "POLYGON";
  center: [number, number];
  radiusMeters: number;
  /** Polygon vertices as [lat, lng]. */
  points: [number, number][];
  color: string;
  onMapClick: (latLng: [number, number]) => void;
};

/** Zone editor map: a click moves a circle's centre or adds a polygon vertex. */
export function GeofenceDrawMap({
  shape, center, radiusMeters, points, color, onMapClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const clickRef = useRef(onMapClick);
  // Centre only seeds the first view; later edits must not yank the map around.
  const initialCenterRef = useRef(center);
  useEffect(() => {
    clickRef.current = onMapClick;
  });

  useEffect(
    () => {
      if (!containerRef.current)
        return;
      const map = L.map(
        containerRef.current,
        {
          minZoom: 6,
          maxBounds: [
            [
              NIGERIA_BBOX.minLat,
              NIGERIA_BBOX.minLng,
            ],
            [
              NIGERIA_BBOX.maxLat,
              NIGERIA_BBOX.maxLng,
            ],
          ],
          maxBoundsViscosity: 1,
        },
      ).setView(
        initialCenterRef.current,
        13,
      );
      L.tileLayer(
        MAP_TILES_LIGHT,
        {
          attribution: MAP_ATTRIBUTION, maxZoom: 19,
        },
      ).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      map.on(
        "click",
        e => clickRef.current([
          e.latlng.lat,
          e.latlng.lng,
        ]),
      );
      mapRef.current = map;
      // The dialog animates in, so Leaflet measures a zero-size box at first.
      const resize = setTimeout(
        () => map.invalidateSize(),
        250,
      );
      return () => {
        clearTimeout(resize);
        layerRef.current = null;
        mapRef.current = null;
        map.remove();
      };
    },
    [],
  );

  useEffect(
    () => {
      const layer = layerRef.current;
      if (!layer)
        return;
      layer.clearLayers();
      const style = {
        color, weight: 2, fillOpacity: 0.15,
      };
      if (shape === "CIRCLE") {
        L.circle(
          center,
          {
            ...style, radius: radiusMeters,
          },
        ).addTo(layer);
        L.circleMarker(
          center,
          {
            radius: 4, color, fillOpacity: 1,
          },
        ).addTo(layer);
        return;
      }
      if (points.length >= 3) {
        L.polygon(
          points,
          style,
        ).addTo(layer);
      }
      else if (points.length === 2) {
        L.polyline(
          points,
          style,
        ).addTo(layer);
      }
      points.forEach(p => L.circleMarker(
        p,
        {
          radius: 4, color, fillOpacity: 1,
        },
      ).addTo(layer));
    },
    [
      shape,
      center,
      radiusMeters,
      points,
      color,
    ],
  );

  return (
    <div
      ref={containerRef}
      className="h-56 w-full rounded-lg border border-border overflow-hidden isolate"
    />
  );
}
