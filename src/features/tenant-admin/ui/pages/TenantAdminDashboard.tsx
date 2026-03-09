import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { VerificationBanner } from "@/components/admin/VerificationBanner";
import { useTenantDashboard } from "@/hooks/useTenantDashboard";
import { useVehicles } from "@/hooks/useVehicles";
import { useDrivers } from "@/hooks/useDrivers";
import { useJobs } from "@/hooks/useJobs";
import { useAlerts } from "@/hooks/useAlerts";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";

export default function TenantAdminDashboard() {
  const navigate = useNavigate();
  const { data: tenantData, isLoading: tenantLoading } = useTenantDashboard();
  const { vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { drivers, isLoading: driversLoading } = useDrivers();
  const { jobs, isLoading: jobsLoading } = useJobs();
  const { alerts, isLoading: alertsLoading, acknowledgeAlert } = useAlerts();

  const isLoading = tenantLoading || vehiclesLoading || driversLoading || jobsLoading || alertsLoading;

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

  return (
    <DashboardLayout
      title="Fleet Dashboard"
      subtitle={`${tenantName} - Overview`}
    >
      <div className="space-y-6">
        {/* Verification Banner */}
        <VerificationBanner />

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

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate("/admin/fleet")} className="gap-2">
            <Truck className="h-4 w-4" />
            Manage Fleet
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/drivers")} className="gap-2">
            <Users className="h-4 w-4" />
            Manage Drivers
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/jobs")} className="gap-2">
            <Package className="h-4 w-4" />
            Create Job
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/fleet?tab=analytics")} className="gap-2">
            <TrendingUp className="h-4 w-4" />
            View Analytics
          </Button>
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
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No jobs yet"
                  description="Create your first job to see activity trends"
                  actionLabel="Create Job"
                  onAction={() => navigate("/admin/jobs")}
                />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={tripData}>
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
                    <XAxis
                      dataKey="day"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="trips"
                      name="Jobs Created"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorTrips)"
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      name="Completed"
                      stroke="hsl(var(--success))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCompleted)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Vehicle Status Pie */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Vehicle Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vehicles.length === 0 ? (
                <EmptyState
                  icon={Truck}
                  title="No vehicles"
                  description="Add your first vehicle to see status breakdown"
                  actionLabel="Add Vehicle"
                  onAction={() => navigate("/admin/fleet")}
                />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={vehicleStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {vehicleStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {vehicleStatusData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {item.name}: {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Active Jobs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Active Jobs
              </CardTitle>
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
                                : "outline-solid"
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-primary" />
                Recent Alerts
              </CardTitle>
              <Button variant="ghost" size="sm">
                View All
              </Button>
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
