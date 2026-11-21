import { useQuery } from "@tanstack/react-query";
import { getSystemSimDataUsageQueryOptions } from "@truckmoov/api/auth";
import { Database } from "lucide-react";
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
import {
  CHART_TOOLTIP_STYLE,
  DATA_USAGE_REFRESH_MS,
  formatWeekdayLabel,
} from "./overviewFormat";
import { WidgetBody } from "./WidgetBody";

const MB_PER_GB = 1024;
const WEEK_DAYS = 7;

/** Weekly Data Usage (GB) — fleetflow's 7-day SIM data area chart, from live daily usage. */
export function DataUsageCard() {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    ...getSystemSimDataUsageQueryOptions(WEEK_DAYS),
    refetchInterval: DATA_USAGE_REFRESH_MS,
  });
  const dataUsageTrend = (data?.data.days ?? []).map(entry => ({
    day: formatWeekdayLabel(entry.day),
    usage: Math.round((entry.usageMb / MB_PER_GB) * 1000) / 1000,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Weekly Data Usage (GB)
            </CardTitle>
            <CardDescription>Total data consumed across all SIM cards</CardDescription>
          </div>

        </div>
      </CardHeader>
      <CardContent>
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
            <AreaChart data={dataUsageTrend}>
              <defs>
                <linearGradient
                  id="colorData"
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
                dataKey="day"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value: number) => [
                  `${value} GB`,
                  "Data Usage",
                ]}
              />
              <Area
                type="monotone"
                dataKey="usage"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorData)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </WidgetBody>
      </CardContent>
    </Card>
  );
}
