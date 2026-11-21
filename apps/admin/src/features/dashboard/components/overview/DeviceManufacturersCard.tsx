import type { SystemSnapshotPeriod } from "@truckmoov/api/auth";
import type { ChartDateRange } from "@/components/shadcn/chart-date-filter";
import { useQuery } from "@tanstack/react-query";
import { getSystemDeviceManufacturersQueryOptions } from "@truckmoov/api/auth";
import {
  Eye,
  Server,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { ChartDateFilter } from "@/components/shadcn/chart-date-filter";
import { CHART_TOOLTIP_STYLE } from "./overviewFormat";
import { WidgetBody } from "./WidgetBody";

// The manufacturers endpoint only takes 7d / 30d / 90d windows, so "Today" / "Yesterday" are not offered.
const RANGE_OPTIONS: ChartDateRange[] = [
  "7d",
  "30d",
  "90d",
];

/** Device Distribution by Manufacturer — fleetflow's vendor bar chart, from live device counts. */
export function DeviceManufacturersCard() {
  const navigate = useNavigate();
  const [
    deviceChartRange,
    setDeviceChartRange,
  ] = useState<ChartDateRange>("30d");
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery(getSystemDeviceManufacturersQueryOptions(deviceChartRange as SystemSnapshotPeriod));
  const deviceStats = data?.data.manufacturers ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              Device Distribution by Manufacturer
            </CardTitle>
            <CardDescription>Breakdown of provisioned IoT devices grouped by hardware vendor</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <ChartDateFilter
              value={deviceChartRange}
              onValueChange={setDeviceChartRange}
              options={RANGE_OPTIONS}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/devices")}
            >
              <Eye className="h-4 w-4 mr-2" />
              Manage
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <WidgetBody
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          isEmpty={deviceStats.length === 0}
          emptyMessage="No devices in this period."
          skeletonClassName="h-[300px] w-full"
        >
          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <BarChart
              data={deviceStats}
              layout="vertical"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                dataKey="manufacturer"
                type="category"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                width={80}
              />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[
                  0,
                  4,
                  4,
                  0,
                ]}
              />
            </BarChart>
          </ResponsiveContainer>
        </WidgetBody>
      </CardContent>
    </Card>
  );
}
