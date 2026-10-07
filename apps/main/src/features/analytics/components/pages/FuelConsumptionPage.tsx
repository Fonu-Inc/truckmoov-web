import type { FleetFuelReport } from "@truckmoov/api/fleet";
import type { ChartPeriod } from "@/features/analytics/components/ui/ChartPeriodFilter";
import { useQuery } from "@tanstack/react-query";
import { getFleetFuelReportQueryOptions } from "@truckmoov/api/fleet";
import {
  DollarSign, Fuel, Search, SlidersHorizontal, TrendingUp, Truck,
} from "lucide-react";
import { useState } from "react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import { AnalyticsGate } from "@/features/analytics/components/ui/AnalyticsGate";
import { ChartPeriodFilter } from "@/features/analytics/components/ui/ChartPeriodFilter";
import { ExportCsvButton } from "@/features/analytics/components/ui/ExportCsvButton";
import {
  periodLabel, periodToRange,
} from "@/features/analytics/utils/period";
import { formatCurrency } from "@/lib/currency";

export default function FuelConsumptionPage() {
  const [
    chartPeriod,
    setChartPeriod,
  ] = useState<ChartPeriod>("30d");
  const query = useQuery(getFleetFuelReportQueryOptions({ params: periodToRange(chartPeriod) }));
  const report = query.data?.data;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Fuel Consumption Report</h3>
          <p className="text-sm text-muted-foreground">
            {periodLabel(chartPeriod)}
            {" · recorded fuel transactions; distance is the odometer movement between fills"}
          </p>
        </div>
        <ChartPeriodFilter
          value={chartPeriod}
          onChange={setChartPeriod}
        />
      </div>
      <AnalyticsGate
        isPending={query.isPending}
        isError={query.isError}
        onRetry={() => query.refetch()}
        hasData
      >
        {report && (
          <div className={query.isPlaceholderData ? "opacity-60 transition-opacity" : undefined}>
            <FuelConsumptionReport report={report} />
          </div>
        )}
      </AnalyticsGate>
    </div>
  );
}

