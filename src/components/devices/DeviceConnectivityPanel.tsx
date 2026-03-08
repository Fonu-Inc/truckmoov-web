import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DeviceHealthBadge, DeviceHealthStatus } from './DeviceHealthBadge';
import { 
  Activity, 
  Clock, 
  Timer, 
  AlertTriangle, 
  Wifi, 
  WifiOff,
  TrendingDown
} from 'lucide-react';
import { formatDistanceToNow, differenceInSeconds, differenceInMinutes } from 'date-fns';

interface DeviceConnectivityPanelProps {
  healthStatus: DeviceHealthStatus | null;
  lastSeen: string | null;
  lastHealthCheckAt: string | null;
  lastStatusChangeAt: string | null;
  expectedHeartbeatSeconds: number;
  onlineThresholdSeconds: number;
  offlineThresholdSeconds: number;
  lifecycleStatus: string;
}

export function DeviceConnectivityPanel({
  healthStatus,
  lastSeen,
  lastHealthCheckAt,
  lastStatusChangeAt,
  expectedHeartbeatSeconds = 60,
  onlineThresholdSeconds = 180,
  offlineThresholdSeconds = 600,
  lifecycleStatus
}: DeviceConnectivityPanelProps) {
  const now = new Date();
  const status = healthStatus || 'offline';
  
  // Calculate time since last seen
  const secondsSinceLastSeen = lastSeen 
    ? differenceInSeconds(now, new Date(lastSeen))
    : null;
  
  // Calculate offline duration if applicable
  const offlineDurationMinutes = lastStatusChangeAt && status === 'offline'
    ? differenceInMinutes(now, new Date(lastStatusChangeAt))
    : null;

  // Determine if device is in pre-verification state
  const isPreVerification = ['registered', 'config_pending', 'configured'].includes(lifecycleStatus);

  const getStatusIcon = () => {
    switch (status) {
      case 'online':
        return <Wifi className="h-5 w-5 text-emerald-500" />;
      case 'degraded':
        return <TrendingDown className="h-5 w-5 text-amber-500" />;
      case 'offline':
        return <WifiOff className="h-5 w-5 text-destructive" />;
      default:
        return <WifiOff className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'online':
        return 'Device is actively transmitting telemetry within expected intervals.';
      case 'degraded':
        return 'Heartbeat is delayed. Device may be experiencing connectivity issues.';
      case 'offline':
        return 'No telemetry received beyond offline threshold. Check device connectivity.';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Connectivity & Telemetry
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status Section */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Connection Status</p>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <DeviceHealthBadge 
                healthStatus={healthStatus} 
                lastSeen={lastSeen}
                size="lg"
              />
            </div>
          </div>
          {isPreVerification && (
            <Badge variant="secondary" className="text-xs">
              Awaiting First Signal
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {getStatusDescription()}
        </p>

        <Separator />

        {/* Timing Details */}
        <div className="grid grid-cols-2 gap-4">
          {/* Last Seen */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs">Last Telemetry</span>
            </div>
            <p className="font-mono text-sm">
              {lastSeen 
                ? formatDistanceToNow(new Date(lastSeen), { addSuffix: true })
                : 'Never received'
              }
            </p>
          </div>

          {/* Last Health Check */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              <span className="text-xs">Last Health Check</span>
            </div>
            <p className="font-mono text-sm">
              {lastHealthCheckAt 
                ? formatDistanceToNow(new Date(lastHealthCheckAt), { addSuffix: true })
                : 'Pending'
              }
            </p>
          </div>
        </div>

        <Separator />

        {/* Thresholds */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Heartbeat Configuration</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 bg-muted/50 rounded-md text-center">
              <p className="text-muted-foreground">Expected</p>
              <p className="font-mono font-medium">{expectedHeartbeatSeconds}s</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-md text-center">
              <p className="text-muted-foreground">Online ≤</p>
              <p className="font-mono font-medium text-primary">{onlineThresholdSeconds}s</p>
            </div>
            <div className="p-2 bg-destructive/10 rounded-md text-center">
              <p className="text-muted-foreground">Offline {'>'}</p>
              <p className="font-mono font-medium text-destructive">{offlineThresholdSeconds}s</p>
            </div>
          </div>
        </div>

        {/* Offline Duration Warning */}
        {status === 'offline' && offlineDurationMinutes !== null && (
          <>
            <Separator />
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Device Offline</p>
                <p className="text-xs text-muted-foreground">
                  Offline for {offlineDurationMinutes} minute{offlineDurationMinutes !== 1 ? 's' : ''}. 
                  Last status change: {lastStatusChangeAt 
                    ? formatDistanceToNow(new Date(lastStatusChangeAt), { addSuffix: true })
                    : 'Unknown'
                  }
                </p>
              </div>
            </div>
          </>
        )}

        {/* Degraded Warning */}
        {status === 'degraded' && secondsSinceLastSeen !== null && (
          <>
            <Separator />
            <div className="flex items-start gap-2 p-3 bg-secondary rounded-lg border">
              <Timer className="h-4 w-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-600">Degraded Connectivity</p>
                <p className="text-xs text-muted-foreground">
                  No heartbeat for {Math.round(secondsSinceLastSeen / 60)} minutes. 
                  Will transition to offline in {Math.max(0, Math.round((offlineThresholdSeconds - secondsSinceLastSeen) / 60))} minutes if no signal received.
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
