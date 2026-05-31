import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type CatalogStatus = 'supported' | 'deprecated' | 'blocked';
export type ProtocolType = 'tcp' | 'http' | 'mqtt' | 'udp';

export interface DeviceCatalogEntry {
  id: string;
  manufacturer: string;
  model: string;
  protocol_type: ProtocolType;
  default_port: number | null;
  payload_schema_reference: string | null;
  supports_obd: boolean;
  supports_fuel: boolean;
  supports_sos: boolean;
  // Phase 2: Telemetry capability flags
  supports_mileage: boolean;
  supports_engine_hours: boolean;
  supports_fuel_level: boolean;
  config_instructions: string | null;
  status: CatalogStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateCatalogEntry {
  manufacturer: string;
  model: string;
  protocol_type: ProtocolType;
  default_port?: number;
  payload_schema_reference?: string;
  supports_obd?: boolean;
  supports_fuel?: boolean;
  supports_sos?: boolean;
  // Phase 2: Telemetry capability flags
  supports_mileage?: boolean;
  supports_engine_hours?: boolean;
  supports_fuel_level?: boolean;
  config_instructions?: string;
  status?: CatalogStatus;
}

export function useDeviceCatalog() {
  const [catalog, setCatalog] = useState<DeviceCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('device_catalog')
        .select('*')
        .order('manufacturer', { ascending: true })
        .order('model', { ascending: true });

      if (fetchError) throw fetchError;
      
      // Type assertion since we know the shape matches
      setCatalog((data || []) as unknown as DeviceCatalogEntry[]);
      setError(null);
    } catch (err) {
      console.error('Error fetching device catalog:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch catalog');
    } finally {
      setLoading(false);
    }
  }, []);

  const createEntry = useCallback(async (entry: CreateCatalogEntry) => {
    try {
      const { data, error: insertError } = await supabase
        .from('device_catalog')
        .insert(entry)
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('Catalog entry created', {
        description: `${entry.manufacturer} ${entry.model} added to catalog`,
      });

      await fetchCatalog();
      return data;
    } catch (err) {
      console.error('Error creating catalog entry:', err);
      toast.error('Failed to create entry', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
      throw err;
    }
  }, [fetchCatalog]);

  const updateEntry = useCallback(async (id: string, updates: Partial<CreateCatalogEntry>) => {
    try {
      const { error: updateError } = await supabase
        .from('device_catalog')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Catalog entry updated');
      await fetchCatalog();
    } catch (err) {
      console.error('Error updating catalog entry:', err);
      toast.error('Failed to update entry', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
      throw err;
    }
  }, [fetchCatalog]);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('device_catalog')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast.success('Catalog entry deleted');
      await fetchCatalog();
    } catch (err) {
      console.error('Error deleting catalog entry:', err);
      toast.error('Failed to delete entry', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
      throw err;
    }
  }, [fetchCatalog]);

  // Get only supported entries for tenant registration
  const getSupportedModels = useCallback(() => {
    return catalog.filter(entry => entry.status === 'supported');
  }, [catalog]);

  // Get manufacturers list
  const getManufacturers = useCallback(() => {
    const manufacturers = new Set(catalog.filter(e => e.status === 'supported').map(e => e.manufacturer));
    return Array.from(manufacturers).sort();
  }, [catalog]);

  // Get models for a manufacturer
  const getModelsForManufacturer = useCallback((manufacturer: string) => {
    return catalog.filter(e => e.manufacturer === manufacturer && e.status === 'supported');
  }, [catalog]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  return {
    catalog,
    loading,
    error,
    refetch: fetchCatalog,
    createEntry,
    updateEntry,
    deleteEntry,
    getSupportedModels,
    getManufacturers,
    getModelsForManufacturer,
  };
}



