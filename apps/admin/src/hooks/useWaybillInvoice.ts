import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useOrgDataScope } from '@/hooks/useOrgDataScope';
import { useOrgContext } from '@/hooks/useOrgContext';
import { useActiveOrgStore } from '@/stores/activeOrgStore';

// Types matching the DB schema
export interface WaybillRecord {
  id: string;
  tenant_id: string;
  org_id: string | null;
  status: 'received' | 'processing' | 'extracted' | 'extraction_failed' | 'needs_review' | 'approved' | 'invoice_generated' | 'archived' | 'rejected';
  source_type: string;
  source_message_id: string | null;
  source_phone: string | null;
  driver_name: string | null;
  image_url: string | null;
  image_storage_path: string | null;
  extracted_data: Record<string, unknown> | null;
  destination: string | null;
  origin: string | null;
  vehicle_number: string | null;
  waybill_number: string | null;
  customer_name: string | null;
  waybill_date: string | null;
  quantity: number | null;
  quantity_unit: string | null;
  weight_kg: number | null;
  weight_tons: number | null;
  matched_pricing_rule_id: string | null;
  calculated_price_ngn: number | null;
  ai_confidence_score: number | null;
  ai_model_used: string | null;
  confidence_per_field: Record<string, number> | null;
  extraction_error: string | null;
  processed_at: string | null;
  processed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WaybillInvoice {
  id: string;
  tenant_id: string;
  org_id: string | null;
  invoice_number: string;
  waybill_id: string;
  status: 'draft' | 'pending_review' | 'approved' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'disputed';
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  line_items: unknown[];
  subtotal_ngn: number;
  tax_rate_percent: number | null;
  tax_amount_ngn: number | null;
  discount_ngn: number | null;
  total_ngn: number;
  amount_paid_ngn: number | null;
  invoice_date: string;
  due_date: string | null;
  payment_terms: string | null;
  notes: string | null;
  origin: string | null;
  destination: string | null;
  vehicle_number: string | null;
  waybill_number: string | null;
  waybill_date: string | null;
  quantity: number | null;
  quantity_unit: string | null;
  sent_via: string | null;
  sent_at: string | null;
  sent_to: string | null;
  pdf_storage_path: string | null;
  pdf_url: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PricingRule {
  id: string;
  tenant_id: string;
  org_id: string | null;
  rule_name: string;
  origin: string | null;
  destination: string;
  vehicle_type: string | null;
  price_ngn: number;
  price_per_unit_ngn: number | null;
  unit_type: string | null;
  customer_name: string | null;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  notes: string | null;
  destination_aliases: string[];
  pricing_mode: 'FLAT' | 'PER_WEIGHT' | 'PER_DISTANCE';
  currency: string;
  minimum_charge: number | null;
  created_at: string;
}

export interface InvoiceShare {
  id: string;
  invoice_id: string;
  tenant_id: string;
  channel: 'WHATSAPP' | 'EMAIL' | 'LINK';
  recipient: string;
  status: 'QUEUED' | 'SENT' | 'FAILED';
  provider_response: Record<string, unknown> | null;
  sent_at: string | null;
  created_at: string;
}

export interface InvoiceConfig {
  id: string;
  tenant_id: string;
  tax_enabled: boolean;
  tax_rate_percent: number;
  tax_label: string;
  invoice_prefix: string;
  company_name: string | null;
  company_address: string | null;
  company_phone: string | null;
  company_email: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  payment_terms_days: number;
  currency: string;
  notes_template: string | null;
}

export function useWaybillInvoice() {
  const user = useAuthStore((s) => s.user);
  const { multiStakeholderEnabled } = useOrgDataScope();
  const orgCtx = useOrgContext();
  const activeOrgId = useActiveOrgStore((s) => s.activeOrgId);

  const currentOrgType = useMemo(() => {
    if (!activeOrgId) return null;
    const membership = orgCtx.memberships.find((m) => m.orgId === activeOrgId);
    return membership?.orgType ?? null;
  }, [activeOrgId, orgCtx.memberships]);

  const isPlatformAdmin = user?.role === 'platform_admin';
  const isEnterprise = currentOrgType === 'ENTERPRISE';
  const canWriteWaybills = !isEnterprise && !isPlatformAdmin &&
    ['FLEET_PROVIDER', 'AGGREGATOR', 'OWNER_OPERATOR'].includes(currentOrgType || '');
  const canConfigureWaybills = isPlatformAdmin || ['FLEET_PROVIDER', 'AGGREGATOR'].includes(currentOrgType || '');

  return {
    waybills: [] as WaybillRecord[],
    invoices: [] as WaybillInvoice[],
    pricingRules: [] as PricingRule[],
    invoiceConfig: null as InvoiceConfig | null,
    isLoading: false,
    canWriteWaybills,
    canConfigureWaybills,
    isEnterprise,
    isPlatformAdmin,
    currentOrgType,
    fetchWaybills: async () => {},
    fetchInvoices: async () => {},
    fetchPricingRules: async () => {},
    fetchInvoiceConfig: async () => {},
    createWaybill: async (_data: {
      source_type: string;
      image_url?: string;
      driver_name?: string;
      source_phone?: string;
    }): Promise<WaybillRecord | null> => null,
    extractWaybill: async (_waybillId: string, _imageUrl?: string, _imageBase64?: string) => null,
    updateWaybillFields: async (_waybillId: string, _updates: Record<string, unknown>) => null,
    generateInvoice: async (_waybillId: string): Promise<WaybillInvoice | null> => null,
    updateInvoice: async (_invoiceId: string, _updates: Partial<WaybillInvoice>) => {},
    deleteInvoice: async (_invoiceId: string) => {},
    addPricingRule: async (_rule: Partial<PricingRule>) => {},
    updatePricingRule: async (_ruleId: string, _updates: Partial<PricingRule>) => {},
    deletePricingRule: async (_ruleId: string) => {},
    updateInvoiceConfig: async (_config: Record<string, unknown>) => {},
    generateInvoicePDF: async (_invoiceId: string): Promise<{ storage_path: string } | null> => null,
    getInvoicePdfUrl: async (_storagePath: string): Promise<string | null> => null,
    recordInvoiceShare: async (_invoiceId: string, _channel: 'WHATSAPP' | 'EMAIL' | 'LINK', _recipient: string) => {},
  };
}
