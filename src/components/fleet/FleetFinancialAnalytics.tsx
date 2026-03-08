import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Fuel, 
  Wrench, 
  Users, 
  Shield,
  Calculator,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { useVehicles, VehicleData } from "@/hooks/useVehicles";
import { useVehicleFinancials, VehicleProfitability } from "@/hooks/useVehicleFinancials";
import { useCurrency } from "@/contexts/CurrencyContext";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { VehicleFinancialConfigDialog } from "./VehicleFinancialConfigDialog";

const TIER_COLORS = {
  excellent: "#22c55e",
  good: "#3b82f6",
  marginal: "#f59e0b",
  "loss-making": "#ef4444",
};

const TIER_LABELS = {
  excellent: "Excellent",
  good: "Good",
  marginal: "Marginal",
  "loss-making": "Loss-Making",
};

export function FleetFinancialAnalytics() {
  const { vehicles } = useVehicles();
  const { configs, calculateFleetProfitability, isLoading } = useVehicleFinancials();
  const { format } = useCurrency();
  
  const [period, setPeriod] = useState<"30" | "90" | "180" | "365">("30");
  const [profitabilityData, setProfitabilityData] = useState<VehicleProfitability[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const loadProfitability = async () => {
    if (vehicles.length === 0) return;
    
    setIsCalculating(true);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    const vehicleIds = vehicles.map(v => v.id);
    const results = await calculateFleetProfitability(vehicleIds, startDate, endDate);
    setProfitabilityData(results);
    setIsCalculating(false);
  };

  useEffect(() => {
    loadProfitability();
  }, [vehicles, period]);

  // Calculate fleet totals
  const fleetTotals = profitabilityData.reduce((acc, v) => ({
    totalRevenue: acc.totalRevenue + (v.revenue?.total || 0),
    totalCosts: acc.totalCosts + (v.costs?.total || 0),
    totalProfit: acc.totalProfit + (v.profitability?.net_profit || 0),
    jobsCompleted: acc.jobsCompleted + (v.revenue?.jobs_completed || 0),
    totalKm: acc.totalKm + (v.revenue?.total_km || 0),
  }), { totalRevenue: 0, totalCosts: 0, totalProfit: 0, jobsCompleted: 0, totalKm: 0 });

  const fleetMargin = fleetTotals.totalRevenue > 0 
    ? (fleetTotals.totalProfit / fleetTotals.totalRevenue) * 100 
    : 0;

  // Tier distribution for pie chart
  const tierDistribution = profitabilityData.reduce((acc, v) => {
    const tier = v.profitability?.tier || 'marginal';
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(tierDistribution).map(([tier, count]) => ({
    name: TIER_LABELS[tier as keyof typeof TIER_LABELS],
    value: count,
    fill: TIER_COLORS[tier as keyof typeof TIER_COLORS],
  }));

  // Cost breakdown for bar chart
  const costBreakdown = profitabilityData.reduce((acc, v) => {
    acc.fuel += v.costs?.fuel || 0;
    acc.maintenance += v.costs?.maintenance || 0;
    acc.wages += v.costs?.wages || 0;
    acc.insurance += v.costs?.insurance || 0;
    acc.depreciation += v.costs?.depreciation || 0;
    return acc;
  }, { fuel: 0, maintenance: 0, wages: 0, insurance: 0, depreciation: 0 });

  const costChartData = [
    { name: "Fuel", value: costBreakdown.fuel, fill: "#f59e0b" },
    { name: "Maintenance", value: costBreakdown.maintenance, fill: "#3b82f6" },
    { name: "Wages", value: costBreakdown.wages, fill: "#8b5cf6" },
    { name: "Insurance", value: costBreakdown.insurance, fill: "#22c55e" },
    { name: "Depreciation", value: costBreakdown.depreciation, fill: "#64748b" },
  ];

  const chartConfig = {
    fuel: { label: "Fuel", color: "#f59e0b" },
    maintenance: { label: "Maintenance", color: "#3b82f6" },
    wages: { label: "Wages", color: "#8b5cf6" },
    insurance: { label: "Insurance", color: "#22c55e" },
    depreciation: { label: "Depreciation", color: "#64748b" },
  };

  // Identify underperforming vehicles
  const underperformingVehicles = profitabilityData
    .filter(v => v.profitability?.tier === 'loss-making' || v.profitability?.tier === 'marginal')
    .sort((a, b) => (a.profitability?.net_profit || 0) - (b.profitability?.net_profit || 0));

  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle?.registrationNumber || vehicleId.slice(0, 8);
  };

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      excellent: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      good: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      marginal: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "loss-making": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return (
      <Badge className={colors[tier] || colors.marginal}>
        {TIER_LABELS[tier as keyof typeof TIER_LABELS] || tier}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Fleet Financial Analytics</h2>
          <p className="text-muted-foreground">Track costs, revenue, and profitability per vehicle</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="180">Last 6 Months</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon"
            onClick={loadProfitability}
            disabled={isCalculating}
          >
            <RefreshCw className={`h-4 w-4 ${isCalculating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{format(fleetTotals.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">{fleetTotals.jobsCompleted} jobs completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Total Costs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{format(fleetTotals.totalCosts)}</div>
            <p className="text-xs text-muted-foreground">{fleetTotals.totalKm.toFixed(0)} km driven</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Net Profit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${fleetTotals.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {format(fleetTotals.totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground">{fleetMargin.toFixed(1)}% margin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Cost per KM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fleetTotals.totalKm > 0 ? format(fleetTotals.totalCosts / fleetTotals.totalKm) : '—'}
            </div>
            <p className="text-xs text-muted-foreground">Fleet average</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicle P&L</TabsTrigger>
          <TabsTrigger value="costs">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="underperforming">Underperforming</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profitability Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profitability Distribution</CardTitle>
                <CardDescription>Vehicle count by profitability tier</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cost Breakdown</CardTitle>
                <CardDescription>Total costs by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" width={80} />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        formatter={(value) => format(Number(value))}
                      />
                      <Bar dataKey="value" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Fuel className="h-4 w-4" /> Fuel
              </div>
              <div className="font-semibold">{format(costBreakdown.fuel)}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Wrench className="h-4 w-4" /> Maintenance
              </div>
              <div className="font-semibold">{format(costBreakdown.maintenance)}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Users className="h-4 w-4" /> Wages
              </div>
              <div className="font-semibold">{format(costBreakdown.wages)}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Shield className="h-4 w-4" /> Insurance
              </div>
              <div className="font-semibold">{format(costBreakdown.insurance)}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <BarChart3 className="h-4 w-4" /> Depreciation
              </div>
              <div className="font-semibold">{format(costBreakdown.depreciation)}</div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vehicles">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Vehicle Profit & Loss</CardTitle>
                <CardDescription>Individual vehicle financial performance</CardDescription>
              </div>
              <Button onClick={() => setConfigDialogOpen(true)}>
                Configure Costs
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Costs</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitabilityData.map((item) => (
                    <TableRow key={item.vehicle_id}>
                      <TableCell className="font-medium">
                        {getVehicleName(item.vehicle_id)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {format(item.revenue?.total || 0)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {format(item.costs?.total || 0)}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${(item.profitability?.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {format(item.profitability?.net_profit || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {(item.profitability?.margin_percent || 0).toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        {getTierBadge(item.profitability?.tier || 'marginal')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Progress 
                            value={item.profitability?.score || 0} 
                            className="w-16 h-2"
                          />
                          <span className="text-sm">{item.profitability?.score || 0}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {profitabilityData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {isCalculating ? 'Calculating profitability...' : 'No data available. Configure vehicle costs to see analysis.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Cost Analysis</CardTitle>
              <CardDescription>Per-vehicle cost breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead className="text-right">Fuel</TableHead>
                    <TableHead className="text-right">Maintenance</TableHead>
                    <TableHead className="text-right">Wages</TableHead>
                    <TableHead className="text-right">Insurance</TableHead>
                    <TableHead className="text-right">Depreciation</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitabilityData.map((item) => (
                    <TableRow key={item.vehicle_id}>
                      <TableCell className="font-medium">
                        {getVehicleName(item.vehicle_id)}
                      </TableCell>
                      <TableCell className="text-right">{format(item.costs?.fuel || 0)}</TableCell>
                      <TableCell className="text-right">{format(item.costs?.maintenance || 0)}</TableCell>
                      <TableCell className="text-right">{format(item.costs?.wages || 0)}</TableCell>
                      <TableCell className="text-right">{format(item.costs?.insurance || 0)}</TableCell>
                      <TableCell className="text-right">{format(item.costs?.depreciation || 0)}</TableCell>
                      <TableCell className="text-right font-semibold">{format(item.costs?.total || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="underperforming">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Underperforming Assets
              </CardTitle>
              <CardDescription>
                Vehicles with marginal or negative profitability requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {underperformingVehicles.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-muted-foreground">All vehicles are performing well!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {underperformingVehicles.map((item) => {
                    const vehicle = vehicles.find(v => v.id === item.vehicle_id);
                    return (
                      <Card key={item.vehicle_id} className="border-amber-200 dark:border-amber-800">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold flex items-center gap-2">
                                {vehicle?.registrationNumber || 'Unknown Vehicle'}
                                {getTierBadge(item.profitability?.tier || 'marginal')}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {vehicle?.make} {vehicle?.model} • {item.revenue?.jobs_completed || 0} jobs
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${(item.profitability?.net_profit || 0) >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                                {format(item.profitability?.net_profit || 0)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(item.profitability?.margin_percent || 0).toFixed(1)}% margin
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Revenue:</span>
                              <span className="ml-2 font-medium">{format(item.revenue?.total || 0)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Costs:</span>
                              <span className="ml-2 font-medium">{format(item.costs?.total || 0)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">KM Driven:</span>
                              <span className="ml-2 font-medium">{(item.revenue?.total_km || 0).toFixed(0)} km</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <VehicleFinancialConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        vehicles={vehicles.map(v => ({
          id: v.id,
          registration_number: v.registrationNumber,
          make: v.make,
          model: v.model,
        }))}
      />
    </div>
  );
}
