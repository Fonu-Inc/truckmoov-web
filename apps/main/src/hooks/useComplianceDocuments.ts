import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { differenceInDays } from 'date-fns';
import { useOrgDataScope } from '@/hooks/useOrgDataScope';
export interface ComplianceDocument {
  id: string;
  tenant_id: string;
  vehicle_id?: string | null;
  vehicle_name?: string | null;
  document_type: string;
  document_name: string;
  document_number?: string | null;
  issue_date?: string | null;
  expiry_date: string;
  status: string;
  file_path?: string | null;
  reminder_days: number;
  reminder_sent: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplianceDocumentInput {
  vehicle_id?: string | null;
  vehicle_name?: string | null;
  document_type: string;
  document_name: string;
  document_number?: string | null;
  issue_date?: string | null;
  expiry_date: string;
  status?: string;
  file_path?: string | null;
  reminder_days?: number;
  notes?: string | null;
}

export function useComplianceDocuments(tenantId: string = 'default') {
  const [documents, setDocuments] = useState<ComplianceDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const orgScope = useOrgDataScope();
  const assetOrgIdsKey = JSON.stringify(orgScope.assetOrgIds);
  const stableAssetOrgIds = useMemo(() => orgScope.assetOrgIds, [assetOrgIdsKey]);

  const calculateStatus = (expiryDate: string): string => {
    const daysLeft = differenceInDays(new Date(expiryDate), new Date());
    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 30) return 'expiring';
    return 'valid';
  };

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('compliance_documents')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('expiry_date', { ascending: true });

      // Apply org-level filter when multi-stakeholder is enabled
      if (orgScope.multiStakeholderEnabled && stableAssetOrgIds.length > 0) {
        query = query.in('org_id', stableAssetOrgIds);
      }

      const { data, error: fetchError } = await query;

      // Update status based on expiry date
      const updatedData = (data || []).map(doc => ({
        ...doc,
        status: calculateStatus(doc.expiry_date),
      }));

      setDocuments(updatedData);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch compliance documents';
      setError(message);
      console.error('Error fetching compliance documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, orgScope.multiStakeholderEnabled, stableAssetOrgIds]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const addDocument = async (document: ComplianceDocumentInput) => {
    try {
      const status = calculateStatus(document.expiry_date);
      const { data, error: insertError } = await supabase
        .from('compliance_documents')
        .insert({
          ...document,
          status,
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setDocuments(prev => [data, ...prev].sort((a, b) => 
        new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
      ));
      toast.success('Document added successfully');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add document';
      toast.error(message);
      throw err;
    }
  };

  const updateDocument = async (id: string, updates: Partial<ComplianceDocumentInput>) => {
    try {
      const updateData: Partial<ComplianceDocumentInput> & { status?: string } = { ...updates };
      if (updates.expiry_date) {
        updateData.status = calculateStatus(updates.expiry_date);
      }

      const { data, error: updateError } = await supabase
        .from('compliance_documents')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      setDocuments(prev => prev.map(d => d.id === id ? data : d));
      toast.success('Document updated successfully');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update document';
      toast.error(message);
      throw err;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('compliance_documents')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setDocuments(prev => prev.filter(d => d.id !== id));
      toast.success('Document deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete document';
      toast.error(message);
      throw err;
    }
  };

  const renewDocument = async (id: string, newExpiryDate: string, newIssueDate?: string) => {
    return updateDocument(id, {
      expiry_date: newExpiryDate,
      issue_date: newIssueDate || new Date().toISOString(),
    });
  };

  const setReminderDays = async (id: string, days: number) => {
    try {
      const { error: updateError } = await supabase
        .from('compliance_documents')
        .update({ reminder_days: days, reminder_sent: false })
        .eq('id', id);

      if (updateError) throw updateError;
      setDocuments(prev => prev.map(d => 
        d.id === id ? { ...d, reminder_days: days, reminder_sent: false } : d
      ));
      toast.success(`Reminder set for ${days} days before expiry`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set reminder';
      toast.error(message);
      throw err;
    }
  };

  const getStats = useCallback(() => {
    const total = documents.length;
    const valid = documents.filter(d => d.status === 'valid').length;
    const expiring = documents.filter(d => d.status === 'expiring').length;
    const expired = documents.filter(d => d.status === 'expired').length;
    // When no documents exist, show 0% instead of misleading 100%
    const complianceRate = total > 0 ? Math.round((valid / total) * 100) : 0;

    return { total, valid, expiring, expired, complianceRate };
  }, [documents]);

  return {
    documents,
    isLoading,
    error,
    fetchDocuments,
    addDocument,
    updateDocument,
    deleteDocument,
    renewDocument,
    setReminderDays,
    getStats,
  };
}
