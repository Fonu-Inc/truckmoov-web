import {
  Activity,
  ArrowRight,
  ChevronRight,
  Clock,
  MapPin,
  MessageSquare,
  Package,
  ShieldAlert,
  Truck,
  Users,
} from "lucide-react";
import { Link } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { EmptyState } from "./EmptyState";

/* ── Fleet utilization ─────────────────────────────────────────── */

const DEFAULT_UTILIZATION = [
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

export function FleetUtilizationCard({
  data = DEFAULT_UTILIZATION,
  vehiclesHref,
}: {
  data?: { region: string; utilization: number }[];
  vehiclesHref: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5 text-primary" />
            Fleet Utilization
          </CardTitle>
          <CardDescription>Vehicles in-use vs idle by region</CardDescription>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
        >
          <Link to={vehiclesHref}>
            View vehicles
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer
          width="100%"
          height={260}
        >
          <BarChart
            data={data}
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
              width={90}
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
              {data.map((r, i) => (
                <Cell
                  key={i}
                  fill={r.utilization >= 75 ? "hsl(var(--success))" : r.utilization >= 50 ? "hsl(var(--primary))" : "hsl(var(--warning))"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/* ── Jobs ──────────────────────────────────────────────────────── */

export interface OverviewJob {
  id: string;
  reference: string;
  status: string;
  pickup_address?: string | null;
  delivery_address?: string | null;
  amount_ngn?: number | null;
  created_at?: string | null;
}

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "completed":
      return "default";
    case "in_progress":
    case "arrived_pickup":
    case "arrived_dropoff":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

export function JobsOverviewCard({
  jobs,
  jobsHref,
  formatCurrency,
}: {
  jobs: OverviewJob[];
  jobsHref: string;
  formatCurrency: (v: number) => string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-5 w-5 text-primary" />
            Jobs
          </CardTitle>
          <CardDescription>Jobs created recently and their delivery progress</CardDescription>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
        >
          <Link to={jobsHref}>
            View jobs
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {jobs.length === 0
          ? (
              <EmptyState
                icon={Package}
                title="No jobs yet"
                description="Jobs created will appear here."
              />
            )
          : (
              <div className="space-y-2">
                {jobs.slice(
                  0,
                  8,
                ).map(job => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-secondary/30"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{job.reference}</span>
                        <Badge variant={statusVariant(job.status)}>{job.status.replace(/_/g, " ")}</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {job.pickup_address?.split(",")[0] || "Pickup"}
                          {" → "}
                          {job.delivery_address?.split(",")[0] || "Delivery"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-medium text-sm">{formatCurrency(job.amount_ngn || 0)}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.created_at
                          ? new Date(job.created_at).toLocaleDateString(
                              undefined,
                              {
                                month: "short", day: "numeric",
                              },
                            )
                          : "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
      </CardContent>
    </Card>
  );
}

/* ── Vehicles ──────────────────────────────────────────────────── */

export interface OverviewVehicle {
  id: string;
  registration_number: string;
  make?: string | null;
  model?: string | null;
  year?: number | string | null;
  status: string;
}

export function VehiclesOverviewCard({
  vehicles,
  vehiclesHref,
}: {
  vehicles: OverviewVehicle[];
  vehiclesHref: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="h-5 w-5 text-primary" />
            Vehicles
          </CardTitle>
          <CardDescription>Vehicles on your account and their current status</CardDescription>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
        >
          <Link to={vehiclesHref}>
            View vehicles
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {vehicles.length === 0
          ? (
              <EmptyState
                icon={Truck}
                title="No vehicles registered"
                description="Your vehicles will appear here once registered."
              />
            )
          : (
              <div className="space-y-3">
                {vehicles.slice(
                  0,
                  6,
                ).map(v => (
                  <Link
                    key={v.id}
                    to={vehiclesHref}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-secondary/30"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="font-medium text-sm truncate">{v.registration_number}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {v.make}
                        {" "}
                        {v.model}
                        {" · "}
                        {v.year || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={v.status === "active" ? "default" : "secondary"}>{v.status}</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
      </CardContent>
    </Card>
  );
}

/* ── Drivers ───────────────────────────────────────────────────── */

export interface OverviewDriver {
  id: string;
  name: string;
  phone?: string | null;
  licenseNumber?: string | null;
  status: string;
  score: number;
}

export function DriversOverviewCard({
  drivers,
  driversHref,
}: {
  drivers: OverviewDriver[];
  driversHref: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-primary" />
            Drivers
          </CardTitle>
          <CardDescription>Drivers on your account, availability and performance score</CardDescription>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
        >
          <Link to={driversHref}>
            View drivers
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {drivers.length === 0
          ? (
              <EmptyState
                icon={Users}
                title="No drivers yet"
                description="Drivers added to your account will appear here."
              />
            )
          : (
              <div className="space-y-3">
                {drivers.slice(
                  0,
                  6,
                ).map(d => (
                  <Link
                    key={d.id}
                    to={driversHref}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-secondary/30"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="font-medium text-sm truncate">{d.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {d.phone}
                        {" · "}
                        {d.licenseNumber || "No licence"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-semibold">
                        {d.score}
                        %
                      </span>
                      <Badge variant={d.status === "active" || d.status === "available" ? "default" : "secondary"}>
                        {d.status.replace(/_/g, " ")}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
      </CardContent>
    </Card>
  );
}

/* ── Recent alerts ─────────────────────────────────────────────── */

export interface OverviewAlert {
  id: string;
  title: string;
  description?: string;
  severity?: "critical" | "warning" | "info";
  time: string;
}

const DEFAULT_ALERTS: OverviewAlert[] = [
  {
    id: "1", title: "Harsh braking detected", description: "LAG-441-XT · Apapa Expressway", severity: "warning", time: "12 min ago",
  },
  {
    id: "2", title: "Geofence exit — Apapa Depot", description: "LAG-118-KJ left the zone", severity: "critical", time: "38 min ago",
  },
  {
    id: "3", title: "Low fuel level (18%)", description: "ABJ-902-LM · Abuja Terminal", severity: "warning", time: "1 hr ago",
  },
  {
    id: "4", title: "Device offline", description: "IMEI 8613...4471 · no heartbeat", severity: "critical", time: "2 hrs ago",
  },
  {
    id: "5", title: "Overspeeding 96 km/h", description: "PHC-330-QR · Port Harcourt", severity: "info", time: "4 hrs ago",
  },
];

export function RecentAlertsCard({
  alerts = DEFAULT_ALERTS,
  alertsHref,
}: {
  alerts?: OverviewAlert[];
  alertsHref: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Recent Alerts
          </CardTitle>
          <CardDescription>
            {alerts.length}
            {" "}
            alerts in the last 24 hours
          </CardDescription>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
        >
          <Link to={alertsHref}>
            View all
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0
          ? (
              <p className="text-sm text-muted-foreground">No alerts right now.</p>
            )
          : (
              alerts.map(a => (
                <div
                  key={a.id}
                  className="flex items-start justify-between gap-3 rounded-xl border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    {a.description && (
                      <p className="text-xs text-muted-foreground truncate">{a.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant={a.severity === "critical" ? "destructive" : a.severity === "warning" ? "secondary" : "outline"}>
                      {a.severity ?? "info"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{a.time}</span>
                  </div>
                </div>
              ))
            )}
      </CardContent>
    </Card>
  );
}

/* ── Recent activity ───────────────────────────────────────────── */

export interface OverviewActivity {
  id: string;
  title: string;
  description?: string;
  time: string;
}

export function RecentActivityCard({ items }: { items: OverviewActivity[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest events across jobs, vehicles and drivers</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0
          ? (
              <EmptyState
                icon={Activity}
                title="No activity yet"
                description="Account activity will show up here."
              />
            )
          : (
              <div className="space-y-3">
                {items.map(a => (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{a.title}</p>
                      {a.description && <p className="text-xs text-muted-foreground truncate">{a.description}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{a.time}</span>
                  </div>
                ))}
              </div>
            )}
      </CardContent>
    </Card>
  );
}

/* ── Recent chats ──────────────────────────────────────────────── */

export interface OverviewChat {
  id: string;
  name: string;
  channel: string;
  preview: string;
  time: string;
  unread: number;
}

const DEFAULT_CHATS: OverviewChat[] = [
  {
    id: "c1", name: "Emeka Okafor", channel: "WhatsApp", preview: "Arrived at the Ikeja drop-off, offloading now.", time: "4 min ago", unread: 2,
  },
  {
    id: "c2", name: "Aisha Bello", channel: "SMS", preview: "Traffic on Third Mainland, ETA pushed by 30 mins.", time: "38 min ago", unread: 0,
  },
  {
    id: "c3", name: "Sahara Haulage Ltd", channel: "WhatsApp", preview: "Please confirm the Kaduna pickup window.", time: "2 hrs ago", unread: 1,
  },
  {
    id: "c4", name: "Chinedu Obi", channel: "SMS", preview: "Fuel receipt uploaded for JOB-2406.", time: "yesterday", unread: 0,
  },
];

export function RecentChatsCard({
  chats = DEFAULT_CHATS,
  inboxHref = "/inbox",
}: {
  chats?: OverviewChat[];
  inboxHref?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-5 w-5 text-primary" />
            Recent Chats
          </CardTitle>
          <CardDescription>Latest driver and partner conversations</CardDescription>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
        >
          <Link to={inboxHref}>
            Open inbox
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {chats.map(c => (
            <Link
              key={c.id}
              to={inboxHref}
              className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5"
                  >
                    {c.channel}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{c.preview}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] text-muted-foreground">{c.time}</p>
                {c.unread > 0 && (
                  <Badge className="mt-1 h-5 px-1.5 text-[10px]">
                    {c.unread}
                    {" new"}
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
