import type {
  PricingRule, WaybillInvoice, WaybillRecord,
} from "@/features/payouts-invoicing/utils/demoData";

export type InvoiceConfig = {
  tax_enabled: boolean; tax_rate_percent: number; tax_label: string; invoice_prefix: string; company_name?: string; company_address?: string; company_phone?: string; company_email?: string; bank_name?: string; bank_account_name?: string; bank_account_number?: string; payment_terms_days: number; notes_template?: string; auto_send_enabled?: boolean;
} & Record<string, any>;

// ponytail: stub hook — real implementation ships when the packages/api endpoints land.
export function useWaybillInvoice() {
  return {
    waybills: [] as WaybillRecord[],
    invoices: [] as WaybillInvoice[],
    pricingRules: [] as PricingRule[],
    invoiceConfig: null as InvoiceConfig | null,
    isLoading: false,
    fetchWaybills: async () => {},
    fetchInvoices: async () => {},
    fetchPricingRules: async () => {},
    fetchInvoiceConfig: async () => {},
    createWaybill: async (..._args: any[]): Promise<any> => null,
    extractWaybill: async (..._args: any[]) => {},
    updateWaybillFields: async (..._args: any[]): Promise<any> => null,
    generateInvoice: async (..._args: any[]): Promise<any> => null,
    updateInvoice: (..._args: any[]) => {},
    deleteInvoice: async (..._args: any[]) => {},
    addPricingRule: (..._args: any[]) => {},
    updatePricingRule: (..._args: any[]) => {},
    deletePricingRule: (..._args: any[]) => {},
    updateInvoiceConfig: (..._args: any[]) => {},
    recordInvoiceShare: (..._args: any[]) => {},
    generateInvoicePDF: async (..._args: any[]): Promise<any> => null,
    getInvoicePdfUrl: async (..._args: any[]): Promise<string | null> => null,
  };
}

export function useWaybillRealtimeEvents(_opts: any) {}
