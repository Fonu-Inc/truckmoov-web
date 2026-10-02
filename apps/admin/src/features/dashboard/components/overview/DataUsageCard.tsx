import { useQuery } from "@tanstack/react-query";
import { getSystemSimDataUsageQueryOptions } from "@truckmoov/api/auth";
import { Database } from "lucide-react";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { CHART_TOOLTIP_STYLE, DATA_USAGE_REFRESH_MS, formatDayLabel } from "./overviewFormat";
import { RangeFilter } from "./RangeFilter";
import type { RangeOption } from "./RangeFilter";
import { WidgetBody } from "./WidgetBody";

const MB_PER_GB = 1024;
const WEEK_DAYS = 7;
const DAY_OPTIONS: RangeOption[] = [
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
  { value: 30, label: "Last 30 days" },
];

export function DataUsageCard() {
  const [days, setDays] = useState(WEEK_DAYS);
  const { data, isLoading, isError, refetch } = useQuery({
    ...getSystemSimDataUsageQueryOptions(days),
    refetchInterval: DATA_USAGE_REFRESH_MS,
  });
  const series = (data?.data.days ?? []).map(entry => ({
    label: formatDayLabel(entry.day, days <= WEEK_DAYS),
    usageGb: Math.round((entry.usageMb / MB_PER_GB) * 1000) / 1000,
  }));
  const hasUsage = series.some(entry => entry.usageGb > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              {days === WEEK_DAYS ? "Weekly Data Usage (GB)" : `Data Usage, last ${days} days (GB)`}
            </CardTitle>
            <CardDescription>Total data consumed across all SIM cards</CardDescription>
          </div>
          <RangeFilter
            value={days}
            options={DAY_OPTIONS}
            onValueChange={setDays}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <WidgetBody
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          skeletonClassName="h-[200px] w-full"
        >
          <ResponsiveContainer
            width="100%"
            height={200}
          >
            <AreaChart data={series}>
              <defs>
                <linearGradient
                  id="usageGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--success))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--success))"
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
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                allowDecimals
                domain={[0, (max: number) => Math.max(max, 1)]}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value: number) => [`${value} GB`, "Data Usage"]}
              />
              <Area
                type="monotone"
                dataKey="usageGb"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#usageGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </WidgetBody>
        {!isLoading && !isError && !hasUsage && (
          <p className="text-xs text-muted-foreground">Usage is recorded from SIM data; carrier feed pending</p>
        )}
      </CardContent>
    </Card>
  );
}
