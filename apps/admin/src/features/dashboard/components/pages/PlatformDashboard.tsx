import { useQuery } from "@tanstack/react-query";
import {
  getSystemActivityLogQueryOptions,
  getSystemDashboardQueryOptions,
  getSystemHealthQueryOptions,
} from "@truckmoov/api/auth";
import { formatCompactRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  Activity,
  Building2,
  ChevronRight,
  Clock,
  Cpu,
  CreditCard,
  Database,
  Eye,
  MapPin,
  Radio,
  Server,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Truck,
  Users,
  Wifi,
} from "lucide-react";
import { Link } from "react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { ChartDateFilter } from "@/components/shadcn/chart-date-filter";
import { Progress } from "@/components/shadcn/progress";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";

const revenueDataNGN = [
  {
    month: "Jan",
    revenueNGN: 193750000,
    tenants: 45,
  },
  {
    month: "Feb",
    revenueNGN: 220100000,
    tenants: 52,
  },
  {
    month: "Mar",
    revenueNGN: 244900000,
    tenants: 61,
  },
  {
    month: "Apr",
    revenueNGN: 271250000,
    tenants: 68,
  },
  {
    month: "May",
    revenueNGN: 292950000,
    tenants: 74,
  },
  {
    month: "Jun",
    revenueNGN: 333250000,
    tenants: 82,
  },
  {
    month: "Jul",
    revenueNGN: 353400000,
    tenants: 89,
  },
  {
    month: "Aug",
    revenueNGN: 379750000,
    tenants: 95,
  },
  {
    month: "Sep",
    revenueNGN: 415400000,
    tenants: 103,
  },
  {
    month: "Oct",
    revenueNGN: 441750000,
    tenants: 112,
  },
  {
    month: "Nov",
    revenueNGN: 468100000,
    tenants: 118,
  },
  {
    month: "Dec",
    revenueNGN: 503750000,
    tenants: 125,
  },
];

const deviceStats = [
  {
    manufacturer: "Teltonika",
    count: 3420,
  },
  {
    manufacturer: "Queclink",
    count: 2180,
  },
  {
    manufacturer: "Meitrack",
    count: 1560,
  },
  {
    manufacturer: "CalAmp",
    count: 890,
  },
  {
    manufacturer: "Others",
    count: 650,
  },
];

const simCarrierData = [
  {
    name: "MTN",
    value: 4500,
    color: "#FFCC00",
  },
  {
    name: "Airtel",
    value: 2800,
    color: "#ED1C24",
  },
  {
    name: "Glo",
    value: 1900,
    color: "#00A651",
  },
  {
    name: "9mobile",
    value: 800,
    color: "#006B3F",
  },
];

const dataUsageTrend = [
  {
    day: "Mon",
    usage: 245,
  },
  {
    day: "Tue",
    usage: 312,
  },
  {
    day: "Wed",
    usage: 289,
  },
  {
    day: "Thu",
    usage: 356,
  },
  {
    day: "Fri",
    usage: 398,
  },
  {
    day: "Sat",
    usage: 178,
  },
  {
    day: "Sun",
    usage: 156,
  },
];

const topTenants = [
  {
    id: "lagos-speed",
    name: "Lagos Speed Logistics",
    plan: "enterprise",
    vehicleCount: 420,
    driverCount: 385,
    status: "active",
  },
  {
    id: "xyz-transport",
    name: "XYZ Transport",
    plan: "professional",
    vehicleCount: 318,
    driverCount: 302,
    status: "active",
  },
  {
    id: "abuja-freight",
    name: "Abuja Freight",
    plan: "enterprise",
    vehicleCount: 286,
    driverCount: 260,
    status: "active",
  },
  {
    id: "northline-haulage",
    name: "Northline Haulage",
    plan: "professional",
    vehicleCount: 214,
    driverCount: 199,
    status: "pending",
  },
  {
    id: "delta-movers",
    name: "Delta Movers",
    plan: "starter",
    vehicleCount: 156,
    driverCount: 148,
    status: "suspended",
  },
];

const quickActions = [
  {
    title: "Manage Tenants",
    desc: "Onboard, edit and review tenant organisations.",
    icon: Building2,
    cta: "Open tenants",
    to: "/tenants",
  },
  {
    title: "IoT Devices",
    desc: "Track inventory, lifecycle and connectivity.",
    icon: Cpu,
    cta: "Open devices",
    to: "/devices",
  },
  {
    title: "SIM Management",
    desc: "Approve, activate and assign SIMs.",
    icon: Smartphone,
    cta: "Open SIMs",
    to: "/sims",
  },
  {
    title: "Security",
    desc: "Review alerts, audit trail and access events.",
    icon: ShieldCheck,
    cta: "Open security",
    to: "/security",
  },
];

