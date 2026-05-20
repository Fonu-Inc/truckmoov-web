import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
  const [waybills, setWaybills] = useState<WaybillRecord[]>([]);
  const [invoices, setInvoices] = useState<WaybillInvoice[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const user = useAuthStore((s) => s.user);
  const { assetOrgIds, multiStakeholderEnabled } = useOrgDataScope();
  // Stabilize assetOrgIds reference to prevent infinite re-renders
  const assetOrgIdsKey = JSON.stringify(assetOrgIds);
  const stableAssetOrgIds = useMemo(() => assetOrgIds, [assetOrgIdsKey]);
  const orgCtx = useOrgContext();
  const activeOrgId = useActiveOrgStore((s) => s.activeOrgId);

  // Track if initial fetch has been done to prevent duplicate toasts
  const hasFetchedRef = useRef(false);

  // Determine org-type permissions
  const currentOrgType = useMemo(() => {
    if (!activeOrgId) return null;
    const membership = orgCtx.memberships.find((m) => m.orgId === activeOrgId);
    return membership?.orgType ?? null;
  }, [activeOrgId, orgCtx.memberships]);

  const isPlatformAdmin = user?.role === 'platform_admin';
  const isEnterprise = currentOrgType === 'ENTERPRISE';
  /** Can this user generate invoices / extract / update waybills? */
  const canWriteWaybills = !isEnterprise && !isPlatformAdmin &&
    ['FLEET_PROVIDER', 'AGGREGATOR', 'OWNER_OPERATOR'].includes(currentOrgType || '');
  /** Platform admin: oversight + config only */
  const canConfigureWaybills = isPlatformAdmin || ['FLEET_PROVIDER', 'AGGREGATOR'].includes(currentOrgType || '');

  const fetchWaybills = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('waybill_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (multiStakeholderEnabled && stableAssetOrgIds.length > 0 && !isPlatformAdmin) {
        query = query.in('org_id', stableAssetOrgIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      setWaybills((data as unknown as WaybillRecord[]) || []);
    } catch (err) {
      console.error('Fetch waybills error:', err);
      toast.error('Failed to load waybills');
    } finally {
      setIsLoading(false);
    }
  }, [multiStakeholderEnabled, stableAssetOrgIds, isPlatformAdmin]);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('waybill_invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (multiStakeholderEnabled && stableAssetOrgIds.length > 0 && !isPlatformAdmin) {
        query = query.in('org_id', stableAssetOrgIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      setInvoices((data as unknown as WaybillInvoice[]) || []);
    } catch (err) {
      console.error('Fetch invoices error:', err);
      toast.error('Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  }, [multiStakeholderEnabled, stableAssetOrgIds, isPlatformAdmin]);

  const fetchPricingRules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('destination_pricing_rules')
        .select('*')
        .order('destination', { ascending: true });
      if (error) throw error;
      setPricingRules((data as unknown as PricingRule[]) || []);
    } catch (err) {
      console.error('Fetch pricing rules error:', err);
    }
  }, []);

  const fetchInvoiceConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tenant_invoice_config')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      setInvoiceConfig((data as unknown as InvoiceConfig) || null);
    } catch (err) {
      console.error('Fetch invoice config error:', err);
    }
  }, []);

  const createWaybill = useCallback(async (data: {
    source_type: string;
    image_url?: string;
    driver_name?: string;
    source_phone?: string;
  }) => {
    try {
      const { data: created, error } = await supabase
        .from('waybill_records')
        .insert({
          tenant_id: user?.tenantId || '',
          source_type: data.source_type,
          image_url: data.image_url || null,
          driver_name: data.driver_name || null,
          source_phone: data.source_phone || null,
          status: 'received' as const,
        })
        .select()
        .single();
      if (error) throw error;
      toast.success('Waybill record created');
      await fetchWaybills();
      return created as unknown as WaybillRecord;
    } catch (err) {
      console.error('Create waybill error:', err);
      toast.error('Failed to create waybill');
      return null;
    }
  }, [user?.tenantId, fetchWaybills]);

  const extractWaybill = useCallback(async (waybillId: string, imageUrl?: string, imageBase64?: string) => {
    if (waybillId.startsWith('demo-')) {
      toast.info('Demo waybill — extraction is disabled for sample data');
      return null;
    }
    try {
      const { data, error } = await supabase.functions.invoke('extract-waybill', {
        body: { action: 'extract_waybill', waybillId, imageUrl, imageBase64 },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success('Waybill data extracted successfully');
        await fetchWaybills();
        return data.extracted;
      } else {
        toast.error(data?.error || 'Extraction failed');
        return null;
      }
    } catch (err) {
      console.error('Extract waybill error:', err);
      toast.error('Failed to extract waybill data');
      return null;
    }
  }, [fetchWaybills]);

  const updateWaybillFields = useCallback(async (waybillId: string, updates: Record<string, unknown>) => {
    if (waybillId.startsWith('demo-')) {
      toast.info('Demo waybill — edits are disabled for sample data');
      return null;
    }
    try {
      const { data, error } = await supabase.functions.invoke('extract-waybill', {
        body: { action: 'update_waybill', waybillId, updates },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success('Waybill fields updated');
        await fetchWaybills();
        return data.waybill as WaybillRecord;
      } else {
        toast.error(data?.error || 'Update failed');
        return null;
      }
    } catch (err) {
      console.error('Update waybill fields error:', err);
      toast.error('Failed to update waybill fields');
      return null;
    }
  }, [fetchWaybills]);

  const generateInvoice = useCallback(async (waybillId: string) => {
    if (waybillId.startsWith('demo-')) {
      toast.info('Demo waybill — invoice generation is disabled for sample data');
      return null;
    }
    try {
      const { data, error } = await supabase.functions.invoke('extract-waybill', {
        body: { action: 'generate_invoice', waybillId },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(`Invoice ${data.invoice.invoice_number} generated`);
        await Promise.all([fetchWaybills(), fetchInvoices()]);
        return data.invoice as WaybillInvoice;
      } else {
        toast.error(data?.error || 'Invoice generation failed');
        return null;
      }
    } catch (err) {
      console.error('Generate invoice error:', err);
      toast.error('Failed to generate invoice');
      return null;
    }
  }, [fetchWaybills, fetchInvoices]);

  const updateInvoice = useCallback(async (invoiceId: string, updates: Partial<WaybillInvoice>) => {
    try {
      const { error } = await supabase
        .from('waybill_invoices')
        .update(updates as Record<string, unknown>)
        .eq('id', invoiceId);
      if (error) throw error;
      toast.success('Invoice updated');
      await fetchInvoices();
    } catch (err) {
      console.error('Update invoice error:', err);
      toast.error('Failed to update invoice');
    }
  }, [fetchInvoices]);

  const deleteInvoice = useCallback(async (invoiceId: string) => {
    try {
      // Demo rows are local only — skip the network call.
      if (invoiceId.startsWith('demo-')) {
        toast.success('Invoice deleted');
        return;
      }
      const { error } = await supabase
        .from('waybill_invoices')
        .delete()
        .eq('id', invoiceId);
      if (error) throw error;
      toast.success('Invoice deleted');
      await fetchInvoices();
    } catch (err) {
      console.error('Delete invoice error:', err);
      toast.error('Failed to delete invoice');
    }
  }, [fetchInvoices]);

  const addPricingRule = useCallback(async (rule: Partial<PricingRule>) => {
    try {
      const { error } = await supabase
        .from('destination_pricing_rules')
        .insert({
          tenant_id: user?.tenantId || '',
          rule_name: rule.rule_name || '',
          destination: rule.destination || '',
          origin: rule.origin || null,
          vehicle_type: rule.vehicle_type || null,
          price_ngn: rule.price_ngn || 0,
          price_per_unit_ngn: rule.price_per_unit_ngn || null,
          unit_type: rule.unit_type || null,
          customer_name: rule.customer_name || null,
          effective_from: rule.effective_from || new Date().toISOString().split('T')[0],
          effective_to: rule.effective_to || null,
          notes: rule.notes || null,
          created_by: user?.id || null,
        })
        .select();
      if (error) throw error;
      toast.success('Pricing rule added');
      await fetchPricingRules();
    } catch (err) {
      console.error('Add pricing rule error:', err);
      toast.error('Failed to add pricing rule');
    }
  }, [user, fetchPricingRules]);

  const updatePricingRule = useCallback(async (ruleId: string, updates: Partial<PricingRule>) => {
    try {
      const { error } = await supabase
        .from('destination_pricing_rules')
        .update(updates as Record<string, unknown>)
        .eq('id', ruleId);
      if (error) throw error;
      toast.success('Pricing rule updated');
      await fetchPricingRules();
    } catch (err) {
      console.error('Update pricing rule error:', err);
      toast.error('Failed to update pricing rule');
    }
  }, [fetchPricingRules]);

  const deletePricingRule = useCallback(async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('destination_pricing_rules')
        .delete()
        .eq('id', ruleId);
      if (error) throw error;
      toast.success('Pricing rule deleted');
      await fetchPricingRules();
    } catch (err) {
      console.error('Delete pricing rule error:', err);
      toast.error('Failed to delete pricing rule');
    }
  }, [fetchPricingRules]);

  const updateInvoiceConfig = useCallback(async (config: Record<string, unknown>) => {
    try {
      const { data: existing } = await supabase
        .from('tenant_invoice_config')
        .select('id')
        .eq('tenant_id', user?.tenantId || '')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('tenant_invoice_config')
          .update({ ...config, updated_at: new Date().toISOString() })
          .eq('tenant_id', user?.tenantId || '');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tenant_invoice_config')
          .insert({ tenant_id: user?.tenantId || '', ...config })
          .select();
        if (error) throw error;
      }
      toast.success('Invoice settings saved');
      await fetchInvoiceConfig();
    } catch (err) {
      console.error('Update invoice config error:', err);
      toast.error('Failed to save settings');
    }
  }, [user?.tenantId, fetchInvoiceConfig]);

  const generateInvoicePDF = useCallback(async (invoiceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
        body: { invoiceId },
        headers: activeOrgId ? { 'X-Active-Org-Id': activeOrgId } : undefined,
      });
      if (error) throw error;
      if (data?.success) {
        toast.success('Invoice PDF generated and stored');
        await fetchInvoices();
        return data as { storage_path: string };
      } else {
        toast.error(data?.error || 'PDF generation failed');
        return null;
      }
    } catch (err) {
      console.error('Generate invoice PDF error:', err);
      toast.error('Failed to generate invoice PDF');
      return null;
    }
  }, [fetchInvoices, activeOrgId]);

  /** Get a short-lived signed URL for an invoice PDF (1 hour expiry) */
  const getInvoicePdfUrl = useCallback(async (storagePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('invoice-pdfs')
        .createSignedUrl(storagePath, 3600); // 1 hour
      if (error) throw error;
      return data?.signedUrl || null;
    } catch (err) {
      console.error('Get PDF URL error:', err);
      return null;
    }
  }, []);

  const recordInvoiceShare = useCallback(async (invoiceId: string, channel: 'WHATSAPP' | 'EMAIL' | 'LINK', recipient: string) => {
    try {
      const { error } = await supabase
        .from('invoice_shares')
        .insert({
          invoice_id: invoiceId,
          tenant_id: user?.tenantId || '',
          channel,
          recipient,
          status: 'SENT',
          sent_at: new Date().toISOString(),
        });
      if (error) throw error;
    } catch (err) {
      console.error('Record invoice share error:', err);
    }
  }, [user?.tenantId]);

  return {
    waybills,
    invoices,
    pricingRules,
    invoiceConfig,
    isLoading,
    // Permission flags for UI gating
    canWriteWaybills,
    canConfigureWaybills,
    isEnterprise,
    isPlatformAdmin,
    currentOrgType,
    // Actions
    fetchWaybills,
    fetchInvoices,
    fetchPricingRules,
    fetchInvoiceConfig,
    createWaybill,
    extractWaybill,
    updateWaybillFields,
    generateInvoice,
    updateInvoice,
    deleteInvoice,
    addPricingRule,
    updatePricingRule,
    deletePricingRule,
    updateInvoiceConfig,
    generateInvoicePDF,
    getInvoicePdfUrl,
    recordInvoiceShare,
  };
}
