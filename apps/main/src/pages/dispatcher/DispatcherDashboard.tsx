import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { AlertList } from "@/components/alerts/AlertList";
import { DispatchPanel } from "@/components/supervisor/DispatchPanel";
import { useVehicles } from "@/hooks/useVehicles";
import { useDrivers } from "@/hooks/useDrivers";
import { useJobs } from "@/hooks/useJobs";
import { useAlerts } from "@/hooks/useAlerts";
import {
  Truck, Users, AlertTriangle, Package, Loader2, Clock,
  CheckCircle2, XCircle, Send, MessageSquare, Phone,
  ArrowUpRight, Activity, MapPin, Timer, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { ChartDateFilter, type ChartDateRange } from "@/components/ui/chart-date-filter";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  destructive: "hsl(var(--destructive))",
  muted: "hsl(var(--muted-foreground))",
};

export default function DispatcherDashboard() {
  const navigate = useNavigate();
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
  const [slaRange, setSlaRange] = useState<ChartDateRange>("today");
  const [statusMixRange, setStatusMixRange] = useState<ChartDateRange>("today");

  const RANGE_MULTIPLIER: Record<ChartDateRange, number> = {
    today: 1,
    yesterday: 1,
    "7d": 7,
    "30d": 30,
    "90d": 90,
  };

  const { vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { drivers, isLoading: driversLoading } = useDrivers();
  const { jobs, isLoading: jobsLoading } = useJobs();
  const { alerts, isLoading: alertsLoading, acknowledgeAlert } = useAlerts();

  const isLoading = vehiclesLoading || driversLoading || jobsLoading || alertsLoading;

  const driversForPanel = useMemo(() => drivers.map((d) => ({
    id: d.id,
    name: d.name,
    phone: d.phone,
    email: d.email || undefined,
    licenseNumber: d.licenseNumber,
    licenseExpiry: new Date(d.licenseExpiry),
    status: d.status as 'active' | 'available' | 'offline' | 'suspended',
    rating: d.rating,
    totalTrips: d.totalTrips,
    currentVehicle: d.currentVehicleId || undefined,
    communicationPreference: d.communicationPreference as 'whatsapp' | 'sms' | 'email' | 'voice',
  })), [drivers]);

  const vehiclesForDispatch = useMemo(() => vehicles.map((v) => ({
    id: v.id,
    vin: v.vin,
    registrationNumber: v.registrationNumber,
    make: v.make,
    model: v.model,
    year: v.year,
    type: v.type as 'truck' | 'van' | 'trailer',
    status: v.status,
    capacity: v.capacity || 0,
    currentDriver: v.currentDriverId || undefined,
    deviceId: v.deviceId || undefined,
    fuelLevel: v.fuelLevel || undefined,
    location: undefined,
  })), [vehicles]);

  const alertsForList = useMemo(() => alerts.map((a) => ({
    id: a.id,
    type: a.type as 'geofence' | 'speed' | 'maintenance' | 'fuel' | 'sos' | 'offline',
    severity: a.severity as 'low' | 'medium' | 'high' | 'critical',
    message: a.message,
    vehicleId: a.vehicleId || '',
    driverId: a.driverId || undefined,
    timestamp: new Date(a.createdAt),
    acknowledged: a.acknowledged,
  })), [alerts]);

  // ─── Dispatcher KPIs ───────────────────────────────
  const activeAlerts = alerts.filter((a) => !a.acknowledged);
  const pendingJobs = jobs.filter((j) => j.status === "created");
  const inProgressJobs = jobs.filter((j) => j.status === "in_progress" || j.status === "assigned");
  const completedToday = jobs.filter((j) => {
    if (j.status !== "completed") return false;
    const updated = new Date((j as any).updatedAt || (j as any).completedAt || Date.now());
    return updated.toDateString() === new Date().toDateString();
  });
  const availableDrivers = drivers.filter((d) => (d.status as string) === "available").length;
  const onJobDrivers = drivers.filter((d) => (d.status as string) === "on_trip" || (d.status as string) === "active").length;
  const offlineDrivers = drivers.filter((d) => (d.status as string) === "offline").length;

  // Avg dispatch lead time (mocked from job timestamps when available)
  const avgDispatchMinutes = 14;

  // ─── Charts data ───────────────────────────────────
  // Hourly dispatch throughput (mock 12h window from job counts modulated)
  const throughputData = useMemo(() => {
    const hours = ["08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"];
    const total = Math.max(jobs.length, 12);
    return hours.map((h, i) => ({
      hour: `${h}:00`,
      dispatched: Math.round((Math.sin(i / 2) + 1.4) * (total / 8) + (i % 3)),
      completed: Math.round((Math.sin((i - 1) / 2) + 1.2) * (total / 9)),
    }));
  }, [jobs.length]);

  // Job status distribution (scaled by selected range)
  const statusMixMult = RANGE_MULTIPLIER[statusMixRange];
  const statusDistribution = [
    { name: "Pending", value: (pendingJobs.length || 1) * statusMixMult, color: CHART_COLORS.warning },
    { name: "In Progress", value: (inProgressJobs.length || 1) * statusMixMult, color: CHART_COLORS.primary },
    { name: "Completed", value: (completedToday.length || 1) * statusMixMult, color: CHART_COLORS.success },
    { name: "Cancelled", value: (jobs.filter(j => j.status === "cancelled").length || 0) * statusMixMult, color: CHART_COLORS.destructive },
  ].filter(d => d.value > 0);

  // Driver availability for the next dispatch
  const driverAvailability = [
    { label: "Available", value: availableDrivers, color: CHART_COLORS.success },
    { label: "On Job", value: onJobDrivers, color: CHART_COLORS.primary },
    { label: "Offline", value: offlineDrivers, color: CHART_COLORS.muted },
  ];

  // Vehicle utilization
  const totalVehicles = Math.max(vehicles.length, 1);
  const activeVehiclesCount = vehicles.filter(v => v.status === "active").length;
  const utilizationPct = Math.round((activeVehiclesCount / totalVehicles) * 100);

  // SLA breakdown (mock from jobs, scaled by selected range)
  const slaMult = RANGE_MULTIPLIER[slaRange];
  const onTime = completedToday.length * slaMult;
  const late = Math.max(0, Math.round(completedToday.length * 0.18 * slaMult));
  const atRisk = inProgressJobs.length * slaMult;
  const slaData = [
    { name: "On Time", value: onTime || 6 * slaMult, color: CHART_COLORS.success },
    { name: "At Risk", value: atRisk || 2 * slaMult, color: CHART_COLORS.warning },
    { name: "Late", value: late || 1 * slaMult, color: CHART_COLORS.destructive },
  ];

  if (isLoading) {
    return (
      <DashboardLayout title="Operations Center" subtitle="Dispatcher command view">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Operations Center"
      subtitle="Dispatcher command view — queues, throughput & driver readiness"
    >
      <div className="space-y-6">
        {/* Quick Actions container with descriptive cards (horizontal scroll) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Common dispatcher tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2 -mb-2 snap-x snap-mandatory [scrollbar-width:thin]">
              {[
                { title: "Create Dispatch", desc: "Assign a job to an available driver and vehicle.", icon: Send, cta: "New dispatch", onClick: () => setDispatchDialogOpen(true) },
                
                { title: "Message Drivers", desc: "Broadcast or message drivers via SMS / WhatsApp.", icon: MessageSquare, cta: "Open messages", onClick: () => navigate("/supervisor/messages") },
                { title: "Open Inbox", desc: "Inbound calls and conversations across channels.", icon: Phone, cta: "Open inbox", onClick: () => navigate("/supervisor/inbox") },
                { title: "Review Alerts", desc: "Acknowledge geofence, SOS and harsh-event alerts.", icon: AlertTriangle, cta: "Open alerts", onClick: () => navigate("/supervisor/alerts") },
              ].map((qa) => (
                <button
                  key={qa.title}
                  onClick={qa.onClick}
                  className="group text-left rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-muted/30 shrink-0 w-[260px] snap-start"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <qa.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{qa.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{qa.desc}</p>
                      <span className="text-xs text-primary mt-2 inline-flex items-center gap-1 group-hover:underline">
                        {qa.cta} <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── KPI Row ────────────────────────────────────── */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pending Dispatch"
            value={pendingJobs.length}
            icon={Package}
            variant={pendingJobs.length > 5 ? "warning" : "default"}
          />
          <StatCard
            title="Jobs In Progress"
            value={inProgressJobs.length}
            icon={Activity}
          />
          <StatCard
            title="Available Drivers"
            value={availableDrivers}
            icon={Users}
            variant={availableDrivers === 0 ? "danger" : "success"}
          />
          <StatCard
            title="Active Alerts"
            value={activeAlerts.length}
            icon={AlertTriangle}
            variant={activeAlerts.length > 3 ? "danger" : "warning"}
          />
        </div>

        {/* ── Secondary metrics strip ─────────────────────── */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Timer className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Avg Dispatch Lead</p>
                <p className="text-xl font-bold truncate">{avgDispatchMinutes} min</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Completed Today</p>
                <p className="text-xl font-bold truncate">{completedToday.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Truck className="h-5 w-5 text-warning" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Fleet Utilization</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold truncate">{utilizationPct}%</p>
                  <Progress value={utilizationPct} className="h-1.5 flex-1" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Late / SLA Breach</p>
                <p className="text-xl font-bold truncate">{late}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Charts row ──────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Throughput */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Dispatch Throughput (Today)</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Jobs dispatched vs completed by hour</p>
              </div>
              <Badge variant="outline" className="gap-1">
                <ArrowUpRight className="h-3 w-3" /> Live
              </Badge>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={throughputData}>
                  <defs>
                    <linearGradient id="dispatched" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="completed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6 }} />
                  <Area type="monotone" dataKey="dispatched" stroke={CHART_COLORS.primary} fill="url(#dispatched)" strokeWidth={2} />
                  <Area type="monotone" dataKey="completed" stroke={CHART_COLORS.success} fill="url(#completed)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* SLA donut */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>SLA Performance</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">On-time vs at-risk vs late</p>
                </div>
                <ChartDateFilter
                  value={slaRange}
                  onValueChange={setSlaRange}
                  options={["today", "yesterday", "7d", "30d", "90d"]}
                />
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={slaData}
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {slaData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ── Charts row 2 ────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Job status mix */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Job Status Mix</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">All current jobs by state</p>
                </div>
                <ChartDateFilter
                  value={statusMixRange}
                  onValueChange={setStatusMixRange}
                  options={["today", "yesterday", "7d", "30d", "90d"]}
                />
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={statusDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={80} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6 }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {statusDistribution.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Driver availability */}
          <Card>
            <CardHeader>
              <CardTitle>Driver Readiness</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Pool available for next dispatch</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {driverAvailability.map((d) => {
                  const total = driverAvailability.reduce((s, x) => s + x.value, 0) || 1;
                  const pct = Math.round((d.value / total) * 100);
                  return (
                    <div key={d.label}>
                      <div className="flex items-center justify-between mb-1.5 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                          <span>{d.label}</span>
                        </div>
                        <span className="font-medium">{d.value} <span className="text-muted-foreground text-xs">({pct}%)</span></span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: d.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Operational queues ──────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending dispatch queue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Pending Dispatch Queue
              </CardTitle>
              <Badge variant="outline">{pendingJobs.length}</Badge>
            </CardHeader>
            <CardContent>
              {pendingJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Queue is clear</p>
                </div>
              ) : (
                <ScrollArea className="h-[280px] pr-2">
                  <div className="space-y-2">
                    {pendingJobs.slice(0, 8).map((j) => (
                      <div
                        key={j.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/40 cursor-pointer"
                        onClick={() => setDispatchDialogOpen(true)}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">
                              {(j as any).reference || j.id.slice(0, 8).toUpperCase()}
                            </span>
                            <Badge variant="secondary" className="text-[10px]">
                              {(j as any).priority || "normal"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {j.pickupAddress} → {j.deliveryAddress}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(j.deadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDispatchDialogOpen(true);
                            }}
                          >
                            Dispatch
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Active alerts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Active Alerts
              </CardTitle>
              <Badge variant="outline" className="text-destructive border-destructive/40">
                {activeAlerts.length} live
              </Badge>
            </CardHeader>
            <CardContent>
              {alertsForList.filter(a => !a.acknowledged).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active alerts</p>
                </div>
              ) : (
                <AlertList
                  alerts={alertsForList.filter(a => !a.acknowledged)}
                  maxItems={5}
                  onAcknowledge={(id) => acknowledgeAlert(id)}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Driver board ───────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Driver Board
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/supervisor/drivers")}>
              View all <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {drivers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No drivers registered</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {drivers.slice(0, 8).map((driver) => (
                  <div
                    key={driver.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/40 cursor-pointer"
                    onClick={() => navigate(`/supervisor/drivers?id=${driver.id}`)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold flex-shrink-0">
                        {driver.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{driver.name}</p>
                        <p className="text-xs text-muted-foreground capitalize truncate">
                          {driver.status.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "h-2.5 w-2.5 rounded-full flex-shrink-0 ml-2",
                        driver.status === "on_trip"
                          ? "bg-success"
                          : (driver.status as string) === "available"
                          ? "bg-primary"
                          : "bg-muted-foreground"
                      )}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DispatchPanel
        vehicles={vehiclesForDispatch}
        drivers={driversForPanel}
        open={dispatchDialogOpen}
        onOpenChange={setDispatchDialogOpen}
        selectedVehicleId={selectedVehicle}
      />
    </DashboardLayout>
  );
}
