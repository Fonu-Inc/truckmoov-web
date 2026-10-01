import L from "leaflet";
import {
  Map, MapPin, Maximize2, Minimize2, Truck,
} from "lucide-react";
import {
  useEffect, useMemo, useRef, useState,
} from "react";
import { Link } from "react-router";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Dialog, DialogContent,
} from "@/components/shadcn/dialog";
import "leaflet/dist/leaflet.css";

export type DeliveryPoint = {
  id: string;
  ref: string;
  pickup: [number, number];
  delivery: [number, number];
  label: string;
};

const DEFAULT_POINTS: DeliveryPoint[] = [
  {
    id: "d1", ref: "JOB-2401", pickup: [
      6.4453,
      3.3906,
    ], delivery: [
      6.6018,
      3.3515,
    ], label: "Apapa → Ikeja",
  },
  {
    id: "d2", ref: "JOB-2403", pickup: [
      6.4478,
      3.4723,
    ], delivery: [
      4.8156,
      7.0498,
    ], label: "Lekki → PH",
  },
  {
    id: "d3", ref: "JOB-2404", pickup: [
      6.4281,
      3.4219,
    ], delivery: [
      7.3775,
      3.9470,
    ], label: "VI → Ibadan",
  },
  {
    id: "d4", ref: "JOB-2406", pickup: [
      4.9757,
      8.3417,
    ], delivery: [
      6.4402,
      7.4996,
    ], label: "Calabar → Enugu",
  },
  {
    id: "d5", ref: "JOB-2408", pickup: [
      6.4380,
      3.5710,
    ], delivery: [
      10.5222,
      7.4383,
    ], label: "Lekki FZ → Kaduna",
  },
  {
    id: "d6", ref: "JOB-2402", pickup: [
      6.4404,
      3.3596,
    ], delivery: [
      9.0765,
      7.3986,
    ], label: "Tin Can → Abuja",
  },
];

type ActiveDeliveriesMapProps = {
  points?: DeliveryPoint[];
  className?: string;
  height?: string;
  description?: string;
};

// Same public OSRM demo server RoutePreviewMap uses.
// ponytail: one request per delivery, no cache — fine for a handful of jobs; move
// to a backend route endpoint (or self-hosted OSRM) before this shows many deliveries.
const OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving";

async function fetchRoadRoute(
  from: [number, number],
  to: [number, number],
  signal: AbortSignal,
): Promise<[number, number][] | null> {
  const res = await fetch(
    `${OSRM_ROUTE_URL}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`,
    { signal },
  );
  if (!res.ok)
    return null;
  const data = (await res.json()) as {
    code: string; routes?: { geometry: { coordinates: [number, number][] } }[];
  };
  const coords = data.code === "Ok" ? data.routes?.[0]?.geometry.coordinates : undefined;
  return coords ? coords.map(([
    lng,
    lat,
  ]) => [
    lat,
    lng,
  ]) : null;
}

// ponytail: markers go straight on the map — no clustering. Add
// leaflet.markercluster if the waypoint count ever outgrows a readable map.
function initMap(container: HTMLDivElement, deliveryPoints: DeliveryPoint[]) {
  const map = L.map(
    container,
    {
      center: [
        9.082,
        8.6753,
      ],
      zoom: 6,
      zoomControl: true,
      attributionControl: false,
    },
  );
  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { maxZoom: 19 },
  ).addTo(map);

  const pickupIcon = L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:hsl(var(--primary));border:2px solid white;box-shadow:0 0 0 1px hsl(var(--primary));"></div>`,
    iconSize: [
      14,
      14,
    ],
    iconAnchor: [
      7,
      7,
    ],
  });
  const deliveryIcon = L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:hsl(var(--success));border:2px solid white;box-shadow:0 0 0 1px hsl(var(--success));"></div>`,
    iconSize: [
      14,
      14,
    ],
    iconAnchor: [
      7,
      7,
    ],
  });

  // Leaflet fires "unload" on map.remove(); abort in-flight route requests so they don't draw on a dead map.
  const controller = new AbortController();
  map.on(
    "unload",
    () => controller.abort(),
  );

  deliveryPoints.forEach((p) => {
    // Dashed straight line until the road route arrives (or if routing fails).
    const line = L.polyline(
      [
        p.pickup,
        p.delivery,
      ],
      {
        // SVG stroke attributes can't resolve var(); currentColor picks up the container's text-primary.
        color: "currentColor", weight: 3, opacity: 0.8, dashArray: "6,6",
      },
    ).addTo(map);

    fetchRoadRoute(
      p.pickup,
      p.delivery,
      controller.signal,
    )
      .then((coords) => {
        if (coords) {
          line.setLatLngs(coords).setStyle({
            dashArray: undefined, opacity: 0.9,
          });
        }
      })
      .catch(() => { /* keep the straight line */ });

    L.marker(
      p.pickup,
      { icon: pickupIcon },
    )
      .bindPopup(`<b>${p.ref}</b><br/>Pickup: ${p.label.split(" → ")[0]}`)
      .addTo(map);
    L.marker(
      p.delivery,
      { icon: deliveryIcon },
    )
      .bindPopup(`<b>${p.ref}</b><br/>Delivery: ${p.label.split(" → ")[1]}`)
      .addTo(map);
  });

  // Frame every pickup and drop-off on load; the Nigeria-wide default above stays for an empty list.
  if (deliveryPoints.length > 0) {
    map.fitBounds(
      deliveryPoints.flatMap(p => [
        p.pickup,
        p.delivery,
      ]),
      {
        padding: [
          40,
          40,
        ],
        maxZoom: 14,
      },
    );
  }

  return map;
}

