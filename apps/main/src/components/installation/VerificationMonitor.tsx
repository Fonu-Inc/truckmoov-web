import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Input } from '@/components/shadcn/input';
import { Checkbox } from '@/components/shadcn/checkbox';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from '@/components/shadcn/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from '@/components/shadcn/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger } from '@/components/shadcn/popover';
import { ConfigQueueDevice } from '@/hooks/useInstallerConfig';
import { Skeleton } from '@/components/shadcn/skeleton';
import { formatDistanceToNow } from 'date-fns';
import {Radio, AlertTriangle, Check, Clock, Search, SlidersHorizontal as Filter, Hourglass, ShieldCheck, Download} from 'lucide-react';

interface VerificationMonitorProps {
  devices: ConfigQueueDevice[];
  loading: boolean;
  onRefresh: () => void;
  onTroubleshoot: (deviceId: string) => void;
}

export function VerificationMonitor({
  devices,
  loading,
  onTroubleshoot }: VerificationMonitorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const [lastSeenFilter, setLastSeenFilter] = useState<string>('all');
  const [timeSinceFrom, setTimeSinceFrom] = useState<string>('');
  const [timeSinceTo, setTimeSinceTo] = useState<string>('');

  const pendingDevices = devices.filter(d =>
    d.lifecycle_status === 'configured' &&
    (d as any).verification_status !== 'verified'
  );

  const failedDevices = devices.filter(d =>
    (d as any).verification_status === 'failed'
  );

  const verifiedToday = devices.filter(d =>
    d.lifecycle_status === 'verified_online' || d.lifecycle_status === 'assignable'
  ).length;

  const manufacturers = [...new Set(devices.map(d => d.manufacturer))];

  const matchesLastSeen = (device: ConfigQueueDevice) => {
    if (lastSeenFilter === 'all') return true;
    if (!device.last_seen) return lastSeenFilter === 'never';
    const hours = (Date.now() - new Date(device.last_seen).getTime()) / (1000 * 60 * 60);
    if (lastSeenFilter === '1h') return hours <= 1;
    if (lastSeenFilter === '24h') return hours <= 24;
    if (lastSeenFilter === '7d') return hours <= 24 * 7;
    if (lastSeenFilter === 'older') return hours > 24 * 7;
    return true;
  };

  const matchesTimeSinceConfigured = (device: ConfigQueueDevice) => {
    const configuredAt = (device as any).configured_at;
    if (!configuredAt) return !timeSinceFrom && !timeSinceTo;
    const t = new Date(configuredAt).getTime();
    if (timeSinceFrom && t < new Date(timeSinceFrom).getTime()) return false;
    if (timeSinceTo && t > new Date(timeSinceTo).getTime()) return false;
    return true;
  };

  const filtered = pendingDevices.filter(device => {
    const matchesSearch =
      device.imei.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (device.model?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const hasError = (device as any).verification_status === 'failed';
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'failed' && hasError) ||
      (statusFilter === 'waiting' && !hasError);

    const matchesDevice = deviceFilter === 'all' || device.manufacturer === deviceFilter;

    return matchesSearch && matchesStatus && matchesDevice && matchesLastSeen(device) && matchesTimeSinceConfigured(device);
  });

  const getTimeSinceConfigured = (device: ConfigQueueDevice) => {
    if (!(device as any).configured_at) return 'Unknown';
    return formatDistanceToNow(new Date((device as any).configured_at), { addSuffix: true });
  };

  const exportData = () => {
    const headers = ['IMEI', 'Manufacturer', 'Model', 'Status', 'Configured At', 'Last Seen', 'Error'];
    const rows = filtered.map(d => [
      d.imei,
      d.manufacturer,
      d.model || '',
      d.lifecycle_status,
      (d as any).configured_at || '',
      d.last_seen || '',
      (d as any).verification_error_message || '',
    ]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeFilterCount = [
    deviceFilter !== 'all',
    lastSeenFilter !== 'all',
    !!timeSinceFrom,
    !!timeSinceTo,
  ].filter(Boolean).length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verification Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              Verification Monitor
            </CardTitle>
            <CardDescription>
              Real-time monitoring of devices awaiting first telemetry
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* KPI Stats with leading icons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg border flex items-start gap-3">
            <div className="h-10 w-10 rounded-md bg-warning/10 flex items-center justify-center shrink-0">
              <Hourglass className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Awaiting Signal</p>
              <p className="text-2xl font-bold">{pendingDevices.length}</p>
            </div>
          </div>
          <div className="p-4 rounded-lg border flex items-start gap-3">
            <div className="h-10 w-10 rounded-md bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Failed Verification</p>
              <p className="text-2xl font-bold text-destructive">{failedDevices.length}</p>
            </div>
          </div>
          <div className="p-4 rounded-lg border flex items-start gap-3">
            <div className="h-10 w-10 rounded-md bg-success/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Verified Today</p>
              <p className="text-2xl font-bold text-success">{verifiedToday}</p>
            </div>
          </div>
        </div>

        {/* Search + Status + Filter */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by IMEI, manufacturer, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-transparent border-border"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-transparent border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="waiting">Waiting</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="w-[280px] p-3 rounded-xl">
              <div className="space-y-2.5">
                <h4 className="text-xs font-medium text-foreground px-0.5">
                  Only show devices by...
                </h4>

                {/* Device */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <Checkbox
                      checked={deviceFilter !== 'all'}
                      onCheckedChange={(c) => setDeviceFilter(c ? (manufacturers[0] ?? 'all') : 'all')}
                      className="h-3.5 w-3.5"
                    />
                    <span className={cn("text-xs font-medium", deviceFilter === 'all' && "text-muted-foreground")}>
                      Device
                    </span>
                  </label>
                  <Select
                    value={deviceFilter === 'all' ? '' : deviceFilter}
                    onValueChange={(v) => setDeviceFilter(v || 'all')}
                    disabled={deviceFilter === 'all'}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select device" />
                    </SelectTrigger>
                    <SelectContent>
                      {manufacturers.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Last seen */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <Checkbox
                      checked={lastSeenFilter !== 'all'}
                      onCheckedChange={(c) => setLastSeenFilter(c ? '24h' : 'all')}
                      className="h-3.5 w-3.5"
                    />
                    <span className={cn("text-xs font-medium", lastSeenFilter === 'all' && "text-muted-foreground")}>
                      Last seen
                    </span>
                  </label>
                  <Select
                    value={lastSeenFilter === 'all' ? '' : lastSeenFilter}
                    onValueChange={(v) => setLastSeenFilter(v || 'all')}
                    disabled={lastSeenFilter === 'all'}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Any time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Last hour</SelectItem>
                      <SelectItem value="24h">Last 24 hours</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="older">Older than 7 days</SelectItem>
                      <SelectItem value="never">Never seen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Time since configured */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <Checkbox
                      checked={!!timeSinceFrom || !!timeSinceTo}
                      onCheckedChange={(c) => {
                        if (!c) { setTimeSinceFrom(''); setTimeSinceTo(''); }
                      }}
                      className="h-3.5 w-3.5"
                    />
                    <span className={cn("text-xs font-medium", !timeSinceFrom && !timeSinceTo && "text-muted-foreground")}>
                      Time since configured
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Input
                      type="datetime-local"
                      placeholder="From"
                      value={timeSinceFrom}
                      onChange={(e) => setTimeSinceFrom(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Input
                      type="datetime-local"
                      placeholder="To"
                      value={timeSinceTo}
                      onChange={(e) => setTimeSinceTo(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <Button size="sm" className="flex-1 h-8 text-xs">
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => {
                      setDeviceFilter('all');
                      setLastSeenFilter('all');
                      setTimeSinceFrom('');
                      setTimeSinceTo('');
                    }}
                  >
                    Show All
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Pending Devices Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>IMEI</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time Since Configured</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Errors</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Check className="h-8 w-8 mx-auto mb-2 text-success" />
                    <p>{pendingDevices.length === 0 ? 'All configured devices have been verified!' : 'No devices match your filters'}</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(device => {
                  const hasError = (device as any).verification_status === 'failed';

                  return (
                    <TableRow key={device.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{device.manufacturer}</p>
                          <p className="text-xs text-muted-foreground">{device.model}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{device.imei}</TableCell>
                      <TableCell>
                        {hasError ? (
                          <Badge variant="destructive">Failed</Badge>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-sm">Waiting...</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getTimeSinceConfigured(device)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {device.last_seen
                          ? formatDistanceToNow(new Date(device.last_seen), { addSuffix: true })
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        {(device as any).verification_error_code ? (
                          <Badge variant="outline" className="text-destructive">
                            {(device as any).verification_error_code}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onTroubleshoot(device.id)}
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
