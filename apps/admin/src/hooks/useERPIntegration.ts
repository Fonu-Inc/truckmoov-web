import { toast } from 'sonner';

export type ERPProvider = string;
export type ERPAuthMethod = string;
export type ERPSyncScope = string;
export type ERPSyncDirection = string;

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

export function useERPIntegration(_tenantId: string) {
  const connectors: ERPConnector[] = [];
  const mappings: ERPSyncMapping[] = [];
  const syncLogs: ERPSyncLog[] = [];
  const schedules: ERPSyncSchedule[] = [];
  const isLoading = false;
  const isSyncing = false;

  const fetchConnectors = async () => {};
  const createConnector = async (_connector: Record<string, unknown>) => null;
  const deleteConnector = async (_id: string) => {};
  const testConnection = async (_connectorId: string) => null;
  const fetchMappings = async (_connectorId: string) => {};
  const addMapping = async (_mapping: Record<string, unknown>) => {};
  const deleteMapping = async (_id: string, _connectorId: string) => {};
  const loadDefaultMappings = async (_connectorId: string, _provider: string) => {};
  const executeSync = async (_connectorId: string, _scope: string) => null;
  const fetchSyncLogs = async (_connectorId: string) => {};
  const fetchSchedules = async (_connectorId: string) => {};
  const upsertSchedule = async (_schedule: Record<string, unknown>) => {};

  return {
    connectors, mappings, syncLogs, schedules,
    isLoading, isSyncing,
    fetchConnectors, createConnector, deleteConnector, testConnection,
    fetchMappings, addMapping, deleteMapping, loadDefaultMappings,
    executeSync, fetchSyncLogs, fetchSchedules, upsertSchedule,
  };
}