export function ActiveDeliveriesMap({
  points,
  className,
  height = "380px",
  description = "Live view of pickups and drop-offs across your active jobs",
}: ActiveDeliveriesMapProps) {
  const deliveryPoints = useMemo(
    () => points ?? DEFAULT_POINTS,
    [points],
  );

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const enlargedMapRef = useRef<HTMLDivElement>(null);
  const enlargedMapInstance = useRef<L.Map | null>(null);
  const [
    mapEnlarged,
    setMapEnlarged,
  ] = useState(false);

  const pickupCount = deliveryPoints.length;
  const deliveryCount = deliveryPoints.length;
  const stopCount = pickupCount + deliveryCount;

  useEffect(
    () => {
      if (!mapRef.current || mapInstance.current)
        return;
      mapInstance.current = initMap(
        mapRef.current,
        deliveryPoints,
      );
      return () => {
        mapInstance.current?.remove();
        mapInstance.current = null;
      };
    },
    [deliveryPoints],
  );

  useEffect(
    () => {
      if (!mapEnlarged)
        return;
      const t = setTimeout(
        () => {
          if (enlargedMapRef.current && !enlargedMapInstance.current) {
            enlargedMapInstance.current = initMap(
              enlargedMapRef.current,
              deliveryPoints,
            );
          }
          else if (enlargedMapInstance.current) {
            enlargedMapInstance.current.invalidateSize();
          }
        },
        80,
      );
      return () => {
        clearTimeout(t);
        if (enlargedMapInstance.current) {
          enlargedMapInstance.current.remove();
          enlargedMapInstance.current = null;
        }
      };
    },
    [
      mapEnlarged,
      deliveryPoints,
    ],
  );

  return (
    <>
      <Card className={className}>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5 text-primary" />
              Active Deliveries Map
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link to="/map">
              <Map className="h-4 w-4 mr-2" />
              View Live Map
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className={`relative ${mapEnlarged ? "invisible" : ""}`}>
            <div
              ref={mapRef}
              style={{ height }}
              className="w-full rounded-lg overflow-hidden border border-border text-primary"
            />

            <div className="absolute top-3 right-3 z-[400] rounded-md bg-background/90 backdrop-blur border border-border px-2.5 py-1.5 text-[11px] shadow-sm">
              <div className="flex items-center gap-1.5 font-medium">
                <Truck className="h-3 w-3 text-primary" />
                {deliveryPoints.length}
                {" "}
                active deliveries
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {stopCount}
                {" "}
                stops ·
                {" "}
                {pickupCount}
                {" "}
                pickups ·
                {" "}
                {deliveryCount}
                {" "}
                drop-offs
              </div>
            </div>

            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={() => setMapEnlarged(true)}
              className="absolute bottom-3 right-3 z-[400] h-9 w-9 rounded-full shadow-lg"
              title="Enlarge map"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              {" "}
              Pickup
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-success" />
              {" "}
              Delivery
            </div>
            <div className="ml-auto">
              {deliveryPoints.length}
              {" "}
              active waypoints
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={mapEnlarged}
        onOpenChange={setMapEnlarged}
      >
        <DialogContent className="max-w-[95vw] w-[95vw] h-[92vh] p-0 bg-card border-border flex flex-col z-[1200]">
          <div className="flex-1 p-3 min-h-0 relative">
            <div
              ref={enlargedMapRef}
              className="h-full w-full rounded-lg overflow-hidden border border-border text-primary"
            />

            <div className="absolute top-6 right-6 z-[400] rounded-md bg-background/90 backdrop-blur border border-border px-3 py-2 text-xs shadow-sm">
              <div className="flex items-center gap-2 font-medium">
                <Truck className="h-3.5 w-3.5 text-primary" />
                {deliveryPoints.length}
                {" "}
                active deliveries
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {stopCount}
                {" "}
                stops ·
                {" "}
                {pickupCount}
                {" "}
                pickups ·
                {" "}
                {deliveryCount}
                {" "}
                drop-offs
              </div>
            </div>

            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={() => setMapEnlarged(false)}
              className="absolute bottom-6 right-6 z-[400] h-10 w-10 rounded-full shadow-lg"
              title="Collapse map"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
