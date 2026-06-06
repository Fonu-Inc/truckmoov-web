export type BundleCycle = "monthly" | "yearly";

export interface BundleCatalogItem {
  id: string;
  code: string;
  name: string;
  carrier: string;
  data_mb: number;
  validity_days: number;
  price_ngn: number;
  billing_cycle: BundleCycle;
  is_active: boolean;
}

export interface BundleAllocation {
  id: string;
  tenant_id: string;
  msisdn: string;
  bundle_code: string;
  data_mb_total: number;
  data_mb_used: number;
  status: string;
  expires_at: string;
  expiry_alert_7d_sent_at: string | null;
  expiry_alert_1d_sent_at: string | null;
  created_at: string;
}

export interface BundleTopupInput {
  tenant_id: string;
  org_id?: string | null;
  sim_id?: string | null;
  msisdn: string;
  bundle_code: string;
}

/* ── Catalog (read-only for tenants, writeable for platform) ── */
export function useBundleCatalog() {
  return {
    data: [] as BundleCatalogItem[],
    isLoading: false,
    error: null,
    refetch: () => {},
  };
}

export function useUpsertBundle() {
  return {
    mutate: async (_b: Partial<BundleCatalogItem> & { code: string; name: string; data_mb: number; price_ngn: number; validity_days: number }) => {},
    mutateAsync: async (_b: any) => {},
    isPending: false,
  };
}

export function useToggleBundleActive() {
  return {
    mutate: async (_args: { id: string; is_active: boolean }) => {},
    mutateAsync: async (_args: any) => {},
    isPending: false,
  };
}

/* ── Allocations (per tenant) ── */
export function useBundleAllocations(_tenantId?: string) {
  return {
    data: [] as BundleAllocation[],
    isLoading: false,
    error: null,
    refetch: () => {},
  };
}

/* ── Top-up ── */
export function useBundleTopup() {
  return {
    mutate: async (_input: BundleTopupInput) => {},
    mutateAsync: async (_input: any) => {},
    isPending: false,
  };
}

export function useBundleTopups(_tenantId?: string) {
  return {
    data: [] as any[],
    isLoading: false,
    error: null,
    refetch: () => {},
  };
}

export function formatBundleSize(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`;
  return `${mb} MB`;
}
