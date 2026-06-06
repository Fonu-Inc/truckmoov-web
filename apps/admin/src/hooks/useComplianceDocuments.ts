import { useCallback } from 'react';
import { differenceInDays } from 'date-fns';

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

export function useComplianceDocuments(_tenantId: string = 'default') {
  const getStats = useCallback(() => {
    return { total: 0, valid: 0, expiring: 0, expired: 0, complianceRate: 0 };
  }, []);

  return {
    documents: [] as ComplianceDocument[],
    isLoading: false,
    error: null as string | null,
    fetchDocuments: async () => {},
    addDocument: async (_document: ComplianceDocumentInput) => null,
    updateDocument: async (_id: string, _updates: Partial<ComplianceDocumentInput>) => null,
    deleteDocument: async (_id: string) => {},
    renewDocument: async (_id: string, _newExpiryDate: string, _newIssueDate?: string) => null,
    setReminderDays: async (_id: string, _days: number) => {},
    getStats,
  };
}
