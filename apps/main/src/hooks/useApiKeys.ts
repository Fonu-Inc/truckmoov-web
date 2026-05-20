import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  const fetchApiKeys = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke('api-keys', {
        method: 'GET',
      });

      if (response.error) throw new Error(response.error.message);
      setApiKeys(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createApiKey = useCallback(async (input: CreateApiKeyInput): Promise<string | null> => {
    try {
      const response = await supabase.functions.invoke('api-keys', {
        method: 'POST',
        body: input,
      });

      if (response.error) throw new Error(response.error.message);

      const createdKey = response.data?.data?.api_key;
      if (createdKey) {
        setNewlyCreatedKey(createdKey);
        toast.success('API key created! Copy it now - it won\'t be shown again.');
        await fetchApiKeys();
        return createdKey;
      }
      return null;
    } catch (error: any) {
      console.error('Error creating API key:', error);
      toast.error(error.message || 'Failed to create API key');
      return null;
    }
  }, [fetchApiKeys]);

  const revokeApiKey = useCallback(async (keyId: string): Promise<boolean> => {
    try {
      const response = await supabase.functions.invoke(`api-keys/${keyId}`, {
        method: 'DELETE',
      });

      if (response.error) throw new Error(response.error.message);

      toast.success('API key revoked');
      await fetchApiKeys();
      return true;
    } catch (error: any) {
      console.error('Error revoking API key:', error);
      toast.error(error.message || 'Failed to revoke API key');
      return false;
    }
  }, [fetchApiKeys]);

  const clearNewlyCreatedKey = useCallback(() => {
    setNewlyCreatedKey(null);
  }, []);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  return {
    apiKeys,
    isLoading,
    newlyCreatedKey,
    createApiKey,
    revokeApiKey,
    refreshApiKeys: fetchApiKeys,
    clearNewlyCreatedKey,
  };
}
