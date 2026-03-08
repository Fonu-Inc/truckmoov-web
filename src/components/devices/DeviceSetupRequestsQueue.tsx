import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DeviceSetupRequest,
  DeviceSetupRequestStatus,
} from '@/hooks/useDeviceSetupRequests';
import {
  MoreHorizontal,
  UserPlus,
  Play,
  Radio,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  Search,
  RefreshCw,
  MapPin,
  Calendar,
  Wrench,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import { format } from 'date-fns';

interface DeviceSetupRequestsQueueProps {
  requests: DeviceSetupRequest[];
  loading: boolean;
  onRefresh: () => void;
  onUpdateStatus: (
    requestId: string,
    newStatus: DeviceSetupRequestStatus,
    updates?: Record<string, unknown>,
    notes?: string,
  ) => Promise<unknown>;
  onOpenWizard?: (request: DeviceSetupRequest) => void;
  isConfigurator: boolean;
  /** When true, all actions are flagged as support mode with audit logging */
  isSupportMode?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  pending_review: { label: 'Pending Review', variant: 'secondary', icon: Clock },
  assigned: { label: 'Assigned', variant: 'default', icon: UserPlus },
  in_progress: { label: 'In Progress', variant: 'default', icon: Play },
  awaiting_heartbeat: { label: 'Awaiting Heartbeat', variant: 'outline', icon: Radio },
  active: { label: 'Active', variant: 'default', icon: CheckCircle2 },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
  cancelled: { label: 'Cancelled', variant: 'secondary', icon: XCircle },
};

const TRACKER_LABELS: Record<string, string> = {
  obd: 'OBD-II',
  hardwired: 'Hardwired',
  battery: 'Battery',
};

export function DeviceSetupRequestsQueue({
  requests,
  loading,
  onRefresh,
  onUpdateStatus,
  onOpenWizard,
  isConfigurator,
  isSupportMode = false,
}: DeviceSetupRequestsQueueProps) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('pending');
  const [detailRequest, setDetailRequest] = useState<DeviceSetupRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const filtered = requests.filter(r => {
    const matchSearch = !search || 
      r.imei.toLowerCase().includes(search.toLowerCase()) ||
      r.manufacturer.toLowerCase().includes(search.toLowerCase()) ||
      r.requester_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.vehicle_name?.toLowerCase().includes(search.toLowerCase());

    if (tab === 'pending') return matchSearch && r.status === 'pending_review';
    if (tab === 'active') return matchSearch && ['assigned', 'in_progress', 'awaiting_heartbeat'].includes(r.status);
    if (tab === 'completed') return matchSearch && ['active', 'rejected', 'cancelled'].includes(r.status);
    return matchSearch;
  });

  // Wrap status updates to inject support mode flags
  const handleStatusUpdate = (
    requestId: string,
    newStatus: DeviceSetupRequestStatus,
    extraUpdates?: Record<string, unknown>,
    notes?: string,
  ) => {
    const supportUpdates = isSupportMode
      ? { is_support_mode: true, support_actor_id: null, ...extraUpdates }
      : extraUpdates;
    const supportNotes = isSupportMode
      ? `[SUPPORT MODE] ${notes || newStatus}`
      : notes;
    return onUpdateStatus(requestId, newStatus, supportUpdates, supportNotes);
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    await handleStatusUpdate(rejectingId, 'rejected', { rejection_reason: rejectionReason }, rejectionReason);
    setShowRejectDialog(false);
    setRejectingId(null);
    setRejectionReason('');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Device Setup Requests</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            Device Setup Requests
            {isSupportMode && (
              <Badge variant="outline" className="border-warning text-warning ml-2">
                Support Mode
              </Badge>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by IMEI, manufacturer, requester..."
                className="pl-9"
              />
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({requests.filter(r => r.status === 'pending_review').length})
              </TabsTrigger>
              <TabsTrigger value="active">
                In Progress ({requests.filter(r => ['assigned', 'in_progress', 'awaiting_heartbeat'].includes(r.status)).length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({requests.filter(r => ['active', 'rejected', 'cancelled'].includes(r.status)).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={tab} className="mt-4">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Cpu className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No requests in this category</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Device</TableHead>
                        <TableHead>Requester</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(req => {
                        const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending_review;
                        const StatusIcon = statusCfg.icon;
                        return (
                          <TableRow key={req.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{req.manufacturer} {req.model}</p>
                                <p className="text-xs text-muted-foreground font-mono">{req.imei}</p>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {TRACKER_LABELS[req.tracker_type] || req.tracker_type}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{req.requester_name || '—'}</p>
                              {req.needs_sim && (
                                <Badge variant="secondary" className="text-xs mt-1">Needs SIM</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{req.vehicle_name || '—'}</p>
                            </TableCell>
                            <TableCell>
                              {req.installation_state || req.installation_city ? (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {[req.installation_city, req.installation_state].filter(Boolean).join(', ')}
                                </div>
                              ) : '—'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusCfg.variant} className="flex items-center gap-1 w-fit">
                                <StatusIcon className="h-3 w-3" />
                                {statusCfg.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(req.created_at), 'dd MMM yyyy')}
                                {req.preferred_date && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(req.preferred_date), 'dd MMM')}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setDetailRequest(req)}>
                                    <Eye className="h-4 w-4 mr-2" /> View Details
                                  </DropdownMenuItem>
                                  {isConfigurator && req.status === 'pending_review' && (
                                    <>
                                      <DropdownMenuItem onClick={() => handleStatusUpdate(req.id, 'assigned')}>
                                        <UserPlus className="h-4 w-4 mr-2" /> Assign to Me
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => { setRejectingId(req.id); setShowRejectDialog(true); }}
                                      >
                                        <XCircle className="h-4 w-4 mr-2" /> Reject
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {isConfigurator && req.status === 'assigned' && (
                                    <DropdownMenuItem onClick={() => {
                                      handleStatusUpdate(req.id, 'in_progress');
                                      onOpenWizard?.(req);
                                    }}>
                                      <Wrench className="h-4 w-4 mr-2" /> Start Configuration
                                    </DropdownMenuItem>
                                  )}
                                  {isConfigurator && req.status === 'in_progress' && (
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(req.id, 'awaiting_heartbeat')}>
                                      <Radio className="h-4 w-4 mr-2" /> Mark Awaiting Heartbeat
                                    </DropdownMenuItem>
                                  )}
                                  {isConfigurator && req.status === 'awaiting_heartbeat' && (
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(req.id, 'active')}>
                                      <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Active
                                    </DropdownMenuItem>
                                  )}
                                  {req.status === 'pending_review' && !isConfigurator && (
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => handleStatusUpdate(req.id, 'cancelled')}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" /> Cancel Request
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!detailRequest} onOpenChange={() => setDetailRequest(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription className="sr-only">Device setup request details</DialogDescription>
          </DialogHeader>
          {detailRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Manufacturer</span><p className="font-medium">{detailRequest.manufacturer}</p></div>
                <div><span className="text-muted-foreground">Model</span><p className="font-medium">{detailRequest.model || '—'}</p></div>
                <div><span className="text-muted-foreground">IMEI</span><p className="font-mono">{detailRequest.imei}</p></div>
                <div><span className="text-muted-foreground">Tracker Type</span><p>{TRACKER_LABELS[detailRequest.tracker_type] || detailRequest.tracker_type}</p></div>
                <div><span className="text-muted-foreground">Vehicle</span><p>{detailRequest.vehicle_name || '—'}</p></div>
                <div><span className="text-muted-foreground">Requester</span><p>{detailRequest.requester_name || '—'}</p></div>
              </div>
              <Separator />
              {(detailRequest.installation_state || detailRequest.installation_city) && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Installation Location</span>
                  <p>{[detailRequest.installation_city, detailRequest.installation_state].filter(Boolean).join(', ')}</p>
                </div>
              )}
              {detailRequest.preferred_date && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Preferred Date</span>
                  <p>{format(new Date(detailRequest.preferred_date), 'dd MMMM yyyy')} {detailRequest.preferred_time && `(${detailRequest.preferred_time})`}</p>
                </div>
              )}
              {detailRequest.sim_iccid && (
                <div className="text-sm">
                  <span className="text-muted-foreground">SIM ICCID</span>
                  <p className="font-mono">{detailRequest.sim_iccid}</p>
                </div>
              )}
              {detailRequest.needs_sim && (
                <Badge variant="secondary">SIM Requested</Badge>
              )}
              {detailRequest.requester_notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Notes</span>
                  <p className="whitespace-pre-wrap">{detailRequest.requester_notes}</p>
                </div>
              )}
              {detailRequest.assigned_to_name && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Assigned To</span>
                  <p>{detailRequest.assigned_to_name}</p>
                </div>
              )}
              {detailRequest.rejection_reason && (
                <div className="text-sm">
                  <span className="text-muted-foreground text-destructive">Rejection Reason</span>
                  <p className="text-destructive">{detailRequest.rejection_reason}</p>
                </div>
              )}
              {detailRequest.configurator_notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Configurator Notes</span>
                  <p className="whitespace-pre-wrap">{detailRequest.configurator_notes}</p>
                </div>
              )}
              {detailRequest.is_support_mode && (
                <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
                  <ShieldAlert className="h-4 w-4 text-warning" />
                  <div className="text-sm">
                    <p className="font-medium text-warning">Support Mode</p>
                    <p className="text-xs text-muted-foreground">
                      This request was handled via Platform Support with audit logging.
                      {detailRequest.support_actor_id && ` Actor: ${detailRequest.support_actor_id.slice(0, 8)}...`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>Provide a reason for rejection.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder="Reason for rejection..."
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>
              Reject Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
