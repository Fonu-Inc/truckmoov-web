import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { useTenants } from "@/hooks/useTenants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Building2,
  Truck,
  Users,
  CreditCard,
  Activity,
  TrendingUp,
  Server,
  Wifi,
  Cpu,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  Clock,
  Globe,
  Zap,
  HardDrive,
  Database,
  Radio,
  MapPin,
  Eye,
} from "lucide-react";
import { ChartDateFilter, type ChartDateRange } from "@/components/shadcn/chart-date-filter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Badge } from "@/components/shadcn/badge";
import { Progress } from "@/components/shadcn/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "@/contexts/CurrencyContext";
import { CurrencySelector } from "@/components/CurrencySelector";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { StakeholderOverviewTab } from "@/components/platform/StakeholderOverviewTab";

// Revenue data in NGN (base currency)
const revenueDataNGN = [
  { month: "Jan", revenueNGN: 193750000, revenueUSD: 125000, tenants: 45 },
  { month: "Feb", revenueNGN: 220100000, revenueUSD: 142000, tenants: 52 },
  { month: "Mar", revenueNGN: 244900000, revenueUSD: 158000, tenants: 61 },
  { month: "Apr", revenueNGN: 271250000, revenueUSD: 175000, tenants: 68 },
  { month: "May", revenueNGN: 292950000, revenueUSD: 189000, tenants: 74 },
  { month: "Jun", revenueNGN: 333250000, revenueUSD: 215000, tenants: 82 },
  { month: "Jul", revenueNGN: 353400000, revenueUSD: 228000, tenants: 89 },
  { month: "Aug", revenueNGN: 379750000, revenueUSD: 245000, tenants: 95 },
  { month: "Sep", revenueNGN: 415400000, revenueUSD: 268000, tenants: 103 },
  { month: "Oct", revenueNGN: 441750000, revenueUSD: 285000, tenants: 112 },
  { month: "Nov", revenueNGN: 468100000, revenueUSD: 302000, tenants: 118 },
  { month: "Dec", revenueNGN: 503750000, revenueUSD: 325000, tenants: 125 },
];

const deviceStats = [
  { manufacturer: "Teltonika", count: 3420, color: "hsl(var(--primary))" },
  { manufacturer: "Queclink", count: 2180, color: "hsl(var(--success))" },
  { manufacturer: "Meitrack", count: 1560, color: "hsl(var(--warning))" },
  { manufacturer: "CalAmp", count: 890, color: "hsl(var(--destructive))" },
  { manufacturer: "Others", count: 650, color: "hsl(var(--muted-foreground))" },
];

const simCarrierData = [
  { name: "MTN", value: 4500, color: "#FFCC00" },
  { name: "Airtel", value: 2800, color: "#ED1C24" },
  { name: "Glo", value: 1900, color: "#00A651" },
  { name: "9mobile", value: 800, color: "#006B3F" },
];

const dataUsageTrend = [
  { day: "Mon", usage: 245 },
  { day: "Tue", usage: 312 },
  { day: "Wed", usage: 289 },
  { day: "Thu", usage: 356 },
  { day: "Fri", usage: 398 },
  { day: "Sat", usage: 178 },
  { day: "Sun", usage: 156 },
];

const systemServices = [
  { label: "API Gateway", status: "healthy", uptime: "99.98%", latency: "45ms", requests: "2.4M/day" },
  { label: "Database Cluster", status: "healthy", uptime: "99.99%", latency: "12ms", requests: "8.2M/day" },
  { label: "Message Queue", status: "healthy", uptime: "99.95%", latency: "8ms", requests: "1.1M/day" },
  { label: "WhatsApp API", status: "healthy", uptime: "99.87%", latency: "120ms", requests: "450K/day" },
  { label: "SMS Gateway", status: "warning", uptime: "98.50%", latency: "180ms", requests: "125K/day" },
  { label: "GPS Processor", status: "healthy", uptime: "99.92%", latency: "25ms", requests: "15M/day" },
];

