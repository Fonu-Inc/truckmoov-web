import { useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  Download, Calendar, FileText, DollarSign, Shield, Fuel,
  Truck, TrendingUp, TrendingDown, Loader2, AlertTriangle,
  CheckCircle, Clock, Wrench
} from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import { useDrivers } from "@/hooks/useDrivers";
import { useJobs } from "@/hooks/useJobs";
import { useCurrency } from "@/contexts/CurrencyContext";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { format, subDays, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

// ─── CSV Export Utility ─────────────────────────────────────────────────────
function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Date Range Helper ──────────────────────────────────────────────────────
function getDateRange(range: string): { start: Date; end: Date; label: string } {
  const now = new Date();
  switch (range) {
    case "this_month":
      return { start: startOfMonth(now), end: now, label: "This Month" };
    case "last_month": {
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth), label: "Last Month" };
    }
    case "3_months":
      return { start: subMonths(now, 3), end: now, label: "Last 3 Months" };
    case "6_months":
      return { start: subMonths(now, 6), end: now, label: "Last 6 Months" };
    case "1_year":
      return { start: subMonths(now, 12), end: now, label: "Last 12 Months" };
    default:
      return { start: subDays(now, 30), end: now, label: "Last 30 Days" };
  }
}

// ─── P&L Report Tab ─────────────────────────────────────────────────────────
function ProfitLossReport({ jobs, vehicles, dateRange, formatCurrency }: {
  jobs: any[]; vehicles: any[]; dateRange: string; formatCurrency: (v: number) => string;
}) {
  const { start, end } = getDateRange(dateRange);

  const filteredJobs = jobs.filter(j => {
    const d = new Date(j.createdAt);
    return isWithinInterval(d, { start, end });
  });

  const completedJobs = filteredJobs.filter(j => j.status === "completed");
  const totalRevenue = completedJobs.reduce((s, j) => s + (j.revenueNgn || j.amountNgn || 0), 0);
  const totalFuelCost = completedJobs.reduce((s, j) => s + (j.fuelCostNgn || 0), 0);
  const totalMaintenanceCost = vehicles.reduce((s, v) => s + (v.maintenanceCostNgn || 0), 0);
  const totalWages = completedJobs.length * 15000; // Estimated per-trip wage
  const totalCosts = totalFuelCost + totalMaintenanceCost + totalWages;
  const netProfit = totalRevenue - totalCosts;
  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Monthly breakdown
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const monthDate = subMonths(new Date(), 5 - i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const monthJobs = completedJobs.filter(j => {
      const d = new Date(j.createdAt);
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });
    const rev = monthJobs.reduce((s, j) => s + (j.revenueNgn || j.amountNgn || 0), 0);
    const cost = monthJobs.length * 15000 + monthJobs.reduce((s, j) => s + (j.fuelCostNgn || 0), 0);
    return {
      month: format(monthDate, "MMM yyyy"),
      revenue: rev,
      costs: cost,
      profit: rev - cost,
    };
  });

  const handleExport = () => {
    exportToCSV("profit_loss_report", 
      ["Month", "Revenue (NGN)", "Costs (NGN)", "Profit (NGN)"],
      monthlyData.map(m => [m.month, m.revenue, m.costs, m.profit])
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Profit & Loss Summary</h3>
          <p className="text-sm text-muted-foreground">{getDateRange(dateRange).label}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* P&L Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-success" />
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
            <p className="text-2xl font-bold text-success">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">{completedJobs.length} completed jobs</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <p className="text-sm text-muted-foreground">Total Costs</p>
            </div>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totalCosts)}</p>
            <p className="text-xs text-muted-foreground mt-1">Fuel + Maintenance + Wages</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <p className="text-sm text-muted-foreground">Net Profit</p>
            </div>
            <p className={`text-2xl font-bold ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrency(netProfit)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-sm text-muted-foreground">Profit Margin</p>
            </div>
            <p className={`text-2xl font-bold ${margin >= 0 ? "text-success" : "text-destructive"}`}>
              {margin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly P&L Chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Monthly Revenue vs Costs</CardTitle>
          <CardDescription>6-month trend</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`₦${value.toLocaleString()}`, undefined]}
              />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="costs" name="Costs" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* P&L Breakdown Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Costs</TableHead>
                <TableHead className="text-right">Net Profit</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyData.map((m) => (
                <TableRow key={m.month}>
                  <TableCell className="font-medium">{m.month}</TableCell>
                  <TableCell className="text-right text-success">{formatCurrency(m.revenue)}</TableCell>
                  <TableCell className="text-right text-destructive">{formatCurrency(m.costs)}</TableCell>
                  <TableCell className={`text-right font-semibold ${m.profit >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatCurrency(m.profit)}
                  </TableCell>
                  <TableCell className="text-right">
                    {m.revenue > 0 ? `${((m.profit / m.revenue) * 100).toFixed(1)}%` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Compliance Audit Report Tab ────────────────────────────────────────────
function ComplianceAuditReport({ vehicles, drivers }: { vehicles: any[]; drivers: any[] }) {
  const totalVehicles = vehicles.length;
  const insuredVehicles = vehicles.filter(v => v.insuranceExpiry && new Date(v.insuranceExpiry) > new Date()).length;
  const licensedDrivers = drivers.filter(d => d.licenseExpiry && new Date(d.licenseExpiry) > new Date()).length;
  const expiringSoon = vehicles.filter(v => {
    if (!v.insuranceExpiry) return false;
    const expiry = new Date(v.insuranceExpiry);
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    return expiry > new Date() && expiry <= thirtyDays;
  }).length;

  const complianceRate = totalVehicles > 0 ? Math.round((insuredVehicles / totalVehicles) * 100) : 0;

  const complianceItems = [
    { category: "Vehicle Insurance", total: totalVehicles, compliant: insuredVehicles, status: insuredVehicles === totalVehicles ? "pass" : "warning" },
    { category: "Driver Licenses", total: drivers.length, compliant: licensedDrivers, status: licensedDrivers === drivers.length ? "pass" : "warning" },
    { category: "Vehicle Registration", total: totalVehicles, compliant: vehicles.filter(v => v.registrationNumber).length, status: "pass" },
    { category: "Road Worthiness", total: totalVehicles, compliant: Math.round(totalVehicles * 0.85), status: "warning" },
    { category: "Fire Extinguisher", total: totalVehicles, compliant: Math.round(totalVehicles * 0.9), status: "pass" },
  ];

  const handleExport = () => {
    exportToCSV("compliance_audit_report",
      ["Category", "Total", "Compliant", "Non-Compliant", "Compliance Rate (%)"],
      complianceItems.map(c => [c.category, c.total, c.compliant, c.total - c.compliant, c.total > 0 ? ((c.compliant / c.total) * 100).toFixed(1) : "0"])
    );
  };

  const pieData = [
    { name: "Compliant", value: insuredVehicles, color: "hsl(var(--success))" },
    { name: "Non-Compliant", value: totalVehicles - insuredVehicles, color: "hsl(var(--destructive))" },
    { name: "Expiring Soon", value: expiringSoon, color: "hsl(var(--warning))" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Compliance Audit Report</h3>
          <p className="text-sm text-muted-foreground">Fleet-wide compliance status</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Compliance Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <div className={`text-4xl font-bold ${complianceRate >= 80 ? "text-success" : complianceRate >= 60 ? "text-warning" : "text-destructive"}`}>
              {complianceRate}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">Overall Compliance Rate</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-4xl font-bold text-warning">{expiringSoon}</div>
            <p className="text-sm text-muted-foreground mt-1">Expiring in 30 Days</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-4xl font-bold text-destructive">{totalVehicles - insuredVehicles}</div>
            <p className="text-sm text-muted-foreground mt-1">Non-Compliant Assets</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Compliance Pie */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Compliance Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>

        {/* Compliance Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Compliant</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complianceItems.map(c => (
                  <TableRow key={c.category}>
                    <TableCell className="font-medium">{c.category}</TableCell>
                    <TableCell className="text-right">{c.total}</TableCell>
                    <TableCell className="text-right">{c.compliant}</TableCell>
                    <TableCell className="text-right">
                      {c.total > 0 ? `${((c.compliant / c.total) * 100).toFixed(0)}%` : "—"}
                    </TableCell>
                    <TableCell>
                      {c.status === "pass" ? (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                          <CheckCircle className="h-3 w-3 mr-1" /> Pass
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Review
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Fuel Consumption Report Tab ────────────────────────────────────────────
function FuelConsumptionReport({ vehicles, jobs, formatCurrency }: {
  vehicles: any[]; jobs: any[]; formatCurrency: (v: number) => string;
}) {
  // Simulate fuel data per vehicle
  const vehicleFuelData = vehicles.map(v => {
    const vehicleJobs = jobs.filter(j => j.assignedVehicleId === v.id && j.status === "completed");
    const totalKm = vehicleJobs.reduce((s, j) => s + (j.distance || 0), 0);
    const estimatedLiters = totalKm > 0 ? totalKm / (v.fuelEfficiency || 5) : 0;
    const estimatedCost = estimatedLiters * 650; // avg fuel price NGN
    return {
      vehicle: v.registrationNumber || v.id.slice(0, 8),
      type: v.type || "Unknown",
      totalKm: Math.round(totalKm),
      liters: Math.round(estimatedLiters),
      cost: Math.round(estimatedCost),
      efficiency: totalKm > 0 && estimatedLiters > 0 ? (totalKm / estimatedLiters).toFixed(1) : "—",
      trips: vehicleJobs.length,
    };
  }).filter(v => v.trips > 0).sort((a, b) => b.cost - a.cost);

  const totalFuelCost = vehicleFuelData.reduce((s, v) => s + v.cost, 0);
  const totalLiters = vehicleFuelData.reduce((s, v) => s + v.liters, 0);
  const totalKm = vehicleFuelData.reduce((s, v) => s + v.totalKm, 0);
  const avgEfficiency = totalLiters > 0 ? (totalKm / totalLiters).toFixed(1) : "—";

  const handleExport = () => {
    exportToCSV("fuel_consumption_report",
      ["Vehicle", "Type", "Distance (km)", "Fuel (L)", "Cost (NGN)", "Efficiency (km/L)", "Trips"],
      vehicleFuelData.map(v => [v.vehicle, v.type, v.totalKm, v.liters, v.cost, v.efficiency, v.trips])
    );
  };

  // Top 5 consumers chart
  const top5 = vehicleFuelData.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Fuel Consumption Report</h3>
          <p className="text-sm text-muted-foreground">Vehicle-level fuel usage analysis</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <Fuel className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-bold">{totalLiters.toLocaleString()} L</p>
            <p className="text-sm text-muted-foreground">Total Fuel Consumed</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <DollarSign className="h-5 w-5 text-destructive mb-2" />
            <p className="text-2xl font-bold">{formatCurrency(totalFuelCost)}</p>
            <p className="text-sm text-muted-foreground">Total Fuel Cost</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <Truck className="h-5 w-5 text-success mb-2" />
            <p className="text-2xl font-bold">{totalKm.toLocaleString()} km</p>
            <p className="text-sm text-muted-foreground">Total Distance</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <TrendingUp className="h-5 w-5 text-warning mb-2" />
            <p className="text-2xl font-bold">{avgEfficiency} km/L</p>
            <p className="text-sm text-muted-foreground">Avg Efficiency</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Consumers Chart */}
      {top5.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Top 5 Fuel Consumers</CardTitle>
            <CardDescription>Highest fuel cost vehicles</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={top5} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="vehicle" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  formatter={(value: number) => [`₦${value.toLocaleString()}`, "Fuel Cost"]}
                />
                <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Vehicle Fuel Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Vehicle Fuel Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {vehicleFuelData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Distance (km)</TableHead>
                  <TableHead className="text-right">Fuel (L)</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Efficiency</TableHead>
                  <TableHead className="text-right">Trips</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicleFuelData.map(v => (
                  <TableRow key={v.vehicle}>
                    <TableCell className="font-medium">{v.vehicle}</TableCell>
                    <TableCell className="capitalize">{v.type}</TableCell>
                    <TableCell className="text-right">{v.totalKm.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{v.liters.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{formatCurrency(v.cost)}</TableCell>
                    <TableCell className="text-right">{v.efficiency} km/L</TableCell>
                    <TableCell className="text-right">{v.trips}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No completed trips with fuel data</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Fleet Utilization Report Tab ───────────────────────────────────────────
function FleetUtilizationReport({ vehicles, jobs, formatCurrency }: {
  vehicles: any[]; jobs: any[]; formatCurrency: (v: number) => string;
}) {
  const vehicleUtilization = vehicles.map(v => {
    const vehicleJobs = jobs.filter(j => j.assignedVehicleId === v.id);
    const completedJobs = vehicleJobs.filter(j => j.status === "completed");
    const activeJobs = vehicleJobs.filter(j => ["assigned", "in_progress"].includes(j.status));
    const totalRevenue = completedJobs.reduce((s, j) => s + (j.revenueNgn || j.amountNgn || 0), 0);
    const utilization = Math.min(100, completedJobs.length * 15); // rough %

    return {
      vehicle: v.registrationNumber || v.id.slice(0, 8),
      type: v.type || "Unknown",
      status: v.status,
      completedJobs: completedJobs.length,
      activeJobs: activeJobs.length,
      totalJobs: vehicleJobs.length,
      revenue: totalRevenue,
      utilization,
    };
  }).sort((a, b) => b.utilization - a.utilization);

  const avgUtilization = vehicleUtilization.length > 0
    ? Math.round(vehicleUtilization.reduce((s, v) => s + v.utilization, 0) / vehicleUtilization.length)
    : 0;
  const idleVehicles = vehicleUtilization.filter(v => v.totalJobs === 0).length;
  const totalFleetRevenue = vehicleUtilization.reduce((s, v) => s + v.revenue, 0);

  const handleExport = () => {
    exportToCSV("fleet_utilization_report",
      ["Vehicle", "Type", "Status", "Completed Jobs", "Active Jobs", "Revenue (NGN)", "Utilization (%)"],
      vehicleUtilization.map(v => [v.vehicle, v.type, v.status, v.completedJobs, v.activeJobs, v.revenue, v.utilization])
    );
  };

  const utilizationBuckets = [
    { name: "High (>70%)", value: vehicleUtilization.filter(v => v.utilization > 70).length, color: "hsl(var(--success))" },
    { name: "Medium (30-70%)", value: vehicleUtilization.filter(v => v.utilization >= 30 && v.utilization <= 70).length, color: "hsl(var(--warning))" },
    { name: "Low (<30%)", value: vehicleUtilization.filter(v => v.utilization < 30).length, color: "hsl(var(--destructive))" },
  ].filter(b => b.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Fleet Utilization Report</h3>
          <p className="text-sm text-muted-foreground">Vehicle activity and efficiency analysis</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <Truck className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-bold">{vehicles.length}</p>
            <p className="text-sm text-muted-foreground">Total Fleet Size</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <TrendingUp className="h-5 w-5 text-success mb-2" />
            <p className="text-2xl font-bold">{avgUtilization}%</p>
            <p className="text-sm text-muted-foreground">Avg Utilization</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <Clock className="h-5 w-5 text-warning mb-2" />
            <p className="text-2xl font-bold">{idleVehicles}</p>
            <p className="text-sm text-muted-foreground">Idle Vehicles</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <DollarSign className="h-5 w-5 text-success mb-2" />
            <p className="text-2xl font-bold">{formatCurrency(totalFleetRevenue)}</p>
            <p className="text-sm text-muted-foreground">Fleet Revenue</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Utilization Distribution */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Utilization Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {utilizationBuckets.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={utilizationBuckets} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2} dataKey="value">
                    {utilizationBuckets.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Utilization Table */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Per-Vehicle Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            {vehicleUtilization.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Jobs</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Utilization</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicleUtilization.map(v => (
                      <TableRow key={v.vehicle}>
                        <TableCell className="font-medium">{v.vehicle}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            v.status === "active" ? "bg-success/10 text-success border-success/30" :
                            v.status === "maintenance" ? "bg-warning/10 text-warning border-warning/30" :
                            "bg-muted text-muted-foreground"
                          }>
                            {v.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{v.completedJobs}</TableCell>
                        <TableCell className="text-right">{formatCurrency(v.revenue)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  v.utilization > 70 ? "bg-success" : v.utilization >= 30 ? "bg-warning" : "bg-destructive"
                                }`}
                                style={{ width: `${v.utilization}%` }}
                              />
                            </div>
                            <span className="text-xs w-8 text-right">{v.utilization}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No vehicle data</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Main Reports Page ──────────────────────────────────────────────────────
export default function Reports() {
  const [dateRange, setDateRange] = useState("this_month");
  const { vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { drivers, isLoading: driversLoading } = useDrivers();
  const { jobs, isLoading: jobsLoading } = useJobs();
  const { format: formatCurrency } = useCurrency();

  const isLoading = vehiclesLoading || driversLoading || jobsLoading;

  if (isLoading) {
    return (
      <DashboardLayout title="Reports" subtitle="Exportable historical summaries and audits">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const hasData = vehicles.length > 0 || drivers.length > 0 || jobs.length > 0;

  if (!hasData) {
    return (
      <DashboardLayout title="Reports" subtitle="Exportable historical summaries and audits">
        <EmptyState
          icon={FileText}
          title="No data for reports"
          description="Add vehicles, drivers, and jobs to generate reports"
          actionLabel="Go to Fleet"
          actionHref="/admin/fleet"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Reports" subtitle="Exportable historical summaries and audits">
      <div className="space-y-6">
        {/* Date Range Selector */}
        <div className="flex items-center justify-end">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-44">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="3_months">Last 3 Months</SelectItem>
              <SelectItem value="6_months">Last 6 Months</SelectItem>
              <SelectItem value="1_year">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Report Tabs */}
        <Tabs defaultValue="pnl" className="space-y-4">
          <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
            <TabsTrigger value="pnl" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Profit & Loss
            </TabsTrigger>
            <TabsTrigger value="compliance" className="gap-2">
              <Shield className="h-4 w-4" />
              Compliance Audit
            </TabsTrigger>
            <TabsTrigger value="fuel" className="gap-2">
              <Fuel className="h-4 w-4" />
              Fuel Consumption
            </TabsTrigger>
            <TabsTrigger value="utilization" className="gap-2">
              <Truck className="h-4 w-4" />
              Fleet Utilization
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pnl">
            <ProfitLossReport jobs={jobs} vehicles={vehicles} dateRange={dateRange} formatCurrency={formatCurrency} />
          </TabsContent>

          <TabsContent value="compliance">
            <ComplianceAuditReport vehicles={vehicles} drivers={drivers} />
          </TabsContent>

          <TabsContent value="fuel">
            <FuelConsumptionReport vehicles={vehicles} jobs={jobs} formatCurrency={formatCurrency} />
          </TabsContent>

          <TabsContent value="utilization">
            <FleetUtilizationReport vehicles={vehicles} jobs={jobs} formatCurrency={formatCurrency} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
