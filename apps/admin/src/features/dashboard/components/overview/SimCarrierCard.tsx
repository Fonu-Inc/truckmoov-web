import { useQuery } from "@tanstack/react-query";
import { getSystemSimCarrierBreakdownQueryOptions } from "@truckmoov/api/auth";
import { useState } from "react";
import { Eye, Wifi } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/shadcn/button";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { CHART_COLORS, CHART_TOOLTIP_STYLE, SNAPSHOT_RANGE_OPTIONS, toSnapshotPeriod } from "./overviewFormat";
import { RangeFilter } from "./RangeFilter";
import { WidgetBody } from "./WidgetBody";

export function SimCarrierCard() {
  const [days, setDays] = useState(0);
  const { data, isLoading, isError, refetch } = useQuery(getSystemSimCarrierBreakdownQueryOptions(toSnapshotPeriod(days)));
  const carriers = Object.entries(data?.data.byCarrier ?? {})
    .map(([name, value]) => ({ name, value }))
    .filter(carrier => carrier.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-primary" />
              SIM Cards by Carrier
            </CardTitle>
            <CardDescription>SIM inventory split across mobile network operators</CardDescription>
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
              <Link to="/sims">
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
          isEmpty={carriers.length === 0}
          emptyMessage="No SIMs in this period."
          skeletonClassName="h-[200px] w-full"
        >
          <div className="flex items-center gap-8">
            <ResponsiveContainer
              width="50%"
              height={200}
            >
              <PieChart>
                <Pie
                  data={carriers}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {carriers.map((carrier, index) => (
                    <Cell
                      key={carrier.name}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {carriers.map((carrier, index) => (
                <div
                  key={carrier.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{carrier.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{carrier.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </WidgetBody>
      </CardContent>
    </Card>
  );
}
