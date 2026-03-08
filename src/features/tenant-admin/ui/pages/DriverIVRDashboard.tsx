import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Phone, PhoneCall, PhoneOff, PhoneMissed, Check, X, Clock, RefreshCw, TrendingUp, Users, Activity } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface IVRCall {
  id: string;
  tenant_id: string;
  driver_phone: string;
  driver_name: string | null;
  job_id: string | null;
  call_type: string;
  call_status: string;
  driver_response: string | null;
  fonu_call_id: string | null;
  attempt_number: number;
  call_duration_seconds: number | null;
  response_received_at: string | null;
  job_details: Record<string, unknown>;
  created_at: string;
}

export default function DriverIVRDashboard() {
  const [calls, setCalls] = useState<IVRCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');

  const fetchCalls = async () => {
    setIsLoading(true);
    const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
    
    const { data, error } = await supabase
      .from('driver_ivr_calls')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(500);

    if (!error && data) {
      setCalls(data as IVRCall[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCalls();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('ivr-calls-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_ivr_calls' },
        () => fetchCalls()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dateRange]);

  const stats = useMemo(() => {
    const total = calls.length;
    const answered = calls.filter(c => c.call_status === 'answered').length;
    const noAnswer = calls.filter(c => c.call_status === 'no_answer').length;
    const accepted = calls.filter(c => c.driver_response === 'accepted').length;
    const rejected = calls.filter(c => c.driver_response === 'rejected').length;
    
    return {
      total,
      answered,
      noAnswer,
      accepted,
      rejected,
      answerRate: total > 0 ? ((answered / total) * 100).toFixed(1) : '0',
      acceptanceRate: answered > 0 ? ((accepted / answered) * 100).toFixed(1) : '0',
    };
  }, [calls]);

  const responseData = useMemo(() => [
    { name: 'Accepted', value: stats.accepted, color: 'hsl(var(--chart-1))' },
    { name: 'Rejected', value: stats.rejected, color: 'hsl(var(--chart-2))' },
    { name: 'No Response', value: stats.answered - stats.accepted - stats.rejected, color: 'hsl(var(--chart-3))' },
  ].filter(d => d.value > 0), [stats]);

  const callStatusData = useMemo(() => [
    { name: 'Answered', value: stats.answered, color: 'hsl(var(--chart-1))' },
    { name: 'No Answer', value: stats.noAnswer, color: 'hsl(var(--chart-4))' },
    { name: 'Other', value: stats.total - stats.answered - stats.noAnswer, color: 'hsl(var(--chart-5))' },
  ].filter(d => d.value > 0), [stats]);

  const callsByType = useMemo(() => {
    const types: Record<string, number> = {};
    calls.forEach(c => {
      types[c.call_type] = (types[c.call_type] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [calls]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      answered: { variant: 'default', icon: <PhoneCall className="h-3 w-3" /> },
      no_answer: { variant: 'secondary', icon: <PhoneMissed className="h-3 w-3" /> },
      busy: { variant: 'outline', icon: <PhoneOff className="h-3 w-3" /> },
      failed: { variant: 'destructive', icon: <X className="h-3 w-3" /> },
      initiated: { variant: 'outline', icon: <Phone className="h-3 w-3" /> },
      ringing: { variant: 'outline', icon: <Phone className="h-3 w-3" /> },
    };
    const config = variants[status] || { variant: 'outline' as const, icon: <Clock className="h-3 w-3" /> };
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getResponseBadge = (response: string | null) => {
    if (!response) return <Badge variant="outline">Pending</Badge>;
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      accepted: 'default',
      rejected: 'destructive',
      pending: 'secondary',
    };
    return (
      <Badge variant={variants[response] || 'outline'} className="gap-1">
        {response === 'accepted' ? <Check className="h-3 w-3" /> : response === 'rejected' ? <X className="h-3 w-3" /> : null}
        {response}
      </Badge>
    );
  };

  return (
    <DashboardLayout title="Driver IVR Dashboard" subtitle="Monitor IVR call outcomes and job acceptance rates">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24 hours</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={fetchCalls} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">IVR notifications sent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Answer Rate</CardTitle>
              <PhoneCall className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.answerRate}%</div>
              <p className="text-xs text-muted-foreground">{stats.answered} of {stats.total} answered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.acceptanceRate}%</div>
              <p className="text-xs text-muted-foreground">{stats.accepted} jobs accepted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <X className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground">Jobs rejected by drivers</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Call Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={callStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {callStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Driver Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={responseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {responseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Calls by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={callsByType}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Calls Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent IVR Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Call Status</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.slice(0, 20).map((call) => (
                  <TableRow key={call.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{call.driver_name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{call.driver_phone}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {call.job_id || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{call.call_type.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(call.call_status)}</TableCell>
                    <TableCell>{getResponseBadge(call.driver_response)}</TableCell>
                    <TableCell>
                      {call.call_duration_seconds ? `${call.call_duration_seconds}s` : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(call.created_at), 'MMM d, HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
                {calls.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No IVR calls found for this period
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}