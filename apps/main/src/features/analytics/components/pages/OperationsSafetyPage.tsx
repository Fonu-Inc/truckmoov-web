import type {
  FleetAnalyticsDriverScore,
  FleetAnalyticsEvent,
  FleetAnalyticsPeriodDays,
} from "@truckmoov/api/fleet";
import { useQuery } from "@tanstack/react-query";
import {
  getFleetProfitLossQueryOptions,
  useFleetAnalyticsDriverScores,
  useFleetAnalyticsEvents,
  useFleetAnalyticsFleetStatus,
  useFleetAnalyticsJobPipeline,
  useFleetAnalyticsSummary,
  useVehicleSafetyRadar,
} from "@truckmoov/api/fleet";
import {
  Activity,
  AlertTriangle,
  Calendar,
  DollarSign,
  Loader2,
  Minus,
  Package,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Wifi,
  WifiOff,
  Wrench,
  Zap,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/shadcn/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { periodToRange } from "@/features/analytics/utils/period";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
};

const STATUS_COLORS: Record<string, string> = {
  active: "hsl(var(--success))",
  inactive: "hsl(var(--muted-foreground))",
  maintenance: "hsl(var(--warning))",
  decommissioned: "hsl(var(--destructive))",
};

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-destructive",
  high: "bg-warning",
  medium: "bg-primary",
  low: "bg-muted-foreground",
};

const BADGE = "inline-flex items-center rounded-full border py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
const BADGE_SECONDARY = "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80";
const BADGE_DESTRUCTIVE = "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90";
const CARD = "rounded-2xl surface-sleek text-card-foreground border-border/50";
const CARD_HEADER = "p-6 pb-2 flex flex-row items-start justify-between gap-2 space-y-0";
const CARD_TITLE = "tracking-tight text-foreground font-display text-sm font-medium";

const EMPTY_DRIVER_SCORES: FleetAnalyticsDriverScore[] = [];
const EMPTY_EVENTS: FleetAnalyticsEvent[] = [];

// The backend validates period_days to 1 | 2 | 7 | 30 | 90.
const PERIOD_OPTIONS: {
  value: FleetAnalyticsPeriodDays; label: string;
}[] = [
  {
    value: 1, label: "Today",
  },
  {
    value: 2, label: "Last 2 Days",
  },
  {
    value: 7, label: "Last 7 Days",
  },
  {
    value: 30, label: "Last 30 Days",
  },
  {
    value: 90, label: "Last 90 Days",
  },
];

function clampScore(value: number) {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value),
    ),
  );
}

function formatLabel(value: string) {
  return value
    .replace(
      /_/g,
      " ",
    )
    .replace(
      /\b\w/g,
      letter => letter.toUpperCase(),
    );
}

function formatTime(date: Date) {
  return date.toLocaleTimeString(
    "en-GB",
    {
      hour: "2-digit", minute: "2-digit", hour12: false,
    },
  );
}

/** "Today · 09:42", "Yesterday · 17:24", else "18 Nov · 11:48". */
function formatEventTime(iso: string) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime()))
    return "—";
  const today = new Date();
  const yesterday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 1,
  );
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const day = sameDay(
    date,
    today,
  )
    ? "Today"
    : sameDay(
      date,
      yesterday,
    )
      ? "Yesterday"
      : date.toLocaleDateString(
          "en-GB",
          {
            day: "numeric", month: "short",
          },
        );
  return `${day} · ${formatTime(date)}`;
}

