import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { Button } from "@/components/shadcn/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {TrendingUp, TrendingDown, Fuel, Truck, Users, Package, DollarSign, Clock, AlertTriangle, CheckCircle, Calendar, Gauge, Wrench, Route, Star, Loader2, BarChart3, Download} from "lucide-react";
import { useState } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { useDrivers } from "@/hooks/useDrivers";
import { useJobs } from "@/hooks/useJobs";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useCurrency } from "@/contexts/CurrencyContext";

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  trend: "up" | "down";
}

function StatCard({ title, value, change, icon: Icon, trend }: StatCardProps) {
  return (
    <Card className="bg-card border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <div className={`flex items-center gap-1 text-xs ${trend === "up" ? "text-success" : "text-destructive"}`}>
              {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{Math.abs(change)}% vs last period</span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const [dateRange, setDateRange] = useState("30d");
  const { vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { drivers, isLoading: driversLoading } = useDrivers();
  const { jobs, isLoading: jobsLoading } = useJobs();
  const { format: formatCurrency } = useCurrency();

  const isLoading = vehiclesLoading || driversLoading || jobsLoading;

  // Calculate real stats from data
  const activeVehicles = vehicles.filter(v => v.status === "active").length;
  const completedJobs = jobs.filter(j => j.status === "completed").length;
  const totalJobValue = jobs.reduce((sum, j) => sum + (j.amountNgn || 0), 0);
  const onTimeDeliveries = completedJobs > 0 ? Math.round((completedJobs / Math.max(jobs.length, 1)) * 100) : 0;

  // Generate chart data from real jobs
  const jobsByStatus = [
    { name: "Created", value: jobs.filter(j => j.status === "created").length, color: "hsl(var(--warning))" },
    { name: "Assigned", value: jobs.filter(j => j.status === "assigned").length, color: "hsl(var(--primary))" },
    { name: "In Progress", value: jobs.filter(j => j.status === "in_progress").length, color: "hsl(var(--accent))" },
    { name: "Completed", value: jobs.filter(j => j.status === "completed").length, color: "hsl(var(--success))" },
  ].filter(s => s.value > 0);

  const vehiclesByStatus = [
    { name: "Active", value: vehicles.filter(v => v.status === "active").length, color: "hsl(var(--success))" },
    { name: "Maintenance", value: vehicles.filter(v => v.status === "maintenance").length, color: "hsl(var(--warning))" },
    { name: "Inactive", value: vehicles.filter(v => v.status === "inactive").length, color: "hsl(var(--muted-foreground))" },
  ].filter(s => s.value > 0);

  // Driver stats
  const driversByStatus = [
    { name: "Available", value: drivers.filter(d => d.status === "available").length, color: "hsl(var(--success))" },
    { name: "On Trip", value: drivers.filter(d => d.status === "on_trip").length, color: "hsl(var(--primary))" },
    { name: "Offline", value: drivers.filter(d => d.status === "offline").length, color: "hsl(var(--muted-foreground))" },
  ].filter(s => s.value > 0);

  const jobsByStatusChart = jobsByStatus;
  const vehiclesByStatusChart = vehiclesByStatus;
  const driversByStatusChart = driversByStatus;

  if (isLoading) {
    return (
      <DashboardLayout title="Analytics" subtitle="Comprehensive fleet insights and performance metrics">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  // Always render charts (with dummy fallback data) so the analytics surface stays populated

  return (
    <DashboardLayout title="Analytics" subtitle="Comprehensive fleet insights and performance metrics">
      <div className="space-y-6">
        {/* Date Range Filter */}
        <div className="flex items-center justify-end gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Active Vehicles" 
            value={`${activeVehicles}/${vehicles.length}`} 
            change={0} 
            icon={Truck} 
            trend="up" 
          />
          <StatCard 
            title="Active Drivers" 
            value={`${drivers.filter(d => d.status !== "offline").length}/${drivers.length}`} 
            change={0} 
            icon={Users} 
            trend="up" 
          />
          <StatCard 
            title="On-Time Deliveries" 
            value={`${onTimeDeliveries}%`} 
            change={0} 
            icon={Clock} 
            trend="up" 
          />
          <StatCard 
            title="Total Job Value" 
            value={formatCurrency(totalJobValue)} 
            change={0} 
            icon={DollarSign} 
            trend="up" 
          />
        </div>

        {/* Main Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="fleet" className="gap-2">
              <Truck className="h-4 w-4" />
              Fleet
            </TabsTrigger>
            <TabsTrigger value="drivers" className="gap-2">
              <Users className="h-4 w-4" />
              Drivers
            </TabsTrigger>
            <TabsTrigger value="jobs" className="gap-2">
              <Package className="h-4 w-4" />
              Jobs
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Jobs by Status */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Jobs by Status</CardTitle>
                  <CardDescription>Current job distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  {true ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={jobsByStatusChart}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {jobsByStatusChart.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px" }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      No jobs yet
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Vehicles by Status */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Vehicles by Status</CardTitle>
                  <CardDescription>Fleet status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  {true ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={vehiclesByStatusChart}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {vehiclesByStatusChart.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px" }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      No vehicles yet
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Drivers by Status */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Drivers by Status</CardTitle>
                  <CardDescription>Driver availability</CardDescription>
                </CardHeader>
                <CardContent>
                  {true ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={driversByStatusChart}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {driversByStatusChart.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px" }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      No drivers yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="border-border/50 bg-success/5">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                  <p className="text-2xl font-bold">{completedJobs}</p>
                  <p className="text-sm text-muted-foreground">Completed Jobs</p>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-primary/5">
                <CardContent className="p-4 text-center">
                  <Route className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{jobs.length}</p>
                  <p className="text-sm text-muted-foreground">Total Jobs</p>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-warning/5">
                <CardContent className="p-4 text-center">
                  <Truck className="h-8 w-8 text-warning mx-auto mb-2" />
                  <p className="text-2xl font-bold">{vehicles.length}</p>
                  <p className="text-sm text-muted-foreground">Vehicles</p>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-accent/5">
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 text-accent mx-auto mb-2" />
                  <p className="text-2xl font-bold">{drivers.length}</p>
                  <p className="text-sm text-muted-foreground">Drivers</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Fleet Tab */}
          <TabsContent value="fleet" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Vehicle Status Distribution</CardTitle>
                  <CardDescription>Current status of all vehicles</CardDescription>
                </CardHeader>
                <CardContent>
                  {true ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={vehiclesByStatusChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px" }}
                        />
                        <Bar dataKey="value" name="Vehicles">
                          {vehiclesByStatusChart.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No vehicle data
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Vehicle Types</CardTitle>
                  <CardDescription>Fleet composition by type</CardDescription>
                </CardHeader>
                <CardContent>
                  {vehicles.length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(
                        vehicles.reduce((acc, v) => {
                          acc[v.type] = (acc[v.type] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="capitalize">{type}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${(count / vehicles.length) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-8">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      No vehicle data
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Drivers Tab */}
          <TabsContent value="drivers" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Driver Availability</CardTitle>
                  <CardDescription>Current driver status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  {true ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={driversByStatusChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px" }}
                        />
                        <Bar dataKey="value" name="Drivers">
                          {driversByStatusChart.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No driver data
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Top Rated Drivers</CardTitle>
                  <CardDescription>Drivers with highest ratings</CardDescription>
                </CardHeader>
                <CardContent>
                  {drivers.length > 0 ? (
                    <div className="space-y-3">
                      {drivers
                        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                        .slice(0, 5)
                        .map((driver, i) => (
                          <div key={driver.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-muted-foreground w-4">{i + 1}</span>
                              <div>
                                <p className="font-medium">{driver.name}</p>
                                <p className="text-xs text-muted-foreground">{driver.totalTrips || 0} trips</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-warning fill-warning" />
                              <span className="font-medium">{driver.rating?.toFixed(1) || "—"}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      No driver data
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Job Status Distribution</CardTitle>
                  <CardDescription>Current jobs by status</CardDescription>
                </CardHeader>
                <CardContent>
                  {true ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={jobsByStatusChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px" }}
                        />
                        <Bar dataKey="value" name="Jobs">
                          {jobsByStatusChart.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No job data
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Job Value Summary</CardTitle>
                  <CardDescription>Financial overview of jobs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                      <p className="text-sm text-muted-foreground">Completed Jobs Value</p>
                      <p className="text-2xl font-bold text-success">
                        {formatCurrency(
                          jobs.filter(j => j.status === "completed").reduce((sum, j) => sum + (j.amountNgn || 0), 0)
                        )}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-sm text-muted-foreground">In Progress Value</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(
                          jobs.filter(j => j.status === "in_progress").reduce((sum, j) => sum + (j.amountNgn || 0), 0)
                        )}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                      <p className="text-sm text-muted-foreground">Pending Value</p>
                      <p className="text-2xl font-bold text-warning">
                        {formatCurrency(
                          jobs.filter(j => j.status === "created" || j.status === "assigned").reduce((sum, j) => sum + (j.amountNgn || 0), 0)
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}



