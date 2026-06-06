import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Badge } from "@/components/shadcn/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from "@/components/shadcn/select";
import {BarChart3, Calendar, TrendingUp, Truck, Users, Package, Clock, AlertTriangle, Loader2, Download} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell } from "recharts";
import { useState, useMemo } from "react";

export default function DispatcherReports() {
  const devices: any[] = [];
  const alerts: any[] = [];
  const stats = { totalDevices: 0, activeDevices: 0, totalAlerts: 0, unacknowledgedAlerts: 0, criticalAlerts: 0 };
  const loading = false;
  const [dateRange, setDateRange] = useState("7d");

  // Generate chart data from real alerts
  const alertsByDay = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = new Map<string, number>();
    days.forEach(day => counts.set(day, 0));

    alerts.forEach(alert => {
      const date = new Date(alert.timestamp);
      const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
      counts.set(dayName, (counts.get(dayName) || 0) + 1);
    });

    return days.map(day => ({
      day,
      alerts: counts.get(day) || 0 }));
  }, [alerts]);

  // Device utilization from real data
  const deviceUtilization = useMemo(() => {
    const active = devices.filter(d => d.status === 'active').length;
    const idle = devices.filter(d => d.status === 'idle').length;
    const offline = devices.filter(d => d.status !== 'active' && d.status !== 'idle').length;
    const total = devices.length || 1;

    return [
      { name: 'Active', value: Math.round((active / total) * 100), color: 'hsl(var(--success))' },
      { name: 'Idle', value: Math.round((idle / total) * 100), color: 'hsl(var(--warning))' },
      { name: 'Offline', value: Math.round((offline / total) * 100), color: 'hsl(var(--muted))' },
    ];
  }, [devices]);

  // Alert severity breakdown
  const alertsBySeverity = useMemo(() => {
    const critical = alerts.filter(a => a.severity === 'critical').length;
    const high = alerts.filter(a => a.severity === 'high').length;
    const medium = alerts.filter(a => a.severity === 'medium').length;
    const low = alerts.filter(a => a.severity === 'low').length;

    return [
      { name: 'Critical', value: critical, color: 'hsl(var(--destructive))' },
      { name: 'High', value: high, color: 'hsl(var(--warning))' },
      { name: 'Medium', value: medium, color: 'hsl(var(--primary))' },
      { name: 'Low', value: low, color: 'hsl(var(--muted))' },
    ].filter(item => item.value > 0);
  }, [alerts]);

  // Top alert types
  const topAlertTypes = useMemo(() => {
    const typeCounts = new Map<string, number>();
    alerts.forEach(alert => {
      const type = alert.type.replace(/_/g, ' ');
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    });

    return Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  }, [alerts]);

  if (loading) {
    return (
      <DashboardLayout title="Reports & Analytics" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Reports & Analytics"
      subtitle="Real-time fleet performance insights"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Devices</p>
                  <p className="text-2xl font-bold">{stats.totalDevices}</p>
                  <p className="text-xs text-success flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" /> Live data
                  </p>
                </div>
                <Truck className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Devices</p>
                  <p className="text-2xl font-bold text-success">{stats.activeDevices}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.totalDevices > 0 ? ((stats.activeDevices / stats.totalDevices) * 100).toFixed(0) : 0}% utilization
                  </p>
                </div>
                <Clock className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Alerts</p>
                  <p className="text-2xl font-bold text-primary">{stats.totalAlerts}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.unacknowledgedAlerts} unacknowledged
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical Alerts</p>
                  <p className="text-2xl font-bold text-destructive">{stats.criticalAlerts}</p>
                  <p className="text-xs text-warning flex items-center gap-1 mt-1">
                    Requires attention
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Weekly Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Alerts by Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={alertsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px" }}
                  />
                  <Bar dataKey="alerts" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Device Utilization Pie */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Device Utilization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deviceUtilization}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deviceUtilization.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                {deviceUtilization.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name} ({item.value}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Alert Types Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Top Alert Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium">Alert Type</th>
                    <th className="text-left py-3 px-4 font-medium">Count</th>
                    <th className="text-left py-3 px-4 font-medium">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {topAlertTypes.map((item, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-3 px-4">
                        <span className="font-medium capitalize">{item.type}</span>
                      </td>
                      <td className="py-3 px-4">{item.count}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full max-w-24 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ 
                                width: `${alerts.length > 0 ? (item.count / alerts.length) * 100 : 0}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {alerts.length > 0 ? ((item.count / alerts.length) * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {topAlertTypes.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-muted-foreground">
                        No alerts recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}



