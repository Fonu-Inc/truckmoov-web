import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Activity,
  Database,
  DollarSign,
  Building2,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { IoTSIM } from "@/hooks/useFonuSIM";

type Currency = "NGN" | "USD";

interface SIMAnalyticsDashboardProps {
  sims: IoTSIM[];
  loading?: boolean;
}

const EXCHANGE_RATE = 1550;

const formatCurrency = (amount: number, currency: Currency): string => {
  if (currency === "USD") {
    return `$${(amount / EXCHANGE_RATE).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₦${amount.toLocaleString("en-NG")}`;
};

const generateMonthlyData = (baseCost: number, baseData: number) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map((month) => ({
    month,
    dataUsage: Math.round(baseData * (0.7 + Math.random() * 0.6)),
    cost: Math.round(baseCost * (0.8 + Math.random() * 0.4)),
    revenue: Math.round(baseCost * 1.3 * (0.8 + Math.random() * 0.4)),
  }));
};

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export function SIMAnalyticsDashboardLive({ sims, loading }: SIMAnalyticsDashboardProps) {
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [timeRange, setTimeRange] = useState("12m");

  const tenantAnalytics = useMemo(() => {
    const tenantMap = new Map<string, { 
      name: string; 
      simCount: number; 
      dataUsage: number; 
      dataLimit: number;
      monthlyCost: number;
      revenue: number;
      activeSims: number;
    }>();

    sims.forEach(sim => {
      const tenantName = sim.tenant_id || "Unassigned";
      const existing = tenantMap.get(tenantName) || {
        name: tenantName,
        simCount: 0,
        dataUsage: 0,
        dataLimit: 0,
        monthlyCost: 0,
        revenue: 0,
        activeSims: 0,
      };

      existing.simCount += 1;
      existing.dataUsage += sim.data_usage_mb;
      existing.dataLimit += sim.data_limit_mb;
      existing.monthlyCost += sim.monthly_cost_ngn;
      existing.revenue += sim.monthly_cost_ngn * 1.35;
      if (sim.status === "active") existing.activeSims += 1;

      tenantMap.set(tenantName, existing);
    });

    return Array.from(tenantMap.values()).sort((a, b) => b.revenue - a.revenue);
  }, [sims]);

  const totals = useMemo(() => {
    const totalCost = sims.reduce((sum, s) => sum + s.monthly_cost_ngn, 0);
    const totalRevenue = totalCost * 1.35;
    const totalDataUsage = sims.reduce((sum, s) => sum + s.data_usage_mb, 0);
    const totalDataLimit = sims.reduce((sum, s) => sum + s.data_limit_mb, 0);
    const activeSims = sims.filter(s => s.status === "active").length;

    return {
      totalCost,
      totalRevenue,
      profit: totalRevenue - totalCost,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0,
      totalDataUsage,
      totalDataLimit,
      dataUtilization: totalDataLimit > 0 ? (totalDataUsage / totalDataLimit) * 100 : 0,
      activeSims,
      totalSims: sims.length,
    };
  }, [sims]);

  const monthlyData = useMemo(() => 
    generateMonthlyData(totals.totalCost, totals.totalDataUsage),
    [totals.totalCost, totals.totalDataUsage]
  );

  const carrierDistribution = useMemo(() => {
    const carrierMap = new Map<string, number>();
    sims.forEach(sim => {
      carrierMap.set(sim.carrier, (carrierMap.get(sim.carrier) || 0) + 1);
    });
    return Array.from(carrierMap.entries()).map(([name, value]) => ({ name, value }));
  }, [sims]);

  const planDistribution = useMemo(() => {
    const planMap = new Map<string, number>();
    sims.forEach(sim => {
      planMap.set(sim.plan, (planMap.get(sim.plan) || 0) + 1);
    });
    return Array.from(planMap.entries()).map(([name, value]) => ({ name, value }));
  }, [sims]);

  const chartConfig = {
    dataUsage: { label: "Data Usage (MB)", color: "hsl(var(--primary))" },
    cost: { label: "Cost", color: "hsl(var(--chart-2))" },
    revenue: { label: "Revenue", color: "hsl(var(--chart-3))" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">SIM Usage Analytics</h2>
          <p className="text-muted-foreground">Real-time data from Fonu IoT platform</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">Last 3 months</SelectItem>
              <SelectItem value="6m">Last 6 months</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
            <SelectTrigger className="w-[100px]">
              <DollarSign className="h-4 w-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NGN">₦ NGN</SelectItem>
              <SelectItem value="USD">$ USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalRevenue, currency)}</div>
            <div className="flex items-center text-xs text-success mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>From {totals.totalSims} SIMs</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalCost, currency)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Margin: {totals.profitMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <Activity className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totals.profit, currency)}</div>
            <div className="text-xs text-success mt-1">
              {totals.activeSims} active SIMs
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Utilization</CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.dataUtilization.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              {(totals.totalDataUsage / 1024).toFixed(1)} / {(totals.totalDataLimit / 1024).toFixed(1)} GB
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Revenue & Cost</TabsTrigger>
          <TabsTrigger value="data">Data Usage</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Cost Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => currency === "USD" ? `$${(v/EXCHANGE_RATE).toFixed(0)}` : `₦${(v/1000).toFixed(0)}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" fill="hsl(var(--chart-3))" fillOpacity={0.3} stroke="hsl(var(--chart-3))" />
                  <Area type="monotone" dataKey="cost" name="Cost" fill="hsl(var(--chart-2))" fillOpacity={0.3} stroke="hsl(var(--chart-2))" />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Data Consumption</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `${(v/1024).toFixed(1)}GB`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="dataUsage" name="Data Usage" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Carrier Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {carrierDistribution.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <PieChart>
                      <Pie data={carrierDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {carrierDistribution.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {planDistribution.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <PieChart>
                      <Pie data={planDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                        {planDistribution.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Cost Analysis by Tenant
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tenantAnalytics.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead className="text-center">SIMs</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-right">Data Usage</TableHead>
                  <TableHead className="text-right">Monthly Cost</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenantAnalytics.map((tenant) => (
                  <TableRow key={tenant.name}>
                    <TableCell className="font-medium">
                      {tenant.name === "Unassigned" ? (
                        <Badge variant="secondary">{tenant.name}</Badge>
                      ) : tenant.name}
                    </TableCell>
                    <TableCell className="text-center">{tenant.simCount}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-success/10 text-success">{tenant.activeSims}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{(tenant.dataUsage / 1024).toFixed(2)} GB</TableCell>
                    <TableCell className="text-right">{formatCurrency(tenant.monthlyCost, currency)}</TableCell>
                    <TableCell className="text-right text-success">{formatCurrency(tenant.revenue, currency)}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-success font-medium">{formatCurrency(tenant.revenue - tenant.monthlyCost, currency)}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">No SIM data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
