import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfigQueueDevice } from '@/hooks/useInstallerConfig';
import { DeviceLifecycleBadge } from '@/components/devices/DeviceLifecycleBadge';
import { DeviceLifecycleStatus } from '@/hooks/useDeviceLifecycle';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import {
  Radio,
  RefreshCw,
  AlertTriangle,
  Check,
  Clock,
  Download,
  Loader2,
} from 'lucide-react';

interface VerificationMonitorProps {
  devices: ConfigQueueDevice[];
  loading: boolean;
  onRefresh: () => void;
  onTroubleshoot: (deviceId: string) => void;
}

export function VerificationMonitor({
  devices,
  loading,
  onRefresh,
  onTroubleshoot,
}: VerificationMonitorProps) {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh every 30 seconds when enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      onRefresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, onRefresh]);

  const pendingDevices = devices.filter(d => 
    d.lifecycle_status === 'configured' && 
    (d as any).verification_status !== 'verified'
  );

  const failedDevices = devices.filter(d => 
    (d as any).verification_status === 'failed'
  );

  const getTimeSinceConfigured = (device: ConfigQueueDevice) => {
    if (!(device as any).configured_at) return 'Unknown';
    return formatDistanceToNow(new Date((device as any).configured_at), { addSuffix: true });
  };

  const exportToCSV = () => {
    const headers = ['IMEI', 'Manufacturer', 'Model', 'Status', 'Configured At', 'Last Seen', 'Error'];
    const rows = pendingDevices.map(d => [
      d.imei,
      d.manufacturer,
      d.model || '',
      d.lifecycle_status,
      (d as any).configured_at || '',
      d.last_seen || '',
      (d as any).verification_error_message || '',
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification-pending-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Auto-refresh ON
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Auto-refresh OFF
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Awaiting Signal</span>
            </div>
            <p className="text-2xl font-bold">{pendingDevices.length}</p>
          </div>
          <div className="p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Failed Verification</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{failedDevices.length}</p>
          </div>
          <div className="p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Check className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">Verified Today</span>
            </div>
            <p className="text-2xl font-bold text-success">
              {devices.filter(d => 
                d.lifecycle_status === 'verified_online' || 
                d.lifecycle_status === 'assignable'
              ).length}
            </p>
          </div>
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
              {pendingDevices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Check className="h-8 w-8 mx-auto mb-2 text-success" />
                    <p>All configured devices have been verified!</p>
                  </TableCell>
                </TableRow>
              ) : (
                pendingDevices.map(device => {
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
