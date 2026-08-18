import { formatDayMonthTime, formatWithPattern, startOfDay, subDays, toDateParam } from "@truckmoov/app-core/utils/time-utils";
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';
import { TableToolbar, FilterValues } from '@/components/shadcn/table-toolbar';
import {Phone, PhoneCall, PhoneOff, PhoneMissed, Check, X, Clock, TrendingUp, CalendarDays, Download} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

const RANGE_OPTIONS = [
  { value: '0', label: 'Today' },
  { value: '1', label: 'Yesterday' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

function RangeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-[170px] text-xs font-semibold border-border bg-transparent hover:bg-secondary gap-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {RANGE_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function filterByRange<T extends { created_at: string }>(items: T[], range: string): T[] {
  const days = parseInt(range);
  if (range === '0') {
    const start = startOfDay(new Date());
    return items.filter((i) => new Date(i.created_at) >= start);
  }
  if (range === '1') {
    const start = startOfDay(subDays(new Date(), 1));
    const end = startOfDay(new Date());
    return items.filter((i) => {
      const d = new Date(i.created_at);
      return d >= start && d < end;
    });
  }
  const start = startOfDay(subDays(new Date(), days));
  return items.filter((i) => new Date(i.created_at) >= start);
}

// Dummy data for the Recent IVR Calls table
const DUMMY_CALLS: IVRCall[] = [
  { id: '1', tenant_id: 't', driver_phone: '+2348012345678', driver_name: 'Adewale Johnson', job_id: 'JOB-1042', call_type: 'job_offer', call_status: 'answered', driver_response: 'accepted', fonu_call_id: null, attempt_number: 1, call_duration_seconds: 47, response_received_at: null, job_details: {}, created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
  { id: '2', tenant_id: 't', driver_phone: '+2348023456789', driver_name: 'Chinedu Okafor', job_id: 'JOB-1041', call_type: 'job_offer', call_status: 'no_answer', driver_response: null, fonu_call_id: null, attempt_number: 2, call_duration_seconds: null, response_received_at: null, job_details: {}, created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
  { id: '3', tenant_id: 't', driver_phone: '+2348034567890', driver_name: 'Ibrahim Musa', job_id: 'JOB-1040', call_type: 'reminder', call_status: 'answered', driver_response: 'rejected', fonu_call_id: null, attempt_number: 1, call_duration_seconds: 22, response_received_at: null, job_details: {}, created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
  { id: '4', tenant_id: 't', driver_phone: '+2348045678901', driver_name: 'Funke Adebayo', job_id: 'JOB-1039', call_type: 'job_offer', call_status: 'answered', driver_response: 'accepted', fonu_call_id: null, attempt_number: 1, call_duration_seconds: 63, response_received_at: null, job_details: {}, created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
  { id: '5', tenant_id: 't', driver_phone: '+2348056789012', driver_name: 'Tunde Bakare', job_id: 'JOB-1038', call_type: 'cancellation', call_status: 'busy', driver_response: null, fonu_call_id: null, attempt_number: 1, call_duration_seconds: null, response_received_at: null, job_details: {}, created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() },
  { id: '6', tenant_id: 't', driver_phone: '+2348067890123', driver_name: 'Blessing Eze', job_id: 'JOB-1037', call_type: 'job_offer', call_status: 'failed', driver_response: null, fonu_call_id: null, attempt_number: 3, call_duration_seconds: null, response_received_at: null, job_details: {}, created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() },
  { id: '7', tenant_id: 't', driver_phone: '+2348078901234', driver_name: 'Segun Ola', job_id: 'JOB-1036', call_type: 'reminder', call_status: 'answered', driver_response: 'accepted', fonu_call_id: null, attempt_number: 1, call_duration_seconds: 31, response_received_at: null, job_details: {}, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: '8', tenant_id: 't', driver_phone: '+2348089012345', driver_name: 'Halima Yusuf', job_id: 'JOB-1035', call_type: 'job_offer', call_status: 'no_answer', driver_response: null, fonu_call_id: null, attempt_number: 2, call_duration_seconds: null, response_received_at: null, job_details: {}, created_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString() },
];

export function IVRDashboardTab() {
  const [calls] = useState<IVRCall[]>(DUMMY_CALLS);
  const [isLoading] = useState(false);

  // Per-chart range filters
  const [statusRange, setStatusRange] = useState('7');
  const [responseRange, setResponseRange] = useState('7');
  const [typeRange, setTypeRange] = useState('7');

  // Table filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filters, setFilters] = useState<FilterValues>({});

  const stats = useMemo(() => {
    const total = calls.length;
    const answered = calls.filter(c => c.call_status === 'answered').length;
    const noAnswer = calls.filter(c => c.call_status === 'no_answer').length;
    const accepted = calls.filter(c => c.driver_response === 'accepted').length;
    const rejected = calls.filter(c => c.driver_response === 'rejected').length;
    return {
      total, answered, noAnswer, accepted, rejected,
      answerRate: total > 0 ? ((answered / total) * 100).toFixed(1) : '0',
      acceptanceRate: answered > 0 ? ((accepted / answered) * 100).toFixed(1) : '0' };
  }, [calls]);

  const callStatusData = useMemo(() => {
    const scoped = filterByRange(calls, statusRange);
    const answered = scoped.filter(c => c.call_status === 'answered').length;
    const noAnswer = scoped.filter(c => c.call_status === 'no_answer').length;
    const other = scoped.length - answered - noAnswer;
    return [
      { name: 'Answered', value: answered, color: 'hsl(var(--chart-1))' },
      { name: 'No Answer', value: noAnswer, color: 'hsl(var(--chart-4))' },
      { name: 'Other', value: other, color: 'hsl(var(--chart-5))' },
    ].filter(d => d.value > 0);
  }, [calls, statusRange]);

  const responseData = useMemo(() => {
    const scoped = filterByRange(calls, responseRange);
    const answered = scoped.filter(c => c.call_status === 'answered').length;
    const accepted = scoped.filter(c => c.driver_response === 'accepted').length;
    const rejected = scoped.filter(c => c.driver_response === 'rejected').length;
    return [
      { name: 'Accepted', value: accepted, color: 'hsl(var(--chart-1))' },
      { name: 'Rejected', value: rejected, color: 'hsl(var(--chart-2))' },
      { name: 'No Response', value: Math.max(answered - accepted - rejected, 0), color: 'hsl(var(--chart-3))' },
    ].filter(d => d.value > 0);
  }, [calls, responseRange]);

  const callsByType = useMemo(() => {
    const scoped = filterByRange(calls, typeRange);
    const types: Record<string, number> = {};
    scoped.forEach(c => { types[c.call_type] = (types[c.call_type] || 0) + 1; });
    return Object.entries(types).map(([name, value]) => ({ name: name.replace('_', ' '), value }));
  }, [calls, typeRange]);

  const filteredCalls = useMemo(() => {
    return calls.filter((c) => {
      const q = search.trim().toLowerCase();
      if (q && !`${c.driver_name ?? ''} ${c.driver_phone} ${c.job_id ?? ''}`.toLowerCase().includes(q)) return false;
      if (statusFilter !== 'all' && c.call_status !== statusFilter) return false;
      const t = filters.type;
      if (t?.enabled && t.value && c.call_type !== t.value) return false;
      const dur = filters.duration;
      if (dur?.enabled) {
        const d = c.call_duration_seconds ?? 0;
        if (dur.from && d < Number(dur.from)) return false;
        if (dur.to && d > Number(dur.to)) return false;
      }
      const time = filters.time;
      if (time?.enabled) {
        const ts = new Date(c.created_at);
        if (time.dateFrom && ts < new Date(time.dateFrom)) return false;
        if (time.dateTo && ts > new Date(time.dateTo)) return false;
      }
      return true;
    });
  }, [calls, search, statusFilter, filters]);

  const handleExport = () => {
    const rows = [
      ['Driver', 'Phone', 'Job ID', 'Type', 'Status', 'Response', 'Duration (s)', 'Time'],
      ...filteredCalls.map((c) => [
        c.driver_name ?? 'Unknown',
        c.driver_phone,
        c.job_id ?? '',
        c.call_type,
        c.call_status,
        c.driver_response ?? '',
        c.call_duration_seconds ?? '',
        formatWithPattern(c.created_at, 'yyyy-MM-dd HH:mm'),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ivr-calls-${toDateParam(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      answered: { variant: 'default', icon: <PhoneCall className="h-3 w-3" /> },
      no_answer: { variant: 'secondary', icon: <PhoneMissed className="h-3 w-3" /> },
      busy: { variant: 'outline', icon: <PhoneOff className="h-3 w-3" /> },
      failed: { variant: 'destructive', icon: <X className="h-3 w-3" /> },
      initiated: { variant: 'outline', icon: <Phone className="h-3 w-3" /> },
      ringing: { variant: 'outline', icon: <Phone className="h-3 w-3" /> } };
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
      accepted: 'default', rejected: 'destructive', pending: 'secondary' };
    return (
      <Badge variant={variants[response] || 'outline'} className="gap-1">
        {response === 'accepted' ? <Check className="h-3 w-3" /> : response === 'rejected' ? <X className="h-3 w-3" /> : null}
        {response}
      </Badge>
    );
  };

  const callTypeOptions = useMemo(() => {
    const set = new Set(calls.map((c) => c.call_type));
    return Array.from(set).map((t) => ({ value: t, label: t.replace('_', ' ') }));
  }, [calls]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Calls', value: stats.total, hint: 'IVR notifications sent', Icon: Phone },
          { label: 'Answer Rate', value: `${stats.answerRate}%`, hint: `${stats.answered} of ${stats.total} answered`, Icon: PhoneCall },
          { label: 'Acceptance Rate', value: `${stats.acceptanceRate}%`, hint: `${stats.accepted} jobs accepted`, Icon: TrendingUp },
          { label: 'Rejected', value: stats.rejected, hint: 'Jobs rejected by drivers', Icon: X },
        ].map(({ label, value, hint, Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground truncate">{hint}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">Call Status Distribution</CardTitle>
              <CardDescription>Share of IVR calls by outcome — answered, missed, failed.</CardDescription>
            </div>
            <RangeSelect value={statusRange} onChange={setStatusRange} />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={callStatusData}
                  cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}
                >
                  {callStatusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">Driver Responses</CardTitle>
              <CardDescription>How drivers responded to IVR prompts (accept, reject, no input).</CardDescription>
            </div>
            <RangeSelect value={responseRange} onChange={setResponseRange} />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={responseData}
                  cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}
                >
                  {responseData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">Calls by Type</CardTitle>
              <CardDescription>Volume of IVR calls grouped by purpose (job offers, alerts, follow-ups).</CardDescription>
            </div>
            <RangeSelect value={typeRange} onChange={setTypeRange} />
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Recent IVR Calls</CardTitle>
            <CardDescription>Latest automated voice interactions with drivers — review outcomes and responses for follow-up.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search driver, phone or job ID..."
            status={statusFilter}
            onStatusChange={setStatusFilter}
            statusOptions={[
              { value: 'answered', label: 'Answered' },
              { value: 'no_answer', label: 'No Answer' },
              { value: 'busy', label: 'Busy' },
              { value: 'failed', label: 'Failed' },
              { value: 'initiated', label: 'Initiated' },
              { value: 'ringing', label: 'Ringing' },
            ]}
            filterEntity="calls"
            filterFields={[
              { type: 'select', key: 'type', label: 'Type', options: callTypeOptions },
              { type: 'range', key: 'duration', label: 'Duration (seconds)', placeholderFrom: 'Min', placeholderTo: 'Max' },
              { type: 'daterange', key: 'time', label: 'Time', placeholderFrom: 'From', placeholderTo: 'To' },
            ]}
            filterValues={filters}
            onFiltersApply={setFilters}
          />
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
              {filteredCalls.slice(0, 20).map((call) => (
                <TableRow key={call.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{call.driver_name || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground">{call.driver_phone}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{call.job_id || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{call.call_type.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(call.call_status)}</TableCell>
                  <TableCell>{getResponseBadge(call.driver_response)}</TableCell>
                  <TableCell>{call.call_duration_seconds ? `${call.call_duration_seconds}s` : '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDayMonthTime(call.created_at)}
                  </TableCell>
                </TableRow>
              ))}
              {filteredCalls.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No IVR calls found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
