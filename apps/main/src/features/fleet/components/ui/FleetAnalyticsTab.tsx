import type {
  FleetAnalyticsDriverScore,
  FleetAnalyticsEvent,
  FleetAnalyticsFuelLevel,
  FleetAnalyticsPeriodDays,
  FleetAnalyticsShortPeriodDays,
} from "@truckmoov/api/fleet";
import type { PeriodValue } from "./PeriodFilter";
import {
  exportFleetAnalytics,
  useFleetAnalyticsDriverScores,
  useFleetAnalyticsEvents,
  useFleetAnalyticsFleetStatus,
  useFleetAnalyticsFuelLevels,
  useFleetAnalyticsJobPipeline,
  useFleetAnalyticsSummary,
  useVehicleSafetyRadar,
} from "@truckmoov/api/fleet";
import {
  Activity,
  AlertTriangle,
  DollarSign,
  Download,
  Fuel,
  Loader2,
  Package,
  RefreshCw,
  ShieldAlert,
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
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Progress } from "@/components/shadcn/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { PeriodFilter } from "./PeriodFilter";

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

const EMPTY_FUEL_LEVELS: FleetAnalyticsFuelLevel[] = [];
const EMPTY_DRIVER_SCORES: FleetAnalyticsDriverScore[] = [];
const EMPTY_EVENTS: FleetAnalyticsEvent[] = [];

// backend validates period_days to [1,2,7,30,90] — 60 is no longer a valid value
const ANALYTICS_PERIOD_OPTIONS: {
  value: PeriodValue; label: string;
}[] = [
  {
    value: "1", label: "Today",
  },
  {
    value: "2", label: "Last 2 Days",
  },
  {
    value: "7", label: "Last 7 Days",
  },
  {
    value: "30", label: "Last 30 Days",
  },
  {
    value: "90", label: "Last 90 Days",
  },
];

const LIMIT_OPTIONS = [
  {
    value: "5", label: "5 items",
  },
  {
    value: "10", label: "10 items",
  },
  {
    value: "20", label: "20 items",
  },
  {
    value: "50", label: "50 items",
  },
] as const;

const SEVERITY_OPTIONS = [
  {
    value: "all", label: "All severity",
  },
  {
    value: "low", label: "Low",
  },
  {
    value: "medium", label: "Medium",
  },
  {
    value: "high", label: "High",
  },
  {
    value: "critical", label: "Critical",
  },
] as const;

type LimitValue = (typeof LIMIT_OPTIONS)[number]["value"];
type SeverityValue = (typeof SEVERITY_OPTIONS)[number]["value"];

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

// All analytics endpoints now share the same validated set: 1|2|7|30|90
function toPeriodDays(value: PeriodValue): FleetAnalyticsPeriodDays {
  const days = Number(value);
  return days === 1 || days === 2 || days === 7 || days === 30 || days === 90 ? days : 30;
}

function toShortPeriodDays(value: PeriodValue): FleetAnalyticsShortPeriodDays {
  const days = Number(value);
  return days === 1 || days === 2 || days === 7 || days === 30 || days === 90 ? days : 30;
}

function toLimit(value: LimitValue) {
  return Number(value);
}

