import { formatDayMonth, toDate } from "@truckmoov/app-core/utils/time-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { ScrollArea } from '@/components/shadcn/scroll-area';
import { TimeRangeSelect, sliceByRange, type TimeRange } from '@/components/charts/TimeRangeSelect';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Activity, TrendingUp, TrendingDown, Clock, AlertTriangle, RefreshCw, Zap, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export function ApiUsageAnalytics() {
  const [daysRange, setDaysRange] = useState(30);
  const [requestsRange, setRequestsRange] = useState<TimeRange>("30d");
  const [errorsRange, setErrorsRange] = useState<TimeRange>("30d");
  const [latencyRange, setLatencyRange] = useState<TimeRange>("30d");

  const dailyUsage: any[] = [];
  const endpointUsage: any[] = [];
  const apiKeyUsage: any[] = [];
  const summary = { totalRequests: 0, successRate: 0, avgLatencyMs: 0, requestsToday: 0, errorRateToday: 0 };
  const isLoading = false;
  const refreshAnalytics = async () => {};

  const chartData = dailyUsage.map(d => ({
    date: formatDayMonth(d.date),
    requests: d.requests,
    errors: d.errorCount,
    latency: d.avgLatencyMs,
  }));

  const requestsData = sliceByRange(chartData, requestsRange);
  const errorsData = sliceByRange(chartData, errorsRange);
  const latencyData = sliceByRange(chartData, latencyRange);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">API Usage Analytics</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{daysRange} day period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {summary.successRate}%
              {summary.successRate >= 99 ? (
                <TrendingUp className="h-4 w-4 text-primary" />
              ) : summary.successRate < 95 ? (
                <TrendingDown className="h-4 w-4 text-destructive" />
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.errorRateToday > 0 ? (
                <span className="text-destructive">{summary.errorRateToday}% error rate today</span>
              ) : (
                'No errors today'
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Avg Latency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avgLatencyMs}ms</div>
            <p className="text-xs text-muted-foreground">Response time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.requestsToday.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Requests today</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Requests Over Time */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-base">Requests Over Time</CardTitle>
              <CardDescription>Daily API request volume</CardDescription>
            </div>
            <TimeRangeSelect value={requestsRange} onChange={setRequestsRange} />
          </CardHeader>
          <CardContent>
            {requestsData.length === 0 || summary.totalRequests === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No API usage data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={requestsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    name="Requests"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Error Rate Over Time */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-base">Errors Over Time</CardTitle>
              <CardDescription>Daily error count</CardDescription>
            </div>
            <TimeRangeSelect value={errorsRange} onChange={setErrorsRange} />
          </CardHeader>
          <CardContent>
            {errorsData.length === 0 || summary.totalRequests === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No API usage data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={errorsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="errors" fill="hsl(var(--destructive))" name="Errors" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Endpoints & API Key Usage */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Endpoints</CardTitle>
            <CardDescription>Most frequently called API endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            {endpointUsage.length === 0 ? (
              <p className="text-muted-foreground text-sm">No endpoint data yet</p>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {endpointUsage.map((endpoint, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={endpoint.method === 'GET' ? 'default' : 'secondary'}>
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm">{endpoint.endpoint}</code>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">{endpoint.requests} calls</span>
                        <Badge variant={endpoint.successRate >= 99 ? 'default' : endpoint.successRate >= 95 ? 'secondary' : 'destructive'}>
                          {endpoint.successRate}%
                        </Badge>
                        <span className="text-xs text-muted-foreground">{endpoint.avgLatencyMs}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Usage by API Key */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage by API Key</CardTitle>
            <CardDescription>Request distribution across API keys</CardDescription>
          </CardHeader>
          <CardContent>
            {apiKeyUsage.length === 0 ? (
              <p className="text-muted-foreground text-sm">No API keys with usage data</p>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {apiKeyUsage.map((key) => (
                    <div key={key.keyId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{key.keyName}</p>
                        <code className="text-xs text-muted-foreground">{key.keyPrefix}...</code>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">{key.requests.toLocaleString()} requests</span>
                        <Badge variant={key.successRate >= 99 ? 'default' : key.successRate >= 95 ? 'secondary' : 'destructive'}>
                          {key.successRate}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Response Time Distribution */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">Response Time Trend</CardTitle>
            <CardDescription>Average latency over time (ms)</CardDescription>
          </div>
          <TimeRangeSelect value={latencyRange} onChange={setLatencyRange} />
        </CardHeader>
        <CardContent>
          {latencyData.length === 0 || summary.totalRequests === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              No latency data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" unit="ms" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="latency"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name="Latency"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
