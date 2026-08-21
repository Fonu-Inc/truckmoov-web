import L from "leaflet";
import {
  Activity,
  CheckCircle2,
  Gauge,
  MapPin,
  Maximize2,
  Minimize2,
  Package,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import {
  useEffect, useRef, useState,
} from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Dialog, DialogContent,
} from "@/components/shadcn/dialog";
import "leaflet/dist/leaflet.css";

// ponytail: every figure below is static demo data — swap these consts for
// @truckmoov/api queries (see docs/api.md) when there is real enterprise job data.
const completedJobs = 3;
const activeJobs = 6;
const vehicleUtilization = 78;
const onTimeRate = 92;

const utilizationByRegion = [
  {
    region: "Lagos", utilization: 86,
  },
  {
    region: "Abuja", utilization: 72,
  },
  {
    region: "Port Harcourt", utilization: 64,
  },
  {
    region: "Kano", utilization: 58,
  },
  {
    region: "Ibadan", utilization: 45,
  },
];

const topDrivers = [
  {
    name: "Emeka Okafor", jobs: 42, km: 8420, score: 96,
  },
  {
    name: "Aisha Bello", jobs: 38, km: 7180, score: 93,
  },
  {
    name: "Chinedu Obi", jobs: 35, km: 6890, score: 89,
  },
  {
    name: "Fatima Musa", jobs: 31, km: 5940, score: 84,
  },
  {
    name: "Tunde Adeyemi", jobs: 28, km: 5210, score: 78,
  },
];

const weeklyVolume = [
  {
    day: "Mon", completed: 14, inProgress: 6,
  },
  {
    day: "Tue", completed: 18, inProgress: 8,
  },
  {
    day: "Wed", completed: 22, inProgress: 5,
  },
  {
    day: "Thu", completed: 19, inProgress: 9,
  },
  {
    day: "Fri", completed: 26, inProgress: 11,
  },
  {
    day: "Sat", completed: 17, inProgress: 4,
  },
  {
    day: "Sun", completed: 9, inProgress: 3,
  },
];

