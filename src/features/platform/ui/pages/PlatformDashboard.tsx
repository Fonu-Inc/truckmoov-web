import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/dashboard/StatCard";
import { getSystemDashboardQueryOptions } from "@/features/auth/api";
import type { SystemDashboard } from "@/features/auth/api/types";
import {
  Building2,
  MapPin,
  Radio,
  Server,
  Smartphone,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

type MetricKey = keyof Pick<
  SystemDashboard,
  | "totalTenants"
  | "totalVehicles"
  | "totalDrivers"
  | "totalSensors"
  | "totalSimCards"
  | "dataUsageTodayMb"
  | "sensorGpsMessagesPerHour"
>;

type MetricCard = {
  key: MetricKey;
  title: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger";
  formatValue?: (value: number) => string;
};

const metricCards: MetricCard[] = [
  { key: "totalTenants", title: "Total Tenants", icon: Building2 },
  {
    key: "totalVehicles",
    title: "Total Vehicles",
    icon: Truck,
    variant: "success",
    formatValue: (value) => value.toLocaleString(),
  },
  {
    key: "totalDrivers",
    title: "Total Drivers",
    icon: Users,
    formatValue: (value) => value.toLocaleString(),
  },
  {
    key: "totalSensors",
    title: "Total Sensors",
    icon: Server,
    formatValue: (value) => value.toLocaleString(),
  },
  {
    key: "totalSimCards",
    title: "Total SIM Cards",
    icon: Smartphone,
    formatValue: (value) => value.toLocaleString(),
  },
  {
    key: "dataUsageTodayMb",
    title: "Data Usage Today",
    icon: Radio,
    variant: "warning",
    formatValue: (value) => `${value.toLocaleString()} MB`,
  },
  {
    key: "sensorGpsMessagesPerHour",
    title: "GPS Messages/Hour",
    icon: MapPin,
    formatValue: (value) => value.toLocaleString(),
  },
];

function formatMetricValue(
  dashboard: SystemDashboard | undefined,
  isLoading: boolean,
  key: MetricKey,
  formatValue?: (value: number) => string
) {
  if (isLoading) return "...";
  if (!dashboard) return "N/A";

  const unavailableMetrics = new Set(dashboard.unavailableMetrics);
  const value = dashboard[key];

  if (value === null || unavailableMetrics.has(key)) {
    return "N/A";
  }

  return formatValue ? formatValue(value) : value.toLocaleString();
}

export default function PlatformDashboard() {
  const { data, isLoading } = useQuery(getSystemDashboardQueryOptions());
  const dashboard = data?.data;

  return (
    <div className="space-y-6">
      {/* Quick Actions Bar */}

      {/* Primary Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(({ key, title, icon, variant, formatValue }) => (
          <StatCard
            key={key}
            title={title}
            value={formatMetricValue(dashboard, isLoading, key, formatValue)}
            icon={icon}
            variant={variant}
          />
        ))}
      </div>

      {/* IoT & SIM Stats */}

      {/* Main Content Tabs */}

      {/* System Health */}

      {/* Recent Activity */}
    </div>
  );

  // Preserved original non-primary UI for later endpoint integration.
  //
  // Quick Actions Bar
  // <div className="flex flex-wrap items-center gap-2 p-4 rounded-lg bg-muted/30 border border-border">
  //   <span className="text-sm font-medium text-muted-foreground mr-2">Quick Actions:</span>
  //   <Button variant="outline" size="sm" onClick={() => navigate("/platform/tenants")}>
  //     <Building2 className="h-4 w-4 mr-2" />
  //     Manage Tenants
  //   </Button>
  //   <Button variant="outline" size="sm" onClick={() => navigate("/platform/devices")}>
  //     <Cpu className="h-4 w-4 mr-2" />
  //     IoT Devices
  //   </Button>
  //   <Button variant="outline" size="sm" onClick={() => navigate("/platform/sims")}>
  //     <Smartphone className="h-4 w-4 mr-2" />
  //     SIM Management
  //   </Button>
  //   <Button variant="outline" size="sm" onClick={() => navigate("/platform/security")}>
  //     <ShieldCheck className="h-4 w-4 mr-2" />
  //     Security
  //   </Button>
  //   <div className="flex-1" />
  //   <CurrencySelector compact />
  //   <NotificationCenter
  //     notifications={notifications}
  //     unreadCount={unreadCount}
  //     onMarkAsRead={markAsRead}
  //     onMarkAllAsRead={markAllAsRead}
  //     onClear={clearNotifications}
  //   />
  //   <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
  //     <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
  //     Refresh Data
  //   </Button>
  // </div>
  //
  // IoT & SIM Stats
  // <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  //   <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/platform/devices")}>
  //     <CardContent className="p-4">
  //       <div className="flex items-center justify-between">
  //         <div>
  //           <p className="text-sm font-medium text-muted-foreground">IoT Devices</p>
  //           <p className="text-2xl font-bold">{totalDevices.toLocaleString()}</p>
  //           <div className="flex items-center gap-2 mt-1">
  //             <Badge className="bg-success/10 text-success border-success/30 text-xs">
  //               {onlineDevices.toLocaleString()} online
  //             </Badge>
  //           </div>
  //         </div>
  //         <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
  //           <Cpu className="h-6 w-6 text-primary" />
  //         </div>
  //       </div>
  //     </CardContent>
  //   </Card>
  //
  //   <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/platform/sims")}>
  //     <CardContent className="p-4">
  //       <div className="flex items-center justify-between">
  //         <div>
  //           <p className="text-sm font-medium text-muted-foreground">SIM Cards</p>
  //           <p className="text-2xl font-bold">{totalSIMs.toLocaleString()}</p>
  //           <div className="flex items-center gap-2 mt-1">
  //             <Badge className="bg-success/10 text-success border-success/30 text-xs">
  //               {activeSIMs.toLocaleString()} active
  //             </Badge>
  //           </div>
  //         </div>
  //         <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
  //           <Smartphone className="h-6 w-6 text-success" />
  //         </div>
  //       </div>
  //     </CardContent>
  //   </Card>
  //
  //   <Card>
  //     <CardContent className="p-4">
  //       <div className="flex items-center justify-between">
  //         <div>
  //           <p className="text-sm font-medium text-muted-foreground">Data Usage Today</p>
  //           <p className="text-2xl font-bold">1.2 TB</p>
  //           <div className="flex items-center gap-2 mt-1">
  //             <Badge variant="outline" className="text-xs">
  //               <TrendingUp className="h-3 w-3 mr-1" />
  //               +15% vs avg
  //             </Badge>
  //           </div>
  //         </div>
  //         <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
  //           <Radio className="h-6 w-6 text-warning" />
  //         </div>
  //       </div>
  //     </CardContent>
  //   </Card>
  //
  //   <Card>
  //     <CardContent className="p-4">
  //       <div className="flex items-center justify-between">
  //         <div>
  //           <p className="text-sm font-medium text-muted-foreground">GPS Messages/hr</p>
  //           <p className="text-2xl font-bold">625K</p>
  //           <div className="flex items-center gap-2 mt-1">
  //             <Badge variant="outline" className="text-xs">
  //               <Zap className="h-3 w-3 mr-1" />
  //               Real-time
  //             </Badge>
  //           </div>
  //         </div>
  //         <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
  //           <MapPin className="h-6 w-6 text-muted-foreground" />
  //         </div>
  //       </div>
  //     </CardContent>
  //   </Card>
  // </div>
  //
  // Main Content Tabs
  // <Tabs defaultValue="overview" className="space-y-4">
  //   <TabsList>
  //     <TabsTrigger value="overview">System Overview</TabsTrigger>
  //     <TabsTrigger value="stakeholders">Stakeholders</TabsTrigger>
  //     <TabsTrigger value="tenants">Tenants</TabsTrigger>
  //     <TabsTrigger value="iot">IoT & SIMs</TabsTrigger>
  //   </TabsList>
  //
  //   <TabsContent value="overview" className="space-y-6">
  //     <div className="grid gap-6 lg:grid-cols-2">
  //       <Card>
  //         <CardHeader>
  //           <CardTitle className="flex items-center gap-2">
  //             <TrendingUp className="h-5 w-5 text-primary" />
  //             Revenue & Tenant Growth
  //           </CardTitle>
  //           <CardDescription>Monthly platform revenue and tenant acquisition ({currency})</CardDescription>
  //         </CardHeader>
  //         <CardContent>
  //           <ResponsiveContainer width="100%" height={300}>
  //             <AreaChart data={revenueDataNGN}>
  //               <defs>
  //                 <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
  //                   <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
  //                   <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
  //                 </linearGradient>
  //               </defs>
  //               <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
  //               <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
  //               <YAxis
  //                 stroke="hsl(var(--muted-foreground))"
  //                 fontSize={12}
  //                 tickFormatter={(value) => {
  //                   if (currency === "NGN") {
  //                     return `â‚¦${(value / 1000000).toFixed(0)}M`;
  //                   }
  //                   return `$${(value / 1000).toFixed(0)}k`;
  //                 }}
  //               />
  //               <Tooltip
  //                 contentStyle={{
  //                   backgroundColor: "hsl(var(--card))",
  //                   border: "1px solid hsl(var(--border))",
  //                   borderRadius: "8px",
  //                 }}
  //                 formatter={(value: number, name: string) => {
  //                   if (name === "revenueNGN" && currency === "NGN") {
  //                     return [`â‚¦${value.toLocaleString()}`, "Revenue"];
  //                   }
  //                   if (name === "revenueUSD" && currency === "USD") {
  //                     return [`$${value.toLocaleString()}`, "Revenue"];
  //                   }
  //                   return [value, name];
  //                 }}
  //               />
  //               <Area
  //                 type="monotone"
  //                 dataKey={currency === "NGN" ? "revenueNGN" : "revenueUSD"}
  //                 stroke="hsl(var(--primary))"
  //                 strokeWidth={2}
  //                 fillOpacity={1}
  //                 fill="url(#colorRevenue)"
  //               />
  //             </AreaChart>
  //           </ResponsiveContainer>
  //         </CardContent>
  //       </Card>
  //
  //       System Health
  //       <Card>
  //         <CardHeader className="pb-2">
  //           <div className="flex items-center justify-between">
  //             <CardTitle className="flex items-center gap-2">
  //               <Activity className="h-5 w-5 text-primary" />
  //               System Health
  //             </CardTitle>
  //             <Badge className="bg-success/10 text-success border-success/30">All Systems Operational</Badge>
  //           </div>
  //           <CardDescription>Real-time service status and performance</CardDescription>
  //         </CardHeader>
  //         <CardContent className="space-y-3">
  //           {systemServices.map((service) => (
  //             <div
  //               key={service.label}
  //               className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors"
  //             >
  //               <div className="flex items-center gap-3">
  //                 <div
  //                   className={`h-2.5 w-2.5 rounded-full ${service.status === "healthy"
  //                     ? "bg-success"
  //                     : service.status === "warning"
  //                       ? "bg-warning animate-pulse"
  //                       : "bg-destructive"
  //                     }`}
  //                 />
  //                 <span className="text-sm font-medium">{service.label}</span>
  //               </div>
  //               <div className="flex items-center gap-4 text-sm">
  //                 <span className="text-muted-foreground">{service.latency}</span>
  //                 <span className="text-muted-foreground hidden md:inline">{service.requests}</span>
  //                 <Badge variant="outline" className="text-xs">{service.uptime}</Badge>
  //               </div>
  //             </div>
  //           ))}
  //         </CardContent>
  //       </Card>
  //     </div>
  //
  //     Recent Activity
  //     <Card>
  //       <CardHeader className="pb-2">
  //         <div className="flex items-center justify-between">
  //           <CardTitle className="flex items-center gap-2">
  //             <Clock className="h-5 w-5 text-primary" />
  //             Recent Platform Activity
  //           </CardTitle>
  //           <Button variant="ghost" size="sm">
  //             View All
  //             <ChevronRight className="h-4 w-4 ml-1" />
  //           </Button>
  //         </div>
  //       </CardHeader>
  //       <CardContent>
  //         <div className="space-y-3">
  //           {recentActivities.map((activity, index) => (
  //             <div key={index} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
  //               <div className="flex items-center gap-3">
  //                 <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${activity.type === "alert" ? "bg-warning/10" :
  //                   activity.type === "payment" ? "bg-success/10" :
  //                     "bg-primary/10"
  //                   }`}>
  //                   {activity.type === "tenant_created" && <Building2 className="h-4 w-4 text-primary" />}
  //                   {activity.type === "device_provisioned" && <Cpu className="h-4 w-4 text-primary" />}
  //                   {activity.type === "sim_activated" && <Smartphone className="h-4 w-4 text-primary" />}
  //                   {activity.type === "alert" && <AlertTriangle className="h-4 w-4 text-warning" />}
  //                   {activity.type === "payment" && <CreditCard className="h-4 w-4 text-success" />}
  //                 </div>
  //                 <div>
  //                   <p className="text-sm font-medium">{activity.message}</p>
  //                   <p className="text-xs text-muted-foreground">{activity.tenant}</p>
  //                 </div>
  //               </div>
  //               <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
  //             </div>
  //           ))}
  //         </div>
  //       </CardContent>
  //     </Card>
  //   </TabsContent>
  //
  //   <TabsContent value="stakeholders" className="space-y-6">
  //     <StakeholderOverviewTab />
  //   </TabsContent>
  //
  //   <TabsContent value="tenants" className="space-y-6">
  //     <div className="grid gap-6 lg:grid-cols-3">
  //       <Card className="lg:col-span-2">
  //         <CardHeader>
  //           <div className="flex items-center justify-between">
  //             <CardTitle className="flex items-center gap-2">
  //               <Building2 className="h-5 w-5 text-primary" />
  //               Top Tenants by Fleet Size
  //             </CardTitle>
  //             <Button variant="outline" size="sm" onClick={() => navigate("/platform/tenants")}>
  //               <Eye className="h-4 w-4 mr-2" />
  //               View All
  //             </Button>
  //           </div>
  //         </CardHeader>
  //         <CardContent>
  //           <div className="space-y-4">
  //             {tenants
  //               .sort((a, b) => b.vehicleCount - a.vehicleCount)
  //               .slice(0, 5)
  //               .map((tenant, index) => (
  //                 <div
  //                   key={tenant.id}
  //                   className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/30"
  //                 >
  //                   <div className="flex items-center gap-4">
  //                     <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
  //                       #{index + 1}
  //                     </div>
  //                     <div>
  //                       <p className="font-medium">{tenant.name}</p>
  //                       <p className="text-sm text-muted-foreground capitalize">{tenant.plan} Plan</p>
  //                     </div>
  //                   </div>
  //                   <div className="flex items-center gap-6 text-sm">
  //                     <div className="text-right">
  //                       <p className="font-medium">{tenant.vehicleCount}</p>
  //                       <p className="text-muted-foreground">Vehicles</p>
  //                     </div>
  //                     <div className="text-right">
  //                       <p className="font-medium">{tenant.driverCount}</p>
  //                       <p className="text-muted-foreground">Drivers</p>
  //                     </div>
  //                     <Badge
  //                       className={
  //                         tenant.status === "active"
  //                           ? "bg-success/10 text-success border-success/30"
  //                           : tenant.status === "pending"
  //                             ? "bg-warning/10 text-warning border-warning/30"
  //                             : "bg-destructive/10 text-destructive border-destructive/30"
  //                       }
  //                     >
  //                       {tenant.status}
  //                     </Badge>
  //                   </div>
  //                 </div>
  //               ))}
  //           </div>
  //         </CardContent>
  //       </Card>
  //
  //       <Card>
  //         <CardHeader>
  //           <CardTitle className="flex items-center gap-2">
  //             <CreditCard className="h-5 w-5 text-primary" />
  //             Tenants by Plan
  //           </CardTitle>
  //         </CardHeader>
  //         <CardContent className="space-y-4">
  //           {[
  //             { plan: "Enterprise", count: 12, revenueNGN: "â‚¦92.9M/mo", revenueUSD: "$59,988/mo", color: "bg-success" },
  //             { plan: "Professional", count: 45, revenueNGN: "â‚¦104.5M/mo", revenueUSD: "$67,455/mo", color: "bg-primary" },
  //             { plan: "Starter", count: 68, revenueNGN: "â‚¦52.6M/mo", revenueUSD: "$33,932/mo", color: "bg-muted-foreground" },
  //           ].map((item) => (
  //             <div key={item.plan} className="space-y-2">
  //               <div className="flex justify-between text-sm">
  //                 <span className="font-medium">{item.plan}</span>
  //                 <span className="text-muted-foreground">{item.count} tenants</span>
  //               </div>
  //               <Progress value={(item.count / 125) * 100} className={`h-2 ${item.color}`} />
  //               <p className="text-xs text-muted-foreground">
  //                 {currency === "NGN" ? item.revenueNGN : item.revenueUSD}
  //               </p>
  //             </div>
  //           ))}
  //         </CardContent>
  //       </Card>
  //     </div>
  //   </TabsContent>
  //
  //   <TabsContent value="iot" className="space-y-6">
  //     <div className="grid gap-6 lg:grid-cols-2">
  //       <Card>
  //         <CardHeader>
  //           <div className="flex items-center justify-between">
  //             <CardTitle className="flex items-center gap-2">
  //               <Server className="h-5 w-5 text-primary" />
  //               Device Distribution by Manufacturer
  //             </CardTitle>
  //             <Button variant="outline" size="sm" onClick={() => navigate("/platform/devices")}>
  //               <Eye className="h-4 w-4 mr-2" />
  //               Manage
  //             </Button>
  //           </div>
  //         </CardHeader>
  //         <CardContent>
  //           <ResponsiveContainer width="100%" height={300}>
  //             <BarChart data={deviceStats} layout="vertical">
  //               <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
  //               <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
  //               <YAxis dataKey="manufacturer" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
  //               <Tooltip
  //                 contentStyle={{
  //                   backgroundColor: "hsl(var(--card))",
  //                   border: "1px solid hsl(var(--border))",
  //                   borderRadius: "8px",
  //                 }}
  //               />
  //               <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
  //             </BarChart>
  //           </ResponsiveContainer>
  //         </CardContent>
  //       </Card>
  //
  //       <Card>
  //         <CardHeader>
  //           <div className="flex items-center justify-between">
  //             <CardTitle className="flex items-center gap-2">
  //               <Wifi className="h-5 w-5 text-primary" />
  //               SIM Cards by Carrier
  //             </CardTitle>
  //             <Button variant="outline" size="sm" onClick={() => navigate("/platform/sims")}>
  //               <Eye className="h-4 w-4 mr-2" />
  //               Manage
  //             </Button>
  //           </div>
  //         </CardHeader>
  //         <CardContent>
  //           <div className="flex items-center gap-8">
  //             <ResponsiveContainer width="50%" height={200}>
  //               <PieChart>
  //                 <Pie
  //                   data={simCarrierData}
  //                   cx="50%"
  //                   cy="50%"
  //                   innerRadius={50}
  //                   outerRadius={80}
  //                   paddingAngle={2}
  //                   dataKey="value"
  //                 >
  //                   {simCarrierData.map((entry, index) => (
  //                     <Cell key={`cell-${index}`} fill={entry.color} />
  //                   ))}
  //                 </Pie>
  //                 <Tooltip
  //                   contentStyle={{
  //                     backgroundColor: "hsl(var(--card))",
  //                     border: "1px solid hsl(var(--border))",
  //                     borderRadius: "8px",
  //                   }}
  //                 />
  //               </PieChart>
  //             </ResponsiveContainer>
  //             <div className="flex-1 space-y-3">
  //               {simCarrierData.map((carrier) => (
  //                 <div key={carrier.name} className="flex items-center justify-between">
  //                   <div className="flex items-center gap-2">
  //                     <div className="h-3 w-3 rounded-full" style={{ backgroundColor: carrier.color }} />
  //                     <span className="text-sm font-medium">{carrier.name}</span>
  //                   </div>
  //                   <span className="text-sm text-muted-foreground">{carrier.value.toLocaleString()}</span>
  //                 </div>
  //               ))}
  //             </div>
  //           </div>
  //         </CardContent>
  //       </Card>
  //     </div>
  //
  //     <Card>
  //       <CardHeader>
  //         <CardTitle className="flex items-center gap-2">
  //           <Database className="h-5 w-5 text-primary" />
  //           Weekly Data Usage (GB)
  //         </CardTitle>
  //         <CardDescription>Total data consumed across all SIM cards</CardDescription>
  //       </CardHeader>
  //       <CardContent>
  //         <ResponsiveContainer width="100%" height={200}>
  //           <AreaChart data={dataUsageTrend}>
  //             <defs>
  //               <linearGradient id="colorData" x1="0" y1="0" x2="0" y2="1">
  //                 <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
  //                 <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
  //               </linearGradient>
  //             </defs>
  //             <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
  //             <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
  //             <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
  //             <Tooltip
  //               contentStyle={{
  //                 backgroundColor: "hsl(var(--card))",
  //                 border: "1px solid hsl(var(--border))",
  //                 borderRadius: "8px",
  //               }}
  //               formatter={(value: number) => [`${value} GB`, "Data Usage"]}
  //             />
  //             <Area
  //               type="monotone"
  //               dataKey="usage"
  //               stroke="hsl(var(--success))"
  //               strokeWidth={2}
  //               fillOpacity={1}
  //               fill="url(#colorData)"
  //             />
  //           </AreaChart>
  //         </ResponsiveContainer>
  //       </CardContent>
  //     </Card>
  //   </TabsContent>
  // </Tabs>
}
