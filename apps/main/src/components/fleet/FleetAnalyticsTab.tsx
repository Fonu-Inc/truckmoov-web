import { useState, useEffect } from "react";
import { PeriodFilter, PeriodValue } from "./PeriodFilter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import {
  TrendingUp, TrendingDown, Fuel, Truck, Users, Package,
  DollarSign, Clock, AlertTriangle, CheckCircle, Gauge, Wrench,
  Activity, Zap, ShieldAlert, Eye, RefreshCw, Wifi, WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVehicles } from "@/hooks/useVehicles";
import { useDrivers } from "@/hooks/useDrivers";
import { useJobs } from "@/hooks/useJobs";
import { useDriverBehavior } from "@/hooks/useDriverBehavior";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { withDemoFallback, demoVehicleStatusBreakdown, demoTopDrivers, demoDriverBehavior } from "@/lib/demoChartData";

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
};

function LiveIndicator({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {connected ? (
        <>
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
          </span>
          <span className="text-xs text-success font-medium flex items-center gap-1">
            <Wifi className="h-3 w-3" /> Live
          </span>
        </>
      ) : (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <WifiOff className="h-3 w-3" /> Offline
        </span>
      )}
    </div>
  );
}

function KPICard({ title, value, subtitle, icon: Icon, trend, trendValue, color = "primary" }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: string;
}) {
  return (
    <Card className="border-border/50 relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {(subtitle || trendValue) && (
              <div className="flex items-center gap-2">
                {trend && trendValue && (
                  <span className={cn(
                    "flex items-center gap-0.5 text-xs font-medium",
                    trend === "up" && "text-success",
                    trend === "down" && "text-destructive",
                    trend === "neutral" && "text-muted-foreground",
                  )}>
                    {trend === "up" && <TrendingUp className="h-3 w-3" />}
                    {trend === "down" && <TrendingDown className="h-3 w-3" />}
                    {trendValue}
                  </span>
                )}
                {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
              </div>
            )}
          </div>
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center bg-primary/10")}>
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BehaviorScoreRing({ score, label, size = 60 }: { score: number; label: string; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="currentColor" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className={color}
        />
      </svg>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-bold", color)}>{score}</span>
    </div>
  );
}

export function FleetAnalyticsTab() {
  const { vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { drivers, isLoading: driversLoading } = useDrivers();
  const { jobs, isLoading: jobsLoading } = useJobs();
  const { events, driverScores, stats: behaviorStats, isConnected, isLoading: behaviorLoading, refresh } = useDriverBehavior();
  const { format: formatCurrency } = useCurrency();
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [fleetStatusPeriod, setFleetStatusPeriod] = useState<PeriodValue>("30");
  const [jobPipelinePeriod, setJobPipelinePeriod] = useState<PeriodValue>("30");
  const [fuelLevelsPeriod, setFuelLevelsPeriod] = useState<PeriodValue>("30");
  const [safetyRadarPeriod, setSafetyRadarPeriod] = useState<PeriodValue>("30");
  const [driverScoresPeriod, setDriverScoresPeriod] = useState<PeriodValue>("30");
  const [eventFeedPeriod, setEventFeedPeriod] = useState<PeriodValue>("30");

  useEffect(() => {
    const interval = setInterval(() => setLastRefresh(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const isLoading = vehiclesLoading || driversLoading || jobsLoading || behaviorLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── KPI Calculations ──
  const activeVehicles = vehicles.filter(v => v.status === "active").length;
  const maintenanceVehicles = vehicles.filter(v => v.status === "maintenance").length;
  const activeDrivers = drivers.filter(d => d.status === "active" || d.status === "on_trip").length;
  const completedJobs = jobs.filter(j => j.status === "completed").length;
  const inProgressJobs = jobs.filter(j => j.status === "in_progress").length;
  const totalRevenue = jobs.filter(j => j.status === "completed").reduce((sum, j) => sum + (j.amountNgn || 0), 0);
  const fleetUtilization = vehicles.length > 0 ? Math.round((activeVehicles / vehicles.length) * 100) : 0;
  const driverUtilization = drivers.length > 0 ? Math.round((activeDrivers / drivers.length) * 100) : 0;

  // ── Fleet Status Data ──
  const fleetStatusData = [
    { name: "Active", value: activeVehicles, color: "hsl(var(--success))" },
    { name: "Maintenance", value: maintenanceVehicles, color: "hsl(var(--warning))" },
    { name: "Inactive", value: vehicles.filter(v => v.status === "inactive").length, color: "hsl(var(--muted-foreground))" },
  ].filter(d => d.value > 0);

  const fleetStatusChart = withDemoFallback(fleetStatusData, demoVehicleStatusBreakdown.map(v => ({ name: v.name, value: v.value, color: v.fill })));

  // ── Job Pipeline Data ──
  const jobPipelineData = [
    { stage: "Created", count: jobs.filter(j => j.status === "created").length, fill: "hsl(var(--muted-foreground))" },
    { stage: "Assigned", count: jobs.filter(j => j.status === "assigned").length, fill: "hsl(var(--primary))" },
    { stage: "In Transit", count: inProgressJobs, fill: "hsl(var(--warning))" },
    { stage: "Completed", count: completedJobs, fill: "hsl(var(--success))" },
  ];

  // ── Fuel Level Distribution ──
  const fuelLevels = vehicles
    .filter(v => v.fuelLevel !== null && v.fuelLevel !== undefined)
    .map(v => ({
      vehicle: `${v.make} ${v.model}`.substring(0, 12),
      reg: v.registrationNumber,
      level: v.fuelLevel!,
      fill: v.fuelLevel! > 50 ? "hsl(var(--success))" : v.fuelLevel! > 25 ? "hsl(var(--warning))" : "hsl(var(--destructive))",
    }))
    .sort((a, b) => a.level - b.level);

  // ── Behavior Radar ──
  const avgBehavior = driverScores.length > 0
    ? {
        braking: Math.round(driverScores.reduce((s, d) => s + d.brakingScore, 0) / driverScores.length),
        acceleration: Math.round(driverScores.reduce((s, d) => s + d.accelerationScore, 0) / driverScores.length),
        cornering: Math.round(driverScores.reduce((s, d) => s + d.corneringScore, 0) / driverScores.length),
        speeding: Math.round(driverScores.reduce((s, d) => s + d.speedingScore, 0) / driverScores.length),
        overall: Math.round(driverScores.reduce((s, d) => s + d.overallScore, 0) / driverScores.length),
      }
    : null;

  const radarData = avgBehavior
    ? [
        { metric: "Braking", score: avgBehavior.braking, fullMark: 100 },
        { metric: "Acceleration", score: avgBehavior.acceleration, fullMark: 100 },
        { metric: "Cornering", score: avgBehavior.cornering, fullMark: 100 },
        { metric: "Speed Control", score: avgBehavior.speeding, fullMark: 100 },
      ]
    : [];

  const radarChart = withDemoFallback(radarData, [
    { metric: "Braking", score: 82, fullMark: 100 },
    { metric: "Acceleration", score: 76, fullMark: 100 },
    { metric: "Cornering", score: 88, fullMark: 100 },
    { metric: "Speed Control", score: 71, fullMark: 100 },
  ]);

  // ── Recent Behavior Events Timeline ──
  const recentEvents = events.slice(0, 8).map(e => ({
    type: e.eventType.replace(/_/g, " "),
    severity: e.severity,
    time: e.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    date: e.createdAt.toLocaleDateString([], { month: "short", day: "numeric" }),
  }));

  // ── Vehicle Capacity Utilization ──
  const capacityData = vehicles.map(v => {
    const assignedJobs = jobs.filter(j => j.vehicleId === v.id && (j.status === "in_progress" || j.status === "assigned"));
    return {
      vehicle: v.registrationNumber,
      capacity: v.capacity || 0,
      utilized: assignedJobs.length,
    };
  });

  // ── Demo fallbacks (so chart cards always look populated) ──
  const fuelLevelsChart = withDemoFallback(fuelLevels, [
    { vehicle: "Sprinter 314", reg: "LAG-014-AB", level: 88, fill: "hsl(var(--success))" },
    { vehicle: "Hino 500", reg: "LAG-227-CD", level: 72, fill: "hsl(var(--success))" },
    { vehicle: "Iveco Daily", reg: "ABJ-118-EF", level: 54, fill: "hsl(var(--success))" },
    { vehicle: "MAN TGS", reg: "LAG-303-GH", level: 41, fill: "hsl(var(--warning))" },
    { vehicle: "Volvo FH", reg: "PHC-441-JK", level: 33, fill: "hsl(var(--warning))" },
    { vehicle: "Scania R450", reg: "LAG-552-LM", level: 22, fill: "hsl(var(--destructive))" },
    { vehicle: "Mercedes Actros", reg: "ABJ-660-NP", level: 14, fill: "hsl(var(--destructive))" },
  ]);

  const driverScoresChart: Array<{ driverId: string; name?: string; overallScore: number; totalEvents: number; trend: "improving" | "stable" | "declining" }> = withDemoFallback(
    driverScores.map((d) => ({ driverId: d.driverId, name: drivers.find((dr) => dr.id === d.driverId)?.name, overallScore: d.overallScore, totalEvents: d.totalEvents, trend: d.trend })),
    [
      { driverId: "demo-1", name: "Tunde Adebayo", overallScore: 94, totalEvents: 3, trend: "improving" },
      { driverId: "demo-2", name: "Chinwe Okafor", overallScore: 88, totalEvents: 6, trend: "stable" },
      { driverId: "demo-3", name: "Musa Ibrahim", overallScore: 82, totalEvents: 8, trend: "improving" },
      { driverId: "demo-4", name: "Funke Adeleke", overallScore: 76, totalEvents: 11, trend: "stable" },
      { driverId: "demo-5", name: "Emeka Nwosu", overallScore: 71, totalEvents: 14, trend: "declining" },
      { driverId: "demo-6", name: "Aisha Bello", overallScore: 64, totalEvents: 19, trend: "declining" },
      { driverId: "demo-7", name: "Olumide Sani", overallScore: 58, totalEvents: 22, trend: "declining" },
      { driverId: "demo-8", name: "Ngozi Eze", overallScore: 49, totalEvents: 27, trend: "declining" },
    ]
  );

  const recentEventsChart = withDemoFallback(recentEvents, [
    { type: "harsh braking", severity: "high", time: "09:42", date: "Today" },
    { type: "overspeeding", severity: "critical", time: "09:18", date: "Today" },
    { type: "harsh acceleration", severity: "medium", time: "08:51", date: "Today" },
    { type: "harsh cornering", severity: "low", time: "08:33", date: "Today" },
    { type: "overspeeding", severity: "high", time: "07:56", date: "Today" },
    { type: "harsh braking", severity: "medium", time: "17:24", date: "Yesterday" },
    { type: "idling", severity: "low", time: "15:11", date: "Yesterday" },
    { type: "harsh acceleration", severity: "high", time: "11:48", date: "Yesterday" },
  ]);

  return (
    <div className="space-y-6">
      {/* ── Header with Live Status + Refresh ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <LiveIndicator connected={isConnected} />
          <span className="text-xs text-muted-foreground">
            Updated {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refresh();
            setLastRefresh(new Date());
          }}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-2" />
          Refresh
        </Button>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard title="Fleet Utilization" value={`${fleetUtilization}%`} icon={Truck} subtitle={`${activeVehicles}/${vehicles.length} active`} />
        <KPICard title="Driver Utilization" value={`${driverUtilization}%`} icon={Users} subtitle={`${activeDrivers}/${drivers.length} active`} />
        <KPICard title="Active Jobs" value={inProgressJobs} icon={Package} subtitle={`${completedJobs} completed`} />
        <KPICard title="Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} />
        <KPICard title="Safety Score" value={behaviorStats.averageScore || "—"} icon={ShieldAlert}
          subtitle={`${behaviorStats.critical} critical events`}
          trend={behaviorStats.averageScore >= 80 ? "up" : behaviorStats.averageScore >= 60 ? "neutral" : "down"}
          trendValue={behaviorStats.averageScore >= 80 ? "Good" : behaviorStats.averageScore >= 60 ? "Fair" : "Poor"}
        />
        <KPICard title="Maintenance" value={maintenanceVehicles} icon={Wrench} subtitle="vehicles in service" />
      </div>

      {/* ── Row 1: Fleet Status + Job Pipeline + Fuel Levels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fleet Status Donut */}
        <Card className="border-border/50">
          <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-sm font-medium">Fleet Status</CardTitle>
              <CardDescription className="text-xs">Real-time vehicle availability</CardDescription>
            </div>
            <PeriodFilter value={fleetStatusPeriod} onChange={setFleetStatusPeriod} variant="short" className="w-[140px] h-8" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={fleetStatusChart} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {fleetStatusChart.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Job Pipeline */}
        <Card className="border-border/50">
          <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-sm font-medium">Job Pipeline</CardTitle>
              <CardDescription className="text-xs">Current dispatch status</CardDescription>
            </div>
            <PeriodFilter value={jobPipelinePeriod} onChange={setJobPipelinePeriod} variant="short" className="w-[140px] h-8" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={jobPipelineData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis type="category" dataKey="stage" stroke="hsl(var(--muted-foreground))" fontSize={11} width={70} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="count" name="Jobs" radius={[0, 4, 4, 0]}>
                  {jobPipelineData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fuel Levels */}
        <Card className="border-border/50">
          <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Fuel className="h-4 w-4" /> Fuel Levels
              </CardTitle>
              <CardDescription className="text-xs">Current tank readings</CardDescription>
            </div>
            <PeriodFilter value={fuelLevelsPeriod} onChange={setFuelLevelsPeriod} variant="short" className="w-[140px] h-8" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
              {fuelLevelsChart.map((v, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-muted-foreground">{v.reg}</span>
                    <span className={cn(
                      "font-medium",
                      v.level > 50 ? "text-success" : v.level > 25 ? "text-warning" : "text-destructive"
                    )}>{v.level}%</span>
                  </div>
                  <Progress value={v.level} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 2: Driver Behavior Radar + Scores + Event Feed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Behavior Radar */}
        <Card className="border-border/50">
          <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" /> Fleet Safety Radar
              </CardTitle>
              <CardDescription className="text-xs">Average driver behavior scores</CardDescription>
            </div>
            <PeriodFilter value={safetyRadarPeriod} onChange={setSafetyRadarPeriod} variant="short" className="w-[140px] h-8" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarChart}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="Fleet Avg" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Individual Driver Scores */}
        <Card className="border-border/50">
          <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-sm font-medium">Driver Safety Scores</CardTitle>
              <CardDescription className="text-xs">Individual performance ranking</CardDescription>
            </div>
            <PeriodFilter value={driverScoresPeriod} onChange={setDriverScoresPeriod} variant="short" className="w-[140px] h-8" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {driverScoresChart.slice(0, 8).map((d, i) => {
                const name = d.name || `Device ${d.driverId.substring(0, 8)}`;
                return (
                  <div key={d.driverId} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                    <span className="text-xs font-medium text-muted-foreground w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{name}</p>
                      <p className="text-xs text-muted-foreground">{d.totalEvents} events</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={d.trend === "improving" ? "default" : d.trend === "declining" ? "destructive" : "secondary"} className="text-[10px] px-1.5">
                        {d.trend === "improving" ? "↑" : d.trend === "declining" ? "↓" : "→"}
                      </Badge>
                      <span className={cn(
                        "text-sm font-bold",
                        d.overallScore >= 80 ? "text-success" : d.overallScore >= 60 ? "text-warning" : "text-destructive"
                      )}>
                        {d.overallScore}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Live Event Feed */}
        <Card className="border-border/50">
          <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" /> Live Event Feed
              </CardTitle>
              <CardDescription className="text-xs">Recent driver behavior alerts</CardDescription>
            </div>
            <PeriodFilter value={eventFeedPeriod} onChange={setEventFeedPeriod} variant="short" className="w-[140px] h-8" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {recentEventsChart.map((e, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0">
                  <div className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    e.severity === "critical" && "bg-destructive",
                    e.severity === "high" && "bg-warning",
                    e.severity === "medium" && "bg-primary",
                    e.severity === "low" && "bg-muted-foreground",
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium capitalize truncate">{e.type}</p>
                    <p className="text-[10px] text-muted-foreground">{e.date} · {e.time}</p>
                  </div>
                  <Badge variant={e.severity === "critical" ? "destructive" : "secondary"} className="text-[10px] px-1.5 shrink-0">
                    {e.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: Operational Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/50 bg-success/5">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-7 w-7 text-success mx-auto mb-1.5" />
            <p className="text-xl font-bold">{completedJobs}</p>
            <p className="text-xs text-muted-foreground">Completed Jobs</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-warning/5">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-7 w-7 text-warning mx-auto mb-1.5" />
            <p className="text-xl font-bold">{behaviorStats.critical + behaviorStats.high}</p>
            <p className="text-xs text-muted-foreground">Safety Alerts</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-primary/5">
          <CardContent className="p-4 text-center">
            <Gauge className="h-7 w-7 text-primary mx-auto mb-1.5" />
            <p className="text-xl font-bold">{behaviorStats.averageScore || "—"}</p>
            <p className="text-xs text-muted-foreground">Avg Safety Score</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-accent/5">
          <CardContent className="p-4 text-center">
            <Eye className="h-7 w-7 text-accent-foreground mx-auto mb-1.5" />
            <p className="text-xl font-bold">{behaviorStats.last24h}</p>
            <p className="text-xs text-muted-foreground">Events (24h)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
