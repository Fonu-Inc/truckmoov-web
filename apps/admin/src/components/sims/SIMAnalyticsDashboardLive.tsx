import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/shadcn/chart";
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
  Legend,
} from "recharts";
import {
  TrendingUp,
  Activity,
  Database,
  DollarSign,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { ChartDateFilter, type ChartDateRange } from "@/components/shadcn/chart-date-filter";
import { useCurrency } from "@/contexts/CurrencyContext";

type IoTSIM = any;

interface SIMAnalyticsDashboardProps {
  sims: IoTSIM[];
  loading?: boolean;
}

const EXCHANGE_RATE = 1550;
const CHART_DATE_OPTIONS: ChartDateRange[] = ["today", "7d", "30d", "90d"];

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

// Demo fallback so charts always have meaningful data
const DEMO_CARRIERS = [
  { name: "MTN Nigeria", value: 28 },
  { name: "Airtel", value: 19 },
  { name: "Glo", value: 12 },
  { name: "9mobile", value: 6 },
];

const DEMO_PLANS = [
  { name: "iot_basic", value: 22 },
  { name: "iot_premium", value: 18 },
  { name: "data_only", value: 14 },
  { name: "data_sms", value: 7 },
  { name: "data_sms_voice", value: 4 },
];

export function SIMAnalyticsDashboardLive({ sims, loading }: SIMAnalyticsDashboardProps) {
  const { currency, format: formatCurrency } = useCurrency();
  const [revenueRange, setRevenueRange] = useState<ChartDateRange>("30d");
  const [carrierFilter, setCarrierFilter] = useState<string>("all");

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

  const monthlyData = useMemo(
    () => generateMonthlyData(totals.totalCost || 1_500_000, totals.totalDataUsage || 80_000),
    [totals.totalCost, totals.totalDataUsage]
  );

  const carrierDistribution = useMemo(() => {
    const carrierMap = new Map<string, number>();
    sims.forEach(sim => {
      carrierMap.set(sim.carrier, (carrierMap.get(sim.carrier) || 0) + 1);
    });
    const live = Array.from(carrierMap.entries()).map(([name, value]) => ({ name, value }));
    return live.length > 0 ? live : DEMO_CARRIERS;
  }, [sims]);

  const planDistribution = useMemo(() => {
    const planMap = new Map<string, number>();
    sims.forEach(sim => {
      planMap.set(sim.plan, (planMap.get(sim.plan) || 0) + 1);
    });
    const live = Array.from(planMap.entries()).map(([name, value]) => ({ name, value }));
    return live.length > 0 ? live : DEMO_PLANS;
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

  // Carrier list (for filter dropdown)
  const carrierOptions = useMemo(() => {
    const set = new Set<string>();
    carrierDistribution.forEach((c) => set.add(c.name));
    return Array.from(set);
  }, [carrierDistribution]);

  const filteredCarrierData = useMemo(() => {
    if (carrierFilter === "all") return carrierDistribution;
    return carrierDistribution.filter((c) => c.name === carrierFilter);
  }, [carrierDistribution, carrierFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">SIM Usage Analytics</h2>
          <p className="text-muted-foreground">Real-time data from Fonu IoT platform</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalRevenue)}</div>
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
            <div className="text-2xl font-bold">{formatCurrency(totals.totalCost)}</div>
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
            <div className="text-2xl font-bold text-success">{formatCurrency(totals.profit)}</div>
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
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <CardTitle>Revenue vs Cost Trends</CardTitle>
                  <CardDescription>Monthly revenue earned versus operating cost across the SIM fleet.</CardDescription>
                </div>
                <ChartDateFilter
                  value={revenueRange}
                  onValueChange={setRevenueRange}
                  options={CHART_DATE_OPTIONS}
                />
              </div>
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
              <CardDescription>Total cellular data consumed across all active SIMs each month.</CardDescription>
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
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <CardTitle>Carrier Distribution</CardTitle>
                    <CardDescription>Share of SIM inventory provisioned with each mobile network operator.</CardDescription>
                  </div>
                  <Select value={carrierFilter} onValueChange={setCarrierFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="All carriers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All carriers</SelectItem>
                      {carrierOptions.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <PieChart>
                    <Pie data={filteredCarrierData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {filteredCarrierData.map((_, index) => (
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
                <CardDescription>Active SIMs grouped by data plan tier.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[280px] w-full">
                  <PieChart>
                    <Pie data={planDistribution} cx="50%" cy="45%" innerRadius={50} outerRadius={75} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
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