// Delivery waypoints for the map (pickup + delivery pairs across Nigeria)
const deliveryPoints: Array<{
  id: string;
  ref: string;
  pickup: [number, number];
  delivery: [number, number];
  label: string;
}> = [
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

const pickupCount = deliveryPoints.length;
const deliveryCount = deliveryPoints.length;
const stopCount = pickupCount + deliveryCount;

// Shared initializer so the inline and enlarged maps stay in sync visually.
// ponytail: markers go straight on the map — no clustering. Add
// leaflet.markercluster if the waypoint count ever outgrows a readable map.
function initMap(container: HTMLDivElement) {
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

  deliveryPoints.forEach((p) => {
    L.polyline(
      [
        p.pickup,
        p.delivery,
      ],
      {
        color: "hsl(var(--primary))", weight: 2, opacity: 0.4, dashArray: "6,6",
      },
    ).addTo(map);

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

  return map;
}

/**
 * Enterprise Logistics Dashboard
 * Read-only view of enterprise-wide delivery activity and provider performance.
 */
export default function EnterpriseLogisticsDashboard() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const enlargedMapRef = useRef<HTMLDivElement>(null);
  const enlargedMapInstanceRef = useRef<L.Map | null>(null);
  const [
    mapEnlarged,
    setMapEnlarged,
  ] = useState(false);

  // Inline map
  useEffect(
    () => {
      if (!mapRef.current || mapInstanceRef.current)
        return;
      mapInstanceRef.current = initMap(mapRef.current);
      return () => {
        mapInstanceRef.current?.remove();
        mapInstanceRef.current = null;
      };
    },
    [],
  );

  // Enlarged map — created lazily when the dialog opens
  useEffect(
    () => {
      if (!mapEnlarged)
        return;
      // Wait for the dialog container to mount
      const t = setTimeout(
        () => {
          if (enlargedMapRef.current && !enlargedMapInstanceRef.current) {
            enlargedMapInstanceRef.current = initMap(enlargedMapRef.current);
          }
          else if (enlargedMapInstanceRef.current) {
            enlargedMapInstanceRef.current.invalidateSize();
          }
        },
        80,
      );
      return () => {
        clearTimeout(t);
        if (enlargedMapInstanceRef.current) {
          enlargedMapInstanceRef.current.remove();
          enlargedMapInstanceRef.current = null;
        }
      };
    },
    [mapEnlarged],
  );

  return (
    <DashboardLayout
      title="Logistics Dashboard"
      subtitle="Enterprise-wide job monitoring & provider performance"
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Jobs Completed"
            value={completedJobs}
            icon={CheckCircle2}
            variant="success"
            change={12}
            changeLabel="vs last month"
          />
          <StatCard
            title="Active Deliveries"
            value={activeJobs}
            icon={Truck}
            variant={activeJobs > 0 ? "success" : "default"}
          />
          <StatCard
            title="Vehicle Utilization"
            value={`${vehicleUtilization}%`}
            icon={Gauge}
            variant={vehicleUtilization >= 70 ? "success" : "warning"}
            change={5}
            changeLabel="7d"
          />
          <StatCard
            title="On-Time Delivery"
            value={`${onTimeRate}%`}
            icon={TrendingUp}
            variant={onTimeRate >= 90 ? "success" : "default"}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Geo Map */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Active Deliveries Map
              </CardTitle>
              <CardDescription>Live view of pickups and drop-offs across the network</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`relative ${mapEnlarged ? "invisible" : ""}`}>
                <div
                  ref={mapRef}
                  className="h-[380px] w-full rounded-lg overflow-hidden border border-border"
                />

                {/* Stops / active deliveries indicator overlay — top-right */}
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

                {/* Enlarge button — bottom-right */}
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

          {/* Enlarged map dialog */}
          <Dialog
            open={mapEnlarged}
            onOpenChange={setMapEnlarged}
          >
            <DialogContent className="max-w-[95vw] w-[95vw] h-[92vh] p-0 bg-card border-border flex flex-col z-[1200]">
              <div className="flex-1 p-3 min-h-0 relative">
                <div
                  ref={enlargedMapRef}
                  className="h-full w-full rounded-lg overflow-hidden border border-border"
                />

                {/* Stops indicator on enlarged view — top-right */}
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

                {/* Collapse button */}
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

          {/* Vehicle Utilization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Fleet Utilization
              </CardTitle>
              <CardDescription>Vehicles in-use vs idle by region</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer
                width="100%"
                height={260}
              >
                <BarChart
                  data={utilizationByRegion}
                  layout="vertical"
                  margin={{
                    left: 8, right: 8,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    domain={[
                      0,
                      100,
                    ]}
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    type="category"
                    dataKey="region"
                    tick={{ fontSize: 11 }}
                    width={70}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12,
                    }}
                    formatter={(v: number) => [
                      `${v}%`,
                      "Utilization",
                    ]}
                  />
                  <Bar
                    dataKey="utilization"
                    radius={[
                      0,
                      4,
                      4,
                      0,
                    ]}
                  >
                    {utilizationByRegion.map(r => (
                      <Cell
                        key={r.region}
                        fill={r.utilization >= 75 ? "hsl(var(--success))" : r.utilization >= 50 ? "hsl(var(--primary))" : "hsl(var(--warning))"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Driver Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Top Driver Performance
              </CardTitle>
              <CardDescription>Ranked by completed jobs and on-time score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topDrivers.map((d, i) => (
                  <div
                    key={d.name}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{d.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {d.jobs}
                          {" "}
                          jobs ·
                          {" "}
                          {d.km.toLocaleString()}
                          {" "}
                          km
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-semibold">
                        {d.score}
                        %
                      </p>
                      <Badge
                        variant="outline"
                        className={d.score >= 90 ? "text-success border-success/30" : d.score >= 75 ? "text-primary border-primary/30" : "text-warning border-warning/30"}
                      >
                        {d.score >= 90 ? "Excellent" : d.score >= 75 ? "Good" : "Fair"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Delivery volume */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Weekly Delivery Volume
              </CardTitle>
              <CardDescription>Jobs completed per day this week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer
                width="100%"
                height={260}
              >
                <BarChart data={weeklyVolume}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip contentStyle={{
                    backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12,
                  }}
                  />
                  <Bar
                    dataKey="completed"
                    fill="hsl(var(--success))"
                    radius={[
                      4,
                      4,
                      0,
                      0,
                    ]}
                    name="Completed"
                  />
                  <Bar
                    dataKey="inProgress"
                    fill="hsl(var(--primary))"
                    radius={[
                      4,
                      4,
                      0,
                      0,
                    ]}
                    name="In Progress"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
