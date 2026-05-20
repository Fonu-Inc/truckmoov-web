import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UsageLedgerEntry {
  id: string;
  tenant_id: string;
  org_id: string | null;
  event_type: string;
  quantity: number;
  unit_rate_ngn: number;
  amount_ngn: number;
  billing_period: string;
  settled: boolean;
  settled_at: string | null;
  postpaid_invoice_id: string | null;
  metadata: any;
  created_at: string;
}

export interface PostpaidInvoice {
  id: string;
  tenant_id: string;
  invoice_number: string;
  billing_period: string;
  total_usage_ngn: number;
  wallet_deducted_ngn: number;
  invoice_balance_ngn: number;
  status: string;
  line_items: any[];
  due_date: string;
  paid_at: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditLimit {
  id: string;
  tenant_id: string;
  credit_limit_ngn: number;
  current_usage_ngn: number;
  warning_threshold_percent: number;
  hard_limit_action: string;
  is_suspended: boolean;
  suspended_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function usePostpaidBilling(tenantId?: string) {
  const queryClient = useQueryClient();

  // Fetch usage for current period
  const currentPeriod = new Date().toISOString().substring(0, 7);

  const { data: usageEntries = [], isLoading: usageLoading } = useQuery({
    queryKey: ['usage-ledger', tenantId, currentPeriod],
    queryFn: async () => {
      let query = supabase
        .from('usage_ledger')
        .select('*')
        .eq('billing_period', currentPeriod)
        .order('created_at', { ascending: false })
        .limit(500);

      if (tenantId) query = query.eq('tenant_id', tenantId);

      const { data, error } = await query;
      if (error) throw error;
      return data as UsageLedgerEntry[];
    },
    enabled: true,
  });

  // Fetch postpaid invoices
  const { data: postpaidInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['postpaid-invoices', tenantId],
    queryFn: async () => {
      let query = supabase
        .from('postpaid_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (tenantId) query = query.eq('tenant_id', tenantId);

      const { data, error } = await query;
      if (error) throw error;
      return data as PostpaidInvoice[];
    },
  });

  // Fetch credit limit
  const { data: creditLimit, isLoading: creditLoading } = useQuery({
    queryKey: ['credit-limit', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data, error } = await supabase
        .from('credit_limits')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) throw error;
      return data as CreditLimit | null;
    },
    enabled: !!tenantId,
  });

  // Aggregate usage by type for current period
  const usageSummary = usageEntries.reduce<Record<string, { count: number; total: number }>>((acc, entry) => {
    if (!acc[entry.event_type]) {
      acc[entry.event_type] = { count: 0, total: 0 };
    }
    acc[entry.event_type].count += Number(entry.quantity);
    acc[entry.event_type].total += Number(entry.amount_ngn);
    return acc;
  }, {});

  const totalCurrentUsage = usageEntries.reduce((sum, e) => sum + Number(e.amount_ngn), 0);

  // Trigger billing cycle
  const runBillingCycle = useMutation({
    mutationFn: async (billingPeriod?: string) => {
      const { data, error } = await supabase.functions.invoke('postpaid-billing-cycle', {
        body: { billing_period: billingPeriod },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['postpaid-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['usage-ledger'] });
      toast.success(`Processed ${data?.processed || 0} postpaid tenants`);
    },
    onError: (error) => {
      toast.error('Failed to run billing cycle', { description: error.message });
    },
  });

  return {
    usageEntries,
    postpaidInvoices,
    creditLimit,
    usageSummary,
    totalCurrentUsage,
    currentPeriod,
    isLoading: usageLoading || invoicesLoading || creditLoading,
    runBillingCycle,
  };
}
