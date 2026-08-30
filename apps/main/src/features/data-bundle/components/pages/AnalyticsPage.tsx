import { useQuery } from "@tanstack/react-query";
import {
  getDataBundleAllocationsQueryOptions,
  getDataBundleCarrierDistributionQueryOptions,
  getDataBundleSpendBreakdownQueryOptions,
  getDataBundleSpendTrendQueryOptions,
  getDataBundleSubscriptionUsageQueryOptions,
  getDataBundleTransactionsQueryOptions,
} from "@truckmoov/api/auth";
import {
  Activity, TrendingUp, Zap,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import {
  CHART_COLORS,
  RANGE_OPTIONS,
  toAnalyticsRange,
  useDataBundleCatalog,
} from "@/features/data-bundle/utils/dataBundle";

export function AnalyticsPage() {
  const { catalog } = useDataBundleCatalog();

  const [
    spendRange,
    setSpendRange,
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
  const spendBreakdownQuery = useQuery(getDataBundleSpendBreakdownQueryOptions(toAnalyticsRange(spendRange)));
  const carrierDistributionQuery = useQuery(getDataBundleCarrierDistributionQueryOptions(toAnalyticsRange(channelRange)));
  const subscriptionUsageQuery = useQuery(getDataBundleSubscriptionUsageQueryOptions());

  // Unfiltered fallback sources for local derivations
  const allocationsQuery = useQuery(getDataBundleAllocationsQueryOptions({
    params: {
      page: 1, limit: 100,
    },
  }));
  const transactionsQuery = useQuery(getDataBundleTransactionsQueryOptions({
    params: {
      page: 1, limit: 100,
    },
  }));

  const topups = useMemo(
    () => {
      return (transactionsQuery.data?.data.items ?? []).map(item => ({
        id: item.id,
        created_at: item.date,
        msisdn: item.mobileNumber,
        bundle_code: item.bundle.code,
        bundle: item.bundle,
        status: String(item.status).toUpperCase(),
        amount_ngn: item.amount,
        payment_reference: item.paymentReference,
        failure_reason: item.failureReason,
      }));
    },
    [transactionsQuery.data],
  );

  const successTopups = useMemo(
    () => topups.filter((t: { status: string }) => t.status === "SUCCESS"),
    [topups],
  );

  const allocations = useMemo(
    () => {
      return (allocationsQuery.data?.data.items ?? []).map(item => ({
        id: item.id,
        msisdn: item.mobileNumber,
        bundle_code: item.bundle.code,
        bundle: item.bundle,
        data_mb_total: item.dataTotalMb,
        data_mb_used: item.dataUsedMb,
        usage_percentage: item.usagePercentage,
        status: item.status,
        expires_at: item.expiresAt,
        created_at: item.activatedAt,
        days_left: item.daysLeft,
      }));
    },
    [allocationsQuery.data],
  );

  const rangeStart = (rangeKey: string) => {
    const opt = RANGE_OPTIONS.find(r => r.value === rangeKey) ?? RANGE_OPTIONS[3];
    const d = new Date();
    if (rangeKey === "yesterday") {
      d.setDate(d.getDate() - 1);
      d.setHours(
        0,
        0,
        0,
        0,
      );
      return d;
    }
    d.setDate(d.getDate() - opt.days);
    return d;
  };

  const dailySpend = useMemo(
    () => {
      if (spendTrendQuery.data) {
        return spendTrendQuery.data.data.trend.map(point => ({
          day: point.date.slice(5),
          spend: point.amount,
        }));
      }
      const opt = RANGE_OPTIONS.find(r => r.value === spendRange) ?? RANGE_OPTIONS[3];
      const days = opt.days;
      const buckets = new Map<string, number>();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        buckets.set(
          d.toISOString().slice(
            0,
            10,
          ),
          0,
        );
      }
      successTopups.forEach((t: {
        created_at: string; bundle_code: string;
      }) => {
        const key = new Date(t.created_at).toISOString().slice(
          0,
          10,
        );
        if (!buckets.has(key))
          return;
        const b = catalog.find(c => c.code === t.bundle_code);
        buckets.set(
          key,
          (buckets.get(key) ?? 0) + (b ? Number(b.price_ngn) : 0),
        );
      });
      return Array.from(buckets.entries()).map(([
        day,
        spend,
      ]) => ({
        day: day.slice(5),
        spend,
      }));
    },
    [
      successTopups,
      catalog,
      spendRange,
      spendTrendQuery.data,
    ],
  );

  const spendBreakdown = useMemo(
    () => {
      if (spendBreakdownQuery.data) {
        return spendBreakdownQuery.data.data.breakdown.map(item => ({
          name: item.bundleName || item.bundleCode,
          value: item.amount,
        }));
      }
      const start = rangeStart(spendRange);
      const map = new Map<string, number>();
      successTopups
        .filter((t: { created_at: string }) => new Date(t.created_at) >= start)
        .forEach((t: { bundle_code: string }) => {
          const b = catalog.find(c => c.code === t.bundle_code);
          if (!b)
            return;
          map.set(
            b.name,
            (map.get(b.name) ?? 0) + Number(b.price_ngn),
          );
        });
      return Array.from(map.entries()).map(([
        name,
        value,
      ]) => ({
        name, value,
      }));
    },
    [
      successTopups,
      catalog,
      spendRange,
      spendBreakdownQuery.data,
    ],
  );

  const channelDistribution = useMemo(
    () => {
      if (carrierDistributionQuery.data) {
        return carrierDistributionQuery.data.data.distribution.map(item => ({
          name: item.carrierId,
          value: item.amount,
        }));
      }
      const start = rangeStart(channelRange);
      const map = new Map<string, number>();
      successTopups
        .filter((t: { created_at: string }) => new Date(t.created_at) >= start)
        .forEach((t: { bundle_code: string }) => {
          const b = catalog.find(c => c.code === t.bundle_code);
          const carrier = b?.carrier ?? "Unknown";
          map.set(
            carrier,
            (map.get(carrier) ?? 0) + 1,
          );
        });
      return Array.from(map.entries()).map(([
        name,
        value,
      ]) => ({
        name, value,
      }));
    },
    [
      successTopups,
      catalog,
      channelRange,
      carrierDistributionQuery.data,
    ],
  );

  const usageByBundle = useMemo(
    () => {
      if (subscriptionUsageQuery.data) {
        return subscriptionUsageQuery.data.data.usage.map(item => ({
          name: item.bundleCode,
          used: item.usedMb,
          total: item.totalMb,
        }));
      }
      const start = rangeStart(usageRange);
      const map = new Map<string, {
        name: string; used: number; total: number;
      }>();
      allocations.forEach((a) => {
        if (new Date(a.created_at ?? Date.now()) < start)
          return;
        const cur = map.get(a.bundle_code) ?? {
          name: a.bundle_code, used: 0, total: 0,
        };
        cur.used += a.data_mb_used || 0;
        cur.total += a.data_mb_total || 0;
        map.set(
          a.bundle_code,
          cur,
        );
      });
      if (map.size === 0) {
      // fallback to full allocations if range yields nothing
        allocations.forEach((a) => {
          const cur = map.get(a.bundle_code) ?? {
            name: a.bundle_code, used: 0, total: 0,
          };
          cur.used += a.data_mb_used || 0;
          cur.total += a.data_mb_total || 0;
          map.set(
            a.bundle_code,
            cur,
          );
        });
      }
      return Array.from(map.values()).slice(
        0,
        8,
      );
    },
    [
      allocations,
      usageRange,
      subscriptionUsageQuery.data,
    ],
  );

  return (
    <div className="space-y-4">
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
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
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
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
        <CardContent className="h-[280px]">
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
              <Tooltip contentStyle={{
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
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
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
                value={spendRange}
                onValueChange={setSpendRange}
              >
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
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
          <CardContent className="h-[280px]">
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
                      <Tooltip contentStyle={{
                        background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
                      }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
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
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
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
          <CardContent className="h-[280px]">
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
                      <Tooltip contentStyle={{
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

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Subscription Usage Breakdown</CardTitle>
              <CardDescription>MB used vs total per bundle</CardDescription>
            </div>
            <Select
              value={usageRange}
              onValueChange={setUsageRange}
            >
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
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
        <CardContent className="h-[300px]">
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
