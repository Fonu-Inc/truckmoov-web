export interface PlatformPhoneNumber {
  id: string;
  phone_number: string;
  phone_number_type: 'local' | 'mobile' | 'toll_free';
  country_code: string;
  status: 'available' | 'assigned' | 'suspended' | 'released';
  tenant_id: string | null;
  tenant_name: string | null;
  capabilities: string[];
  fonu_number_id: string | null;
  monthly_cost_ngn: number;
  provisioned_at: string;
  assigned_at: string | null;
  assigned_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function usePlatformPhoneNumbers() {
  return {
    phoneNumbers: [] as PlatformPhoneNumber[],
    loading: false,
    error: null as string | null,
    refetch: () => {},
    provisionNumber: async (_data: {
      phone_number: string;
      phone_number_type?: 'local' | 'mobile' | 'toll_free';
      capabilities?: string[];
      monthly_cost_ngn?: number;
      notes?: string;
    }) => {},
    assignToTenant: async (_numberId: string, _tenantId: string, _tenantName: string, _assignedBy: string) => {},
    unassignFromTenant: async (_numberId: string) => {},
    suspendNumber: async (_numberId: string) => {},
    releaseNumber: async (_numberId: string) => {},
    deleteNumber: async (_numberId: string) => {},
  };
}
