import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Clock,
  RotateCcw,
  HardDrive,
  Link,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { DeviceLinkingResolver } from "./DeviceLinkingResolver";

interface ActivationBatch {
  id: string;
  request_id: string | null;
  tenant_id: string;
  tenant_name: string | null;
  activation_mode: string;
  quantity: number;
  operator: string | null;
  data_limit_gb: number | null;
  requested_plan: string | null;
  status: string;
  sims_activated: number | null;
  sims_failed: number | null;
  fonu_batch_id: string | null;
  fonu_response: {
    results?: Array<{
      iccid: string;
      msisdn?: string;
      fonu_sim_id?: string;
      status: string;
    }>;
    device_linking?: {
      results: Array<{
        device_id: string;
        device_name: string;
        imei: string;
        sim_iccid: string;
        action: 'created' | 'updated';
        success: boolean;
      }>;
      exceptions: Array<{
        row_index: number;
        device_name: string;
        imei: string;
        reason: string;
        type: string;
      }>;
      summary: {
        total_mappings: number;
        devices_linked: number;
        exceptions_count: number;
      };
    };
  } | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export function ActivationBatchesPanel() {
  const { user } = useAuthStore();
  const [batches, setBatches] = useState<ActivationBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<ActivationBatch | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [resolverBatch, setResolverBatch] = useState<ActivationBatch | null>(null);
  const [isResolverOpen, setIsResolverOpen] = useState(false);

  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sim_activation_batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBatches((data || []) as ActivationBatch[]);
    } catch (err) {
      console.error('Error fetching activation batches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleInitiateActivation = async (batch: ActivationBatch) => {
    setActivating(batch.id);
    try {
      toast.info('Starting SIM activation...', {
        description: `Processing ${batch.quantity} SIM(s)`,
      });

      const { data, error } = await supabase.functions.invoke('fonu-sim', {
        body: {
          action: 'initiate_activation',
          batchId: batch.id,
          tenantId: batch.tenant_id,
          quantity: batch.quantity,
          operator: batch.operator,
          plan: batch.requested_plan,
          dataLimitMb: batch.data_limit_gb ? batch.data_limit_gb * 1024 : 1000,
          // Pass who triggered the activation for audit logging
          triggeredById: user?.id,
          triggeredByName: user?.name || 'Platform Admin',
        },
      });

      if (error) throw error;

      const result = data as {
        success: boolean;
        status: string;
        summary: { total: number; activated: number; failed: number };
      };

      if (result.status === 'completed') {
        toast.success('Activation Complete', {
          description: `${result.summary.activated} SIM(s) activated successfully`,
        });
      } else if (result.status === 'partially_completed') {
        toast.warning('Partial Activation', {
          description: `${result.summary.activated} activated, ${result.summary.failed} failed`,
        });
      } else {
        toast.error('Activation Failed', {
          description: `${result.summary.failed} SIM(s) failed to activate`,
        });
      }

      await fetchBatches();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initiate activation';
      toast.error(message);
    } finally {
      setActivating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-muted text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'activation_in_progress':
        return (
          <Badge className="bg-primary/10 text-primary border-primary/30">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            In Progress
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-success/10 text-success border-success/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'partially_completed':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/30">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Partial
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProgressPercentage = (batch: ActivationBatch) => {
    if (batch.status === 'pending') return 0;
    if (batch.status === 'completed') return 100;
    const activated = batch.sims_activated || 0;
    const failed = batch.sims_failed || 0;
    const total = batch.quantity || 1;
    return Math.round(((activated + failed) / total) * 100);
  };

  const pendingBatches = batches.filter(b => b.status === 'pending');
  const processingBatches = batches.filter(b => b.status === 'activation_in_progress');
  
  // Count total exceptions across all completed batches
  const totalExceptions = batches.reduce((sum, b) => {
    return sum + (b.fonu_response?.device_linking?.summary?.exceptions_count || 0);
  }, 0);
  
  const batchesWithExceptions = batches.filter(
    b => (b.fonu_response?.device_linking?.summary?.exceptions_count || 0) > 0
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Activation</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBatches.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting auto-activation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{processingBatches.length}</div>
            <p className="text-xs text-muted-foreground">Currently activating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SIMs Queued</CardTitle>
            <Zap className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {pendingBatches.reduce((sum, b) => sum + b.quantity, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting activation</p>
          </CardContent>
        </Card>

        <Card className={totalExceptions > 0 ? 'border-warning/50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertCircle className={`h-4 w-4 ${totalExceptions > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalExceptions > 0 ? 'text-warning' : ''}`}>
              {totalExceptions}
            </div>
            <p className="text-xs text-muted-foreground">
              {batchesWithExceptions.length > 0 
                ? `${batchesWithExceptions.length} batch(es) with exceptions`
                : 'No device linking issues'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activation Batches Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Activation Batches
          </CardTitle>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activation batches yet</p>
              <p className="text-sm">Batches are auto-created and activated when SIM requests are approved</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">
                      {batch.tenant_name || batch.tenant_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {batch.activation_mode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">{batch.quantity}</span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {batch.operator || 'Any'}
                    </TableCell>
                    <TableCell className="w-32">
                      <div className="space-y-1">
                        <Progress value={getProgressPercentage(batch)} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {batch.sims_activated || 0} / {batch.quantity}
                          {(batch.sims_failed || 0) > 0 && (
                            <span className="text-destructive ml-1">
                              ({batch.sims_failed} failed)
                            </span>
                          )}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(batch.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(batch.created_at), 'MMM d, HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(batch.status === 'pending' || batch.status === 'failed' || batch.status === 'partially_completed') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleInitiateActivation(batch)}
                            disabled={activating === batch.id}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Retry
                          </Button>
                        )}
                        {(batch.fonu_response?.device_linking?.summary?.exceptions_count || 0) > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-warning/50 text-warning hover:bg-warning/10"
                            onClick={() => {
                              setResolverBatch(batch);
                              setIsResolverOpen(true);
                            }}
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedBatch(batch);
                            setIsDetailsOpen(true);
                          }}
                        >
                          Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Batch Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Activation Batch Details</DialogTitle>
            <DialogDescription>
              Batch #{selectedBatch?.id.slice(0, 8)} • {selectedBatch?.tenant_name}
            </DialogDescription>
          </DialogHeader>

          {selectedBatch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedBatch.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mode</p>
                  <p className="font-medium capitalize">{selectedBatch.activation_mode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">{selectedBatch.quantity} SIM(s)</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Operator</p>
                  <p className="font-medium">{selectedBatch.operator || 'Any'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="font-medium">{selectedBatch.requested_plan || 'Standard'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Limit</p>
                  <p className="font-medium">
                    {selectedBatch.data_limit_gb ? `${selectedBatch.data_limit_gb} GB` : 'Standard'}
                  </p>
                </div>
              </div>

              {/* Fonu Batch Reference */}
              {selectedBatch.fonu_batch_id && (
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">Fonu Batch ID</p>
                  <p className="font-mono text-xs">{selectedBatch.fonu_batch_id}</p>
                </div>
              )}

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>
                    {selectedBatch.sims_activated || 0} activated, {selectedBatch.sims_failed || 0} failed
                  </span>
                </div>
                <Progress value={getProgressPercentage(selectedBatch)} />
              </div>

              {/* Error Message */}
              {selectedBatch.error_message && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                  {selectedBatch.error_message}
                </div>
              )}

              {/* Activation Results */}
              {selectedBatch.fonu_response?.results && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Activation Results</p>
                  <div className="max-h-48 overflow-y-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ICCID</TableHead>
                          <TableHead>MSISDN</TableHead>
                          <TableHead>Fonu SIM ID</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedBatch.fonu_response.results.map((result, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-xs">
                              {result.iccid?.slice(-10)}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {result.msisdn || '-'}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {result.fonu_sim_id || '-'}
                            </TableCell>
                            <TableCell>
                              {result.status === 'activated' ? (
                                <Badge className="bg-success/10 text-success">Activated</Badge>
                              ) : (
                                <Badge variant="destructive">Failed</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Device Linking Results */}
              {selectedBatch.fonu_response?.device_linking && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    <p className="text-sm font-medium">Device Linking</p>
                    <Badge variant="outline" className="text-xs">
                      {selectedBatch.fonu_response.device_linking.summary.devices_linked} linked
                    </Badge>
                    {selectedBatch.fonu_response.device_linking.summary.exceptions_count > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {selectedBatch.fonu_response.device_linking.summary.exceptions_count} exceptions
                      </Badge>
                    )}
                  </div>

                  {/* Linked Devices */}
                  {selectedBatch.fonu_response.device_linking.results.length > 0 && (
                    <div className="max-h-32 overflow-y-auto border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Device</TableHead>
                            <TableHead>IMEI</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedBatch.fonu_response.device_linking.results.map((device, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-xs">
                                {device.device_name}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {device.imei.slice(-8)}
                              </TableCell>
                              <TableCell>
                                <Badge className={device.action === 'created' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}>
                                  <Link className="h-3 w-3 mr-1" />
                                  {device.action === 'created' ? 'Created & Linked' : 'Updated'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Exceptions - Needs Attention */}
                  {selectedBatch.fonu_response.device_linking.exceptions.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-warning">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-sm font-medium">Needs Attention</p>
                      </div>
                      <div className="max-h-32 overflow-y-auto border border-warning/30 rounded-md bg-warning/5">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Row</TableHead>
                              <TableHead>Device</TableHead>
                              <TableHead>IMEI</TableHead>
                              <TableHead>Issue</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedBatch.fonu_response.device_linking.exceptions.map((exception, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="text-xs">
                                  #{exception.row_index + 1}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {exception.device_name}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {exception.imei || '-'}
                                </TableCell>
                                <TableCell className="text-xs text-destructive">
                                  {exception.reason}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p>{format(new Date(selectedBatch.created_at), 'MMM d, HH:mm')}</p>
                </div>
                {selectedBatch.started_at && (
                  <div>
                    <p className="text-muted-foreground">Started</p>
                    <p>{format(new Date(selectedBatch.started_at), 'MMM d, HH:mm')}</p>
                  </div>
                )}
                {selectedBatch.completed_at && (
                  <div>
                    <p className="text-muted-foreground">Completed</p>
                    <p>{format(new Date(selectedBatch.completed_at), 'MMM d, HH:mm')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
            {selectedBatch?.status === 'pending' && (
              <Button
                onClick={() => {
                  handleInitiateActivation(selectedBatch);
                  setIsDetailsOpen(false);
                }}
              >
                <Play className="h-4 w-4 mr-2" />
                Initiate Activation
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Device Linking Resolver */}
      {resolverBatch && (
        <DeviceLinkingResolver
          open={isResolverOpen}
          onOpenChange={setIsResolverOpen}
          batchId={resolverBatch.id}
          tenantId={resolverBatch.tenant_id}
          exceptions={resolverBatch.fonu_response?.device_linking?.exceptions || []}
          onResolved={fetchBatches}
        />
      )}
    </div>
  );
}