const plans = [
  {
    plan: "Enterprise",
    count: 12,
    revenue: "NGN 92.9M/mo",
    color: "bg-success",
  },
  {
    plan: "Professional",
    count: 45,
    revenue: "NGN 104.5M/mo",
    color: "bg-primary",
  },
  {
    plan: "Starter",
    count: 68,
    revenue: "NGN 52.6M/mo",
    color: "bg-muted-foreground",
  },
];

const ACTIVITY_LOG_LIMIT = 5;

function formatMetric(value?: number) {
  return value == null ? "..." : value.toLocaleString();
}

function formatDataUsage(valueMb?: number) {
  if (valueMb == null) {
    return "...";
  }

  if (valueMb >= 1024 * 1024) {
    return `${(valueMb / 1024 / 1024).toFixed(1)} TB`;
  }

  if (valueMb >= 1024) {
    return `${(valueMb / 1024).toFixed(1)} GB`;
  }

  return `${valueMb.toLocaleString()} MB`;
}

function formatStatusLabel(value?: string) {
  if (!value) {
    return "Unknown";
  }

  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatLatency(value?: number) {
  return value == null ? "..." : `${value.toLocaleString()}ms`;
}

function formatUptime(value?: number) {
  if (value == null) {
    return "...";
  }

  return `${value.toLocaleString(
    undefined,
    { maximumFractionDigits: 2 },
  )}%`;
}

function getHealthStatusClass(status?: string) {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === "healthy") {
    return "bg-success";
  }

  if (normalizedStatus === "warning" || normalizedStatus === "degraded") {
    return "bg-warning animate-pulse";
  }

  return "bg-destructive";
}

function getHealthBadgeClass(status?: string) {
  const normalizedStatus = status?.toLowerCase();

  if (!normalizedStatus) {
    return "bg-muted text-muted-foreground border-border";
  }

  if (normalizedStatus === "healthy") {
    return "bg-success/10 text-success border-success/30";
  }

  if (normalizedStatus === "warning" || normalizedStatus === "degraded") {
    return "bg-warning/10 text-warning border-warning/30";
  }

  return "bg-destructive/10 text-destructive border-destructive/30";
}

