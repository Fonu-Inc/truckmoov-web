import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type ERPProvider = Database['public']['Enums']['erp_provider'];
type ERPAuthMethod = Database['public']['Enums']['erp_auth_method'];
type ERPSyncScope = Database['public']['Enums']['erp_sync_scope'];
type ERPSyncDirection = Database['public']['Enums']['erp_sync_direction'];

export interface ERPConnector {
  id: string;
  tenant_id: string;
  name: string;
  provider: ERPProvider;
  auth_method: ERPAuthMethod;
  api_base_url: string | null;
  api_version: string | null;
  status: string;
  company_name: string | null;
  environment: string | null;
  last_connected_at: string | null;
  last_sync_at: string | null;
  sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface ERPSyncMapping {
  id: string;
  connector_id: string;
  tenant_id: string;
  scope: ERPSyncScope;
  direction: ERPSyncDirection;
  fleetpro_entity: string;
  fleetpro_field: string;
  erp_entity: string;
  erp_field: string;
  transform_rule: string | null;
  is_required: boolean | null;
  is_active: boolean | null;
}

export interface ERPSyncLog {
  id: string;
  connector_id: string;
  scope: ERPSyncScope;
  direction: ERPSyncDirection;
  status: string;
  records_processed: number;
  records_succeeded: number;
  records_failed: number;
  error_message: string | null;
  duration_ms: number | null;
  triggered_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface ERPSyncSchedule {
  id: string;
  connector_id: string;
  scope: ERPSyncScope;
  direction: ERPSyncDirection;
  interval_minutes: number;
  is_active: boolean | null;
  last_run_at: string | null;
  next_run_at: string | null;
}

const ERP_PROVIDERS = [
  { id: 'sap' as ERPProvider, name: 'SAP S/4HANA & Business One', icon: '🏢', color: 'bg-blue-600' },
  { id: 'oracle' as ERPProvider, name: 'Oracle NetSuite / Fusion', icon: '🔴', color: 'bg-red-600' },
  { id: 'dynamics' as ERPProvider, name: 'Microsoft Dynamics 365', icon: '🟦', color: 'bg-indigo-600' },
  { id: 'odoo' as ERPProvider, name: 'Odoo ERP', icon: '🟣', color: 'bg-purple-600' },
  { id: 'zoho' as ERPProvider, name: 'Zoho', icon: '🟡', color: 'bg-yellow-600' },
  { id: 'custom' as ERPProvider, name: 'Custom ERP / WMS', icon: '⚙️', color: 'bg-muted' },
];

export { ERP_PROVIDERS };

export function useERPIntegration(tenantId: string) {
  const [connectors, setConnectors] = useState<ERPConnector[]>([]);
  const [mappings, setMappings] = useState<ERPSyncMapping[]>([]);
  const [syncLogs, setSyncLogs] = useState<ERPSyncLog[]>([]);
  const [schedules, setSchedules] = useState<ERPSyncSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchConnectors = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('erp_wms_connectors')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (!error && data) setConnectors(data as ERPConnector[]);
    setIsLoading(false);
  }, [tenantId]);

  const createConnector = useCallback(async (connector: {
    name: string;
    provider: ERPProvider;
    auth_method: ERPAuthMethod;
    api_base_url?: string;
    api_version?: string;
    company_name?: string;
    environment?: string;
  }) => {
    const { data, error } = await supabase
      .from('erp_wms_connectors')
      .insert({
        name: connector.name,
        provider: connector.provider,
        auth_method: connector.auth_method,
        api_base_url: connector.api_base_url,
        api_version: connector.api_version,
        company_name: connector.company_name,
        environment: connector.environment,
        tenant_id: tenantId,
      })
      .select()
      .single();
    if (error) {
      toast.error('Failed to create connector');
      return null;
    }
    toast.success('Connector created');
    await fetchConnectors();
    return data;
  }, [tenantId, fetchConnectors]);

  const deleteConnector = useCallback(async (id: string) => {
    const { error } = await supabase.from('erp_wms_connectors').delete().eq('id', id);
    if (error) { toast.error('Failed to delete connector'); return; }
    toast.success('Connector removed');
    await fetchConnectors();
  }, [fetchConnectors]);

  const testConnection = useCallback(async (connectorId: string) => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('erp-wms-sync', {
        body: { action: 'test_connection', tenantId, connectorId },
      });
      if (error) throw error;
      toast.success(data.message || 'Connection successful');
      await fetchConnectors();
      return data;
    } catch {
      toast.error('Connection test failed');
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [tenantId, fetchConnectors]);

  const fetchMappings = useCallback(async (connectorId: string) => {
    const { data, error } = await supabase
      .from('erp_sync_mappings')
      .select('*')
      .eq('connector_id', connectorId)
      .eq('tenant_id', tenantId)
      .order('scope');
    if (!error && data) setMappings(data as ERPSyncMapping[]);
  }, [tenantId]);

