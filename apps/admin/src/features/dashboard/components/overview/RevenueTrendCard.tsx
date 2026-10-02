import { useQuery } from "@tanstack/react-query";
import { getSystemRevenueByMonthQueryOptions, getSystemTenantGrowthQueryOptions } from "@truckmoov/api/auth";
import { TrendingUp } from "lucide-react";
import { useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { CHART_TOOLTIP_STYLE, formatMonthLabel, formatNgn, formatNgnCompact } from "./overviewFormat";
import { RangeFilter } from "./RangeFilter";
import type { RangeOption } from "./RangeFilter";
import { WidgetBody } from "./WidgetBody";

const DEFAULT_MONTHS = 6;
const MONTH_OPTIONS: RangeOption[] = [
  { value: 3, label: "Last 3 months" },
  { value: 6, label: "Last 6 months" },
  { value: 12, label: "Last 12 months" },
];

export function RevenueTrendCard() {
  const [months, setMonths] = useState(DEFAULT_MONTHS);
  const revenue = useQuery(getSystemRevenueByMonthQueryOptions(months));
  const growth = useQuery(getSystemTenantGrowthQueryOptions(months));
  const tenantsByMonth = new Map((growth.data?.data.months ?? []).map(entry => [entry.month, entry.tenants]));
  const series = (revenue.data?.data.months ?? []).map(entry => ({
    label: formatMonthLabel(entry.month),
    collectedNgn: entry.collectedNgn,
    tenants: tenantsByMonth.get(entry.month) ?? 0,
  }));
  const hasData = series.some(entry => entry.collectedNgn > 0 || entry.tenants > 0);
  const retry = () => {
    void revenue.refetch();
    void growth.refetch();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Revenue & Tenant Growth
            </CardTitle>
            <CardDescription>{`Cash collected per month (NGN) and tenants over the last ${months} months, Lagos time`}</CardDescription>
          </div>
          <RangeFilter
            value={months}
            options={MONTH_OPTIONS}
            onValueChange={setMonths}
          />
        </div>
      </CardHeader>
      <CardContent>
        <WidgetBody
          isLoading={revenue.isLoading || growth.isLoading}
          isError={revenue.isError || growth.isError}
          onRetry={retry}
          isEmpty={!hasData}
          emptyMessage={`No payments or tenants in the last ${months} months.`}
          skeletonClassName="h-[300px] w-full"
        >
          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <ComposedChart data={series}>
              <defs>
                <linearGradient
                  id="collectedGradient"
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
                dataKey="label"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                yAxisId="ngn"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={value => formatNgnCompact(Number(value))}
              />
              <YAxis
                yAxisId="tenants"
                orientation="right"
                allowDecimals={false}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value: number, name: string) => [
                  name === "Tenants" ? value.toLocaleString() : formatNgn(value),
                  name,
                ]}
              />
              <Area
                yAxisId="ngn"
                type="monotone"
                dataKey="collectedNgn"
                name="Collected"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#collectedGradient)"
              />
              <Line
                yAxisId="tenants"
                type="monotone"
                dataKey="tenants"
                name="Tenants"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </WidgetBody>
      </CardContent>
    </Card>
  );
}
