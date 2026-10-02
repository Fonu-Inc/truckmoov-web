import type { TimeRange } from "@/components/charts/TimeRangeSelect";
import type {
  FilterField, FilterValues,
} from "@/components/shadcn/table-toolbar";
import {
  formatDayMonth, formatDayMonthTime, formatWithPattern, subDays, toDate, toDateParam,
} from "@truckmoov/app-core/utils/time-utils";
import {
  Activity, AlertTriangle, Brain, Clock, TrendingUp, Zap,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { TimeRangeSelect } from "@/components/charts/TimeRangeSelect";
import { Badge } from "@/components/shadcn/badge";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { ExportButton } from "@/components/shadcn/export-button";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { TableToolbar } from "@/components/shadcn/table-toolbar";

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
  waybill_extraction: "Waybill Extraction",
  fatigue_detection: "Fatigue Detection",
};

function rangeDays(r: TimeRange) {
  return r === "7d" ? 7 : r === "30d" ? 30 : r === "90d" ? 90 : 365;
}

export function AIUsageAnalyticsPanel() {
  // ponytail: empty until an AI-usage endpoint exists; the panel renders its empty states
  const logs: any[] = [];
  const stats: {
    totalRequests: number; totalTokens: number; successRate: number; avgLatency: number;
  } | null = null;
  const isLoading = false;
  const [dailyRange] = useState<TimeRange>("30d");
  const [
    featureRange,
    setFeatureRange,
  ] = useState<TimeRange>("30d");
  const [
    featureSearch,
    setFeatureSearch,
  ] = useState("");
  const [
    featureFilters,
    setFeatureFilters,
  ] = useState<FilterValues>({});
  const [
    failureSearch,
    setFailureSearch,
  ] = useState("");
  const [
    failureFilters,
    setFailureFilters,
  ] = useState<FilterValues>({});

  // Daily usage aggregation for chart
  const dailyData = useMemo(
    () => {
      const days = rangeDays(dailyRange);
      const map = new Map<string, {
        date: string; requests: number; tokens: number;
      }>();
      for (let i = days - 1; i >= 0; i--) {
        const date = toDateParam(subDays(
          new Date(),
          i,
        ));
        map.set(
          date,
          {
            date, requests: 0, tokens: 0,
          },
        );
      }
      logs.forEach((log) => {
        const date = toDateParam(log.created_at);
        const entry = map.get(date);
        if (entry) {
          entry.requests += 1;
          entry.tokens += log.tokens_used || 0;
        }
      });
      return Array.from(map.values()).map(d => ({
        ...d,
        label: formatDayMonth(d.date),
      }));
    },
    [
      logs,
      dailyRange,
    ],
  );

  // Usage by feature type
  const featureBreakdown = useMemo(
    () => {
      const days = rangeDays(featureRange);
      const cutoff = subDays(
        new Date(),
        days,
      );
      const map = new Map<string, {
        name: string; requests: number; tokens: number;
      }>();
      logs
        .filter(l => toDate(l.created_at) >= cutoff)
        .forEach((log) => {
          const key = log.request_type || "other";
          const entry = map.get(key) || {
            name: REQUEST_TYPE_LABELS[key] || key,
            requests: 0,
            tokens: 0,
          };
          entry.requests += 1;
          entry.tokens += log.tokens_used || 0;
          map.set(
            key,
            entry,
          );
        });
      return Array.from(map.values()).sort((a, b) => b.requests - a.requests);
    },
    [
      logs,
      featureRange,
    ],
  );

  const summary = {
    totalRequests: stats?.totalRequests ?? 0,
    totalTokens: stats?.totalTokens ?? 0,
    successRate: stats?.successRate ?? 0,
    avgLatency: stats?.avgLatency ?? 0,
  };

  // Recent failures (real only — keep authentic, hide when empty)
  const recentFailures = useMemo(
    () => logs.filter(l => !l.success).slice(
      0,
      5,
    ),
    [logs],
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
                <p className="text-2xl font-bold">{summary.totalRequests.toLocaleString()}</p>
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
                <p className="text-2xl font-bold">{summary.totalTokens.toLocaleString()}</p>
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
                  {summary.totalRequests ? `${summary.successRate.toFixed(1)}%` : "—"}
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
                  {summary.avgLatency ? `${Math.round(summary.avgLatency)}ms` : "—"}
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
            <CardTitle className="text-base">Daily AI Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyData.some(d => d.requests > 0)
              ? (
                  <ResponsiveContainer
                    width="100%"
                    height={260}
                  >
                    <BarChart data={dailyData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-border/30"
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        className="fill-muted-foreground"
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11 }}
                        className="fill-muted-foreground"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                        }}
                      />
                      <Bar
                        dataKey="requests"
                        fill="hsl(var(--primary))"
                        radius={[
                          4,
                          4,
                          0,
                          0,
                        ]}
                        name="Requests"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )
              : (
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
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <CardTitle className="text-base">By Feature</CardTitle>
            <TimeRangeSelect
              value={featureRange}
              onChange={setFeatureRange}
            />
          </CardHeader>
          <CardContent>
            {featureBreakdown.length > 0
              ? (
                  <ResponsiveContainer
                    width="100%"
                    height={260}
                  >
                    <PieChart>
                      <Pie
                        data={featureBreakdown}
                        dataKey="requests"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({
                          name, percent,
                        }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {featureBreakdown.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )
              : (
                  <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground">
                    <Brain className="h-10 w-10 mb-2 opacity-30" />
                    <p className="text-sm">No feature data</p>
                  </div>
                )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Breakdown Table */}
      <FeatureBreakdownTable
        rows={featureBreakdown}
        search={featureSearch}
        onSearchChange={setFeatureSearch}
        filters={featureFilters}
        onFiltersApply={setFeatureFilters}
      />

      {/* Recent Failures */}
      {recentFailures.length > 0 && (
        <RecentFailuresTable
          rows={recentFailures}
          search={failureSearch}
          onSearchChange={setFailureSearch}
          filters={failureFilters}
          onFiltersApply={setFailureFilters}
        />
      )}
    </div>
  );
}

type FeatureRow = {
  name: string; requests: number; tokens: number;
};

const FEATURE_FILTER_FIELDS: FilterField[] = [
  {
    type: "range", key: "requests", label: "Requests", placeholderFrom: "Min", placeholderTo: "Max",
  },
  {
    type: "range", key: "tokens", label: "Tokens used", placeholderFrom: "Min", placeholderTo: "Max",
  },
];

function FeatureBreakdownTable({
  rows,
  search,
  onSearchChange,
  filters,
  onFiltersApply,
}: {
  rows: FeatureRow[];
  search: string;
  onSearchChange: (v: string) => void;
  filters: FilterValues;
  onFiltersApply: (v: FilterValues) => void;
}) {
  const filtered = useMemo(
    () => {
      const q = search.trim().toLowerCase();
      const reqF = filters.requests;
      const tokF = filters.tokens;
      return rows.filter((r) => {
        if (q && !r.name.toLowerCase().includes(q))
          return false;
        if (reqF?.enabled) {
          const from = reqF.from ? Number(reqF.from) : -Infinity;
          const to = reqF.to ? Number(reqF.to) : Infinity;
          if (r.requests < from || r.requests > to)
            return false;
        }
        if (tokF?.enabled) {
          const from = tokF.from ? Number(tokF.from) : -Infinity;
          const to = tokF.to ? Number(tokF.to) : Infinity;
          if (r.tokens < from || r.tokens > to)
            return false;
        }
        return true;
      });
    },
    [
      rows,
      search,
      filters,
    ],
  );

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base">Feature Breakdown</CardTitle>
            <CardDescription>Token usage and request count by AI feature</CardDescription>
          </div>
          <ExportButton
            rows={filtered}
            filename="ai_feature_breakdown"
            columns={[
              {
                header: "Feature", accessor: "name",
              },
              {
                header: "Requests", accessor: "requests",
              },
              {
                header: "Tokens Used", accessor: "tokens",
              },
              {
                header: "Avg Tokens/Request", accessor: r => (r.requests > 0 ? Math.round(r.tokens / r.requests) : 0),
              },
            ]}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <TableToolbar
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search features..."
          filterEntity="features"
          filterFields={FEATURE_FILTER_FIELDS}
          filterValues={filters}
          onFiltersApply={onFiltersApply}
        />
        {filtered.length > 0
          ? (
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
                  {filtered.map(feature => (
                    <TableRow key={feature.name}>
                      <TableCell className="font-medium">{feature.name}</TableCell>
                      <TableCell className="text-right">{feature.requests.toLocaleString()}</TableCell>
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
            )
          : (
              <p className="text-sm text-muted-foreground text-center py-6">
                {rows.length === 0 ? "No AI usage recorded yet." : "No features match your filters."}
              </p>
            )}
      </CardContent>
    </Card>
  );
}

type FailureRow = {
  id: string;
  created_at: string;
  request_type: string;
  provider: string;
  error_message?: string | null;
};

function RecentFailuresTable({
  rows,
  search,
  onSearchChange,
  filters,
  onFiltersApply,
}: {
  rows: FailureRow[];
  search: string;
  onSearchChange: (v: string) => void;
  filters: FilterValues;
  onFiltersApply: (v: FilterValues) => void;
}) {
  const providerOptions = useMemo(
    () => {
      const set = new Set<string>();
      rows.forEach(r => r.provider && set.add(r.provider));
      return Array.from(set).map(p => ({
        value: p, label: p,
      }));
    },
    [rows],
  );

  const filterFields: FilterField[] = useMemo(
    () => [
      {
        type: "daterange", key: "time", label: "Time", placeholderFrom: "From", placeholderTo: "To",
      },
      {
        type: "select", key: "provider", label: "Provider", options: providerOptions,
      },
    ],
    [providerOptions],
  );

  const filtered = useMemo(
    () => {
      const q = search.trim().toLowerCase();
      const tF = filters.time;
      const pF = filters.provider;
      return rows.filter((r) => {
        if (q) {
          const hay = `${r.provider} ${r.error_message ?? ""} ${REQUEST_TYPE_LABELS[r.request_type] || r.request_type}`.toLowerCase();
          if (!hay.includes(q))
            return false;
        }
        if (tF?.enabled) {
          const ts = new Date(r.created_at).getTime();
          if (tF.dateFrom && ts < new Date(tF.dateFrom).getTime())
            return false;
          if (tF.dateTo && ts > new Date(tF.dateTo).getTime() + 86400000)
            return false;
        }
        if (pF?.enabled && pF.value && r.provider !== pF.value)
          return false;
        return true;
      });
    },
    [
      rows,
      search,
      filters,
    ],
  );

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Recent Failures
          </CardTitle>
          <ExportButton
            rows={filtered}
            filename="ai_recent_failures"
            columns={[
              {
                header: "Time", accessor: r => formatWithPattern(
                  r.created_at,
                  "yyyy-MM-dd HH:mm",
                ),
              },
              {
                header: "Feature", accessor: r => REQUEST_TYPE_LABELS[r.request_type] || r.request_type,
              },
              {
                header: "Provider", accessor: "provider",
              },
              {
                header: "Error", accessor: r => r.error_message || "Unknown error",
              },
            ]}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <TableToolbar
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search failures..."
          filterEntity="failures"
          filterFields={filterFields}
          filterValues={filters}
          onFiltersApply={onFiltersApply}
        />
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
            {filtered.length === 0
              ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-6 text-sm text-muted-foreground"
                    >
                      No failures match your filters.
                    </TableCell>
                  </TableRow>
                )
              : (
                  filtered.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {formatDayMonthTime(log.created_at)}
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
                  ))
                )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
