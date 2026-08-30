import type { FleetFinancialsLayoutContext } from "@/features/fleet/components/layout/FleetFinancialsLayout";
import type { PeriodValue } from "@/features/fleet/components/ui/PeriodFilter";
import type { ProfitabilityTierKey } from "@/features/fleet/utils/fleetFinancials";
import { useFleetProfitability } from "@truckmoov/api/fleet";
import {
  BarChart3, Fuel, Shield, Users, Wrench,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { useOutletContext } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/shadcn/chart";
import { useCurrency } from "@/contexts/CurrencyContext";
import { PeriodFilter } from "@/features/fleet/components/ui/PeriodFilter";
import {
  formatPeriodLabel,
  normalizeProfitabilityRow,
  normalizeTier,
  ORDERED_PROFITABILITY_TIERS,
  periodToMonths,

  TIER_COLORS,
  TIER_LABELS,
} from "@/features/fleet/utils/fleetFinancials";

export default function FinancialsOverviewPage() {
  const {
    profitabilityData,
    profitabilityPeriod,
    setProfitabilityPeriod,
    isProfitabilityFetching,
  } = useOutletContext<FleetFinancialsLayoutContext>();
  const { format } = useCurrency();

  const [
    costBreakdownPeriod,
    setCostBreakdownPeriod,
  ] = useState<PeriodValue>("30");
  const costBreakdownPayload = useMemo(
    () => ({ data: { periodMonths: periodToMonths(costBreakdownPeriod) } }),
    [costBreakdownPeriod],
  );
  const {
    data: costBreakdownResp,
    isFetching: isCostBreakdownFetching,
  } = useFleetProfitability(costBreakdownPayload);
  const costBreakdownData = useMemo(
    () => (costBreakdownResp?.data ?? []).map(normalizeProfitabilityRow),
    [costBreakdownResp?.data],
  );

  const tierDistribution = profitabilityData.reduce(
    (acc, v) => {
      const tier = normalizeTier(v.profitability?.tier);
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    },
    {} as Record<ProfitabilityTierKey, number>,
  );

  const profitabilityDistributionData = ORDERED_PROFITABILITY_TIERS.map(tier => ({
    tier,
    name: TIER_LABELS[tier],
    label: `${TIER_LABELS[tier]}: ${tierDistribution[tier] ?? 0}`,
    value: tierDistribution[tier] ?? 0,
    fill: TIER_COLORS[tier],
  })).filter(entry => entry.value > 0);

  const profitabilityDistributionTotal = profitabilityDistributionData.reduce(
    (total, item) => total + item.value,
    0,
  );
  const hasProfitabilityDistribution = profitabilityDistributionTotal > 0;

  const profitabilityDistributionLegend = ORDERED_PROFITABILITY_TIERS.map(tier => ({
    tier,
    name: TIER_LABELS[tier],
    value: tierDistribution[tier] ?? 0,
    fill: TIER_COLORS[tier],
  }));

  // Cost breakdown for bar chart
  const costBreakdown = costBreakdownData.reduce(
    (acc, v) => {
      acc.fuel += v.costs?.fuel || 0;
      acc.maintenance += v.costs?.maintenance || 0;
      acc.wages += v.costs?.wages || 0;
      acc.insurance += v.costs?.insurance || 0;
      acc.depreciation += v.costs?.depreciation || 0;
      return acc;
    },
    {
      fuel: 0, maintenance: 0, wages: 0, insurance: 0, depreciation: 0,
    },
  );

  const costChartData = [
    {
      name: "Fuel", value: costBreakdown.fuel, fill: "#f59e0b",
    },
    {
      name: "Maintenance", value: costBreakdown.maintenance, fill: "#3b82f6",
    },
    {
      name: "Wages", value: costBreakdown.wages, fill: "#8b5cf6",
    },
    {
      name: "Insurance", value: costBreakdown.insurance, fill: "#22c55e",
    },
    {
      name: "Depreciation", value: costBreakdown.depreciation, fill: "#64748b",
    },
  ];

  const costChartDataVisible = costChartData.filter(item => item.value > 0);
  const hasCostBreakdownData = costChartDataVisible.length > 0;

  const chartConfig = {
    fuel: {
      label: "Fuel", color: "#f59e0b",
    },
    maintenance: {
      label: "Maintenance", color: "#3b82f6",
    },
    wages: {
      label: "Wages", color: "#8b5cf6",
    },
    insurance: {
      label: "Insurance", color: "#22c55e",
    },
    depreciation: {
      label: "Depreciation", color: "#64748b",
    },
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profitability Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-lg">Profitability Distribution</CardTitle>
              <CardDescription>
                Vehicle count by profitability tier ·
                {" "}
                {formatPeriodLabel(profitabilityPeriod)}
              </CardDescription>
            </div>
            <PeriodFilter
              value={profitabilityPeriod}
              onChange={setProfitabilityPeriod}
              variant="short"
              className="w-[150px]"
            />
          </CardHeader>
          <CardContent>
            {isProfitabilityFetching
              ? (
                  <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                    Calculating profitability distribution...
                  </div>
                )
              : hasProfitabilityDistribution
                ? (
                    <div className="space-y-3">
                      <ChartContainer
                        config={chartConfig}
                        className="h-[250px]"
                      >
                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                        >
                          <PieChart>
                            <Pie
                              data={profitabilityDistributionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={86}
                              paddingAngle={4}
                              dataKey="value"
                              nameKey="name"
                              label={({ payload }) => payload.label}
                            >
                              {profitabilityDistributionData.map(entry => (
                                <Cell
                                  key={entry.tier}
                                  fill={entry.fill}
                                />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
                        {profitabilityDistributionLegend.map(entry => (
                          <div
                            key={entry.tier}
                            className="flex items-center gap-2"
                          >
                            <span
                              className="h-3 w-3 rounded-sm"
                              style={{ backgroundColor: entry.fill }}
                            />
                            <span>{entry.name}</span>
                            <span className="text-muted-foreground">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                : (
                    <div className="flex h-[250px] flex-col items-center justify-center text-center">
                      <BarChart3 className="mb-3 h-10 w-10 text-muted-foreground/40" />
                      <p className="text-sm font-medium">No profitability data</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        No vehicles were returned for
                        {" "}
                        {formatPeriodLabel(profitabilityPeriod).toLowerCase()}
                        .
                      </p>
                    </div>
                  )}
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-lg">Cost Breakdown</CardTitle>
              <CardDescription>
                Total costs by category ·
                {" "}
                {formatPeriodLabel(costBreakdownPeriod)}
              </CardDescription>
            </div>
            <PeriodFilter
              value={costBreakdownPeriod}
              onChange={setCostBreakdownPeriod}
              variant="short"
              className="w-[150px]"
            />
          </CardHeader>
          <CardContent>
            {isCostBreakdownFetching
              ? (
                  <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                    Calculating cost breakdown...
                  </div>
                )
              : hasCostBreakdownData
                ? (
                    <ChartContainer
                      config={chartConfig}
                      className="h-[250px]"
                    >
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <BarChart
                          data={costChartDataVisible}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            type="number"
                            tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={80}
                          />
                          <ChartTooltip
                            content={<ChartTooltipContent />}
                            formatter={value => format(Number(value))}
                          />
                          <Bar
                            dataKey="value"
                            radius={4}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )
                : (
                    <div className="flex h-[250px] flex-col items-center justify-center text-center">
                      <BarChart3 className="mb-3 h-10 w-10 text-muted-foreground/40" />
                      <p className="text-sm font-medium">No cost data</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        No vehicle costs were returned for
                        {" "}
                        {formatPeriodLabel(costBreakdownPeriod).toLowerCase()}
                        .
                      </p>
                    </div>
                  )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Fuel className="h-4 w-4" />
            {" "}
            Fuel
          </div>
          <div className="font-semibold">{format(costBreakdown.fuel)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Wrench className="h-4 w-4" />
            {" "}
            Maintenance
          </div>
          <div className="font-semibold">{format(costBreakdown.maintenance)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            {" "}
            Wages
          </div>
          <div className="font-semibold">{format(costBreakdown.wages)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Shield className="h-4 w-4" />
            {" "}
            Insurance
          </div>
          <div className="font-semibold">{format(costBreakdown.insurance)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <BarChart3 className="h-4 w-4" />
            {" "}
            Depreciation
          </div>
          <div className="font-semibold">{format(costBreakdown.depreciation)}</div>
        </Card>
      </div>
    </div>
  );
}
