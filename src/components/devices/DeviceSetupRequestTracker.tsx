import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  DeviceSetupRequest,
  DeviceSetupRequestStatus,
} from '@/hooks/useDeviceSetupRequests';
import {
  Clock,
  UserPlus,
  Play,
  Radio,
  CheckCircle2,
  XCircle,
  Cpu,
  MapPin,
  Plus,
} from 'lucide-react';
import { format } from 'date-fns';

interface DeviceSetupRequestTrackerProps {
  requests: DeviceSetupRequest[];
  loading: boolean;
  onNewRequest: () => void;
  onCancelRequest: (id: string) => void;
}

const STATUS_STEPS: { key: DeviceSetupRequestStatus; label: string; icon: typeof Clock }[] = [
  { key: 'pending_review', label: 'Pending Review', icon: Clock },
  { key: 'assigned', label: 'Assigned', icon: UserPlus },
  { key: 'in_progress', label: 'In Progress', icon: Play },
  { key: 'awaiting_heartbeat', label: 'Awaiting Heartbeat', icon: Radio },
  { key: 'active', label: 'Active', icon: CheckCircle2 },
];

const STATUS_ORDER: Record<string, number> = {
  pending_review: 0,
  assigned: 1,
  in_progress: 2,
  awaiting_heartbeat: 3,
  active: 4,
  rejected: -1,
  cancelled: -1,
};

export function DeviceSetupRequestTracker({
  requests,
  loading,
  onNewRequest,
  onCancelRequest,
}: DeviceSetupRequestTrackerProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>My Device Requests</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  const activeRequests = requests.filter(r => !['active', 'rejected', 'cancelled'].includes(r.status));
  const pastRequests = requests.filter(r => ['active', 'rejected', 'cancelled'].includes(r.status));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" />
          My Device Requests
        </CardTitle>
        <Button size="sm" onClick={onNewRequest}>
          <Plus className="h-4 w-4 mr-1" /> Request Setup
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Cpu className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No device setup requests yet</p>
            <p className="text-sm mt-1">Request a device to be configured for your vehicle.</p>
            <Button className="mt-4" onClick={onNewRequest}>
              <Plus className="h-4 w-4 mr-2" /> Request Device Setup
            </Button>
          </div>
        ) : (
          <>
            {/* Active requests with progress tracker */}
            {activeRequests.map(req => {
              const currentStep = STATUS_ORDER[req.status] ?? 0;
              return (
                <div key={req.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{req.manufacturer} {req.model}</p>
                      <p className="text-xs text-muted-foreground font-mono">{req.imei}</p>
                      {req.vehicle_name && (
                        <p className="text-xs text-muted-foreground mt-0.5">→ {req.vehicle_name}</p>
                      )}
                    </div>
                    {req.status === 'pending_review' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => onCancelRequest(req.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>

                  {/* Progress Steps */}
                  <div className="flex items-center gap-1">
                    {STATUS_STEPS.map((step, i) => {
                      const StepIcon = step.icon;
                      const isComplete = currentStep > i;
                      const isCurrent = currentStep === i;
                      return (
                        <div key={step.key} className="flex items-center flex-1">
                          <div className={`flex flex-col items-center flex-1 ${
                            isComplete ? 'text-primary' : isCurrent ? 'text-primary' : 'text-muted-foreground/40'
                          }`}>
                            <div className={`h-7 w-7 rounded-full flex items-center justify-center border-2 ${
                              isComplete ? 'border-primary bg-primary/10'
                              : isCurrent ? 'border-primary bg-primary/5 animate-pulse'
                              : 'border-muted'
                            }`}>
                              <StepIcon className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-[10px] mt-1 text-center leading-tight">{step.label}</span>
                          </div>
                          {i < STATUS_STEPS.length - 1 && (
                            <div className={`h-0.5 w-full mx-0.5 mt-[-16px] ${
                              isComplete ? 'bg-primary' : 'bg-muted'
                            }`} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {req.assigned_to_name && (
                    <p className="text-xs text-muted-foreground">
                      Assigned to: <span className="font-medium">{req.assigned_to_name}</span>
                    </p>
                  )}
                  {(req.installation_state || req.installation_city) && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {[req.installation_city, req.installation_state].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Past requests */}
            {pastRequests.length > 0 && (
              <>
                <Separator />
                <p className="text-xs font-medium text-muted-foreground">Past Requests</p>
                {pastRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium">{req.manufacturer} {req.model}</p>
                      <p className="text-xs text-muted-foreground font-mono">{req.imei}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={req.status === 'active' ? 'default' : 'destructive'}>
                        {req.status === 'active' ? 'Active' : req.status === 'rejected' ? 'Rejected' : 'Cancelled'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(req.updated_at), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