function PeriodSelect({
  value, onChange,
}: {
  value: FleetAnalyticsPeriodDays; onChange: (v: FleetAnalyticsPeriodDays) => void;
}) {
  return (
    <Select
      value={String(value)}
      onValueChange={v => onChange(Number(v) as FleetAnalyticsPeriodDays)}
    >
      <SelectTrigger className="rounded-xl px-3.5 w-[140px] h-8">
        <Calendar className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERIOD_OPTIONS.map(o => (
          <SelectItem
            key={o.value}
            value={String(o.value)}
          >
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EmptyState({
  message, height = 200,
}: {
  message: string; height?: number;
}) {
  return (
    <div
      className="flex items-center justify-center text-center text-xs text-muted-foreground"
      style={{ height }}
    >
      {message}
    </div>
  );
}

function CardError({
  onRetry, height = 200,
}: {
  onRetry: () => void; height?: number;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 text-center text-xs text-muted-foreground"
      style={{ height }}
    >
      <AlertTriangle className="h-5 w-5 text-warning" />
      <span>Unable to load this data.</span>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
      >
        Retry
      </Button>
    </div>
  );
}

function CardLoading({ height = 200 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{ height }}
    >
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

/** Loading / error / empty states shared by the cards below. */
function CardBody({
  query, isEmpty, emptyMessage, height, children,
}: {
  query: {
    isPending: boolean; isError: boolean; refetch: () => unknown;
  };
  isEmpty: boolean;
  emptyMessage: string;
  height?: number;
  children: React.ReactNode;
}) {
  if (query.isError) {
    return (
      <CardError
        onRetry={() => query.refetch()}
        height={height}
      />
    );
  }
  if (query.isPending)
    return <CardLoading height={height} />;
  if (isEmpty) {
    return (
      <EmptyState
        message={emptyMessage}
        height={height}
      />
    );
  }
  return <>{children}</>;
}

function KpiCard({
  title, value, subtitle, icon: Icon, trend, trendValue,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  return (
    <div className={`${CARD} relative overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {(subtitle || trendValue) && (
              <div className="flex items-center gap-2">
                {trend && trendValue && (
                  <span
                    className={cn(
                      "flex items-center gap-0.5 text-xs font-medium",
                      trend === "up" && "text-success",
                      trend === "down" && "text-destructive",
                      trend === "neutral" && "text-muted-foreground",
                    )}
                  >
                    <TrendIcon className="h-3 w-3" />
                    {trendValue}
                  </span>
                )}
                {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
              </div>
            )}
          </div>
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CardHeading({
  icon: Icon, title, description, period, onPeriodChange,
}: {
  icon?: React.ElementType;
  title: string;
  description: string;
  period: FleetAnalyticsPeriodDays;
  onPeriodChange: (v: FleetAnalyticsPeriodDays) => void;
}) {
  return (
    <div className={CARD_HEADER}>
      <div>
        <h3 className={Icon ? `${CARD_TITLE} flex items-center gap-2` : CARD_TITLE}>
          {Icon && <Icon className="h-4 w-4" />}
          {title}
        </h3>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      <PeriodSelect
        value={period}
        onChange={onPeriodChange}
      />
    </div>
  );
}

/** `/analytics/operations` — the design app's Operations & Safety tab. */
export default function OperationsSafetyPage() {
  const [
    lastRefresh,
    setLastRefresh,
  ] = useState(() => new Date());
  const [
    fleetStatusPeriod,
    setFleetStatusPeriod,
  ] = useState<FleetAnalyticsPeriodDays>(30);
  const [
    jobPipelinePeriod,
    setJobPipelinePeriod,
  ] = useState<FleetAnalyticsPeriodDays>(30);
  const [
    safetyRadarPeriod,
    setSafetyRadarPeriod,
  ] = useState<FleetAnalyticsPeriodDays>(30);
  const [
    driverScoresPeriod,
    setDriverScoresPeriod,
  ] = useState<FleetAnalyticsPeriodDays>(30);
  const [
    eventFeedPeriod,
    setEventFeedPeriod,
  ] = useState<FleetAnalyticsPeriodDays>(30);

  // The KPI row has no period control in the design app; it reads the last 30 days.
  const summaryQuery = useFleetAnalyticsSummary({ params: { period_days: 30 } });
  const revenueQuery = useQuery(getFleetProfitLossQueryOptions({ params: periodToRange("30d") }));
  const safetyScoresQuery = useFleetAnalyticsDriverScores({ params: { period_days: 30 } });
  const fleetStatusQuery = useFleetAnalyticsFleetStatus({ params: { period_days: fleetStatusPeriod } });
  const jobPipelineQuery = useFleetAnalyticsJobPipeline({ params: { period_days: jobPipelinePeriod } });
  const safetyRadarQuery = useVehicleSafetyRadar({ params: { period_days: safetyRadarPeriod } });
  const driverScoresQuery = useFleetAnalyticsDriverScores({
    params: {
      period_days: driverScoresPeriod, limit: 8,
    },
  });
  const eventsQuery = useFleetAnalyticsEvents({
    params: {
      period_days: eventFeedPeriod, limit: 10,
    },
  });

  const queries = [
    summaryQuery,
    revenueQuery,
    safetyScoresQuery,
    fleetStatusQuery,
    jobPipelineQuery,
    safetyRadarQuery,
    driverScoresQuery,
    eventsQuery,
  ];

  useEffect(
    () => {
      const interval = setInterval(
        () => setLastRefresh(new Date()),
        30000,
      );
      return () => clearInterval(interval);
    },
    [],
  );

  const summary = summaryQuery.data?.data;
  const fleetStatus = fleetStatusQuery.data?.data;
  const jobPipeline = jobPipelineQuery.data?.data;
  const safetyScores = Array.isArray(safetyScoresQuery.data?.data) ? safetyScoresQuery.data.data : EMPTY_DRIVER_SCORES;
  const driverScores = Array.isArray(driverScoresQuery.data?.data) ? driverScoresQuery.data.data : EMPTY_DRIVER_SCORES;
  const events = Array.isArray(eventsQuery.data?.data) ? eventsQuery.data.data : EMPTY_EVENTS;

  const connected = queries.every(query => query.isSuccess);
  const isRefreshing = queries.some(query => query.isFetching);

  const activeVehicles = summary?.vehicles.active ?? 0;
  const totalVehicles = summary?.vehicles.total ?? 0;
  const activeDrivers = summary?.drivers.active ?? 0;
  const totalDrivers = summary?.drivers.total ?? 0;
  const fleetUtilization = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;
  const driverUtilization = totalDrivers > 0 ? Math.round((activeDrivers / totalDrivers) * 100) : 0;
  const averageSafetyScore = safetyScores.length > 0
    ? clampScore(safetyScores.reduce(
        (sum, score) => sum + score.safetyScore,
        0,
      ) / safetyScores.length)
    : 0;
  const revenue = revenueQuery.data?.data.summary.revenue;

  const fleetStatusChart = useMemo(
    () => Object.entries(fleetStatus?.byStatus ?? {})
      .map(([
        status,
        value,
      ]) => ({
        name: formatLabel(status),
        value,
        color: STATUS_COLORS[status] ?? "hsl(var(--primary))",
      }))
      .filter(item => item.value > 0),
    [fleetStatus],
  );

  const jobPipelineData = useMemo(
    () => {
      const byStatus = jobPipeline?.byStatus ?? {};
      const sum = (...keys: string[]) => keys.reduce(
        (total, key) => total + (byStatus[key] ?? 0),
        0,
      );
      return [
        {
          stage: "Created", count: sum(
            "created",
            "pending",
          ), fill: "hsl(var(--muted-foreground))",
        },
        {
          stage: "Assigned", count: sum("assigned"), fill: "hsl(var(--primary))",
        },
        {
          stage: "In Transit", count: sum(
            "in_progress",
            "en-route",
            "en_route",
            "arrived",
            "loaded",
            "in_transit",
          ), fill: "hsl(var(--warning))",
        },
        {
          stage: "Completed", count: sum(
            "delivered",
            "completed",
          ), fill: "hsl(var(--success))",
        },
      ];
    },
    [jobPipeline],
  );

  const safetyRadar = safetyRadarQuery.data?.data;
  // Every axis null = nothing scored in the period; show the empty state, not a 0-score chart.
  const radarScored = safetyRadar && [
    safetyRadar.braking,
    safetyRadar.acceleration,
    safetyRadar.cornering,
    safetyRadar.speedControl,
  ].some(v => v !== null);
  const radarChart = safetyRadar && radarScored
    ? [
        {
          metric: "Braking", score: clampScore(safetyRadar.braking ?? 0), fullMark: 100,
        },
        {
          metric: "Acceleration", score: clampScore(safetyRadar.acceleration ?? 0), fullMark: 100,
        },
        {
          metric: "Cornering", score: clampScore(safetyRadar.cornering ?? 0), fullMark: 100,
        },
        {
          metric: "Speed Control", score: clampScore(safetyRadar.speedControl ?? 0), fullMark: 100,
        },
      ]
    : [];

  const rankedDrivers = [...driverScores].sort((a, b) => b.safetyScore - a.safetyScore).slice(
    0,
    8,
  );

  async function refreshAll() {
    await Promise.all(queries.map(query => query.refetch()));
    setLastRefresh(new Date());
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {connected
              ? (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
                    </span>
                    <span className="text-xs font-medium text-success flex items-center gap-1">
                      <Wifi className="h-3 w-3" />
                      Live
                    </span>
                  </>
                )
              : (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <WifiOff className="h-3 w-3" />
                    Offline
                  </span>
                )}
          </div>
          <span className="text-xs text-muted-foreground">{`Updated ${formatTime(lastRefresh)}`}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshAll}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn(
            "h-3.5 w-3.5 mr-2",
            isRefreshing && "animate-spin",
          )}
          />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          title="Fleet Utilization"
          value={summary ? `${fleetUtilization}%` : "-"}
          icon={Truck}
          subtitle={summary ? `${activeVehicles}/${totalVehicles} active` : undefined}
        />
        <KpiCard
          title="Driver Utilization"
          value={summary ? `${driverUtilization}%` : "-"}
          icon={Users}
          subtitle={summary ? `${activeDrivers}/${totalDrivers} active` : undefined}
        />
        <KpiCard
          title="Active Jobs"
          value={summary ? summary.jobs.inProgress : "-"}
          icon={Package}
          subtitle={summary ? `${summary.jobs.completed} completed` : undefined}
        />
        <KpiCard
          title="Revenue"
          value={revenue === undefined ? "-" : formatCurrency(revenue)}
          icon={DollarSign}
        />
        <KpiCard
          title="Safety Score"
          value={averageSafetyScore || "—"}
          icon={ShieldAlert}
          subtitle={`${summary?.safety.critical ?? 0} critical events`}
          trend={averageSafetyScore >= 80 ? "up" : averageSafetyScore >= 60 ? "neutral" : "down"}
          trendValue={averageSafetyScore >= 80 ? "Good" : averageSafetyScore >= 60 ? "Fair" : "Poor"}
        />
        <KpiCard
          title="Maintenance"
          value={summary ? summary.vehicles.maintenance : "-"}
          icon={Wrench}
          subtitle="vehicles in service"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={CARD}>
          <CardHeading
            title="Fleet Status"
            description="Real-time vehicle availability"
            period={fleetStatusPeriod}
            onPeriodChange={setFleetStatusPeriod}
          />
          <div className="p-6 pt-0">
            <CardBody
              query={fleetStatusQuery}
              isEmpty={fleetStatusChart.length === 0}
              emptyMessage="No fleet status data available."
            >
              <ResponsiveContainer
                width="100%"
                height={200}
              >
                <PieChart>
                  <Pie
                    data={fleetStatusChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {fleetStatusChart.map(entry => (
                      <Cell
                        key={entry.name}
                        fill={entry.color}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardBody>
          </div>
        </div>

        <div className={CARD}>
          <CardHeading
            title="Job Pipeline"
            description="Current dispatch status"
            period={jobPipelinePeriod}
            onPeriodChange={setJobPipelinePeriod}
          />
          <div className="p-6 pt-0">
            <CardBody
              query={jobPipelineQuery}
              isEmpty={jobPipelineData.every(item => item.count === 0)}
              emptyMessage="No job pipeline data available."
            >
              <ResponsiveContainer
                width="100%"
                height={200}
              >
                <BarChart
                  data={jobPipelineData}
                  layout="vertical"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                  />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    width={70}
                  />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar
                    dataKey="count"
                    name="Jobs"
                    radius={[
                      0,
                      4,
                      4,
                      0,
                    ]}
                  >
                    {jobPipelineData.map(entry => (
                      <Cell
                        key={entry.stage}
                        fill={entry.fill}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={CARD}>
          <CardHeading
            icon={Activity}
            title="Fleet Safety Radar"
            description="Average driver behavior scores"
            period={safetyRadarPeriod}
            onPeriodChange={setSafetyRadarPeriod}
          />
          <div className="p-6 pt-0">
            <CardBody
              query={safetyRadarQuery}
              isEmpty={radarChart.length === 0}
              emptyMessage="No driving events scored in this period."
              height={220}
            >
              <ResponsiveContainer
                width="100%"
                height={220}
              >
                <RadarChart data={radarChart}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{
                      fontSize: 11, fill: "hsl(var(--muted-foreground))",
                    }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[
                      0,
                      100,
                    ]}
                    tick={{ fontSize: 10 }}
                  />
                  <Radar
                    name="Fleet Avg"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                </RadarChart>
              </ResponsiveContainer>
            </CardBody>
          </div>
        </div>

        <div className={CARD}>
          <CardHeading
            title="Driver Safety Scores"
            description="Individual performance ranking"
            period={driverScoresPeriod}
            onPeriodChange={setDriverScoresPeriod}
          />
          <div className="p-6 pt-0">
            <CardBody
              query={driverScoresQuery}
              isEmpty={rankedDrivers.length === 0}
              emptyMessage="No driver safety scores available."
              height={220}
            >
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {rankedDrivers.map((driver, index) => (
                  <div
                    key={driver.driverId}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                  >
                    <span className="text-xs font-medium text-muted-foreground w-4">{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{driver.driverName || "—"}</p>
                      <p className="text-xs text-muted-foreground">{`${driver.incidents} events`}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* ponytail: the ↑ / → / ↓ score trend has no endpoint yet. */}
                      <div className={`${BADGE} ${BADGE_SECONDARY} text-[10px] px-1.5`}>-</div>
                      <span className={cn(
                        "text-sm font-bold",
                        driver.safetyScore >= 80 ? "text-success" : driver.safetyScore >= 60 ? "text-warning" : "text-destructive",
                      )}
                      >
                        {driver.safetyScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </div>
        </div>

        <div className={CARD}>
          <CardHeading
            icon={Zap}
            title="Live Event Feed"
            description="Recent driver behavior alerts"
            period={eventFeedPeriod}
            onPeriodChange={setEventFeedPeriod}
          />
          <div className="p-6 pt-0">
            <CardBody
              query={eventsQuery}
              isEmpty={events.length === 0}
              emptyMessage="No recent events available."
              height={220}
            >
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {events.map(event => (
                  <div
                    key={event.id}
                    className="flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0"
                  >
                    <div className={`h-2 w-2 rounded-full shrink-0 ${SEVERITY_DOT[event.severity] ?? "bg-muted-foreground"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium capitalize truncate">
                        {event.type.replace(
                          /[_-]/g,
                          " ",
                        ).toLowerCase()}
                      </p>
                      {/* ponytail: the events endpoint returns no driver name for an event. */}
                      <p className="text-xs text-muted-foreground break-words">-</p>
                      <p className="text-[10px] text-muted-foreground">{formatEventTime(event.triggeredAt)}</p>
                    </div>
                    <div className={`${BADGE} ${event.severity === "critical" ? BADGE_DESTRUCTIVE : BADGE_SECONDARY} text-[10px] px-1.5 shrink-0`}>{event.severity}</div>
                  </div>
                ))}
              </div>
            </CardBody>
          </div>
        </div>
      </div>
    </div>
  );
}
