import { useQuery } from "@tanstack/react-query";
import {
  getDataBundleCarrierDistributionQueryOptions,
  getDataBundleCarriersQueryOptions,
  getDataBundleDashboardSummaryQueryOptions,
  getDataBundleSpendBreakdownQueryOptions,
  getDataBundleSpendTrendQueryOptions,
  getDataBundleSubscriptionUsageQueryOptions,
} from "@truckmoov/api/auth";
import {
  Activity, Clock, TrendingUp, Zap,
} from "lucide-react";
import { useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import {
  bundleRenewalOutlook,
  CHART_COLORS,
  formatNgn,
  RANGE_OPTIONS,
  spendingTrend,
  toAnalyticsRange,
} from "@/features/data-bundle/utils/dataBundle";

export function AnalyticsPage() {
  const [
    spendRange,
    setSpendRange,
  ] = useState("30d");
  const [
    breakdownRange,
    setBreakdownRange,
  ] = useState("30d");
  const [
    channelRange,
    setChannelRange,
  ] = useState("30d");
  const [
    usageRange,
    setUsageRange,
  ] = useState("30d");

  const spendTrendQuery = useQuery(getDataBundleSpendTrendQueryOptions(toAnalyticsRange(spendRange)));
  const spendBreakdownQuery = useQuery(getDataBundleSpendBreakdownQueryOptions(toAnalyticsRange(breakdownRange)));
  const carrierDistributionQuery = useQuery(getDataBundleCarrierDistributionQueryOptions(toAnalyticsRange(channelRange)));
  const subscriptionUsageQuery = useQuery(getDataBundleSubscriptionUsageQueryOptions(toAnalyticsRange(usageRange)));
  const carriersQuery = useQuery(getDataBundleCarriersQueryOptions());
  const summaryQuery = useQuery(getDataBundleDashboardSummaryQueryOptions());
  const renewalOutlook = bundleRenewalOutlook(summaryQuery.data?.data);

  const dailySpend = spendTrendQuery.data
    ? spendingTrend(
        spendTrendQuery.data.data.trend,
        spendRange,
      )
    : [];
  const spendBreakdown = (spendBreakdownQuery.data?.data.breakdown ?? []).map(item => ({
    name: item.bundleName || item.bundleCode,
    value: item.amount,
  }));
  const channelDistribution = (carrierDistributionQuery.data?.data.distribution ?? []).map(item => ({
    name: carriersQuery.data?.data.carriers.find(carrier => carrier.id === item.carrierId)?.displayName ?? item.carrierId,
    value: item.amount,
  }));
  const usageByBundle = (subscriptionUsageQuery.data?.data.usage ?? []).map(item => ({
    name: item.bundleCode,
    used: item.usedMb,
    total: item.totalMb,
  }));
  const queries = [
    spendTrendQuery,
    spendBreakdownQuery,
    carrierDistributionQuery,
    subscriptionUsageQuery,
    summaryQuery,
  ];
  const failedQuery = queries.find(query => query.isError);
  if (failedQuery) {
    return (
      <div role="alert">
        {failedQuery.error.message}
        <Button
          variant="link"
          onClick={() => queries.forEach(query => query.refetch())}
        >
          Try again
        </Button>
      </div>
    );
  }
  if (queries.some(query => query.isLoading)) {
    return <div role="status">Loading analytics...</div>;
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl surface-sleek bg-card/50 border-border/50">
        <CardHeader className="space-y-1.5 p-6 pb-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {" "}
                Daily Spending Trend
              </CardTitle>
              <CardDescription>Spending over time</CardDescription>
            </div>
            <Select
              value={spendRange}
              onValueChange={setSpendRange}
            >
              <SelectTrigger className="h-10 rounded-xl px-3.5 w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map(r => (
                  <SelectItem
                    key={r.value}
                    value={r.value}
                  >
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 h-[280px]">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <AreaChart data={dailySpend}>
              <defs>
                <linearGradient
                  id="spend"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.6}
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
                dataKey="day"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
              />
              <Tooltip
                formatter={value => formatNgn(Number(value))}
                contentStyle={{
                  background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
                }}
              />
              <Area
                type="monotone"
                dataKey="spend"
                stroke="hsl(var(--primary))"
                fill="url(#spend)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl surface-sleek bg-card/50 border-border/50">
          <CardHeader className="space-y-1.5 p-6 pb-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  {" "}
                  Spend Breakdown
                </CardTitle>
                <CardDescription>By bundle type</CardDescription>
              </div>
              <Select
                value={breakdownRange}
                onValueChange={setBreakdownRange}
              >
                <SelectTrigger className="h-10 rounded-xl px-3.5 w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RANGE_OPTIONS.map(r => (
                    <SelectItem
                      key={r.value}
                      value={r.value}
                    >
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0 h-[280px]">
            {spendBreakdown.length === 0
              ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No spend data yet</div>
                )
              : (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Pie
                        data={spendBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {spendBreakdown.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={value => formatNgn(Number(value))}
                        contentStyle={{
                          background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl surface-sleek bg-card/50 border-border/50">
          <CardHeader className="space-y-1.5 p-6 pb-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  {" "}
                  Channel Distribution
                </CardTitle>
                <CardDescription>Bundles by carrier</CardDescription>
              </div>
              <Select
                value={channelRange}
                onValueChange={setChannelRange}
              >
                <SelectTrigger className="h-10 rounded-xl px-3.5 w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RANGE_OPTIONS.map(r => (
                    <SelectItem
                      key={r.value}
                      value={r.value}
                    >
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0 h-[280px]">
            {channelDistribution.length === 0
              ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No allocations yet</div>
                )
              : (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Pie
                        data={channelDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                      >
                        {channelDistribution.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={value => formatNgn(Number(value))}
                        contentStyle={{
                          background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl surface-sleek bg-card/50 border-border/50">
        <CardHeader className="space-y-1.5 p-6 pb-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {" "}
                Bundle Renewal Outlook
              </CardTitle>
              <CardDescription>Current allocations by expiry window</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 h-[280px]">
          {renewalOutlook.every(bucket => bucket.count === 0)
            ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No allocations yet</div>
              )
            : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={renewalOutlook}
                    layout="vertical"
                    margin={{
                      left: 0, right: 24, top: 8, bottom: 8,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={112}
                      tickLine={false}
                      axisLine={false}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted))" }}
                      contentStyle={{
                        background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name="Bundles"
                      radius={[
                        0,
                        4,
                        4,
                        0,
                      ]}
                      maxBarSize={28}
                    >
                      {renewalOutlook.map((bucket, index) => (
                        <Cell
                          key={bucket.name}
                          fill={[
                            "hsl(var(--destructive))",
                            "hsl(var(--warning))",
                            "hsl(var(--primary))",
                            "hsl(var(--success))",
                          ][index]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl surface-sleek bg-card/50 border-border/50">
        <CardHeader className="space-y-1.5 p-6 pb-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Subscription Usage Breakdown</CardTitle>
              <CardDescription>MB used vs total per bundle</CardDescription>
            </div>
            <Select
              value={usageRange}
              onValueChange={setUsageRange}
            >
              <SelectTrigger className="h-10 rounded-xl px-3.5 w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map(r => (
                  <SelectItem
                    key={r.value}
                    value={r.value}
                  >
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 h-[300px]">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart data={usageByBundle}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip contentStyle={{
                background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
              }}
              />
              <Legend />
              <Bar
                dataKey="used"
                name="Used (MB)"
                fill="hsl(var(--primary))"
                radius={[
                  4,
                  4,
                  0,
                  0,
                ]}
              />
              <Bar
                dataKey="total"
                name="Total (MB)"
                fill="hsl(var(--muted))"
                radius={[
                  4,
                  4,
                  0,
                  0,
                ]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export default AnalyticsPage;
