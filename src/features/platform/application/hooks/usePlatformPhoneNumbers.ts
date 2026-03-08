import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlatformPhoneNumber {
  id: string;
  phone_number: string;
  phone_number_type: 'local' | 'mobile' | 'toll_free';
  country_code: string;
  status: 'available' | 'assigned' | 'suspended' | 'released';
  tenant_id: string | null;
  tenant_name: string | null;
  capabilities: string[];
  fonu_number_id: string | null;
  monthly_cost_ngn: number;
  provisioned_at: string;
  assigned_at: string | null;
  assigned_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function usePlatformPhoneNumbers() {
  const [phoneNumbers, setPhoneNumbers] = useState<PlatformPhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhoneNumbers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('platform_phone_numbers')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPhoneNumbers((data || []) as PlatformPhoneNumber[]);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch phone numbers';
      setError(message);
      console.error('Error fetching phone numbers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhoneNumbers();
  }, [fetchPhoneNumbers]);

  const provisionNumber = async (data: {
    phone_number: string;
    phone_number_type?: 'local' | 'mobile' | 'toll_free';
    capabilities?: string[];
    monthly_cost_ngn?: number;
    notes?: string;
  }) => {
    try {
      const { data: newNumber, error } = await supabase
        .from('platform_phone_numbers')
        .insert({
          phone_number: data.phone_number,
          phone_number_type: data.phone_number_type || 'mobile',
          capabilities: data.capabilities || ['sms', 'voice'],
          monthly_cost_ngn: data.monthly_cost_ngn || 0,
          notes: data.notes,
          status: 'available',
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Phone number provisioned successfully');
      await fetchPhoneNumbers();
      return newNumber;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to provision number';
      toast.error(message);
      throw err;
    }
  };

  const assignToTenant = async (
    numberId: string,
    tenantId: string,
    tenantName: string,
    assignedBy: string
  ) => {
    try {
      const { error } = await supabase
        .from('platform_phone_numbers')
        .update({
          tenant_id: tenantId,
          tenant_name: tenantName,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
          assigned_by: assignedBy,
        })
        .eq('id', numberId);

      if (error) throw error;
      toast.success(`Number assigned to ${tenantName}`);
      await fetchPhoneNumbers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign number';
      toast.error(message);
      throw err;
    }
  };

  const unassignFromTenant = async (numberId: string) => {
    try {
      const { error } = await supabase
        .from('platform_phone_numbers')
        .update({
          tenant_id: null,
          tenant_name: null,
          status: 'available',
          assigned_at: null,
          assigned_by: null,
        })
        .eq('id', numberId);

      if (error) throw error;
      toast.success('Number unassigned and returned to pool');
      await fetchPhoneNumbers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unassign number';
      toast.error(message);
      throw err;
    }
  };

  const suspendNumber = async (numberId: string) => {
    try {
      const { error } = await supabase
        .from('platform_phone_numbers')
        .update({ status: 'suspended' })
        .eq('id', numberId);

      if (error) throw error;
      toast.success('Number suspended');
      await fetchPhoneNumbers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to suspend number';
      toast.error(message);
      throw err;
    }
  };

  const releaseNumber = async (numberId: string) => {
    try {
      const { error } = await supabase
        .from('platform_phone_numbers')
        .update({ 
          status: 'released',
          tenant_id: null,
          tenant_name: null,
        })
        .eq('id', numberId);

      if (error) throw error;
      toast.success('Number released');
      await fetchPhoneNumbers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to release number';
      toast.error(message);
      throw err;
    }
  };

  const deleteNumber = async (numberId: string) => {
    try {
      const { error } = await supabase
        .from('platform_phone_numbers')
        .delete()
        .eq('id', numberId);

      if (error) throw error;
      toast.success('Number deleted');
      await fetchPhoneNumbers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete number';
      toast.error(message);
      throw err;
    }
  };

  return {
    phoneNumbers,
    loading,
    error,
    refetch: fetchPhoneNumbers,
    provisionNumber,
    assignToTenant,
    unassignFromTenant,
    suspendNumber,
    releaseNumber,
    deleteNumber,
  };
}
