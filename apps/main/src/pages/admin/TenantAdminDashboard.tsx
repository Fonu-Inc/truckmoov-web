import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TrialBanner } from "@/components/admin/TrialBanner";
import { useState } from "react";
import {
  Truck,
  Users,
  Package,
  Gauge,
  Clock,
  TrendingUp,
  MapPin,
  AlertTriangle,
  Bell,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { ChartDateFilter, type ChartDateRange } from "@/components/shadcn/chart-date-filter";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { format, subDays, startOfDay, isWithinInterval } from "date-fns";
import { Badge } from "@/components/shadcn/badge";

export default function TenantAdminDashboard() {
  const navigate = useNavigate();
  const [activityRange, setActivityRange] = useState<ChartDateRange>("7d");
  const [vehicleStatusRange, setVehicleStatusRange] = useState<ChartDateRange>("7d");
  const tenantData: any = null;
  const tenantLoading = false;
  const vehicles: any[] = [];
  const vehiclesLoading = false;
  const drivers: any[] = [];
  const jobs: any[] = [];
  const jobsLoading = false;
  const alerts: any[] = [];
  const alertsLoading = false;
  const acknowledgeAlert = async (...args: any[]) => {};

  const isLoading = tenantLoading || vehiclesLoading || jobsLoading || alertsLoading;

  // Compute real stats
  const totalVehicles = vehicles.length;
  const totalDrivers = drivers.length;
  const activeDrivers = drivers.filter((d) => d.status === "active" || d.status === "on_trip").length;
  const pendingJobs = jobs.filter((j) => j.status === "created" || j.status === "assigned").length;
  const tenantName = tenantData?.name ?? "Fleet Dashboard";

  // Vehicle status breakdown for pie chart
  const vehicleStatusData = useMemo(() => {
    const statusCounts = vehicles.reduce(
      (acc, v) => {
        acc[v.status] = (acc[v.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const statusConfig: Record<string, { name: string; color: string }> = {
      active: { name: "Active", color: "hsl(var(--success))" },
      inactive: { name: "Idle", color: "hsl(var(--warning))" },
      maintenance: { name: "Maintenance", color: "hsl(var(--destructive))" },
      decommissioned: { name: "Offline", color: "hsl(var(--muted-foreground))" },
    };

    return Object.entries(statusCounts).map(([status, value]) => ({
      name: statusConfig[status]?.name || status,
      value,
      color: statusConfig[status]?.color || "hsl(var(--muted))",
    }));
  }, [vehicles]);

  // Trip data for the last 7 days (based on jobs created)
  const tripData = useMemo(() => {
    const today = startOfDay(new Date());
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      return {
        day: format(date, "EEE"),
        date,
        trips: 0,
        completed: 0,
      };
    });

    jobs.forEach((job) => {
      const jobDate = startOfDay(new Date(job.createdAt));
      const dayIndex = days.findIndex((d) =>
        isWithinInterval(jobDate, {
          start: startOfDay(d.date),
          end: new Date(startOfDay(d.date).getTime() + 24 * 60 * 60 * 1000 - 1),
        })
      );
      if (dayIndex !== -1) {
        days[dayIndex].trips += 1;
        if (job.status === "completed") {
          days[dayIndex].completed += 1;
        }
      }
    });

    return days;
  }, [jobs]);

  // Recent active jobs (non-completed, non-cancelled)
  const activeJobs = useMemo(() => {
    return jobs
      .filter((j) => j.status !== "completed" && j.status !== "cancelled")
      .slice(0, 5);
  }, [jobs]);

  // Recent unacknowledged alerts
  const recentAlerts = useMemo(() => {
    return alerts.filter((a) => !a.acknowledged).slice(0, 4);
  }, [alerts]);

  // On-time delivery calculation
  const onTimeRate = useMemo(() => {
    const completedJobs = jobs.filter((j) => j.status === "completed");
    if (completedJobs.length === 0) return null;

    const onTime = completedJobs.filter((j) => {
      if (!j.deadline || !j.completedAt) return true;
      return new Date(j.completedAt) <= new Date(j.deadline);
    }).length;

    return Math.round((onTime / completedJobs.length) * 100);
  }, [jobs]);

  const hasNoData = totalVehicles === 0 && totalDrivers === 0 && jobs.length === 0;

  const tripChartData = jobs.length > 0 ? tripData : [];
  const vehicleStatusChartData = vehicleStatusData;

  return (
    <DashboardLayout
      title="Fleet Dashboard"
      subtitle={`${tenantName} - Overview`}
    >
      <div className="space-y-6">
        <TrialBanner />

        {/* Quick Actions container with descriptive cards (horizontal scroll) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Jump into common fleet workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2 -mb-2 snap-x snap-mandatory [scrollbar-width:thin]">
              {[
                { title: "Manage Fleet", desc: "Vehicles, schedules, maintenance and fuel.", icon: Truck, cta: "Open fleet", to: "/admin/fleet" },
                { title: "Manage Drivers", desc: "Driver roster, status, licenses and ratings.", icon: Users, cta: "Open drivers", to: "/admin/drivers" },
                { title: "Create Job", desc: "Dispatch a new shipment to your fleet.", icon: Package, cta: "Open jobs", to: "/admin/jobs" },
                { title: "View Analytics", desc: "Performance, utilization and trends.", icon: TrendingUp, cta: "Open analytics", to: "/admin/fleet?tab=analytics" },
              ].map((qa) => (
                <button
                  key={qa.title}
                  onClick={() => navigate(qa.to)}
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

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Vehicles"
            value={isLoading ? "..." : totalVehicles}
            change={0}
            changeLabel="registered"
            icon={Truck}
          />
          <StatCard
            title="Active Drivers"
            value={isLoading ? "..." : `${activeDrivers}/${totalDrivers}`}
            icon={Users}
            variant={totalDrivers > 0 ? "success" : "default"}
          />
          <StatCard
            title="Pending Jobs"
            value={isLoading ? "..." : pendingJobs}
            icon={Package}
            variant={pendingJobs > 5 ? "warning" : "default"}
          />
          <StatCard
            title="On-Time Delivery"
            value={isLoading ? "..." : onTimeRate !== null ? `${onTimeRate}%` : "N/A"}
            icon={Clock}
            variant={onTimeRate !== null && onTimeRate >= 90 ? "success" : "default"}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Trip Performance Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Weekly Job Activity
              </CardTitle>
              <CardDescription>Jobs created vs completed across the past week.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={tripChartData}>
                    <defs>
                      <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Area type="monotone" dataKey="trips" name="Jobs Created" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorTrips)" />
                    <Area type="monotone" dataKey="completed" name="Completed" stroke="hsl(var(--success))" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
                  </AreaChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Vehicle Status Pie */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Vehicle Status
                </CardTitle>
                <ChartDateFilter value={vehicleStatusRange} onValueChange={setVehicleStatusRange} />
              </div>
              <CardDescription>Live distribution of fleet vehicles by operational state.</CardDescription>
            </CardHeader>
            <CardContent>
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={vehicleStatusChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                      {vehicleStatusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {vehicleStatusChartData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Active Jobs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Active Jobs
                </CardTitle>
                <CardDescription>Currently assigned and in-progress deliveries.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin/jobs")}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {activeJobs.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No active jobs"
                  description="All caught up! Create a new job when ready"
                  actionLabel="Create Job"
                  onAction={() => navigate("/admin/jobs")}
                  className="py-8"
                />
              ) : (
                <div className="space-y-4">
                  {activeJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{job.reference}</span>
                          <Badge
                            variant={
                              job.status === "in_progress"
                                ? "default"
                                : job.status === "assigned"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {job.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {job.pickupAddress.split(",")[0]} → {job.deliveryAddress.split(",")[0]}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₦{job.amountNgn.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{job.cargoType || "General"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-primary" />
                  Recent Alerts
                </CardTitle>
                <CardDescription>Latest fleet safety, telemetry and compliance events.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {recentAlerts.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="No alerts"
                  description="Your fleet is running smoothly with no issues to report"
                  className="py-8"
                />
              ) : (
                <div className="space-y-3">
                  {recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-3 rounded-lg border border-border p-3"
                    >
                      <div
                        className={`mt-0.5 rounded-full p-1.5 ${
                          alert.severity === "critical" || alert.severity === "high"
                            ? "bg-destructive/10 text-destructive"
                            : alert.severity === "medium"
                            ? "bg-warning/10 text-warning"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <AlertTriangle className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(alert.createdAt), "MMM d, h:mm a")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