const recentActivities = [
  { type: "tenant_created", message: "New tenant 'Lagos Speed Logistics' registered", time: "5 min ago", tenant: "Lagos Speed Logistics" },
  { type: "device_provisioned", message: "50 Teltonika devices provisioned for XYZ Transport", time: "23 min ago", tenant: "XYZ Transport" },
  { type: "sim_activated", message: "Bulk SIM activation: 100 MTN SIMs activated", time: "1 hour ago", tenant: "System" },
  { type: "alert", message: "High CPU usage detected on GPS Processor", time: "2 hours ago", tenant: "System" },
  { type: "payment", message: "Payment received: ₦77,485,000 from Abuja Freight", time: "3 hours ago", tenant: "Abuja Freight" },
];

export default function PlatformDashboard() {
  const navigate = useNavigate();
  const [revenueRange, setRevenueRange] = useState<ChartDateRange>("30d");
  const [dataUsageRange, setDataUsageRange] = useState<ChartDateRange>("7d");
  const [deviceChartRange, setDeviceChartRange] = useState<ChartDateRange>("30d");
  const [simChartRange, setSimChartRange] = useState<ChartDateRange>("30d");
  const { currency } = useCurrency();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useRealtimeNotifications();
  const { tenants, isLoading: tenantsLoading } = useTenants();

  const activeTenants = tenants.filter((t) => t.status === "active").length;
  const totalVehicles = tenants.reduce((sum, t) => sum + t.vehicleCount, 0);
  const totalDrivers = tenants.reduce((sum, t) => sum + t.driverCount, 0);
  const totalRevenue = tenants.reduce((sum, t) => sum + t.monthlyRevenueNgn, 0);
  
  const totalDevices = tenants.reduce((sum, t) => sum + t.deviceCount, 0);
  const onlineDevices = Math.round(totalDevices * 0.87);
  const totalSIMs = tenants.reduce((sum, t) => sum + t.simCount, 0);
  const activeSIMs = Math.round(totalSIMs * 0.92);
  const suspendedAccounts = tenants.filter((t) => t.status === "suspended").length;
  const overdueInvoices = tenants.filter((t: any) => t.hasOverdueInvoice || t.overdueInvoices > 0).length;

  // Format revenue based on selected currency
  const formatRevenue = (amountNGN: number, amountUSD: number) => {
    if (currency === "NGN") {
      return `₦${(amountNGN / 1000000).toFixed(1)}M`;
    }
    return `$${(amountUSD / 1000).toFixed(0)}K`;
  };

  const currentMonthRevenue = currency === "NGN" 
    ? `₦${(totalRevenue / 1000000).toFixed(1)}M`
    : `$${Math.round(totalRevenue / 1550 / 1000)}K`;

  return (
    <DashboardLayout
      title="Platform Dashboard"
      subtitle="System overview for Super Administrator"
    >
      <div className="space-y-6">
        {/* Currency is configured globally in Settings → Billing */}

        {/* Quick Actions container with descriptive cards (horizontal scroll) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Jump into common platform workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2 -mb-2 snap-x snap-mandatory [scrollbar-width:thin]">
              {[
                { title: "Manage Tenants", desc: "Onboard, edit and review tenant organisations.", icon: Building2, cta: "Open tenants", to: "/tenants" },
                { title: "IoT Devices", desc: "Track inventory, lifecycle and connectivity.", icon: Cpu, cta: "Open devices", to: "/devices" },
                { title: "SIM Management", desc: "Approve, activate and assign SIMs.", icon: Smartphone, cta: "Open SIMs", to: "/sims" },
                { title: "Security", desc: "Review alerts, audit trail and access events.", icon: ShieldCheck, cta: "Open security", to: "/security" },
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

        {/* Primary Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Tenants"
            value={tenantsLoading ? "..." : activeTenants}
            change={12}
            changeLabel="vs last month"
            icon={Building2}
            variant="success"
          />
          <StatCard
            title="Total Vehicles"
            value={totalVehicles.toLocaleString()}
            change={8}
            changeLabel="vs last month"
            icon={Truck}
          />
          <StatCard
            title="Total Drivers"
            value={totalDrivers.toLocaleString()}
            change={15}
            changeLabel="vs last month"
            icon={Users}
          />
          <StatCard
            title="Monthly Revenue"
            value={currentMonthRevenue}
            change={18}
            changeLabel="vs last month"
            icon={CreditCard}
            variant="success"
          />
        </div>

        {/* IoT & SIM Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/devices")}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Cpu className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">IoT Devices</p>
                  <p className="text-2xl font-bold">{totalDevices.toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-success/10 text-success border-success/30 text-xs">
                      {onlineDevices.toLocaleString()} online
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                  <Users className="h-6 w-6 text-success" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Drivers</p>
                  <p className="text-2xl font-bold">{totalDrivers.toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +15% vs last month
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                  <Radio className="h-6 w-6 text-warning" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Data Usage Today</p>
                  <p className="text-2xl font-bold">1.2 TB</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +15% vs avg
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <MapPin className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">GPS Messages/hr</p>
                  <p className="text-2xl font-bold">625K</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      Real-time
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <div className="flex justify-center">
            <TabsList>
              <TabsTrigger value="overview">System Overview</TabsTrigger>
              <TabsTrigger value="stakeholders">Stakeholders</TabsTrigger>
              <TabsTrigger value="tenants">Tenants</TabsTrigger>
              <TabsTrigger value="iot">IoT & SIMs</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Revenue & Tenant Growth
                      </CardTitle>
                      <CardDescription>Monthly platform revenue and tenant acquisition ({currency})</CardDescription>
                    </div>
                    <ChartDateFilter value={revenueRange} onValueChange={setRevenueRange} />
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueDataNGN}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12} 
                        tickFormatter={(value) => {
                          if (currency === "NGN") {
                            return `₦${(value / 1000000).toFixed(0)}M`;
                          }
                          return `$${(value / 1000).toFixed(0)}k`;
                        }} 
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === "revenueNGN" && currency === "NGN") {
                            return [`₦${value.toLocaleString()}`, "Revenue"];
                          }
                          if (name === "revenueUSD" && currency === "USD") {
                            return [`$${value.toLocaleString()}`, "Revenue"];
                          }
                          return [value, name];
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey={currency === "NGN" ? "revenueNGN" : "revenueUSD"}
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      System Health
                    </CardTitle>
                    <Badge className="bg-success/10 text-success border-success/30">All Systems Operational</Badge>
                  </div>
                  <CardDescription>Real-time service status and performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {systemServices.map((service) => (
                    <div
                      key={service.label}
                      className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            service.status === "healthy"
                              ? "bg-success"
                              : service.status === "warning"
                              ? "bg-warning animate-pulse"
                              : "bg-destructive"
                          }`}
                        />
                        <span className="text-sm font-medium">{service.label}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">{service.latency}</span>
                        <span className="text-muted-foreground hidden md:inline">{service.requests}</span>
                        <Badge variant="outline" className="text-xs">{service.uptime}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Platform Activity
                </CardTitle>
                <CardDescription>Latest events across tenants — onboarding, devices, SIMs, alerts and payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                          activity.type === "alert" ? "bg-warning/10" : 
                          activity.type === "payment" ? "bg-success/10" : 
                          "bg-primary/10"
                        }`}>
                          {activity.type === "tenant_created" && <Building2 className="h-4 w-4 text-primary" />}
                          {activity.type === "device_provisioned" && <Cpu className="h-4 w-4 text-primary" />}
                          {activity.type === "sim_activated" && <Smartphone className="h-4 w-4 text-primary" />}
                          {activity.type === "alert" && <AlertTriangle className="h-4 w-4 text-warning" />}
                          {activity.type === "payment" && <CreditCard className="h-4 w-4 text-success" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">{activity.tenant}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stakeholders" className="space-y-6">
            <StakeholderOverviewTab />
          </TabsContent>

          <TabsContent value="tenants" className="space-y-6">
            {/* Tenant Overview */}
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        Top Tenants by Fleet Size
                      </CardTitle>
                      <CardDescription>Largest tenants ranked by number of vehicles under management</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate("/tenants")}>
                      <Eye className="h-4 w-4 mr-2" />
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tenants
                      .sort((a, b) => b.vehicleCount - a.vehicleCount)
                      .slice(0, 5)
                      .map((tenant, index) => (
                        <div
                          key={tenant.id}
                          className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/30"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                              #{index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{tenant.name}</p>
                              <p className="text-sm text-muted-foreground capitalize">{tenant.plan} Plan</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-right">
                              <p className="font-medium">{tenant.vehicleCount}</p>
                              <p className="text-muted-foreground">Vehicles</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{tenant.driverCount}</p>
                              <p className="text-muted-foreground">Drivers</p>
                            </div>
                            <Badge
                              className={
                                tenant.status === "active"
                                  ? "bg-success/10 text-success border-success/30"
                                  : tenant.status === "pending"
                                  ? "bg-warning/10 text-warning border-warning/30"
                                  : "bg-destructive/10 text-destructive border-destructive/30"
                              }
                            >
                              {tenant.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tenant by Plan */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Tenants by Plan
                  </CardTitle>
                  <CardDescription>Subscription mix and recurring revenue contribution per plan tier</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { plan: "Enterprise", count: 12, revenueNGN: "₦92.9M/mo", revenueUSD: "$59,988/mo", color: "bg-success" },
                    { plan: "Professional", count: 45, revenueNGN: "₦104.5M/mo", revenueUSD: "$67,455/mo", color: "bg-primary" },
                    { plan: "Starter", count: 68, revenueNGN: "₦52.6M/mo", revenueUSD: "$33,932/mo", color: "bg-muted-foreground" },
                  ].map((item) => (
                    <div key={item.plan} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.plan}</span>
                        <span className="text-muted-foreground">{item.count} tenants</span>
                      </div>
                      <Progress value={(item.count / 125) * 100} className={`h-2 ${item.color}`} />
                      <p className="text-xs text-muted-foreground">
                        {currency === "NGN" ? item.revenueNGN : item.revenueUSD}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="iot" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Device Distribution */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5 text-primary" />
                        Device Distribution by Manufacturer
                      </CardTitle>
                      <CardDescription>Breakdown of provisioned IoT devices grouped by hardware vendor</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChartDateFilter value={deviceChartRange} onValueChange={setDeviceChartRange} />
                      <Button variant="outline" size="sm" onClick={() => navigate("/devices")}>
                        <Eye className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={deviceStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis dataKey="manufacturer" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* SIM Distribution */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Wifi className="h-5 w-5 text-primary" />
                        SIM Cards by Carrier
                      </CardTitle>
                      <CardDescription>Active SIM inventory split across mobile network operators</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChartDateFilter value={simChartRange} onValueChange={setSimChartRange} />
                      <Button variant="outline" size="sm" onClick={() => navigate("/sims")}>
                        <Eye className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-8">
                    <ResponsiveContainer width="50%" height={200}>
                      <PieChart>
                        <Pie
                          data={simCarrierData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {simCarrierData.map((entry, index) => (
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
                    <div className="flex-1 space-y-3">
                      {simCarrierData.map((carrier) => (
                        <div key={carrier.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: carrier.color }} />
                            <span className="text-sm font-medium">{carrier.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{carrier.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Usage Trend */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-primary" />
                      Weekly Data Usage (GB)
                    </CardTitle>
                    <CardDescription>Total data consumed across all SIM cards</CardDescription>
                  </div>
                  
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={dataUsageTrend}>
                    <defs>
                      <linearGradient id="colorData" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`${value} GB`, "Data Usage"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="usage"
                      stroke="hsl(var(--success))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorData)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}



