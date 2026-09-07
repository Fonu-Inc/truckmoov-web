import type { ChartDateRange } from "@/components/shadcn/chart-date-filter";
import { Users } from "lucide-react";
import { useState } from "react";
import {
  PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { ChartDateFilter } from "@/components/shadcn/chart-date-filter";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { getDummyEcoLeaderboard } from "@/lib/sustainabilityDummyData";
import { cn } from "@/lib/utils";

function getScoreBadge(score: number) {
  if (score >= 80)
    return <Badge className="bg-success/20 text-success border-success/30">Excellent</Badge>;
  if (score >= 60)
    return <Badge className="bg-warning/20 text-warning border-warning/30">Good</Badge>;
  if (score >= 40)
    return <Badge className="bg-warning/20 text-warning border-warning/30">Fair</Badge>;
  return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Poor</Badge>;
}

export default function EcoDrivingPage() {
  const ecoScores: any = { data: [] };
  const [
    leaderboardRange,
    setLeaderboardRange,
  ] = useState<ChartDateRange>("30d");
  const [
    breakdownRange,
    setBreakdownRange,
  ] = useState<ChartDateRange>("30d");
  const [
    leaderboardOpen,
    setLeaderboardOpen,
  ] = useState(false);

  const ecoLeaderboard = ecoScores.data?.map((s: any) => ({
    ...s,
    driverName: s.driver_id.slice(
      0,
      8,
    ),
  })) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Eco-Driving Leaderboard
            </CardTitle>
            <ChartDateFilter
              value={leaderboardRange}
              onValueChange={setLeaderboardRange}
              options={[
                "today",
                "yesterday",
                "7d",
                "30d",
                "90d",
              ]}
            />
          </div>
          <CardDescription className="text-xs">Top drivers ranked by eco-score and CO₂ saved.</CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const rows = ecoLeaderboard.length > 0 ? ecoLeaderboard : getDummyEcoLeaderboard(leaderboardRange);
            const top5 = rows.slice(
              0,
              5,
            );
            return (
              <div className="space-y-4">
                {top5.map((driver: any, i: number) => (
                  <div
                    key={driver.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <span className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      i === 0
                        ? "bg-warning/20 text-warning"
                        : i === 1
                          ? "bg-muted-foreground/20 text-muted-foreground"
                          : i === 2
                            ? "bg-warning/20 text-warning"
                            : "bg-muted text-muted-foreground",
                    )}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{driver.driverName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">{driver.eco_score.toFixed(0)}</span>
                          {getScoreBadge(driver.eco_score)}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {driver.co2_saved_kg.toFixed(1)}
                        {" "}
                        kg CO₂ saved ·
                        {driver.total_trips}
                        {" "}
                        trips
                      </p>
                    </div>
                  </div>
                ))}
                {rows.length > 5 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setLeaderboardOpen(true)}
                  >
                    View All (
                    {rows.length}
                    )
                  </Button>
                )}

                <Dialog
                  open={leaderboardOpen}
                  onOpenChange={setLeaderboardOpen}
                >
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Full Eco-Driving Leaderboard
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 mt-2">
                      {rows.map((driver: any, i: number) => (
                        <div
                          key={driver.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                        >
                          <span className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                            i === 0
                              ? "bg-warning/20 text-warning"
                              : i === 1
                                ? "bg-muted-foreground/20 text-muted-foreground"
                                : i === 2
                                  ? "bg-warning/20 text-warning"
                                  : "bg-muted text-muted-foreground",
                          )}
                          >
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-sm truncate">{driver.driverName}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-lg font-bold">{driver.eco_score.toFixed(0)}</span>
                                {getScoreBadge(driver.eco_score)}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {driver.co2_saved_kg.toFixed(1)}
                              {" "}
                              kg CO₂ saved ·
                              {driver.total_trips}
                              {" "}
                              trips
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1">
          <div className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Score Breakdown</CardTitle>
            <ChartDateFilter
              value={breakdownRange}
              onValueChange={setBreakdownRange}
              options={[
                "today",
                "yesterday",
                "7d",
                "30d",
                "90d",
              ]}
            />
          </div>
          <CardDescription className="text-xs">Top driver's performance across idling, acceleration, speed and fuel efficiency.</CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const rows = ecoLeaderboard.length > 0 ? ecoLeaderboard : getDummyEcoLeaderboard(breakdownRange);
            const top = rows[0];
            return (
              <ResponsiveContainer
                width="100%"
                height={300}
              >
                <RadarChart data={[
                  {
                    metric: "Idling", value: top?.idling_score || 0,
                  },
                  {
                    metric: "Acceleration", value: top?.acceleration_score || 0,
                  },
                  {
                    metric: "Speed", value: top?.speed_compliance_score || 0,
                  },
                  {
                    metric: "Fuel Efficiency", value: top?.fuel_efficiency_score || 0,
                  },
                  {
                    metric: "Overall", value: top?.eco_score || 0,
                  },
                ]}
                >
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <PolarRadiusAxis
                    domain={[
                      0,
                      100,
                    ]}
                    tick={{ fontSize: 10 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Radar
                    dataKey="value"
                    stroke="hsl(142 71% 45%)"
                    fill="hsl(142 71% 45%)"
                    fillOpacity={0.2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