  const addMapping = useCallback(async (mapping: {
    connector_id: string;
    scope: ERPSyncScope;
    direction: ERPSyncDirection;
    fleetpro_entity: string;
    fleetpro_field: string;
    erp_entity: string;
    erp_field: string;
    is_required?: boolean;
    is_active?: boolean;
  }) => {
    const { error } = await supabase.from('erp_sync_mappings').insert({
      connector_id: mapping.connector_id,
      scope: mapping.scope,
      direction: mapping.direction,
      fleetpro_entity: mapping.fleetpro_entity,
      fleetpro_field: mapping.fleetpro_field,
      erp_entity: mapping.erp_entity,
      erp_field: mapping.erp_field,
      is_required: mapping.is_required ?? false,
      is_active: mapping.is_active ?? true,
      tenant_id: tenantId,
    });
    if (error) { toast.error('Failed to add mapping'); return; }
    toast.success('Mapping added');
    await fetchMappings(mapping.connector_id);
  }, [tenantId, fetchMappings]);

  const deleteMapping = useCallback(async (id: string, connectorId: string) => {
    const { error } = await supabase.from('erp_sync_mappings').delete().eq('id', id);
    if (error) { toast.error('Failed to delete mapping'); return; }
    toast.success('Mapping removed');
    await fetchMappings(connectorId);
  }, [fetchMappings]);

  const loadDefaultMappings = useCallback(async (connectorId: string, provider: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('erp-wms-sync', {
        body: { action: 'get_template', provider },
      });
      if (error) throw error;
      const template = data.template;
      const inserts: Database['public']['Tables']['erp_sync_mappings']['Insert'][] = [];
      for (const [scope, fields] of Object.entries(template.defaultMappings)) {
        for (const field of fields as Array<{ fleetpro: string; erp: string; entity: string }>) {
          inserts.push({
            connector_id: connectorId,
            tenant_id: tenantId,
            scope: scope as ERPSyncScope,
            direction: 'bidirectional' as ERPSyncDirection,
            fleetpro_entity: scope === 'orders' ? 'jobs' : scope === 'invoices' ? 'waybill_invoices' : 'vehicles',
            fleetpro_field: field.fleetpro,
            erp_entity: field.entity,
            erp_field: field.erp,
            is_required: false,
            is_active: true,
          });
        }
      }
      if (inserts.length > 0) {
        await supabase.from('erp_sync_mappings').insert(inserts);
      }
      toast.success(`Loaded ${inserts.length} default mappings`);
      await fetchMappings(connectorId);
    } catch {
      toast.error('Failed to load default mappings');
    }
  }, [tenantId, fetchMappings]);

  const executeSync = useCallback(async (connectorId: string, scope: string) => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('erp-wms-sync', {
        body: { action: 'sync', tenantId, connectorId, scope },
      });
      if (error) throw error;
      toast.success(`Synced ${data.succeeded}/${data.processed} records`);
      return data;
    } catch {
      toast.error('Sync failed');
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [tenantId]);

  const fetchSyncLogs = useCallback(async (connectorId: string) => {
    const { data, error } = await supabase
      .from('erp_sync_logs')
      .select('*')
      .eq('connector_id', connectorId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) setSyncLogs(data as ERPSyncLog[]);
  }, [tenantId]);

  const fetchSchedules = useCallback(async (connectorId: string) => {
    const { data, error } = await supabase
      .from('erp_sync_schedules')
      .select('*')
      .eq('connector_id', connectorId)
      .eq('tenant_id', tenantId);
    if (!error && data) setSchedules(data as ERPSyncSchedule[]);
  }, [tenantId]);

  const upsertSchedule = useCallback(async (schedule: {
    connector_id: string;
    scope: ERPSyncScope;
    direction: ERPSyncDirection;
    interval_minutes: number;
    is_active: boolean;
  }) => {
    const { error } = await supabase
      .from('erp_sync_schedules')
      .upsert(
        {
          connector_id: schedule.connector_id,
          scope: schedule.scope,
          direction: schedule.direction,
          interval_minutes: schedule.interval_minutes,
          is_active: schedule.is_active,
          tenant_id: tenantId,
        },
        { onConflict: 'connector_id,scope' }
      );
    if (error) { toast.error('Failed to save schedule'); return; }
    toast.success('Schedule saved');
    await fetchSchedules(schedule.connector_id);
  }, [tenantId, fetchSchedules]);

  return {
    connectors, mappings, syncLogs, schedules,
    isLoading, isSyncing,
    fetchConnectors, createConnector, deleteConnector, testConnection,
    fetchMappings, addMapping, deleteMapping, loadDefaultMappings,
    executeSync, fetchSyncLogs, fetchSchedules, upsertSchedule,
  };
}



