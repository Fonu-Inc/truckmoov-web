import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  invoice_number: string;
  tenant_id: string;
  tenant_name: string;
  amount_ngn: number;
  tax_ngn: number;
  total_ngn: number;
  status: 'pending' | 'paid' | 'failed' | 'canceled' | 'refunded';
  due_date: string;
  paid_at?: string;
  payment_reference?: string;
  line_items: any[];
  created_at: string;
}

interface BillingSummary {
  totalInvoices: number;
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
}

interface UseBillingReturn {
  isLoading: boolean;
  invoices: Invoice[];
  summary: BillingSummary | null;
  generateInvoice: (subscriptionId: string) => Promise<Invoice | null>;
  processPayment: (invoiceId: string, phoneNumber: string) => Promise<boolean>;
  fetchBillingSummary: (tenantId?: string) => Promise<void>;
  checkRenewals: () => Promise<void>;
}

export function useBilling(): UseBillingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);

  const generateInvoice = useCallback(async (subscriptionId: string): Promise<Invoice | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('billing', {
        body: {
          action: 'generate_invoice',
          subscriptionId,
        },
      });

      if (error) {
        console.error('Generate invoice error:', error);
        toast.error('Failed to generate invoice');
        return null;
      }

      if (data?.success && data.invoice) {
        toast.success(`Invoice ${data.invoice.invoice_number} generated`);
        return data.invoice;
      }

      return null;
    } catch (err) {
      console.error('Generate invoice error:', err);
      toast.error('Failed to generate invoice');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const processPayment = useCallback(async (invoiceId: string, phoneNumber: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('billing', {
        body: {
          action: 'process_payment',
          invoiceId,
          phoneNumber,
        },
      });

      if (error) {
        console.error('Process payment error:', error);
        toast.error('Failed to process payment');
        return false;
      }

      if (data?.success) {
        toast.success(data.message || 'Payment initiated');
        return true;
      } else {
        toast.error(data?.error || 'Payment failed');
        return false;
      }
    } catch (err) {
      console.error('Process payment error:', err);
      toast.error('Failed to process payment');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBillingSummary = useCallback(async (tenantId?: string): Promise<void> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('billing', {
        body: {
          action: 'get_billing_summary',
          tenantId,
        },
      });

      if (error) {
        console.error('Fetch billing summary error:', error);
        toast.error('Failed to fetch billing data');
        return;
      }

      if (data?.summary) {
        setSummary(data.summary);
      }
      if (data?.invoices) {
        setInvoices(data.invoices);
      }
    } catch (err) {
      console.error('Fetch billing summary error:', err);
      toast.error('Failed to fetch billing data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkRenewals = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('billing', {
        body: {
          action: 'check_renewals',
        },
      });

      if (error) {
        console.error('Check renewals error:', error);
        toast.error('Failed to check renewals');
        return;
      }

      if (data?.processed > 0) {
        toast.success(`Processed ${data.processed} renewal invoices`);
      } else {
        toast.info('No renewals to process');
      }
    } catch (err) {
      console.error('Check renewals error:', err);
      toast.error('Failed to check renewals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    invoices,
    summary,
    generateInvoice,
    processPayment,
    fetchBillingSummary,
    checkRenewals,
  };
}
