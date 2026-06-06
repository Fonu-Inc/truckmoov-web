export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  status: 'active' | 'revoked' | 'expired';
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
  created_by: string | null;
}

export interface CreateApiKeyInput {
  name: string;
  scopes: string[];
  expires_at?: string;
  rate_limit_per_minute?: number;
  rate_limit_per_day?: number;
}

export const API_SCOPES = [
  { value: 'jobs.read', label: 'Read Jobs', description: 'View job and dispatch data' },
  { value: 'jobs.write', label: 'Write Jobs', description: 'Create and update jobs' },
  { value: 'vehicles.read', label: 'Read Vehicles', description: 'View fleet vehicles' },
  { value: 'vehicles.write', label: 'Write Vehicles', description: 'Create and update vehicles' },
  { value: 'drivers.read', label: 'Read Drivers', description: 'View driver data' },
  { value: 'drivers.write', label: 'Write Drivers', description: 'Create and update drivers' },
  { value: 'devices.read', label: 'Read Devices', description: 'View IoT device status' },
  { value: 'geofences.read', label: 'Read Geofences', description: 'View geofence zones' },
  { value: 'geofences.write', label: 'Write Geofences', description: 'Create and update geofences' },
  { value: 'alerts.read', label: 'Read Alerts', description: 'View fleet alerts' },
  { value: 'maintenance.read', label: 'Read Maintenance', description: 'View maintenance data' },
  { value: 'fuel.read', label: 'Read Fuel', description: 'View fuel transactions' },
  { value: 'webhooks.manage', label: 'Manage Webhooks', description: 'Create and manage webhooks' },
] as const;

export function useApiKeys() {
  return {
    apiKeys: [] as ApiKey[],
    isLoading: false,
    newlyCreatedKey: null as string | null,
    createApiKey: async (_input: CreateApiKeyInput): Promise<string | null> => null,
    revokeApiKey: async (_keyId: string): Promise<boolean> => false,
    refreshApiKeys: () => {},
    clearNewlyCreatedKey: () => {},
  };
}
