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
  return {
    integration: null as AccountingIntegration | null,
    invoiceSyncs: [] as InvoiceSync[],
    isLoading: false,
    isConnecting: false,
    fetchIntegration: async () => {},
    connectSage: async () => {},
    disconnectSage: async () => {},
    syncJobToInvoice: async (_jobId: string, _invoiceData?: { contactId?: string }) => null,
    fetchInvoiceSyncs: async (_jobId?: string) => {},
    listSageInvoices: async () => [] as any[],
  };
}
