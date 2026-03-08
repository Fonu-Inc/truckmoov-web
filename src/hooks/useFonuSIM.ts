import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface IoTSIM {
  id: string;
  iccid: string;
  imsi: string | null;
  msisdn: string;
  carrier: string;
  plan: string;
  status: string;
  tenant_id: string | null;
  device_id: string | null;
  data_usage_mb: number;
  data_limit_mb: number;
  sms_usage: number;
  sms_limit: number;
  monthly_cost_ngn: number;
  activation_date: string | null;
  expiry_date: string | null;
  last_activity: string | null;
  signal_strength: number | null;
  network_type: string | null;
  roaming: boolean;
  fonu_sim_id: string | null;
  fonu_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeviceMappingRow {
  device_name: string;
  imei: string;
  serial_number?: string;
  notes?: string;
}

export interface SIMProvisioningRequest {
  id: string;
  request_type: string;
  sim_id: string | null;
  iccid: string | null;
  msisdn: string | null;
  tenant_id: string;
  tenant_name: string | null;
  requested_plan: string | null;
  requested_data_limit_mb: number | null;
  requested_by: string | null;
  requested_by_name: string | null;
  status: string;
  priority: string | null;
  notes: string | null;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  fonu_request_id: string | null;
  fonu_response: any;
  created_at: string;
  updated_at: string;
  // New fields
  number_of_sims: number | null;
  deployment_timeline: string | null;
  device_mapping_enabled: boolean | null;
  device_mapping_file_path: string | null;
  device_mapping_data: DeviceMappingRow[] | any;
  use_case: string | null;
  preferred_operator: string | null;
}

export interface SIMUsageSignal {
  id: string;
  sim_id: string | null;
  iccid: string;
  signal_type: string;
  data_usage_mb: number | null;
  sms_count: number | null;
  signal_strength: number | null;
  network_type: string | null;
  latitude: number | null;
  longitude: number | null;
  raw_data: any;
  recorded_at: string;
  created_at: string;
}

export function useFonuSIM(tenantId?: string) {
  const [sims, setSims] = useState<IoTSIM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSIMs = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from('iot_sims').select('*');
      
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      
      const { data, error: fetchError } = await query.order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      setSims((data || []) as IoTSIM[]);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch SIMs';
      setError(message);
      console.error('Error fetching SIMs:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchSIMs();
  }, [fetchSIMs]);

  const activateSIM = async (iccid: string, targetTenantId: string, plan?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('fonu-sim', {
        body: { action: 'activate', iccid, tenantId: targetTenantId, plan },
      });
      
      if (error) throw error;
      toast.success('SIM activated successfully');
      await fetchSIMs();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to activate SIM';
      toast.error(message);
      throw err;
    }
  };

  const suspendSIM = async (iccid: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('fonu-sim', {
        body: { action: 'suspend', iccid },
      });
      
      if (error) throw error;
      toast.success('SIM suspended successfully');
      await fetchSIMs();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to suspend SIM';
      toast.error(message);
      throw err;
    }
  };

  const resumeSIM = async (iccid: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('fonu-sim', {
        body: { action: 'resume', iccid },
      });
      
      if (error) throw error;
      toast.success('SIM resumed successfully');
      await fetchSIMs();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resume SIM';
      toast.error(message);
      throw err;
    }
  };

  const updatePlan = async (iccid: string, plan: string, dataLimitMb?: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('fonu-sim', {
        body: { action: 'update_plan', iccid, plan, dataLimitMb },
      });
      
      if (error) throw error;
      toast.success('SIM plan updated successfully');
      await fetchSIMs();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update plan';
      toast.error(message);
      throw err;
    }
  };

  const topupData = async (iccid: string, dataLimitMb: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('fonu-sim', {
        body: { action: 'topup_data', iccid, dataLimitMb },
      });
      
      if (error) throw error;
      toast.success(`Added ${dataLimitMb}MB to SIM`);
      await fetchSIMs();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to top up data';
      toast.error(message);
      throw err;
    }
  };

  const getUsage = async (iccid: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('fonu-sim', {
        body: { action: 'get_usage', iccid },
      });
      
      if (error) throw error;
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get usage';
      toast.error(message);
      throw err;
    }
  };

  const provisionSIM = async (iccid: string, targetTenantId?: string, plan?: string, dataLimitMb?: number, notes?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('fonu-sim', {
        body: { action: 'provision', iccid, tenantId: targetTenantId, plan, dataLimitMb, notes },
      });
      
      if (error) throw error;
      toast.success('SIM provisioning request created');
      await fetchSIMs();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to provision SIM';
      toast.error(message);
      throw err;
    }
  };

  const createSIM = async (simData: Partial<IoTSIM>) => {
    try {
      const { data, error } = await supabase
        .from('iot_sims')
        .insert({
          iccid: simData.iccid!,
          imsi: simData.imsi,
          msisdn: simData.msisdn!,
          carrier: simData.carrier || 'MTN Nigeria',
          plan: simData.plan || 'iot_basic',
          status: simData.status || 'registered',
          tenant_id: simData.tenant_id,
          data_limit_mb: simData.data_limit_mb || 1000,
          sms_limit: simData.sms_limit || 0,
          monthly_cost_ngn: simData.monthly_cost_ngn || 0,
          expiry_date: simData.expiry_date,
        })
        .select()
        .single();
      
      if (error) throw error;
      toast.success('SIM created successfully');
      await fetchSIMs();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create SIM';
      toast.error(message);
      throw err;
    }
  };

  const updateSIM = async (id: string, updates: Partial<IoTSIM>) => {
    try {
      const { data, error } = await supabase
        .from('iot_sims')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      toast.success('SIM updated successfully');
      await fetchSIMs();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update SIM';
      toast.error(message);
      throw err;
    }
  };

  const deleteSIM = async (id: string) => {
    try {
      const { error } = await supabase
        .from('iot_sims')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('SIM deleted successfully');
      await fetchSIMs();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete SIM';
      toast.error(message);
      throw err;
    }
  };

  return {
    sims,
    loading,
    error,
    refetch: fetchSIMs,
    activateSIM,
    suspendSIM,
    resumeSIM,
    updatePlan,
    topupData,
    getUsage,
    provisionSIM,
    createSIM,
    updateSIM,
    deleteSIM,
  };
}

