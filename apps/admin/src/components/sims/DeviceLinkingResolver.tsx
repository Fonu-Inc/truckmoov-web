import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { Badge } from "@/components/shadcn/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  Link,
  Unlink,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HardDrive,
  Smartphone,
  ArrowRight,
  SkipForward,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeviceLinkingException {
  row_index: number;
  device_name: string;
  imei: string;
  reason: string;
  type: string;
}

interface UnlinkedSIM {
  id: string;
  iccid: string;
  msisdn: string;
  status: string;
}

interface UnlinkedDevice {
  id: string;
  imei: string;
  model: string | null;
  device_name: string;
  from_mapping: boolean;
}

interface ManualLink {
  sim_id: string;
  device_id: string;
  sim_iccid: string;
  device_imei: string;
}

interface DeviceLinkingResolverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  tenantId: string;
  exceptions: DeviceLinkingException[];
  onResolved: () => void;
}

export function DeviceLinkingResolver({
  open,
  onOpenChange,
  batchId,
  tenantId,
  exceptions,
  onResolved,
}: DeviceLinkingResolverProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unlinkedSims, setUnlinkedSims] = useState<UnlinkedSIM[]>([]);
  const [unlinkedDevices, setUnlinkedDevices] = useState<UnlinkedDevice[]>([]);
  const [manualLinks, setManualLinks] = useState<ManualLink[]>([]);
  const [skippedExceptions, setSkippedExceptions] = useState<number[]>([]);

  useEffect(() => {
    if (open) {
      fetchUnlinkedItems();
    }
  }, [open, batchId, tenantId]);

  const fetchUnlinkedItems = async () => {
    setLoading(true);
    try {
      // Fetch SIMs that are activated but not linked to any device
      const { data: sims, error: simsError } = await supabase
        .from('iot_sims')
        .select('id, iccid, msisdn, status')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .is('device_id', null);

      if (simsError) throw simsError;

      // Fetch devices that don't have a SIM assigned
      const { data: devices, error: devicesError } = await supabase
        .from('devices')
        .select('id, imei, model, device_config')
        .eq('tenant_id', tenantId)
        .is('sim_id', null);

      if (devicesError) throw devicesError;

      setUnlinkedSims((sims || []) as UnlinkedSIM[]);
      
      // Map devices and include device_name from config or mapping
      const mappedDevices: UnlinkedDevice[] = (devices || []).map((d: any) => ({
        id: d.id,
        imei: d.imei,
        model: d.model,
        device_name: d.device_config?.device_name || `Device ${d.imei.slice(-6)}`,
        from_mapping: d.device_config?.created_from_mapping || false,
      }));
      
      // Also add devices from exceptions that weren't created
      for (const ex of exceptions) {
        if (ex.type === 'creation_failed' && ex.imei) {
          const exists = mappedDevices.some(d => d.imei === ex.imei);
          if (!exists) {
            mappedDevices.push({
              id: `pending_${ex.row_index}`,
              imei: ex.imei,
              model: null,
              device_name: ex.device_name,
              from_mapping: true,
            });
          }
        }
      }
      
      setUnlinkedDevices(mappedDevices);
    } catch (err) {
      console.error('Error fetching unlinked items:', err);
      toast.error('Failed to load unlinked items');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkSelection = (simId: string, deviceId: string) => {
    // Remove any existing link for this SIM or device
    const filtered = manualLinks.filter(
      l => l.sim_id !== simId && l.device_id !== deviceId
    );
    
    if (deviceId && deviceId !== 'none') {
      const sim = unlinkedSims.find(s => s.id === simId);
      const device = unlinkedDevices.find(d => d.id === deviceId);
      
      if (sim && device) {
        filtered.push({
          sim_id: simId,
          device_id: deviceId,
          sim_iccid: sim.iccid,
          device_imei: device.imei,
        });
      }
    }
    
    setManualLinks(filtered);
  };

  const handleSkipException = (rowIndex: number) => {
    if (skippedExceptions.includes(rowIndex)) {
      setSkippedExceptions(skippedExceptions.filter(i => i !== rowIndex));
    } else {
      setSkippedExceptions([...skippedExceptions, rowIndex]);
    }
  };

  const handleAutoLink = () => {
    // Auto-link first N unlinked SIMs to first N unlinked devices
    const links: ManualLink[] = [];
    const availableSims = unlinkedSims.filter(
      s => !manualLinks.some(l => l.sim_id === s.id)
    );
    const availableDevices = unlinkedDevices.filter(
      d => !manualLinks.some(l => l.device_id === d.id) && !d.id.startsWith('pending_')
    );
    
    const count = Math.min(availableSims.length, availableDevices.length);
    for (let i = 0; i < count; i++) {
      links.push({
        sim_id: availableSims[i].id,
        device_id: availableDevices[i].id,
        sim_iccid: availableSims[i].iccid,
        device_imei: availableDevices[i].imei,
      });
    }
    
    setManualLinks([...manualLinks, ...links]);
    toast.success(`Auto-linked ${count} SIM-device pairs`);
  };

  const handleSaveLinks = async () => {
    if (manualLinks.length === 0 && skippedExceptions.length === 0) {
      toast.info('No changes to save');
      return;
    }

    setSaving(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Process manual links
      for (const link of manualLinks) {
        // Skip pending devices (need to create first)
        if (link.device_id.startsWith('pending_')) {
          // Create the device first
          const exception = exceptions.find(
            e => `pending_${e.row_index}` === link.device_id
          );
          
          if (exception) {
            const { data: newDevice, error: createError } = await supabase
              .from('devices')
              .insert({
                imei: exception.imei,
                manufacturer: 'Manual Resolution',
                status: 'registered',
                tenant_id: tenantId,
                device_config: {
                  device_name: exception.device_name,
                  created_from_resolution: true,
                },
              })
              .select('id')
              .single();

            if (createError) {
              console.error('Failed to create device:', createError);
              failCount++;
              continue;
            }

            // Update the link with the real device ID
            link.device_id = newDevice.id;
          }
        }

        // Update device with SIM
        const { error: deviceError } = await supabase
          .from('devices')
          .update({ sim_id: link.sim_id })
          .eq('id', link.device_id);

        if (deviceError) {
          console.error('Failed to update device:', deviceError);
          failCount++;
          continue;
        }

        // Update SIM with device
        const { error: simError } = await supabase
          .from('iot_sims')
          .update({ device_id: link.device_id })
          .eq('id', link.sim_id);

        if (simError) {
          console.error('Failed to update SIM:', simError);
          failCount++;
          continue;
        }

        successCount++;
      }

      // Update batch to mark exceptions as resolved
      if (skippedExceptions.length > 0 || successCount > 0) {
        const { data: batch } = await supabase
          .from('sim_activation_batches')
          .select('fonu_response')
          .eq('id', batchId)
          .single();

        if (batch?.fonu_response && typeof batch.fonu_response === 'object') {
          const updatedResponse = { ...(batch.fonu_response as Record<string, any>) };
          if (updatedResponse.device_linking) {
            // Mark resolved exceptions
            updatedResponse.device_linking.resolved_count = 
              (updatedResponse.device_linking.resolved_count || 0) + successCount + skippedExceptions.length;
            updatedResponse.device_linking.manual_links = manualLinks.map(l => ({
              sim_iccid: l.sim_iccid,
              device_imei: l.device_imei,
            }));
          }

          await supabase
            .from('sim_activation_batches')
            .update({ fonu_response: updatedResponse })
            .eq('id', batchId);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully linked ${successCount} SIM-device pair(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to link ${failCount} pair(s)`);
      }
      if (skippedExceptions.length > 0) {
        toast.info(`Marked ${skippedExceptions.length} exception(s) as skipped`);
      }

      onResolved();
      onOpenChange(false);
    } catch (err) {
      console.error('Error saving links:', err);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const getSelectedDevice = (simId: string) => {
    const link = manualLinks.find(l => l.sim_id === simId);
    return link?.device_id || 'none';
  };

  const isDeviceUsed = (deviceId: string, excludeSimId?: string) => {
    return manualLinks.some(l => l.device_id === deviceId && l.sim_id !== excludeSimId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Resolve Device Linking
          </DialogTitle>
          <DialogDescription>
            Manually pair unlinked SIMs with devices or skip exceptions
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-primary" />
                    Unlinked SIMs
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-2xl font-bold">{unlinkedSims.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    Available Devices
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-2xl font-bold">{unlinkedDevices.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Link className="h-4 w-4 text-success" />
                    Pending Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-2xl font-bold text-success">{manualLinks.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Auto-link button */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoLink}
                disabled={unlinkedSims.length === 0 || unlinkedDevices.length === 0}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Auto-Link Available
              </Button>
            </div>

            {/* Manual Linking Table */}
            <ScrollArea className="h-[300px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SIM (ICCID)</TableHead>
                    <TableHead>MSISDN</TableHead>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Link to Device</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unlinkedSims.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
                        All SIMs are linked to devices
                      </TableCell>
                    </TableRow>
                  ) : (
                    unlinkedSims.map((sim) => (
                      <TableRow key={sim.id}>
                        <TableCell className="font-mono text-xs">
                          ...{sim.iccid.slice(-10)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {sim.msisdn}
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={getSelectedDevice(sim.id)}
                            onValueChange={(value) => handleLinkSelection(sim.id, value)}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select device..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">-- No link --</SelectItem>
                              {unlinkedDevices.map((device) => (
                                <SelectItem
                                  key={device.id}
                                  value={device.id}
                                  disabled={isDeviceUsed(device.id, sim.id)}
                                >
                                  <span className="flex items-center gap-2">
                                    {device.device_name}
                                    <span className="text-xs text-muted-foreground">
                                      ({device.imei.slice(-6)})
                                    </span>
                                    {device.id.startsWith('pending_') && (
                                      <Badge variant="outline" className="text-xs">New</Badge>
                                    )}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {getSelectedDevice(sim.id) !== 'none' ? (
                            <Badge className="bg-success/10 text-success">
                              <Link className="h-3 w-3 mr-1" />
                              Linked
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              <Unlink className="h-3 w-3 mr-1" />
                              Unlinked
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Exceptions that can be skipped */}
            {exceptions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Exceptions ({exceptions.length})
                </p>
                <ScrollArea className="h-[120px] border border-warning/30 rounded-md bg-warning/5">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Device</TableHead>
                        <TableHead>IMEI</TableHead>
                        <TableHead>Issue</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exceptions.map((ex, idx) => (
                        <TableRow key={idx} className={skippedExceptions.includes(ex.row_index) ? 'opacity-50' : ''}>
                          <TableCell className="text-xs">{ex.device_name}</TableCell>
                          <TableCell className="font-mono text-xs">{ex.imei || '-'}</TableCell>
                          <TableCell className="text-xs text-destructive">{ex.reason}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={skippedExceptions.includes(ex.row_index) ? "secondary" : "outline"}
                              onClick={() => handleSkipException(ex.row_index)}
                            >
                              {skippedExceptions.includes(ex.row_index) ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Skipped
                                </>
                              ) : (
                                <>
                                  <SkipForward className="h-3 w-3 mr-1" />
                                  Skip
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveLinks}
            disabled={saving || (manualLinks.length === 0 && skippedExceptions.length === 0)}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Save {manualLinks.length > 0 && `(${manualLinks.length} links)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



