import type { LucideIcon } from "lucide-react";
import { format } from "date-fns";
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
import {
  Avatar, AvatarFallback,
} from "@/components/shadcn/avatar";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  SLEEK_HEADER, SLEEK_TITLE, SleekCard,
} from "./DashboardListCard";
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
  data?: {
    region: string; utilization: number;
  }[];
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

export type OverviewJob = {
  id: string;
  reference: string;
  status: string;
  pickup_address?: string | null;
  delivery_address?: string | null;
  amount_ngn?: number | null;
  created_at?: string | null;
};

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

/** Shared header for the overview's icon-title cards (Jobs, My Vehicles, My Drivers). */
function OverviewCardHeader({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  className = SLEEK_HEADER,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  /** Jobs keeps a single row; My Vehicles / My Drivers stack on mobile. */
  className?: string;
}) {
  return (
    <div className={className}>
      <div>
        <h3 className={`${SLEEK_TITLE} flex items-center gap-2`}>
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button
        asChild
        variant="outline"
        size="sm"
      >
        <Link to={actionHref}>
          {actionLabel}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </Button>
    </div>
  );
}

function titleCase(s: string) {
  return s.replace(
    /_/g,
    " ",
  ).replace(
    /\b\w/g,
    c => c.toUpperCase(),
  );
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(
    0,
    2,
  ).map(p => p[0]?.toUpperCase()).join("") || "?";
}

export function JobsOverviewCard({
  jobs,
  jobsHref,
}: {
  jobs: OverviewJob[];
  jobsHref: string;
}) {
  return (
    <SleekCard>
      <OverviewCardHeader
        icon={Package}
        title="Jobs"
        description="Jobs created recently and their delivery progress"
        actionLabel="View All Jobs"
        actionHref={jobsHref}
        className="p-6 pb-4 flex flex-row items-start justify-between gap-3 space-y-0"
      />
      <div className="p-6 pt-0">
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
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="h-4 w-4 shrink-0 text-primary" />
                        <span className="font-medium text-sm truncate">
                          {job.pickup_address?.split(",")[0] || "Pickup"}
                          {" → "}
                          {job.delivery_address?.split(",")[0] || "Delivery"}
                        </span>
                        <Badge
                          variant={statusVariant(job.status)}
                          className="rounded-full px-2.5 shrink-0"
                        >
                          {job.status.replace(
                            /_/g,
                            " ",
                          )}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Start Date</p>
                      <p className="font-medium text-sm">
                        {job.created_at ? format(
                          new Date(job.created_at),
                          "MMM d, h:mm aaa",
                        ) : "-"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
      </div>
    </SleekCard>
  );
}

/* ── Vehicles ──────────────────────────────────────────────────── */

export type OverviewVehicle = {
  id: string;
  registration_number: string;
  make?: string | null;
  model?: string | null;
  year?: number | string | null;
  status: string;
};

export function VehiclesOverviewCard({
  vehicles,
  vehiclesHref,
}: {
  vehicles: OverviewVehicle[];
  vehiclesHref: string;
}) {
  return (
    <SleekCard className="min-w-0">
      <OverviewCardHeader
        icon={Truck}
        title="My Vehicles"
        description="Vehicles on your account and their current status"
        actionLabel="View vehicles"
        actionHref={vehiclesHref}
      />
      <div className="p-6 pt-0">
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
                  5,
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
                        {v.year || "-"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={v.status === "active" ? "default" : "secondary"}
                        className="rounded-full px-2.5"
                      >
                        {titleCase(v.status)}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
      </div>
    </SleekCard>
  );
}

/* ── Drivers ───────────────────────────────────────────────────── */

export type OverviewDriver = {
  id: string;
  name: string;
  phone?: string | null;
  licenseNumber?: string | null;
  status: string;
  score: number;
};

export function DriversOverviewCard({
  drivers,
  driversHref,
}: {
  drivers: OverviewDriver[];
  driversHref: string;
}) {
  return (
    <SleekCard className="min-w-0">
      <OverviewCardHeader
        icon={Users}
        title="My Drivers"
        description="Drivers on your account and their current availability"
        actionLabel="View All Drivers"
        actionHref={driversHref}
      />
      <div className="p-6 pt-0">
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
                  5,
                ).map(d => (
                  <Link
                    key={d.id}
                    to={driversHref}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-secondary/30"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-muted text-xs font-medium">{initials(d.name)}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-medium text-sm truncate">{d.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{d.phone || "-"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={d.status === "active" || d.status === "available" ? "default" : "secondary"}
                        className="rounded-full px-2.5"
                      >
                        {titleCase(d.status)}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
      </div>
    </SleekCard>
  );
}

/* ── Recent alerts ─────────────────────────────────────────────── */

export type OverviewAlert = {
  id: string;
  title: string;
  description?: string;
  severity?: "critical" | "warning" | "info";
  time: string;
};

const DEFAULT_ALERTS: OverviewAlert[] = [
  {
    id: "1", title: "Harsh braking detected", description: "LAG-441-XT · Apapa Expressway", severity: "warning", time: "12 min ago",
  },
  {
    id: "2", title: "Geofence exit: Apapa Depot", description: "LAG-118-KJ left the zone", severity: "critical", time: "38 min ago",
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

export type OverviewActivity = {
  id: string;
  title: string;
  description?: string;
  time: string;
};

export function RecentActivityCard({ items }: { items: OverviewActivity[] }) {
  return (
    <SleekCard>
      <div className="flex flex-col space-y-1.5 p-6 pb-4">
        <h3 className={`${SLEEK_TITLE} flex items-center gap-2`}>
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </h3>
        <p className="text-sm text-muted-foreground">Latest events across jobs, vehicles and drivers</p>
      </div>
      <div className="p-6 pt-0">
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
                      {a.description && <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{a.time}</span>
                  </div>
                ))}
              </div>
            )}
      </div>
    </SleekCard>
  );
}

/* ── Recent chats ──────────────────────────────────────────────── */

export type OverviewChat = {
  id: string;
  name: string;
  channel: string;
  preview: string;
  time: string;
  unread: number;
};

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