export default function PlatformDashboard() {
  const {
    data: systemDashboardResponse,
    isLoading: systemDashboardLoading,
  } = useQuery(getSystemDashboardQueryOptions());
  const {
    data: systemHealthResponse,
    isError: systemHealthError,
    isLoading: systemHealthLoading,
  } = useQuery({
    ...getSystemHealthQueryOptions(),
    refetchInterval: 30000,
  });
  const {
    data: systemActivityLogResponse,
    isLoading: activityLogLoading,
  } = useQuery(
    getSystemActivityLogQueryOptions({ params: { limit: ACTIVITY_LOG_LIMIT } }),
  );
  const systemDashboard = systemDashboardResponse?.data;
  const systemHealth = systemHealthResponse?.data;
  const systemHealthServices = systemHealth?.services ?? [];
  const recentActivities = (systemActivityLogResponse?.data ?? []).slice(
    0,
    ACTIVITY_LOG_LIMIT,
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Jump into common platform workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 overflow-x-auto pb-2 -mb-2 snap-x snap-mandatory [scrollbar-width:thin]">
            {quickActions.map(qa => (
              <Link
                key={qa.title}
                to={qa.to}
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
                      {qa.cta}
                      {" "}
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tenants"
          value={formatMetric(systemDashboard?.totalTenants)}
          icon={Building2}
          variant="success"
          loading={systemDashboardLoading}
        />
        <StatCard
          title="Total Vehicles"
          value={formatMetric(systemDashboard?.totalVehicles)}
          icon={Truck}
          loading={systemDashboardLoading}
        />
        <StatCard
          title="Total Drivers"
          value={formatMetric(systemDashboard?.totalDrivers)}
          icon={Users}
          loading={systemDashboardLoading}
        />
        <StatCard
          title="GPS Messages/hr"
          value={formatMetric(systemDashboard?.sensorGpsMessagesPerHour)}
          icon={MapPin}
          loading={systemDashboardLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <Smartphone className="h-6 w-6 text-success" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total IoT SIMs</p>
                <p className="text-2xl font-bold">{formatMetric(systemDashboard?.totalSimCards)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-success/10 text-success border-success/30 text-xs">
                    Active
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Cpu className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total IoT Devices</p>
                <p className="text-2xl font-bold">{formatMetric(systemDashboard?.totalSensors)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-success/10 text-success border-success/30 text-xs">
                    Online
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
                <p className="text-2xl font-bold">{formatDataUsage(systemDashboard?.dataUsageTodayMb)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className="text-xs"
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Live
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
                <Database className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total Data Bought</p>
                <p className="text-2xl font-bold">8.6 TB</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className="text-xs"
                  >
                    Across all bundles
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        defaultValue="overview"
        className="space-y-4"
      >
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="overview">System Overview</TabsTrigger>
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="iot">IoT & SIMs</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="overview"
          className="space-y-6"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Revenue & Tenant Growth
                    </CardTitle>
                    <CardDescription>Monthly platform revenue and tenant acquisition (NGN)</CardDescription>
                  </div>
                  <ChartDateFilter
                    value="30d"
                    onValueChange={() => undefined}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <AreaChart data={revenueDataNGN}>
                    <defs>
                      <linearGradient
                        id="colorRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="month"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={value => `NGN ${(Number(value) / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [
                        `NGN ${value.toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenueNGN"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    System Health
                  </CardTitle>
                  <Badge className={getHealthBadgeClass(systemHealth?.overall)}>
                    {systemHealthLoading
                      ? "Checking status"
                      : systemHealthError
                        ? "Status unavailable"
                        : systemHealth?.overall?.toLowerCase() === "healthy"
                          ? "All Systems Operational"
                          : formatStatusLabel(systemHealth?.overall)}
                  </Badge>
                </div>
                <CardDescription>Real-time service status and performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {systemHealthLoading && (
                  <>
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-2.5 w-2.5 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-4 w-12" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {systemHealthError && (
                  <div className="p-3 rounded-lg border text-sm text-muted-foreground">
                    Unable to load system health.
                  </div>
                )}

                {!systemHealthLoading && !systemHealthError && systemHealthServices.length === 0 && (
                  <div className="p-3 rounded-lg border text-sm text-muted-foreground">
                    No service health data found.
                  </div>
                )}

                {systemHealthServices.map(service => (
                  <div
                    key={service.name}
                    className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${getHealthStatusClass(service.status)}`} />
                      <span className="text-sm font-medium">{service.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">{formatLatency(service.latencyMs)}</span>
                      <span className="text-muted-foreground hidden md:inline">{formatStatusLabel(service.status)}</span>
                      <Badge
                        variant="outline"
                        className="text-xs"
                      >
                        {formatUptime(service.uptime)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Platform Activity
              </CardTitle>
              <CardDescription>Latest events across tenants - onboarding, devices, SIMs, alerts and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activityLogLoading && (
                  <>
                    {Array.from({ length: ACTIVITY_LOG_LIMIT }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-4 p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Skeleton className="h-8 w-8 rounded-lg" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                        <Skeleton className="h-3 w-12" />
                      </div>
                    ))}
                  </>
                )}

                {!activityLogLoading && recentActivities.length === 0 && (
                  <div className="p-3 rounded-lg border text-sm text-muted-foreground">
                    No recent activity found.
                  </div>
                )}

                {recentActivities.map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-primary/10">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{activity.summary}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatCompactRelative(activity.occurredAt)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="tenants"
          className="space-y-6"
        >
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
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topTenants.map((tenant, index) => (
                    <div
                      key={tenant.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                          #
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{tenant.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {tenant.plan}
                            {" "}
                            Plan
                          </p>
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Tenants by Plan
                </CardTitle>
                <CardDescription>Subscription mix and recurring revenue contribution per plan tier</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {plans.map(item => (
                  <div
                    key={item.plan}
                    className="space-y-2"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.plan}</span>
                      <span className="text-muted-foreground">
                        {item.count}
                        {" "}
                        tenants
                      </span>
                    </div>
                    <Progress
                      value={(item.count / 125) * 100}
                      className={`h-2 ${item.color}`}
                    />
                    <p className="text-xs text-muted-foreground">
                      {item.revenue}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent
          value="iot"
          className="space-y-6"
        >
          <div className="grid gap-6 lg:grid-cols-2">
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
                    <ChartDateFilter
                      value="30d"
                      onValueChange={() => undefined}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <BarChart
                    data={deviceStats}
                    layout="vertical"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      dataKey="manufacturer"
                      type="category"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[
                        0,
                        4,
                        4,
                        0,
                      ]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

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
                    <ChartDateFilter
                      value="30d"
                      onValueChange={() => undefined}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8">
                  <ResponsiveContainer
                    width="50%"
                    height={200}
                  >
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
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                          />
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
                    {simCarrierData.map(carrier => (
                      <div
                        key={carrier.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: carrier.color }}
                          />
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
              <ResponsiveContainer
                width="100%"
                height={200}
              >
                <AreaChart data={dataUsageTrend}>
                  <defs>
                    <linearGradient
                      id="colorData"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--success))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--success))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
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
                    formatter={(value: number) => [
                      `${value} GB`,
                      "Data Usage",
                    ]}
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
  );
}
