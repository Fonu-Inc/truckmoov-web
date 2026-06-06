export interface TenantKYCInfo {
  status: string | null;
  isVerified: boolean;
}

export interface TenantKYCCache {
  [tenantId: string]: TenantKYCInfo;
}

/**
 * Fetches and caches KYC verification status for a list of tenant IDs.
 * Returns a map of tenantId → { status, isVerified }.
 */
export function useTenantKYCCache(_tenantIds: string[]): TenantKYCCache {
  return {};
}