function FuelConsumptionReport({ report }: { report: FleetFuelReport }) {
  const [
    fuelSearch,
    setFuelSearch,
  ] = useState("");
  const [
    fuelFilterOpen,
    setFuelFilterOpen,
  ] = useState(false);
  const [
    fuelTypeEnabled,
    setFuelTypeEnabled,
  ] = useState(false);
  const [
    fuelTypeVal,
    setFuelTypeVal,
  ] = useState<string>("all");
  const [
    costEnabled,
    setCostEnabled,
  ] = useState(false);
  const [
    costMin,
    setCostMin,
  ] = useState("");
  const [
    costMax,
    setCostMax,
  ] = useState("");
  const [
    distEnabled,
    setDistEnabled,
  ] = useState(false);
  const [
    distMin,
    setDistMin,
  ] = useState("");
  const [
    distMax,
    setDistMax,
  ] = useState("");
  const [
    effEnabled,
    setEffEnabled,
  ] = useState(false);
  const [
    effMin,
    setEffMin,
  ] = useState("");
  const [
    effMax,
    setEffMax,
  ] = useState("");
  const [
    tripsEnabled,
    setTripsEnabled,
  ] = useState(false);
  const [
    tripsMin,
    setTripsMin,
  ] = useState("");
  const [
    tripsMax,
    setTripsMax,
  ] = useState("");
  const [
    dFuelTypeEnabled,
    setDFuelTypeEnabled,
  ] = useState(false);
  const [
    dFuelTypeVal,
    setDFuelTypeVal,
  ] = useState<string>("all");
  const [
    dCostEnabled,
    setDCostEnabled,
  ] = useState(false);
  const [
    dCostMin,
    setDCostMin,
  ] = useState("");
  const [
    dCostMax,
    setDCostMax,
  ] = useState("");
  const [
    dDistEnabled,
    setDDistEnabled,
  ] = useState(false);
  const [
    dDistMin,
    setDDistMin,
  ] = useState("");
  const [
    dDistMax,
    setDDistMax,
  ] = useState("");
  const [
    dEffEnabled,
    setDEffEnabled,
  ] = useState(false);
  const [
    dEffMin,
    setDEffMin,
  ] = useState("");
  const [
    dEffMax,
    setDEffMax,
  ] = useState("");
  const [
    dTripsEnabled,
    setDTripsEnabled,
  ] = useState(false);
  const [
    dTripsMin,
    setDTripsMin,
  ] = useState("");
  const [
    dTripsMax,
    setDTripsMax,
  ] = useState("");

  const openFuelFilter = () => {
    setDFuelTypeEnabled(fuelTypeEnabled);
    setDFuelTypeVal(fuelTypeVal);
    setDCostEnabled(costEnabled);
    setDCostMin(costMin);
    setDCostMax(costMax);
    setDDistEnabled(distEnabled);
    setDDistMin(distMin);
    setDDistMax(distMax);
    setDEffEnabled(effEnabled);
    setDEffMin(effMin);
    setDEffMax(effMax);
    setDTripsEnabled(tripsEnabled);
    setDTripsMin(tripsMin);
    setDTripsMax(tripsMax);
    setFuelFilterOpen(true);
  };
  const applyFuelFilter = () => {
    setFuelTypeEnabled(dFuelTypeEnabled);
    setFuelTypeVal(dFuelTypeVal);
    setCostEnabled(dCostEnabled);
    setCostMin(dCostMin);
    setCostMax(dCostMax);
    setDistEnabled(dDistEnabled);
    setDistMin(dDistMin);
    setDistMax(dDistMax);
    setEffEnabled(dEffEnabled);
    setEffMin(dEffMin);
    setEffMax(dEffMax);
    setTripsEnabled(dTripsEnabled);
    setTripsMin(dTripsMin);
    setTripsMax(dTripsMax);
    setFuelFilterOpen(false);
  };
  const clearFuelFilter = () => {
    setFuelTypeEnabled(false);
    setFuelTypeVal("all");
    setCostEnabled(false);
    setCostMin("");
    setCostMax("");
    setDistEnabled(false);
    setDistMin("");
    setDistMax("");
    setEffEnabled(false);
    setEffMin("");
    setEffMax("");
    setTripsEnabled(false);
    setTripsMin("");
    setTripsMax("");
    setFuelFilterOpen(false);
  };
  const fuelActiveFilters = [
    fuelTypeEnabled,
    costEnabled,
    distEnabled,
    effEnabled,
    tripsEnabled,
  ].filter(Boolean).length;

  const displayFuelData = report.vehicles.map(v => ({
    vehicle: v.plateNumber,
    type: v.fuelType ?? v.vehicleType ?? "Unknown",
    totalKm: v.distanceKm,
    liters: v.litres,
    cost: v.costNgn,
    efficiency: v.efficiencyKmPerLitre,
    trips: v.trips,
  }));
  const {
    totalLitres: totalLiters, totalCostNgn: totalFuelCost, totalDistanceKm: totalKm, avgEfficiencyKmPerLitre,
  } = report.summary;
  const avgEfficiency = avgEfficiencyKmPerLitre === null ? "—" : avgEfficiencyKmPerLitre.toFixed(1);
  const top5 = displayFuelData.slice(
    0,
    5,
  );

  const fuelTypes = Array.from(new Set(displayFuelData.map(v => v.type))).sort();
  const filteredFuel = displayFuelData.filter((v) => {
    if (fuelSearch && !`${v.vehicle} ${v.type}`.toLowerCase().includes(fuelSearch.toLowerCase()))
      return false;
    if (fuelTypeEnabled && fuelTypeVal !== "all" && v.type !== fuelTypeVal)
      return false;
    if (costEnabled) {
      if (costMin && v.cost < Number(costMin))
        return false;
      if (costMax && v.cost > Number(costMax))
        return false;
    }
    if (distEnabled) {
      if (distMin && v.totalKm < Number(distMin))
        return false;
      if (distMax && v.totalKm > Number(distMax))
        return false;
    }
    if (effEnabled) {
      if (v.efficiency === null)
        return false;
      if (effMin && v.efficiency < Number(effMin))
        return false;
      if (effMax && v.efficiency > Number(effMax))
        return false;
    }
    if (tripsEnabled) {
      if (tripsMin && v.trips < Number(tripsMin))
        return false;
      if (tripsMax && v.trips > Number(tripsMax))
        return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Fuel className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Total Fuel Consumed</p>
                <p className="text-2xl font-bold truncate">
                  {totalLiters.toLocaleString()}
                  {" "}
                  L
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5 text-destructive" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Total Fuel Cost</p>
                <p className="text-2xl font-bold truncate">{formatCurrency(totalFuelCost)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Total Distance</p>
                <p className="text-2xl font-bold truncate">
                  {totalKm.toLocaleString()}
                  {" "}
                  km
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Avg Efficiency</p>
                <p className="text-2xl font-bold truncate">
                  {avgEfficiency}
                  {" "}
                  km/L
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Top 5 Fuel Consumers</CardTitle>
          <CardDescription>Highest fuel cost vehicles</CardDescription>
        </CardHeader>
        <CardContent>
          {top5.length > 0
            ? (
                <ResponsiveContainer
                  width="100%"
                  height={250}
                >
                  <BarChart
                    data={top5}
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
                      tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      type="category"
                      dataKey="vehicle"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px",
                      }}
                      formatter={(value: number) => [
                        `₦${value.toLocaleString()}`,
                        "Fuel Cost",
                      ]}
                    />
                    <Bar
                      dataKey="cost"
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
              )
            : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">No fuel recorded in this period</div>
              )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Vehicle Fuel Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicle..."
                value={fuelSearch}
                onChange={e => setFuelSearch(e.target.value)}
                className="pl-8 h-9 w-full"
              />
            </div>
            <Popover
              open={fuelFilterOpen}
              onOpenChange={o => (o ? openFuelFilter() : setFuelFilterOpen(false))}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filter
                  {fuelActiveFilters > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5"
                    >
                      {fuelActiveFilters}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80"
                align="end"
              >
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-foreground px-0.5">Show vehicles by...</h4>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="ft-en"
                        checked={dFuelTypeEnabled}
                        onCheckedChange={v => setDFuelTypeEnabled(!!v)}
                      />
                      <Label
                        htmlFor="ft-en"
                        className="text-sm"
                      >
                        Fuel type
                      </Label>
                    </div>
                    <Select
                      value={dFuelTypeVal}
                      onValueChange={setDFuelTypeVal}
                      disabled={!dFuelTypeEnabled}
                    >
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        {fuelTypes.map(t => (
                          <SelectItem
                            key={t}
                            value={t}
                          >
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="cost-en"
                        checked={dCostEnabled}
                        onCheckedChange={v => setDCostEnabled(!!v)}
                      />
                      <Label
                        htmlFor="cost-en"
                        className="text-sm"
                      >
                        Cost (₦)
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={dCostMin}
                        onChange={e => setDCostMin(e.target.value)}
                        disabled={!dCostEnabled}
                        className="h-8"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={dCostMax}
                        onChange={e => setDCostMax(e.target.value)}
                        disabled={!dCostEnabled}
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="dist-en"
                        checked={dDistEnabled}
                        onCheckedChange={v => setDDistEnabled(!!v)}
                      />
                      <Label
                        htmlFor="dist-en"
                        className="text-sm"
                      >
                        Distance (km)
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={dDistMin}
                        onChange={e => setDDistMin(e.target.value)}
                        disabled={!dDistEnabled}
                        className="h-8"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={dDistMax}
                        onChange={e => setDDistMax(e.target.value)}
                        disabled={!dDistEnabled}
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="eff-en"
                        checked={dEffEnabled}
                        onCheckedChange={v => setDEffEnabled(!!v)}
                      />
                      <Label
                        htmlFor="eff-en"
                        className="text-sm"
                      >
                        Efficiency (km/L)
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={dEffMin}
                        onChange={e => setDEffMin(e.target.value)}
                        disabled={!dEffEnabled}
                        className="h-8"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={dEffMax}
                        onChange={e => setDEffMax(e.target.value)}
                        disabled={!dEffEnabled}
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="trips-en"
                        checked={dTripsEnabled}
                        onCheckedChange={v => setDTripsEnabled(!!v)}
                      />
                      <Label
                        htmlFor="trips-en"
                        className="text-sm"
                      >
                        Number of trips
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={dTripsMin}
                        onChange={e => setDTripsMin(e.target.value)}
                        disabled={!dTripsEnabled}
                        className="h-8"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={dTripsMax}
                        onChange={e => setDTripsMax(e.target.value)}
                        disabled={!dTripsEnabled}
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFuelFilter}
                    >
                      Show All
                    </Button>
                    <Button
                      size="sm"
                      onClick={applyFuelFilter}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <ExportCsvButton
              rows={filteredFuel}
              filename="fuel-consumption"
              columns={[
                {
                  header: "Vehicle", accessor: "vehicle",
                },
                {
                  header: "Fuel type", accessor: "type",
                },
                {
                  header: "Distance (km)", accessor: "totalKm",
                },
                {
                  header: "Fuel (L)", accessor: "liters",
                },
                {
                  header: "Cost (NGN)", accessor: "cost",
                },
                {
                  header: "Efficiency (km/L)", accessor: "efficiency",
                },
                {
                  header: "Trips", accessor: "trips",
                },
              ]}
            />
          </div>
          {filteredFuel.length > 0
            ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Fuel type</TableHead>
                      <TableHead className="text-right">Distance (km)</TableHead>
                      <TableHead className="text-right">Fuel (L)</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Efficiency</TableHead>
                      <TableHead className="text-right">Trips</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFuel.map(v => (
                      <TableRow key={v.vehicle}>
                        <TableCell className="font-medium">{v.vehicle}</TableCell>
                        <TableCell className="capitalize">{v.type}</TableCell>
                        <TableCell className="text-right">{v.totalKm.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{v.liters.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{formatCurrency(v.cost)}</TableCell>
                        <TableCell className="text-right">
                          {v.efficiency === null ? "—" : `${v.efficiency} km/L`}
                        </TableCell>
                        <TableCell className="text-right">{v.trips}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            : (
                <div className="text-center py-8 text-muted-foreground">No fuel recorded for this period or filters</div>
              )}
        </CardContent>
      </Card>
    </div>
  );
}
