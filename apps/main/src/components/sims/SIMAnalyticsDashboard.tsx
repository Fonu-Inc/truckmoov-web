import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/shadcn/card";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/shadcn/chart";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Database,
  DollarSign,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

type Currency = "NGN" | "USD";

interface SIMCard {
  id: string;
  iccid: string;
  msisdn: string;
  carrier: string;
  plan: string;
  status: string;
  tenant: string | null;
  tenantId: string | null;
  dataUsage: number;
  dataLimit: number;
  monthlyCost: number;
}

interface SIMAnalyticsDashboardProps {
  sims: SIMCard[];
}

const EXCHANGE_RATE = 1550; // 1 USD = 1550 NGN

const formatCurrency = (amount: number, currency: Currency): string => {
  if (currency === "USD") {
    return `$${(amount / EXCHANGE_RATE).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₦${amount.toLocaleString("en-NG")}`;
};

// Mock monthly data trends
const generateMonthlyData = (baseCost: number, baseData: number) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map((month, i) => ({
    month,
    dataUsage: Math.round(baseData * (0.7 + Math.random() * 0.6)),
    cost: Math.round(baseCost * (0.8 + Math.random() * 0.4)),
    revenue: Math.round(baseCost * 1.3 * (0.8 + Math.random() * 0.4)),
  }));
};

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export function SIMAnalyticsDashboard({ sims }: SIMAnalyticsDashboardProps) {
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [timeRange, setTimeRange] = useState("12m");

  // Calculate tenant analytics
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
      const tenantName = sim.tenant || "Unassigned";
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
      existing.dataUsage += sim.dataUsage;
      existing.dataLimit += sim.dataLimit;
      existing.monthlyCost += sim.monthlyCost;
      existing.revenue += sim.monthlyCost * 1.35; // 35% margin
      if (sim.status === "active") existing.activeSims += 1;

      tenantMap.set(tenantName, existing);
    });

    return Array.from(tenantMap.values()).sort((a, b) => b.revenue - a.revenue);
  }, [sims]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalCost = sims.reduce((sum, s) => sum + s.monthlyCost, 0);
    const totalRevenue = totalCost * 1.35;
    const totalDataUsage = sims.reduce((sum, s) => sum + s.dataUsage, 0);
    const totalDataLimit = sims.reduce((sum, s) => sum + s.dataLimit, 0);
    const activeSims = sims.filter(s => s.status === "active").length;

    return {
      totalCost,
      totalRevenue,
      profit: totalRevenue - totalCost,
      profitMargin: ((totalRevenue - totalCost) / totalRevenue) * 100,
      totalDataUsage,
      totalDataLimit,
      dataUtilization: (totalDataUsage / totalDataLimit) * 100,
      activeSims,
      totalSims: sims.length,
    };
  }, [sims]);

  // Monthly trend data
  const monthlyData = useMemo(() => 
    generateMonthlyData(totals.totalCost, totals.totalDataUsage),
    [totals.totalCost, totals.totalDataUsage]
  );

  // Carrier distribution
  const carrierDistribution = useMemo(() => {
    const carrierMap = new Map<string, number>();
    sims.forEach(sim => {
      carrierMap.set(sim.carrier, (carrierMap.get(sim.carrier) || 0) + 1);
    });
    return Array.from(carrierMap.entries()).map(([name, value]) => ({ name, value }));
  }, [sims]);

  // Plan distribution
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

  return (
    <div className="space-y-6">
      {/* Header with currency toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">SIM Usage Analytics</h2>
          <p className="text-muted-foreground">Data consumption trends and cost analysis</p>
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

      {/* Summary Cards */}
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
              <span>+12.5% from last month</span>
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
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>Profit margin: {totals.profitMargin.toFixed(1)}%</span>
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
            <div className="flex items-center text-xs text-success mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>+8.2% from last month</span>
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
              {(totals.totalDataUsage / 1024).toFixed(1)} GB / {(totals.totalDataLimit / 1024).toFixed(1)} GB
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Revenue & Cost Trends</TabsTrigger>
          <TabsTrigger value="data">Data Consumption</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Cost Trends</CardTitle>
              <CardDescription>Monthly revenue earned versus operating cost across the SIM fleet</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis 
                    className="text-xs" 
                    tickFormatter={(v) => currency === "USD" ? `$${(v/EXCHANGE_RATE).toFixed(0)}` : `₦${(v/1000).toFixed(0)}k`} 
                  />
                  <ChartTooltip 
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="font-medium">{payload[0]?.payload.month}</div>
                          {payload.map((entry: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <div 
                                className="h-2 w-2 rounded-full" 
                                style={{ backgroundColor: entry.color }}
                              />
                              <span>{entry.name}: {formatCurrency(entry.value, currency)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Revenue"
                    stackId="1" 
                    stroke="hsl(var(--chart-3))" 
                    fill="hsl(var(--chart-3))" 
                    fillOpacity={0.3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cost" 
                    name="Cost"
                    stackId="2" 
                    stroke="hsl(var(--chart-2))" 
                    fill="hsl(var(--chart-2))" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Data Consumption (MB)</CardTitle>
              <CardDescription>Total cellular data consumed across all active SIMs each month</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `${(v/1024).toFixed(1)}GB`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="dataUsage" 
                    name="Data Usage"
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Carrier Distribution</CardTitle>
                <CardDescription>Share of SIM inventory provisioned with each mobile network operator</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <PieChart>
                    <Pie
                      data={carrierDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {carrierDistribution.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan Distribution</CardTitle>
                <CardDescription>Active SIMs grouped by data plan tier</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <PieChart>
                    <Pie
                      data={planDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {planDistribution.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

    </div>
  );
}
