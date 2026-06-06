import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { Badge } from "@/components/shadcn/badge";
import { Progress } from "@/components/shadcn/progress";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/shadcn/dialog";
import { ExportButton } from "@/components/shadcn/export-button";
import { PlatformFilterPopover, buildEmptyDraft, type FilterDraft, type FilterField } from "@/components/shadcn/platform-filter-popover";
import { Search } from "lucide-react";
import { useDrivers } from "@/hooks/useDrivers";
import { useAuthStore } from "@/stores/authStore";
import {
  Leaf, TrendingDown, Zap, Car, Fuel, TreePine,
  BarChart3, Users, Target, Battery, ChevronUp, ChevronDown,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChartDateFilter, type ChartDateRange } from "@/components/shadcn/chart-date-filter";
import {
  getDummyTrend,
  getDummyFuelComposition,
  getDummyVehicleRankings,
  getDummyEcoLeaderboard,
  getDummyChargingSessions,
} from "@/lib/sustainabilityDummyData";

const FUEL_TYPE_COLORS: Record<string, string> = {
  diesel: '#ef4444',
  petrol: '#f97316',
  cng: '#eab308',
  lpg: '#84cc16',
  electric: '#22c55e',
  hybrid_diesel: '#06b6d4',
  hybrid_petrol: '#8b5cf6',
};

const FUEL_TYPE_LABELS: Record<string, string> = {
  diesel: 'Diesel',
  petrol: 'Petrol',
  cng: 'CNG',
  lpg: 'LPG',
  electric: 'Electric',
  hybrid_diesel: 'Hybrid (Diesel)',
  hybrid_petrol: 'Hybrid (Petrol)',
};

