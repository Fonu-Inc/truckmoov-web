import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { demoMaintenanceRecords } from '@/lib/demoFleetData';

export interface MaintenanceRecord {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  vehicle_name: string;
  maintenance_type: string;
  status: string;
  scheduled_date: string;
  completed_date?: string | null;
  cost_ngn?: number | null;
  technician?: string | null;
  notes?: string | null;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRecordInput {
  vehicle_id: string;
  vehicle_name: string;
  maintenance_type: string;
  status?: string;
  scheduled_date: string;
  completed_date?: string | null;
  cost_ngn?: number | null;
  technician?: string | null;
  notes?: string | null;
  priority?: string;
}

export function useMaintenanceRecords(tenantId: string = 'default') {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('scheduled_date', { ascending: false });

      if (fetchError) throw fetchError;
      const rows = data || [];
      setRecords(rows.length > 0 ? rows : (demoMaintenanceRecords as unknown as MaintenanceRecord[]));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch maintenance records';
      setError(message);
      console.error('Error fetching maintenance records:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const addRecord = async (record: MaintenanceRecordInput) => {
    try {
      const { data, error: insertError } = await supabase
        .from('maintenance_records')
        .insert({
          ...record,
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setRecords(prev => [data, ...prev]);
      toast.success('Maintenance scheduled successfully');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add maintenance record';
      toast.error(message);
      throw err;
    }
  };

  const updateRecord = async (id: string, updates: Partial<MaintenanceRecordInput>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('maintenance_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      setRecords(prev => prev.map(r => r.id === id ? data : r));
      toast.success('Maintenance record updated');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update maintenance record';
      toast.error(message);
      throw err;
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('maintenance_records')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setRecords(prev => prev.filter(r => r.id !== id));
      toast.success('Maintenance record deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete maintenance record';
      toast.error(message);
      throw err;
    }
  };

  const markComplete = async (id: string, cost?: number) => {
    return updateRecord(id, {
      status: 'completed',
      completed_date: new Date().toISOString(),
      cost_ngn: cost,
    });
  };

  const startMaintenance = async (id: string) => {
    return updateRecord(id, { status: 'in_progress' });
  };

  return {
    records,
    isLoading,
    error,
    fetchRecords,
    addRecord,
    updateRecord,
    deleteRecord,
    markComplete,
    startMaintenance,
  };
}



