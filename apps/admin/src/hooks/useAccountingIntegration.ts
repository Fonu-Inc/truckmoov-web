import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export interface AccountingIntegration {
  id: string;
  tenant_id: string;
  provider: string;
  status: 'pending' | 'connected' | 'disconnected' | 'error';
  company_id: string | null;
  company_name: string | null;
  connected_at: string | null;
  last_sync_at: string | null;
  sync_error: string | null;
  created_at: string;
}

export interface InvoiceSync {
  id: string;
  job_id: string;
  external_invoice_id: string | null;
  external_invoice_number: string | null;
  sync_status: 'pending' | 'syncing' | 'synced' | 'failed';
  sync_direction: string;
  amount_ngn: number | null;
  synced_at: string | null;
  error_message: string | null;
}

export function useAccountingIntegration() {
  const { user } = useAuthStore();
  const [integration, setIntegration] = useState<AccountingIntegration | null>(null);
  const [invoiceSyncs, setInvoiceSyncs] = useState<InvoiceSync[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const tenantId = user?.tenantId;

  const fetchIntegration = useCallback(async () => {
    if (!tenantId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tenant_accounting_integrations')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('provider', 'sage')
        .maybeSingle();

      if (error) throw error;
      setIntegration(data as AccountingIntegration | null);
    } catch (error) {
      console.error('Failed to fetch accounting integration:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  const connectSage = async () => {
    if (!tenantId) {
      toast.error('Tenant ID not available');
      return;
    }

    try {
      setIsConnecting(true);
      const { data, error } = await supabase.functions.invoke('sage-oauth', {
        body: { tenantId },
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (error) throw error;

      if (data?.authUrl) {
        // Redirect to Sage OAuth
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Failed to initiate Sage connection:', error);
      toast.error('Failed to connect to Sage');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectSage = async () => {
    if (!tenantId) return;

    try {
      setIsLoading(true);
      const { error } = await supabase.functions.invoke('sage-oauth', {
        body: { tenantId, action: 'disconnect' },
        method: 'POST',
      });

      if (error) throw error;

      await fetchIntegration();
      toast.success('Disconnected from Sage');
    } catch (error) {
      console.error('Failed to disconnect Sage:', error);
      toast.error('Failed to disconnect from Sage');
    } finally {
      setIsLoading(false);
    }
  };

  const syncJobToInvoice = async (jobId: string, invoiceData?: { contactId?: string }) => {
    if (!tenantId) {
      toast.error('Tenant ID not available');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('sage-sync', {
        body: { 
          action: 'create_invoice', 
          tenantId, 
          jobId,
          invoiceData,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Invoice ${data.invoiceNumber} created in Sage`);
        return data;
      } else {
        toast.error(data?.error || 'Failed to create invoice');
        return null;
      }
    } catch (error) {
      console.error('Failed to sync job to invoice:', error);
      toast.error('Failed to create invoice in Sage');
      return null;
    }
  };

  const fetchInvoiceSyncs = useCallback(async (jobId?: string) => {
    if (!tenantId) return;

    try {
      let query = supabase
        .from('accounting_invoice_syncs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (jobId) {
        query = query.eq('job_id', jobId);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setInvoiceSyncs(data as InvoiceSync[]);
    } catch (error) {
      console.error('Failed to fetch invoice syncs:', error);
    }
  }, [tenantId]);

  const listSageInvoices = async () => {
    if (!tenantId) return [];

    try {
      const { data, error } = await supabase.functions.invoke('sage-sync', {
        body: { action: 'list_invoices', tenantId },
      });

      if (error) throw error;
      return data?.invoices || [];
    } catch (error) {
      console.error('Failed to list Sage invoices:', error);
      return [];
    }
  };

  return {
    integration,
    invoiceSyncs,
    isLoading,
    isConnecting,
    fetchIntegration,
    connectSage,
    disconnectSage,
    syncJobToInvoice,
    fetchInvoiceSyncs,
    listSageInvoices,
  };
}



