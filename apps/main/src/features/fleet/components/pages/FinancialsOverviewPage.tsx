import type { FleetFinancialsLayoutContext } from "@/features/fleet/components/layout/FleetFinancialsLayout";
import type { PeriodValue } from "@/features/fleet/components/ui/PeriodFilter";
import type { ProfitabilityTierKey } from "@/features/fleet/utils/fleetFinancials";
import { useFleetProfitability } from "@truckmoov/api/fleet";
import { BarChart3 } from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { useOutletContext } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
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

// The design app's period Select trigger (h-10 rounded-xl px-3.5), over the shared base.
const PERIOD_TRIGGER_CLASS = "h-10 rounded-xl px-3.5 w-[150px]";

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
    value: tierDistribution[tier] ?? 0,
    fill: TIER_COLORS[tier],
  })).filter(entry => entry.value > 0);

  const hasProfitabilityDistribution = profitabilityDistributionData.length > 0;

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

  const costTotal = costChartData.reduce(
    (total, item) => total + item.value,
    0,
  );
  const hasCostBreakdownData = costTotal > 0;

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
    <div className="mt-3 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profitability Distribution */}
        <div className="rounded-2xl surface-sleek text-card-foreground">
          <div className="p-6 pb-4 flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <h3 className="font-semibold tracking-tight text-foreground font-display text-lg">Profitability Distribution</h3>
              <p className="text-sm text-muted-foreground">Vehicle count by profitability tier</p>
            </div>
            <PeriodFilter
              value={profitabilityPeriod}
              onChange={setProfitabilityPeriod}
              variant="short"
              className={PERIOD_TRIGGER_CLASS}
            />
          </div>
          <div className="p-6 pt-0">
            {isProfitabilityFetching
              ? (
                  <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                    Calculating profitability distribution...
                  </div>
                )
              : hasProfitabilityDistribution
                ? (
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
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                            label={({
                              name, value,
                            }) => `${name}: ${value}`}
                          >
                            {profitabilityDistributionData.map(entry => (
                              <Cell
                                key={entry.tier}
                                fill={entry.fill}
                              />
                            ))}
                          </Pie>
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )
                : (
                    <div className="flex h-[250px] flex-col items-center justify-center text-center">
                      <BarChart3 className="mb-3 h-10 w-10 text-muted-foreground/40" />
                      <p className="text-sm font-medium">No profitability data</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {`No vehicles were returned for ${formatPeriodLabel(profitabilityPeriod).toLowerCase()}.`}
                      </p>
                    </div>
                  )}
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="rounded-2xl surface-sleek text-card-foreground">
          <div className="p-6 pb-4 flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <h3 className="font-semibold tracking-tight text-foreground font-display text-lg">Cost Breakdown</h3>
              <p className="text-sm text-muted-foreground">Total costs by category</p>
            </div>
            <PeriodFilter
              value={costBreakdownPeriod}
              onChange={setCostBreakdownPeriod}
              variant="short"
              className={PERIOD_TRIGGER_CLASS}
            />
          </div>
          <div className="p-6 pt-0">
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
                          data={costChartData}
                          layout="vertical"
                          margin={{
                            top: 0, right: 120, left: 0, bottom: 0,
                          }}
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
                          >
                            {costChartData.map(entry => (
                              <Cell
                                key={entry.name}
                                fill={entry.fill}
                              />
                            ))}
                            <LabelList
                              dataKey="value"
                              position="right"
                              className="fill-foreground text-[10px]"
                              formatter={(value: number) => `${format(value)} · ${((value / costTotal) * 100).toFixed(1)}%`}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )
                : (
                    <div className="flex h-[250px] flex-col items-center justify-center text-center">
                      <BarChart3 className="mb-3 h-10 w-10 text-muted-foreground/40" />
                      <p className="text-sm font-medium">No cost data</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {`No vehicle costs were returned for ${formatPeriodLabel(costBreakdownPeriod).toLowerCase()}.`}
                      </p>
                    </div>
                  )}
          </div>
        </div>
      </div>
    </div>
  );
}
