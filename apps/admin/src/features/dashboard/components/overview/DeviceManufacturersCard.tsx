import { useQuery } from "@tanstack/react-query";
import { getSystemDeviceManufacturersQueryOptions } from "@truckmoov/api/auth";
import { useState } from "react";
import { Eye, Server } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/shadcn/button";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { CHART_TOOLTIP_STYLE, SNAPSHOT_RANGE_OPTIONS, toSnapshotPeriod } from "./overviewFormat";
import { RangeFilter } from "./RangeFilter";
import { WidgetBody } from "./WidgetBody";

export function DeviceManufacturersCard() {
  const [days, setDays] = useState(0);
  const { data, isLoading, isError, refetch } = useQuery(getSystemDeviceManufacturersQueryOptions(toSnapshotPeriod(days)));
  const manufacturers = data?.data.manufacturers ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              Device Distribution by Manufacturer
            </CardTitle>
            <CardDescription>IoT devices grouped by hardware vendor</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <RangeFilter
              value={days}
              options={SNAPSHOT_RANGE_OPTIONS}
              onValueChange={setDays}
            />
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link to="/devices">
                <Eye className="h-4 w-4 mr-2" />
                Manage
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <WidgetBody
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          isEmpty={manufacturers.length === 0}
          emptyMessage="No devices in this period."
          skeletonClassName="h-[300px] w-full"
        >
          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <BarChart
              data={manufacturers}
              layout="vertical"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                type="number"
                allowDecimals={false}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                dataKey="manufacturer"
                type="category"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                width={90}
              />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar
                dataKey="count"
                name="Devices"
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </WidgetBody>
      </CardContent>
    </Card>
  );
}
