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

export function usePostpaidBilling(_tenantId?: string) {
  const currentPeriod = new Date().toISOString().substring(0, 7);

  return {
    usageEntries: [] as UsageLedgerEntry[],
    postpaidInvoices: [] as PostpaidInvoice[],
    creditLimit: null as CreditLimit | null,
    usageSummary: {} as Record<string, { count: number; total: number }>,
    totalCurrentUsage: 0,
    currentPeriod,
    isLoading: false,
    runBillingCycle: {
      mutate: (_billingPeriod?: string) => {},
      mutateAsync: async (_billingPeriod?: string) => {},
      isPending: false,
    },
  };
}