export default function Sustainability() {
  const { user } = useAuthStore();
  const co2Logs: any = { data: [] };
  const emissionProfiles: any = { data: [] };
  const ecoScores: any = { data: [] };
  const targets: any = { data: null };
  const evSessions: any = { data: [] };
  const saveTarget = { mutate: async (...args: any[]) => {}, isPending: false };
  const totalCo2 = 0;
  const totalDistance = 0;
  const avgCo2PerKm = 0;
  const evCount = 0;
  const totalProfiled = 0;
  const trendData: any[] = [];
  const vehicles: any[] = [];
  const { drivers } = useDrivers();
  const [activeTab, setActiveTab] = useState("overview");
  const [trendRange, setTrendRange] = useState<ChartDateRange>("30d");
  const [fuelRange, setFuelRange] = useState<ChartDateRange>("30d");
  const [rankingsRange, setRankingsRange] = useState<ChartDateRange>("30d");
  const [leaderboardRange, setLeaderboardRange] = useState<ChartDateRange>("30d");
  const [breakdownRange, setBreakdownRange] = useState<ChartDateRange>("30d");
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  // Charging sessions toolbar
  const sessionsFilterFields: FilterField[] = [
    { key: "energy", label: "Energy (kWh)", type: "range", fromPlaceholder: "Min", toPlaceholder: "Max" },
    { key: "duration", label: "Duration (min)", type: "range", fromPlaceholder: "Min", toPlaceholder: "Max" },
    {
      key: "type", label: "Charging Type", type: "select",
      options: [
        { value: "DC Fast", label: "DC Fast" },
        { value: "AC Level 2", label: "AC Level 2" },
        { value: "AC Level 1", label: "AC Level 1" },
      ],
    },
  ];
  const [sessionsSearch, setSessionsSearch] = useState("");
  const [sessionsFilters, setSessionsFilters] = useState<FilterDraft>(buildEmptyDraft(sessionsFilterFields));

  // Fleet composition by fuel type
  const fuelComposition = emissionProfiles.data?.reduce((acc, p) => {
    acc[p.fuel_type] = (acc[p.fuel_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const pieData = Object.entries(fuelComposition).map(([key, value]) => ({
    name: FUEL_TYPE_LABELS[key] || key,
    value,
    color: FUEL_TYPE_COLORS[key] || '#94a3b8',
  }));

  // Top polluters
  const vehicleCo2 = co2Logs.data?.reduce((acc, l) => {
    if (!acc[l.vehicle_id]) acc[l.vehicle_id] = { co2: 0, distance: 0 };
    acc[l.vehicle_id].co2 += Number(l.co2_emitted_kg);
    acc[l.vehicle_id].distance += Number(l.distance_km);
    return acc;
  }, {} as Record<string, { co2: number; distance: number }>) || {};

  const vehicleRankings = Object.entries(vehicleCo2)
    .map(([id, data]) => ({
      id,
      name: vehicles?.find(v => v.id === id)?.registrationNumber || id.slice(0, 8),
      co2: data.co2,
      distance: data.distance,
      co2PerKm: data.distance > 0 ? data.co2 / data.distance : 0,
    }))
    .sort((a, b) => b.co2 - a.co2);

  // Eco driving leaderboard
  const ecoLeaderboard = ecoScores.data?.map(s => ({
    ...s,
    driverName: drivers?.find(d => d.id === s.driver_id)?.name || s.driver_id.slice(0, 8),
  })) || [];

  // Target progress
  const targetData = targets.data;
  const co2Progress = targetData?.baseline_co2_kg_per_month && targetData?.target_co2_kg_per_month
    ? Math.min(100, Math.max(0, ((targetData.baseline_co2_kg_per_month - totalCo2) / (targetData.baseline_co2_kg_per_month - targetData.target_co2_kg_per_month)) * 100))
    : 0;

  const evAdoptionProgress = totalProfiled > 0
    ? (evCount / totalProfiled) * 100
    : 0;

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Good</Badge>;
    if (score >= 40) return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Fair</Badge>;
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Poor</Badge>;
  };

  // Trees equivalent (1 tree absorbs ~22kg CO2/year)
  const treesEquivalent = Math.round((totalCo2 * 12) / 22);

  return (
    <DashboardLayout title="Sustainability & Environment">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Leaf className="h-6 w-6 text-green-500" />
              Sustainability Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your fleet's environmental impact and progress toward sustainability goals
            </p>
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <TrendingDown className="h-6 w-6 text-red-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">CO₂ Emitted (30d)</p>
                  <p className="text-2xl font-bold">{totalCo2.toFixed(1)} kg</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(totalCo2 / 1000).toFixed(2)} tonnes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                  <Fuel className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">Avg CO₂/km</p>
                  <p className="text-2xl font-bold">{(avgCo2PerKm * 1000).toFixed(0)} g/km</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalDistance.toFixed(0)} km total
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <Zap className="h-6 w-6 text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">EV/Zero Emission</p>
                  <p className="text-2xl font-bold">{evCount} / {totalProfiled}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {evAdoptionProgress.toFixed(1)}% adoption
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <TreePine className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">Trees to Offset</p>
                  <p className="text-2xl font-bold">{treesEquivalent}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    trees/year equivalent
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">CO₂ Overview</TabsTrigger>
            <TabsTrigger value="eco-scores">Eco-Driving</TabsTrigger>
            <TabsTrigger value="ev-fleet">EV Fleet</TabsTrigger>
            <TabsTrigger value="targets">Targets</TabsTrigger>
          </TabsList>

          {/* CO₂ Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* CO₂ Trend Chart */}
              <Card className="lg:col-span-2">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-sm font-medium">Daily CO₂ Emissions Trend</CardTitle>
                  <CardDescription className="text-xs">Total CO₂ emitted by the fleet each day in the selected range.</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const data = trendData.length > 0 ? trendData : getDummyTrend(trendRange);
                    return (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip
                            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                            formatter={(value: number) => [`${value.toFixed(2)} kg`, 'CO₂']}
                          />
                          <Line type="monotone" dataKey="co2" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Fleet Composition Pie */}
              <Card>
                <CardHeader className="space-y-1">
                  <div className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium">Fleet Fuel Composition</CardTitle>
                    <ChartDateFilter value={fuelRange} onValueChange={setFuelRange} options={["today","yesterday","7d","30d","90d"]} />
                  </div>
                  <CardDescription className="text-xs">Share of fuel consumed across diesel, petrol, hybrid and EV vehicles.</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const data = pieData.length > 0 ? pieData : getDummyFuelComposition(fuelRange);
                    return (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                            {data.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
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

            {/* Vehicle CO₂ Rankings */}
            <Card>
              <CardHeader className="space-y-1">
                <div className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Vehicle Emission Rankings
                  </CardTitle>
                  <ChartDateFilter value={rankingsRange} onValueChange={setRankingsRange} options={["today","yesterday","7d","30d","90d"]} />
                </div>
                <CardDescription className="text-xs">Vehicles ranked by total CO₂ emitted, highest first.</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const rows = vehicleRankings.length > 0 ? vehicleRankings : getDummyVehicleRankings(rankingsRange);
                  const top = rows[0];
                  return (
                    <div className="space-y-3">
                      {rows.slice(0, 10).map((v, i) => (
                        <div key={v.id} className="flex items-center gap-3">
                          <span className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                            i === 0 ? "bg-destructive/20 text-destructive" :
                            i < 3 ? "bg-orange-500/20 text-orange-400" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {i + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{v.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {v.co2.toFixed(1)} kg CO₂ · {(v.co2PerKm * 1000).toFixed(0)} g/km
                              </span>
                            </div>
                            <Progress value={top ? (v.co2 / top.co2) * 100 : 0} className="h-1.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Eco-Driving Tab */}
          <TabsContent value="eco-scores" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Leaderboard */}
              <Card>
                <CardHeader className="space-y-1">
                  <div className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Eco-Driving Leaderboard
                    </CardTitle>
                    <ChartDateFilter value={leaderboardRange} onValueChange={setLeaderboardRange} options={["today","yesterday","7d","30d","90d"]} />
                  </div>
                  <CardDescription className="text-xs">Top drivers ranked by eco-score and CO₂ saved.</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const rows = ecoLeaderboard.length > 0 ? ecoLeaderboard : getDummyEcoLeaderboard(leaderboardRange);
                    const top5 = rows.slice(0, 5);
                    return (
                      <div className="space-y-4">
                        {top5.map((driver, i) => (
                          <div key={driver.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                            <span className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                              i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                              i === 1 ? "bg-gray-400/20 text-gray-300" :
                              i === 2 ? "bg-amber-700/20 text-amber-500" :
                              "bg-muted text-muted-foreground"
                            )}>
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
                                {driver.co2_saved_kg.toFixed(1)} kg CO₂ saved · {driver.total_trips} trips
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
                            View All ({rows.length})
                          </Button>
                        )}

                        <Dialog open={leaderboardOpen} onOpenChange={setLeaderboardOpen}>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Full Eco-Driving Leaderboard
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 mt-2">
                              {rows.map((driver, i) => (
                                <div key={driver.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                                  <span className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                                    i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                                    i === 1 ? "bg-gray-400/20 text-gray-300" :
                                    i === 2 ? "bg-amber-700/20 text-amber-500" :
                                    "bg-muted text-muted-foreground"
                                  )}>
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
                                      {driver.co2_saved_kg.toFixed(1)} kg CO₂ saved · {driver.total_trips} trips
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

              {/* Radar chart for top driver */}
              <Card>
                <CardHeader className="space-y-1">
                  <div className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium">Score Breakdown</CardTitle>
                    <ChartDateFilter value={breakdownRange} onValueChange={setBreakdownRange} options={["today","yesterday","7d","30d","90d"]} />
                  </div>
                  <CardDescription className="text-xs">Top driver's performance across idling, acceleration, speed and fuel efficiency.</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const rows = ecoLeaderboard.length > 0 ? ecoLeaderboard : getDummyEcoLeaderboard(breakdownRange);
                    const top = rows[0];
                    return (
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={[
                          { metric: 'Idling', value: top?.idling_score || 0 },
                          { metric: 'Acceleration', value: top?.acceleration_score || 0 },
                          { metric: 'Speed', value: top?.speed_compliance_score || 0 },
                          { metric: 'Fuel Efficiency', value: top?.fuel_efficiency_score || 0 },
                          { metric: 'Overall', value: top?.eco_score || 0 },
                        ]}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <Radar dataKey="value" stroke="hsl(142 71% 45%)" fill="hsl(142 71% 45%)" fillOpacity={0.2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* EV Fleet Tab */}
          <TabsContent value="ev-fleet" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Battery className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">EV Vehicles</p>
                      <p className="text-xl font-bold">{evCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Zap className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Charging Sessions</p>
                      <p className="text-xl font-bold">{evSessions.data?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Fuel className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Energy</p>
                      <p className="text-xl font-bold">
                        {(evSessions.data?.reduce((s, e) => s + (Number(e.energy_kwh) || 0), 0) || 0).toFixed(1)} kWh
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              {(() => {
                const sourceRows = evSessions.data && evSessions.data.length > 0
                  ? evSessions.data.map(s => ({
                      id: s.id,
                      vehicleName: vehicles?.find(v => v.id === s.vehicle_id)?.registrationNumber || s.vehicle_id.slice(0, 8),
                      charging_station: s.charging_station,
                      start_soc_percent: s.start_soc_percent,
                      end_soc_percent: s.end_soc_percent,
                      energy_kwh: s.energy_kwh,
                      duration_minutes: s.duration_minutes,
                      charging_type: s.charging_type,
                    }))
                  : getDummyChargingSessions(12);

                const energyMin = sessionsFilters.energy?.enabled ? Number(sessionsFilters.energy.from) : null;
                const energyMax = sessionsFilters.energy?.enabled ? Number(sessionsFilters.energy.to) : null;
                const durMin = sessionsFilters.duration?.enabled ? Number(sessionsFilters.duration.from) : null;
                const durMax = sessionsFilters.duration?.enabled ? Number(sessionsFilters.duration.to) : null;
                const typeVal = sessionsFilters.type?.enabled ? sessionsFilters.type.value : null;
                const q = sessionsSearch.trim().toLowerCase();

                const filtered = sourceRows.filter(s => {
                  if (q && !`${s.vehicleName} ${s.charging_station ?? ""}`.toLowerCase().includes(q)) return false;
                  const e = Number(s.energy_kwh) || 0;
                  if (energyMin != null && !Number.isNaN(energyMin) && e < energyMin) return false;
                  if (energyMax != null && !Number.isNaN(energyMax) && e > energyMax) return false;
                  const d = Number(s.duration_minutes) || 0;
                  if (durMin != null && !Number.isNaN(durMin) && d < durMin) return false;
                  if (durMax != null && !Number.isNaN(durMax) && d > durMax) return false;
                  if (typeVal && s.charging_type !== typeVal) return false;
                  return true;
                });

                return (
                  <>
                    <CardHeader className="space-y-1">
                      <div className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Recent Charging Sessions</CardTitle>
                        <ExportButton
                          rows={filtered}
                          filename="charging-sessions"
                          columns={[
                            { header: "Vehicle", accessor: (r) => r.vehicleName },
                            { header: "Station", accessor: (r) => r.charging_station ?? "" },
                            { header: "Start SOC %", accessor: (r) => r.start_soc_percent ?? "" },
                            { header: "End SOC %", accessor: (r) => r.end_soc_percent ?? "" },
                            { header: "Energy (kWh)", accessor: (r) => r.energy_kwh ?? "" },
                            { header: "Duration (min)", accessor: (r) => r.duration_minutes ?? "" },
                            { header: "Type", accessor: (r) => r.charging_type ?? "" },
                          ]}
                        />
                      </div>
                      <CardDescription className="text-xs">Latest EV charging activity across stations and vehicles.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search by vehicle or station..."
                            value={sessionsSearch}
                            onChange={(e) => setSessionsSearch(e.target.value)}
                            className="pl-8 h-9"
                          />
                        </div>
                        <PlatformFilterPopover
                          entity="charging sessions"
                          fields={sessionsFilterFields}
                          value={sessionsFilters}
                          onApply={setSessionsFilters}
                          onReset={() => setSessionsFilters(buildEmptyDraft(sessionsFilterFields))}
                        />
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 text-muted-foreground font-medium">Vehicle</th>
                              <th className="text-left py-2 text-muted-foreground font-medium">Station</th>
                              <th className="text-right py-2 text-muted-foreground font-medium">SOC</th>
                              <th className="text-right py-2 text-muted-foreground font-medium">Energy</th>
                              <th className="text-right py-2 text-muted-foreground font-medium">Duration</th>
                              <th className="text-right py-2 text-muted-foreground font-medium">Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.slice(0, 15).map(s => (
                              <tr key={s.id} className="border-b border-border/50">
                                <td className="py-2">{s.vehicleName}</td>
                                <td className="py-2">{s.charging_station || '-'}</td>
                                <td className="py-2 text-right">{s.start_soc_percent?.toFixed(0)}% → {s.end_soc_percent?.toFixed(0)}%</td>
                                <td className="py-2 text-right">{s.energy_kwh?.toFixed(1)} kWh</td>
                                <td className="py-2 text-right">{s.duration_minutes} min</td>
                                <td className="py-2 text-right">
                                  <Badge variant="outline" className="text-xs">{s.charging_type}</Badge>
                                </td>
                              </tr>
                            ))}
                            {filtered.length === 0 && (
                              <tr><td colSpan={6} className="py-6 text-center text-muted-foreground text-xs">No sessions match your filters</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </>
                );
              })()}
            </Card>
          </TabsContent>

          {/* Targets Tab */}
          <TabsContent value="targets" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    CO₂ Reduction Target
                  </CardTitle>
                  <CardDescription className="text-xs">Progress toward your monthly CO₂ reduction goal.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const display = targetData ?? {
                      baseline_co2_kg_per_month: 5200,
                      target_co2_kg_per_month: 3640,
                      target_co2_reduction_percent: 30,
                      target_year: 2030,
                      ev_adoption_target_percent: 35,
                    };
                    const displayCurrentCo2 = totalCo2 > 0 ? totalCo2 : 4180;
                    const displayProgress = display.baseline_co2_kg_per_month && display.target_co2_kg_per_month
                      ? Math.min(100, Math.max(0, ((display.baseline_co2_kg_per_month - displayCurrentCo2) / (display.baseline_co2_kg_per_month - display.target_co2_kg_per_month)) * 100))
                      : 0;
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Current monthly CO₂</span>
                          <span className="font-medium">{displayCurrentCo2.toFixed(1)} kg</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Baseline</span>
                          <span>{display.baseline_co2_kg_per_month?.toFixed(0) || '—'} kg/month</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Target</span>
                          <span className="text-green-400">{display.target_co2_kg_per_month?.toFixed(0) || '—'} kg/month</span>
                        </div>
                        <Progress value={displayProgress} className="h-3 mt-2" />
                        <p className="text-xs text-muted-foreground text-center">
                          {displayProgress.toFixed(1)}% progress toward {display.target_co2_reduction_percent}% reduction by {display.target_year}
                        </p>
                        {!targetData && (
                          <p className="text-[10px] text-muted-foreground text-center italic pt-1">
                            Sample targets shown — configure below to set your own.
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    EV Adoption Progress
                  </CardTitle>
                  <CardDescription className="text-xs">Share of electric vehicles in your fleet versus your adoption target.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const evTarget = targetData?.ev_adoption_target_percent || 35;
                    const displayEvCount = totalProfiled > 0 ? evCount : 12;
                    const displayTotal = totalProfiled > 0 ? totalProfiled : 48;
                    const displayRate = displayTotal > 0 ? (displayEvCount / displayTotal) * 100 : 0;
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Current EV fleet</span>
                          <span className="font-medium">{displayEvCount} / {displayTotal} vehicles</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Current rate</span>
                          <span>{displayRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Target</span>
                          <span className="text-green-400">{evTarget}%</span>
                        </div>
                        <Progress
                          value={evTarget ? (displayRate / evTarget) * 100 : 0}
                          className="h-3 mt-2"
                        />
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* Set Targets Form */}
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-sm font-medium">Set Sustainability Targets</CardTitle>
                <CardDescription className="text-xs">Configure baseline, CO₂ reduction and EV adoption targets for your fleet.</CardDescription>
              </CardHeader>
              <CardContent>
                <TargetsForm
                  existing={targetData}
                  tenantId={user?.tenantId || ''}
                  onSave={(data) => saveTarget.mutate(data)}
                  isSaving={saveTarget.isPending}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function TargetsForm({
  existing,
  tenantId,
  onSave,
  isSaving,
}: {
  existing: any;
  tenantId: string;
  onSave: (data: any) => void;
  isSaving: boolean;
}) {
  const [baseline, setBaseline] = useState(existing?.baseline_co2_kg_per_month?.toString() || '');
  const [target, setTarget] = useState(existing?.target_co2_kg_per_month?.toString() || '');
  const [reduction, setReduction] = useState(existing?.target_co2_reduction_percent?.toString() || '20');
  const [targetYear, setTargetYear] = useState(existing?.target_year?.toString() || '2030');
  const [evTarget, setEvTarget] = useState(existing?.ev_adoption_target_percent?.toString() || '30');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Baseline CO₂ (kg/month)</Label>
        <Input type="number" value={baseline} onChange={e => setBaseline(e.target.value)} placeholder="e.g. 5000" />
      </div>
      <div className="space-y-2">
        <Label>Target CO₂ (kg/month)</Label>
        <Input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="e.g. 3500" />
      </div>
      <div className="space-y-2">
        <Label>Reduction Target (%)</Label>
        <Input type="number" value={reduction} onChange={e => setReduction(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Target Year</Label>
        <Input type="number" value={targetYear} onChange={e => setTargetYear(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>EV Adoption Target (%)</Label>
        <Input type="number" value={evTarget} onChange={e => setEvTarget(e.target.value)} />
      </div>
      <div className="flex items-end">
        <Button
          onClick={() => onSave({
            tenant_id: tenantId,
            baseline_co2_kg_per_month: baseline ? Number(baseline) : null,
            target_co2_kg_per_month: target ? Number(target) : null,
            target_co2_reduction_percent: Number(reduction),
            target_year: Number(targetYear),
            ev_adoption_target_percent: Number(evTarget),
          })}
          disabled={isSaving}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSaving ? 'Saving...' : 'Save Targets'}
        </Button>
      </div>
    </div>
  );
}
