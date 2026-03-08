import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Activity, Brain, Zap, Clock, RefreshCw, TrendingUp, AlertTriangle } from "lucide-react";
import { useAIUsageLogs } from "@/hooks/useAIUsageLogs";
import { useAuthStore } from "@/stores/authStore";
import { format, parseISO, subDays } from "date-fns";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--warning))",
  "hsl(var(--success))",
  "hsl(var(--destructive))",
];

const REQUEST_TYPE_LABELS: Record<string, string> = {
  load_matching: "AI Load Matching",
  route_optimization: "Route Optimization",
  job_matching: "Job Matching",
};

export function AIUsageAnalyticsPanel() {
  const { user } = useAuthStore();
  const { logs, stats, isLoading, refetch } = useAIUsageLogs(user?.tenantId, false);

  // Daily usage aggregation for chart
  const dailyData = useMemo(() => {
    const map = new Map<string, { date: string; requests: number; tokens: number }>();
    
    // Initialize last 14 days
    for (let i = 13; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      map.set(date, { date, requests: 0, tokens: 0 });
    }

    logs.forEach((log) => {
      const date = format(parseISO(log.created_at), "yyyy-MM-dd");
      const entry = map.get(date);
      if (entry) {
        entry.requests += 1;
        entry.tokens += log.tokens_used || 0;
      }
    });

    return Array.from(map.values()).map((d) => ({
      ...d,
      label: format(parseISO(d.date), "MMM d"),
    }));
  }, [logs]);

  // Usage by feature type
  const featureBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; requests: number; tokens: number }>();
    logs.forEach((log) => {
      const key = log.request_type || "other";
      const entry = map.get(key) || {
        name: REQUEST_TYPE_LABELS[key] || key,
        requests: 0,
        tokens: 0,
      };
      entry.requests += 1;
      entry.tokens += log.tokens_used || 0;
      map.set(key, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.requests - a.requests);
  }, [logs]);

  // Recent failures
  const recentFailures = useMemo(
    () => logs.filter((l) => !l.success).slice(0, 5),
    [logs]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">AI Usage Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Monitor your organization's AI feature consumption and costs
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{stats?.totalRequests ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <Brain className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tokens Used</p>
                <p className="text-2xl font-bold">
                  {(stats?.totalTokens ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/20">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">
                  {stats?.successRate?.toFixed(1) ?? "100"}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Latency</p>
                <p className="text-2xl font-bold">
                  {stats?.avgLatency ? `${Math.round(stats.avgLatency)}ms` : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily usage chart */}
        <Card className="lg:col-span-2 bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Daily AI Requests (Last 14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyData.some((d) => d.requests > 0) ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="requests" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Requests" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground">
                <Zap className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">No AI usage data yet</p>
                <p className="text-xs">Use AI features like Load Matching or Route Optimization to see data here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feature breakdown pie */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base">By Feature</CardTitle>
          </CardHeader>
          <CardContent>
            {featureBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={featureBreakdown}
                    dataKey="requests"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {featureBreakdown.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground">
                <Brain className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">No feature data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Breakdown Table */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Feature Breakdown</CardTitle>
          <CardDescription>Token usage and request count by AI feature</CardDescription>
        </CardHeader>
        <CardContent>
          {featureBreakdown.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                  <TableHead className="text-right">Tokens Used</TableHead>
                  <TableHead className="text-right">Avg Tokens/Request</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featureBreakdown.map((feature) => (
                  <TableRow key={feature.name}>
                    <TableCell className="font-medium">{feature.name}</TableCell>
                    <TableCell className="text-right">{feature.requests}</TableCell>
                    <TableCell className="text-right">{feature.tokens.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {feature.requests > 0
                        ? Math.round(feature.tokens / feature.requests).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No AI usage recorded yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Failures */}
      {recentFailures.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Recent Failures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Feature</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentFailures.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {format(parseISO(log.created_at), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {REQUEST_TYPE_LABELS[log.request_type] || log.request_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{log.provider}</TableCell>
                    <TableCell className="text-sm text-destructive max-w-[300px] truncate">
                      {log.error_message || "Unknown error"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