export function useSIMProvisioningRequests() {
  const [requests, setRequests] = useState<SIMProvisioningRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sim_provisioning_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRequests((data || []) as SIMProvisioningRequest[]);
    } catch (err) {
      console.error('Error fetching provisioning requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const approveRequest = async (requestId: string, approverName: string, approverId?: string, overrideJustification?: string) => {
    try {
      const { data: request } = await supabase
        .from('sim_provisioning_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (!request) throw new Error('Request not found');

      // Determine activation mode
      const quantity = request.number_of_sims || 1;
      const activationMode = quantity > 1 ? 'bulk' : 'single';
      const dataLimitGb = request.requested_data_limit_mb ? request.requested_data_limit_mb / 1024 : null;

      // Build approval metadata
      const approvalMetadata = overrideJustification ? {
        override_justification: overrideJustification,
        approved_with_override: true,
        override_timestamp: new Date().toISOString(),
      } : {};

       // Update request status to approved with approver UUID
      await supabase
        .from('sim_provisioning_requests')
        .update({
          status: 'approved',
          approved_by: approverId || null,
          approved_by_name: approverName,
          approved_at: new Date().toISOString(),
          fonu_response: { ...approvalMetadata },
        })
        .eq('id', requestId);

      // Log approval to security audit
      await supabase.from('security_audit_logs').insert({
        event_type: 'sim_request_approved',
        severity: 'info',
        description: `SIM request approved for ${request.tenant_name || request.tenant_id}: ${quantity} SIM(s)`,
        user_id: approverId || null,
        user_name: approverName,
        tenant_id: request.tenant_id,
        tenant_name: request.tenant_name,
        metadata: {
          request_id: requestId,
          quantity,
          operator: request.preferred_operator,
          override_applied: !!overrideJustification,
        },
      });

      // Create Activation Batch record
      const { data: batch, error: batchError } = await supabase
        .from('sim_activation_batches')
        .insert({
          request_id: requestId,
          tenant_id: request.tenant_id,
          tenant_name: request.tenant_name,
          activation_mode: activationMode,
          quantity: quantity,
          operator: request.preferred_operator,
          data_limit_gb: dataLimitGb,
          requested_plan: request.requested_plan,
          device_mapping_file_path: request.device_mapping_file_path,
          device_mapping_data: request.device_mapping_data || [],
          status: 'pending',
          created_by_name: approverName,
          notes: request.notes,
        } as any)
        .select()
        .single();

      if (batchError) {
        console.error('Failed to create activation batch:', batchError);
        // Don't throw - request is still approved
      }

      // For single SIM with ICCID, trigger immediate activation
      if (activationMode === 'single' && request.iccid) {
        // Update batch to processing
        if (batch) {
          await supabase
            .from('sim_activation_batches')
            .update({ status: 'processing', started_at: new Date().toISOString() } as any)
            .eq('id', batch.id);
        }

        try {
          await supabase.functions.invoke('fonu-sim', {
            body: { 
              action: 'activate', 
              iccid: request.iccid, 
              tenantId: request.tenant_id,
              plan: request.requested_plan,
            },
          });

          // Update batch and request to completed/approved
          if (batch) {
            await supabase
              .from('sim_activation_batches')
              .update({ 
                status: 'completed', 
                sims_activated: 1, 
                completed_at: new Date().toISOString() 
              } as any)
              .eq('id', batch.id);
          }

          await supabase
            .from('sim_provisioning_requests')
            .update({ status: 'approved' })
            .eq('id', requestId);

          toast.success('Request approved and SIM activated');
        } catch (activationErr) {
          // Mark batch as failed
          if (batch) {
            await supabase
              .from('sim_activation_batches')
              .update({ 
                status: 'failed', 
                sims_failed: 1,
                error_message: activationErr instanceof Error ? activationErr.message : 'Activation failed',
                completed_at: new Date().toISOString() 
              } as any)
              .eq('id', batch.id);
          }
          throw activationErr;
        }
      } else if (batch) {
        // Auto-trigger activation for bulk requests too
        try {
          toast.info('Auto-triggering activation...', {
            description: `Processing ${quantity} SIM(s)`,
          });

          await supabase
            .from('sim_activation_batches')
            .update({ status: 'processing', started_at: new Date().toISOString() } as any)
            .eq('id', batch.id);

          const { data: activationData, error: activationError } = await supabase.functions.invoke('fonu-sim', {
            body: {
              action: 'initiate_activation',
              batchId: batch.id,
              tenantId: request.tenant_id,
              quantity,
              operator: request.preferred_operator,
              plan: request.requested_plan,
              dataLimitMb: request.requested_data_limit_mb || 1000,
            },
          });

          if (activationError) throw activationError;

          const activationResult = activationData as {
            success: boolean;
            status: string;
            summary: { total: number; activated: number; failed: number };
            results: Array<{ iccid: string; msisdn?: string; fonu_sim_id?: string; status: string }>;
          };

          // Update request status based on activation result
          const finalStatus = 'approved';
          await supabase
            .from('sim_provisioning_requests')
            .update({ status: finalStatus })
            .eq('id', requestId);

          if (activationResult.status === 'completed') {
            toast.success('Request approved & SIMs activated', {
              description: `${activationResult.summary.activated} SIM(s) activated successfully`,
            });
          } else if (activationResult.status === 'partially_completed') {
            toast.warning('Partial activation', {
              description: `${activationResult.summary.activated} activated, ${activationResult.summary.failed} failed — retry from Activation Batches`,
            });
          } else {
            toast.error('Activation failed after approval', {
              description: 'Retry from the Activation Batches panel',
            });
          }

          // Auto-assign SIMs to devices if mapping provided
          const deviceMappingData = request.device_mapping_data as unknown as DeviceMappingRow[] | undefined;
          if (deviceMappingData?.length && activationResult.summary.activated > 0) {
            await autoAssignSIMsToDevices(
              request.tenant_id,
              deviceMappingData,
              activationResult.results.filter(r => r.status === 'activated')
            );
          }
        } catch (activationErr) {
          console.error('Auto-activation failed:', activationErr);
          // Batch stays — admin can retry from panel
          toast.warning('Request approved, but activation failed', {
            description: 'You can retry activation from the Activation Batches tab',
          });
        }
      }

      await fetchRequests();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve request';
      toast.error(message);
      throw err;
    }
  };

  const rejectRequest = async (requestId: string, reason: string, rejecterName?: string, rejecterId?: string) => {
    try {
      // Fetch request details for audit log
      const { data: request } = await supabase
        .from('sim_provisioning_requests')
        .select('tenant_id, tenant_name, number_of_sims')
        .eq('id', requestId)
        .single();

      await supabase
        .from('sim_provisioning_requests')
        .update({
          status: 'rejected',
          rejected_reason: reason,
          approved_by: rejecterId || null,
          approved_by_name: rejecterName || 'Platform Admin',
          approved_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      // Log rejection to security audit
      if (request) {
        await supabase.from('security_audit_logs').insert({
          event_type: 'sim_request_rejected',
          severity: 'info',
          description: `SIM request rejected for ${request.tenant_name || request.tenant_id}: ${reason}`,
          user_id: rejecterId || null,
          user_name: rejecterName || 'Platform Admin',
          tenant_id: request.tenant_id,
          tenant_name: request.tenant_name,
          metadata: {
            request_id: requestId,
            quantity: request.number_of_sims || 1,
            rejection_reason: reason,
          },
        });
      }

      toast.success('Request rejected');
      await fetchRequests();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject request';
      toast.error(message);
      throw err;
    }
  };

  /**
   * After SIMs are activated, auto-assign them to devices using the
   * device_mapping_data from the original request (IMEI → SIM link).
   */
  const autoAssignSIMsToDevices = async (
    tenantId: string,
    deviceMappingData: DeviceMappingRow[],
    activatedResults: Array<{ iccid: string; msisdn?: string; fonu_sim_id?: string; status: string }>
  ) => {
    if (!deviceMappingData?.length) return { assigned: 0, failed: 0 };

    let assigned = 0;
    let failed = 0;

    for (const mapping of deviceMappingData) {
      if (!mapping.imei) continue;

      try {
        // Find the device by IMEI in this tenant
        const { data: device } = await supabase
          .from('devices')
          .select('id, vehicle_id')
          .eq('imei', mapping.imei)
          .eq('tenant_id', tenantId)
          .single();

        if (!device) {
          console.warn(`No device found for IMEI ${mapping.imei}`);
          failed++;
          continue;
        }

        // Find an activated SIM that isn't yet assigned (round-robin match)
        const { data: availableSim } = await supabase
          .from('iot_sims')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('status', 'active')
          .is('device_id', null)
          .limit(1)
          .single();

        if (!availableSim) {
          console.warn(`No unassigned active SIM available for IMEI ${mapping.imei}`);
          failed++;
          continue;
        }

        // Assign SIM to device
        await supabase
          .from('iot_sims')
          .update({ device_id: device.id, status: 'assigned', updated_at: new Date().toISOString() })
          .eq('id', availableSim.id);

        // Update device with SIM reference
        await supabase
          .from('devices')
          .update({ sim_id: availableSim.id, updated_at: new Date().toISOString() })
          .eq('id', device.id);

        assigned++;
      } catch (err) {
        console.error(`Failed to assign SIM to device IMEI ${mapping.imei}:`, err);
        failed++;
      }
    }

    if (assigned > 0) {
      toast.success(`Auto-assigned ${assigned} SIM(s) to devices`, {
        description: failed > 0 ? `${failed} assignment(s) could not be completed` : undefined,
      });
    }

    return { assigned, failed };
  };

  const initiateActivation = async (batchId: string) => {
    try {
      // Get batch details
      const { data: batch, error: batchError } = await supabase
        .from('sim_activation_batches')
        .select('*')
        .eq('id', batchId)
        .single();

      if (batchError || !batch) {
        throw new Error('Activation batch not found');
      }

      toast.info('Starting SIM activation...', {
        description: `Processing ${batch.quantity} SIM(s)`,
      });

      const { data, error } = await supabase.functions.invoke('fonu-sim', {
        body: {
          action: 'initiate_activation',
          batchId,
          tenantId: batch.tenant_id,
          quantity: batch.quantity,
          operator: batch.operator,
          plan: batch.requested_plan,
          dataLimitMb: batch.data_limit_gb ? batch.data_limit_gb * 1024 : 1000,
        },
      });

      if (error) throw error;

      const result = data as {
        success: boolean;
        status: string;
        summary: { total: number; activated: number; failed: number };
        results: Array<{ iccid: string; msisdn?: string; fonu_sim_id?: string; status: string; error?: string }>;
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

      // Auto-assign SIMs to devices if device mapping was provided
      const deviceMappingData = (batch as any).device_mapping_data as DeviceMappingRow[] | undefined;
      if (deviceMappingData?.length && result.summary.activated > 0) {
        await autoAssignSIMsToDevices(
          batch.tenant_id,
          deviceMappingData,
          result.results.filter(r => r.status === 'activated')
        );
      }

      await fetchRequests();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initiate activation';
      toast.error(message);
      throw err;
    }
  };

  return {
    requests,
    loading,
    refetch: fetchRequests,
    approveRequest,
    rejectRequest,
    initiateActivation,
  };
}

export function useSIMUsageSignals(iccid: string) {
  const [signals, setSignals] = useState<SIMUsageSignal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSignals = useCallback(async () => {
    if (!iccid) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sim_usage_signals')
        .select('*')
        .eq('iccid', iccid)
        .order('recorded_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      setSignals((data || []) as SIMUsageSignal[]);
    } catch (err) {
      console.error('Error fetching usage signals:', err);
    } finally {
      setLoading(false);
    }
  }, [iccid]);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  return { signals, loading, refetch: fetchSignals };
}
