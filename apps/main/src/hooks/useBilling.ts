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
  return {
    isLoading: false,
    invoices: [],
    summary: null,
    generateInvoice: async (_subscriptionId: string) => null,
    processPayment: async (_invoiceId: string, _phoneNumber: string) => false,
    fetchBillingSummary: async (_tenantId?: string) => {},
    checkRenewals: async () => {},
  };
}
