import type { ChartDateRange } from "@/components/shadcn/chart-date-filter";
import { useQuery } from "@tanstack/react-query";
import { getSystemRevenueByMonthQueryOptions } from "@truckmoov/api/auth";
import { TrendingUp } from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { ChartDateFilter } from "@/components/shadcn/chart-date-filter";
import { useCurrency } from "@/contexts/CurrencyContext";
import { convertCurrency } from "@/lib/currency";
import {
  CHART_TOOLTIP_STYLE,
  formatMonthLabel,
} from "./overviewFormat";
import { WidgetBody } from "./WidgetBody";

const REVENUE_MONTHS = 12;

/** Revenue & Tenant Growth — fleetflow's 12-month revenue area chart, from live monthly collections. */
export function RevenueTrendCard() {
  // Fleetflow's range control is presentational: the chart always plots the last 12 months.
  const [
    revenueRange,
    setRevenueRange,
  ] = useState<ChartDateRange>("30d");
  const { currency } = useCurrency();
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery(getSystemRevenueByMonthQueryOptions(REVENUE_MONTHS));
  const revenueData = (data?.data.months ?? []).map(entry => ({
    month: formatMonthLabel(entry.month),
    revenueNGN: entry.collectedNgn,
    revenueUSD: Math.round(convertCurrency(
      entry.collectedNgn,
      "NGN",
      "USD",
    )),
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Revenue & Tenant Growth
            </CardTitle>
            <CardDescription>{`Monthly platform revenue and tenant acquisition (${currency})`}</CardDescription>
          </div>
          <ChartDateFilter
            value={revenueRange}
            onValueChange={setRevenueRange}
          />
        </div>
      </CardHeader>
      <CardContent>
        <WidgetBody
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          skeletonClassName="h-[300px] w-full"
        >
          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <AreaChart data={revenueData}>
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
                tickFormatter={(value: number) => {
                  if (currency === "NGN") {
                    return `₦${(value / 1000000).toFixed(0)}M`;
                  }
                  return `$${(value / 1000).toFixed(0)}k`;
                }}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value: number, name: string) => {
                  if (name === "revenueNGN" && currency === "NGN") {
                    return [
                      `₦${value.toLocaleString()}`,
                      "Revenue",
                    ];
                  }
                  if (name === "revenueUSD" && currency === "USD") {
                    return [
                      `$${value.toLocaleString()}`,
                      "Revenue",
                    ];
                  }
                  return [
                    value,
                    name,
                  ];
                }}
              />
              <Area
                type="monotone"
                dataKey={currency === "NGN" ? "revenueNGN" : "revenueUSD"}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </WidgetBody>
      </CardContent>
    </Card>
  );
}