function LimitFilter({
  value,
  onChange,
  className,
}: {
  value: LimitValue;
  onChange: (value: LimitValue) => void;
  className?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={nextValue => onChange(nextValue as LimitValue)}
    >
      <SelectTrigger className={className ?? "h-8 w-[104px]"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LIMIT_OPTIONS.map(option => (
          <SelectItem
            key={option.value}
            value={option.value}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SeverityFilter({
  value,
  onChange,
  className,
}: {
  value: SeverityValue;
  onChange: (value: SeverityValue) => void;
  className?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={nextValue => onChange(nextValue as SeverityValue)}
    >
      <SelectTrigger className={className ?? "h-8 w-[126px]"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SEVERITY_OPTIONS.map(option => (
          <SelectItem
            key={option.value}
            value={option.value}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-[200px] items-center justify-center text-center text-xs text-muted-foreground">
      {message}
    </div>
  );
}

function CardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-[200px] flex-col items-center justify-center gap-3 text-center text-xs text-muted-foreground">
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

function CardLoading() {
  return (
    <div className="flex h-[200px] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function LiveIndicator({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {connected
        ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-success">
                <Wifi className="h-3 w-3" />
                {" "}
                Live
              </span>
            </>
          )
        : (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <WifiOff className="h-3 w-3" />
              {" "}
              Offline
            </span>
          )}
    </div>
  );
}

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}) {
  return (
    <Card className="relative overflow-hidden border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
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
                    {trendValue}
                  </span>
                )}
                {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
              </div>
            )}
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FleetAnalyticsTab() {
  const { format: formatCurrency } = useCurrency();
  const [
    lastRefresh,
    setLastRefresh,
  ] = useState(new Date());
  const [
    summaryPeriod,
    setSummaryPeriod,
  ] = useState<PeriodValue>("30");
  const [
    fleetStatusPeriod,
    setFleetStatusPeriod,
  ] = useState<PeriodValue>("30");
  const [
    jobPipelinePeriod,
    setJobPipelinePeriod,
  ] = useState<PeriodValue>("30");
  const [
    fuelLevelsPeriod,
    setFuelLevelsPeriod,
  ] = useState<PeriodValue>("30");
  const [
    safetyRadarPeriod,
    setSafetyRadarPeriod,
  ] = useState<PeriodValue>("30");
  const [
    driverScoresPeriod,
    setDriverScoresPeriod,
  ] = useState<PeriodValue>("30");
  const [
    eventFeedPeriod,
    setEventFeedPeriod,
  ] = useState<PeriodValue>("30");
  const [
    driverScoresLimit,
    setDriverScoresLimit,
  ] = useState<LimitValue>("10");
  const [
    eventFeedLimit,
    setEventFeedLimit,
  ] = useState<LimitValue>("10");
  const [
    isExporting,
    setIsExporting,
  ] = useState(false);
  const [
    eventFeedSeverity,
    setEventFeedSeverity,
  ] = useState<SeverityValue>("all");

  const summaryQuery = useFleetAnalyticsSummary({ params: { period_days: toPeriodDays(summaryPeriod) } });
  const fleetStatusQuery = useFleetAnalyticsFleetStatus({ params: { period_days: toShortPeriodDays(fleetStatusPeriod) } });
  const jobPipelineQuery = useFleetAnalyticsJobPipeline({ params: { period_days: toPeriodDays(jobPipelinePeriod) } });
  const fuelLevelsQuery = useFleetAnalyticsFuelLevels({ params: { period_days: toShortPeriodDays(fuelLevelsPeriod) } });
  const safetyScoresQuery = useFleetAnalyticsDriverScores({ params: { period_days: toPeriodDays(safetyRadarPeriod) } });
  const safetyRadarQuery = useVehicleSafetyRadar({ params: { period_days: toShortPeriodDays(safetyRadarPeriod) } });
  const driverScoresQuery = useFleetAnalyticsDriverScores({
    params: {
      period_days: toPeriodDays(driverScoresPeriod),
      limit: toLimit(driverScoresLimit),
    },
  });
  const eventsQuery = useFleetAnalyticsEvents({
    params: {
      period_days: toPeriodDays(eventFeedPeriod),
      limit: toLimit(eventFeedLimit),
      severity: eventFeedSeverity === "all" ? undefined : eventFeedSeverity,
    },
  });

  const queries = [
    summaryQuery,
    fleetStatusQuery,
    jobPipelineQuery,
    fuelLevelsQuery,
    safetyScoresQuery,
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
  const fuelLevels = Array.isArray(fuelLevelsQuery.data?.data) ? fuelLevelsQuery.data.data : EMPTY_FUEL_LEVELS;
  const safetyScores = Array.isArray(safetyScoresQuery.data?.data) ? safetyScoresQuery.data.data : EMPTY_DRIVER_SCORES;
  const driverScores = Array.isArray(driverScoresQuery.data?.data) ? driverScoresQuery.data.data : EMPTY_DRIVER_SCORES;
  const events = Array.isArray(eventsQuery.data?.data) ? eventsQuery.data.data : EMPTY_EVENTS;

  const connected = queries.every(query => query.isSuccess && !query.isError);
  const isRefreshing = queries.some(query => query.isFetching);
  const isInitialLoading = queries.every(query => query.isPending && !query.data);

  const activeVehicles = summary?.vehicles.active ?? 0;
  const totalVehicles = summary?.vehicles.total ?? 0;
  const activeDrivers = summary?.drivers.active ?? 0;
  const totalDrivers = summary?.drivers.total ?? 0;
  const completedJobs = summary?.jobs.completed ?? 0;
  const inProgressJobs = summary?.jobs.inProgress ?? 0;
  const maintenanceVehicles = summary?.vehicles.maintenance ?? 0;
  const fleetUtilization = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;
  const driverUtilization = totalDrivers > 0 ? Math.round((activeDrivers / totalDrivers) * 100) : 0;
  const averageSafetyScore
    = safetyScores.length > 0
      ? clampScore(safetyScores.reduce(
          (sum, score) => sum + score.safetyScore,
          0,
        ) / safetyScores.length)
      : 0;
  const fleetStatusChart = useMemo(
    () => {
      const byStatus = fleetStatus?.byStatus ?? {};
      return Object.entries(byStatus)
        .map(([
          status,
          value,
        ]) => ({
          name: formatLabel(status),
          value,
          color: STATUS_COLORS[status] ?? "hsl(var(--primary))",
        }))
        .filter(item => item.value > 0);
    },
    [fleetStatus],
  );

  const jobPipelineData = useMemo(
    () => {
      const byStatus = jobPipeline?.byStatus ?? {};
      return [
        {
          stage: "Pending", count: byStatus.pending ?? 0, fill: "hsl(var(--muted-foreground))",
        },
        {
          stage: "In Progress", count: byStatus.in_progress ?? 0, fill: "hsl(var(--warning))",
        },
        {
          stage: "Delivered", count: byStatus.delivered ?? 0, fill: "hsl(var(--success))",
        },
      ];
    },
    [jobPipeline],
  );

  const availableFuelLevels = fuelLevels
    .filter(vehicle => vehicle.fuelLevelPercent !== null)
    .map(vehicle => ({
      vehicleId: vehicle.vehicleId,
      plateNumber: vehicle.plateNumber,
      level: clampScore(vehicle.fuelLevelPercent ?? 0),
    }))
    .sort((a, b) => a.level - b.level);

  const safetyRadar = safetyRadarQuery.data?.data;
  // Every axis null = nothing scored in the period; show the empty state, not a 0-score chart.
  const radarScored = safetyRadar && [
    safetyRadar.braking,
    safetyRadar.acceleration,
    safetyRadar.speedControl,
    safetyRadar.cornering,
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
          metric: "Speed Control", score: clampScore(safetyRadar.speedControl ?? 0), fullMark: 100,
        },
        {
          metric: "Cornering", score: clampScore(safetyRadar.cornering ?? 0), fullMark: 100,
        },
      ]
    : [];

  const driverScoresChart = [...driverScores].sort((a, b) => b.safetyScore - a.safetyScore);
  const recentEvents = events.map((event) => {
    const triggeredAt = new Date(event.triggeredAt);
    const hasValidDate = Number.isFinite(triggeredAt.getTime());

    return {
      id: event.id,
      type: formatLabel(event.type),
      severity: event.severity,
      status: event.status,
      time: hasValidDate
        ? triggeredAt.toLocaleTimeString(
            [],
            {
              hour: "2-digit", minute: "2-digit",
            },
          )
        : "--:--",
      date: hasValidDate
        ? triggeredAt.toLocaleDateString(
            [],
            {
              month: "short", day: "numeric",
            },
          )
        : "Unknown",
    };
  });

  async function refreshAll() {
    await Promise.all(queries.map(query => query.refetch()));
    setLastRefresh(new Date());
  }

  if (isInitialLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <LiveIndicator connected={connected} />
          <span className="text-xs text-muted-foreground">
            Updated
            {" "}
            {lastRefresh.toLocaleTimeString(
              [],
              {
                hour: "2-digit", minute: "2-digit",
              },
            )}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <PeriodFilter
            value={summaryPeriod}
            onChange={setSummaryPeriod}
            options={ANALYTICS_PERIOD_OPTIONS}
            className="h-9 w-[136px]"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                setIsExporting(true);
                const periodDays = toShortPeriodDays(summaryPeriod);
                const blob = await exportFleetAnalytics(periodDays);
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `fleet-analytics-${periodDays}d.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }
              catch {
                toast.error("Analytics export failed");
              }
              finally {
                setIsExporting(false);
              }
            }}
            disabled={isExporting}
          >
            <Download className="mr-2 h-3.5 w-3.5" />
            Export Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn(
              "mr-2 h-3.5 w-3.5",
              isRefreshing && "animate-spin",
            )}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <KPICard
          title="Fleet Utilization"
          value={`${fleetUtilization}%`}
          icon={Truck}
          subtitle={`${activeVehicles}/${totalVehicles} active`}
        />
        <KPICard
          title="Driver Utilization"
          value={`${driverUtilization}%`}
          icon={Users}
          subtitle={`${activeDrivers}/${totalDrivers} active`}
        />
        <KPICard
          title="Active Jobs"
          value={inProgressJobs}
          icon={Package}
          subtitle={`${completedJobs} completed`}
        />
        <KPICard
          title="Revenue"
          value={formatCurrency(0)}
          icon={DollarSign}
        />
        <KPICard
          title="Safety Score"
          value={averageSafetyScore || "-"}
          icon={ShieldAlert}
          subtitle={`${summary?.safety.critical ?? 0} critical events`}
          trend={safetyScores.length === 0 ? "neutral" : averageSafetyScore >= 80 ? "up" : averageSafetyScore >= 60 ? "neutral" : "down"}
          trendValue={safetyScores.length === 0 ? "Unscored" : averageSafetyScore >= 80 ? "Good" : averageSafetyScore >= 60 ? "Fair" : "Poor"}
        />
        <KPICard
          title="Maintenance"
          value={maintenanceVehicles}
          icon={Wrench}
          subtitle="vehicles in service"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Fleet Status</CardTitle>
              <CardDescription className="text-xs">Real-time vehicle availability</CardDescription>
            </div>
            <PeriodFilter
              value={fleetStatusPeriod}
              onChange={setFleetStatusPeriod}
              options={ANALYTICS_PERIOD_OPTIONS}
              className="h-8 w-[132px]"
            />
          </CardHeader>
          <CardContent>
            {fleetStatusQuery.isError
              ? (
                  <CardError onRetry={() => fleetStatusQuery.refetch()} />
                )
              : fleetStatusQuery.isPending
                ? (
                    <CardLoading />
                  )
                : fleetStatusChart.length === 0
                  ? (
                      <EmptyState message="No fleet status data available." />
                    )
                  : (
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
                    )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Job Pipeline</CardTitle>
              <CardDescription className="text-xs">Current dispatch status</CardDescription>
            </div>
            <PeriodFilter
              value={jobPipelinePeriod}
              onChange={setJobPipelinePeriod}
              options={ANALYTICS_PERIOD_OPTIONS}
              className="h-8 w-[132px]"
            />
          </CardHeader>
          <CardContent>
            {jobPipelineQuery.isError
              ? (
                  <CardError onRetry={() => jobPipelineQuery.refetch()} />
                )
              : jobPipelineQuery.isPending
                ? (
                    <CardLoading />
                  )
                : jobPipelineData.every(item => item.count === 0)
                  ? (
                      <EmptyState message="No job pipeline data available." />
                    )
                  : (
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
                            width={80}
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
                    )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Fuel className="h-4 w-4" />
                {" "}
                Fuel Levels
              </CardTitle>
              <CardDescription className="text-xs">Current tank readings</CardDescription>
            </div>
            <PeriodFilter
              value={fuelLevelsPeriod}
              onChange={setFuelLevelsPeriod}
              options={ANALYTICS_PERIOD_OPTIONS}
              className="h-8 w-[132px]"
            />
          </CardHeader>
          <CardContent>
            {fuelLevelsQuery.isError
              ? (
                  <CardError onRetry={() => fuelLevelsQuery.refetch()} />
                )
              : fuelLevelsQuery.isPending
                ? (
                    <CardLoading />
                  )
                : availableFuelLevels.length === 0
                  ? (
                      <EmptyState message="Fuel telemetry is not available for these vehicles." />
                    )
                  : (
                      <div className="max-h-[200px] space-y-3 overflow-y-auto pr-1">
                        {availableFuelLevels.map(vehicle => (
                          <div
                            key={vehicle.vehicleId}
                            className="space-y-1"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono text-muted-foreground">{vehicle.plateNumber}</span>
                              <span
                                className={cn(
                                  "font-medium",
                                  vehicle.level > 50 ? "text-success" : vehicle.level > 25 ? "text-warning" : "text-destructive",
                                )}
                              >
                                {vehicle.level}
                                %
                              </span>
                            </div>
                            <Progress
                              value={vehicle.level}
                              className="h-1.5"
                            />
                          </div>
                        ))}
                      </div>
                    )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4" />
                {" "}
                Fleet Safety Radar
              </CardTitle>
              <CardDescription className="text-xs">Average driver behavior scores</CardDescription>
            </div>
            <PeriodFilter
              value={safetyRadarPeriod}
              onChange={setSafetyRadarPeriod}
              options={ANALYTICS_PERIOD_OPTIONS}
              className="h-8 w-[132px]"
            />
          </CardHeader>
          <CardContent>
            {safetyRadarQuery.isError
              ? (
                  <CardError onRetry={() => safetyRadarQuery.refetch()} />
                )
              : safetyRadarQuery.isPending
                ? (
                    <CardLoading />
                  )
                : radarChart.length === 0
                  ? (
                      <EmptyState message="No driving events scored in this period." />
                    )
                  : (
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
                    )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="space-y-3 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Driver Safety Scores</CardTitle>
              <CardDescription className="text-xs">Individual performance ranking</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <PeriodFilter
                value={driverScoresPeriod}
                onChange={setDriverScoresPeriod}
                options={ANALYTICS_PERIOD_OPTIONS}
                className="h-8 w-[132px]"
              />
              <LimitFilter
                value={driverScoresLimit}
                onChange={setDriverScoresLimit}
              />
            </div>
          </CardHeader>
          <CardContent>
            {driverScoresQuery.isError
              ? (
                  <CardError onRetry={() => driverScoresQuery.refetch()} />
                )
              : driverScoresQuery.isPending
                ? (
                    <CardLoading />
                  )
                : driverScoresChart.length === 0
                  ? (
                      <EmptyState message="No driver safety scores available." />
                    )
                  : (
                      <div className="max-h-[220px] space-y-2.5 overflow-y-auto pr-1">
                        {driverScoresChart.slice(
                          0,
                          8,
                        ).map((driver, index) => (
                          <div
                            key={driver.driverId}
                            className="flex items-center gap-3 rounded-lg bg-muted/30 p-2"
                          >
                            <span className="w-4 text-xs font-medium text-muted-foreground">{index + 1}</span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {driver.driverName || `Driver ${driver.driverId.substring(
                                  0,
                                  8,
                                )}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {driver.incidents}
                                {" "}
                                events
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="px-1.5 text-[10px]"
                              >
                                {driver.harshBraking + driver.overspeeding}
                                {" "}
                                signals
                              </Badge>
                              <span
                                className={cn(
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
                    )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="space-y-3 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Zap className="h-4 w-4" />
                {" "}
                Live Event Feed
              </CardTitle>
              <CardDescription className="text-xs">Recent driver behavior alerts</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <PeriodFilter
                value={eventFeedPeriod}
                onChange={setEventFeedPeriod}
                options={ANALYTICS_PERIOD_OPTIONS}
                className="h-8 w-[132px]"
              />
              <SeverityFilter
                value={eventFeedSeverity}
                onChange={setEventFeedSeverity}
              />
              <LimitFilter
                value={eventFeedLimit}
                onChange={setEventFeedLimit}
              />
            </div>
          </CardHeader>
          <CardContent>
            {eventsQuery.isError
              ? (
                  <CardError onRetry={() => eventsQuery.refetch()} />
                )
              : eventsQuery.isPending
                ? (
                    <CardLoading />
                  )
                : recentEvents.length === 0
                  ? (
                      <EmptyState message="No recent events available." />
                    )
                  : (
                      <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
                        {recentEvents.map(event => (
                          <div
                            key={event.id}
                            className="flex items-center gap-2 border-b border-border/30 py-1.5 last:border-0"
                          >
                            <div
                              className={cn(
                                "h-2 w-2 shrink-0 rounded-full",
                                event.severity === "critical" && "bg-destructive",
                                event.severity === "high" && "bg-warning",
                                event.severity === "medium" && "bg-primary",
                                event.severity === "low" && "bg-muted-foreground",
                              )}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium">{event.type}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {event.date}
                                {" "}
                                -
                                {event.time}
                              </p>
                            </div>
                            <Badge
                              variant={event.severity === "critical" ? "destructive" : "secondary"}
                              className="shrink-0 px-1.5 text-[10px]"
                            >
                              {event.severity}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
