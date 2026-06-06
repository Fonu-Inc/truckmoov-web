import type { TenantSenderId, SenderIdStatus } from './useTenantSenderIds';

export function usePlatformSenderIdApprovals() {
  return {
    requests: [] as TenantSenderId[],
    pendingCount: 0,
    whitelistingCount: 0,
    loading: false,
    error: null as string | null,
    refetch: () => {},
    updateStatus: async (
      _id: string,
      _status: SenderIdStatus,
      _options?: {
        rejection_reason?: string;
        admin_notes?: string;
        telecom_reference?: string;
        telecom_provider?: string;
      }
    ) => {},
    deleteRequest: async (_id: string) => {},
  };
}
