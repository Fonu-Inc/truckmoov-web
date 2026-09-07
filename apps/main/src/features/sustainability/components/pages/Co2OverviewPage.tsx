import type { ChartDateRange } from "@/components/shadcn/chart-date-filter";
import { BarChart3 } from "lucide-react";
import { useState } from "react";
import {
  CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { ChartDateFilter } from "@/components/shadcn/chart-date-filter";
import { Progress } from "@/components/shadcn/progress";
import {
  FUEL_TYPE_COLORS, FUEL_TYPE_LABELS,
} from "@/features/sustainability/utils/fuelTypes";
import {
  getDummyFuelComposition, getDummyTrend, getDummyVehicleRankings,
} from "@/lib/sustainabilityDummyData";
import { cn } from "@/lib/utils";

export default function Co2OverviewPage() {
  const co2Logs: any = { data: [] };
  const emissionProfiles: any = { data: [] };
  const vehicles: any[] = [];
  const trendData: any[] = [];
  const [trendRange] = useState<ChartDateRange>("30d");
  const [
    fuelRange,
    setFuelRange,
  ] = useState<ChartDateRange>("30d");
  const [
    rankingsRange,
    setRankingsRange,
  ] = useState<ChartDateRange>("30d");

  const fuelComposition = emissionProfiles.data?.reduce(
    (acc: Record<string, number>, p: any) => {
      acc[p.fuel_type] = (acc[p.fuel_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  ) || {};

  const pieData = Object.entries(fuelComposition).map(([
    key,
    value,
  ]) => ({
    name: FUEL_TYPE_LABELS[key] || key,
    value,
    color: FUEL_TYPE_COLORS[key] || "#94a3b8",
  }));

  const vehicleCo2 = co2Logs.data?.reduce(
    (acc: Record<string, {
      co2: number; distance: number;
    }>, l: any) => {
      if (!acc[l.vehicle_id]) {
        acc[l.vehicle_id] = {
          co2: 0, distance: 0,
        };
      }
      acc[l.vehicle_id].co2 += Number(l.co2_emitted_kg);
      acc[l.vehicle_id].distance += Number(l.distance_km);
      return acc;
    },
    {} as Record<string, {
      co2: number; distance: number;
    }>,
  ) || {};

  const vehicleRankings = (Object.entries(vehicleCo2) as [string, {
    co2: number; distance: number;
  }][])
    .map(([
      id,
      data,
    ]) => ({
      id,
      name: vehicles?.find(v => v.id === id)?.registrationNumber || id.slice(
        0,
        8,
      ),
      co2: data.co2,
      distance: data.distance,
      co2PerKm: data.distance > 0 ? data.co2 / data.distance : 0,
    }))
    .sort((a, b) => b.co2 - a.co2);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-medium">Daily CO₂ Emissions Trend</CardTitle>
            <CardDescription className="text-xs">Total CO₂ emitted by the fleet each day in the selected range.</CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const data = trendData.length > 0 ? trendData : getDummyTrend(trendRange);
              return (
                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <LineChart data={data}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
                      }}
                      formatter={(value: number) => [
                        `${value.toFixed(2)} kg`,
                        "CO₂",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="co2"
                      stroke="hsl(142 71% 45%)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              );
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <div className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Fleet Fuel Composition</CardTitle>
              <ChartDateFilter
                value={fuelRange}
                onValueChange={setFuelRange}
                options={[
                  "today",
                  "yesterday",
                  "7d",
                  "30d",
                  "90d",
                ]}
              />
            </div>
            <CardDescription className="text-xs">Share of fuel consumed across diesel, petrol, hybrid and EV vehicles.</CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const data = pieData.length > 0 ? pieData : getDummyFuelComposition(fuelRange);
              return (
                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={({
                        name, value,
                      }) => `${name}: ${value}`}
                    >
                      {data.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.color}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <div className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Vehicle Emission Rankings
            </CardTitle>
            <ChartDateFilter
              value={rankingsRange}
              onValueChange={setRankingsRange}
              options={[
                "today",
                "yesterday",
                "7d",
                "30d",
                "90d",
              ]}
            />
          </div>
          <CardDescription className="text-xs">Vehicles ranked by total CO₂ emitted, highest first.</CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const rows = vehicleRankings.length > 0 ? vehicleRankings : getDummyVehicleRankings(rankingsRange);
            const top = rows[0];
            return (
              <div className="space-y-3">
                {rows.slice(
                  0,
                  10,
                ).map((v, i) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-3"
                  >
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      i === 0
                        ? "bg-destructive/20 text-destructive"
                        : i < 3
                          ? "bg-warning/20 text-warning"
                          : "bg-muted text-muted-foreground",
                    )}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{v.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {v.co2.toFixed(1)}
                          {" "}
                          kg CO₂ ·
                          {(v.co2PerKm * 1000).toFixed(0)}
                          {" "}
                          g/km
                        </span>
                      </div>
                      <Progress
                        value={top ? (v.co2 / top.co2) * 100 : 0}
                        className="h-1.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
