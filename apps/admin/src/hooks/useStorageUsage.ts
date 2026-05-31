import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { useTenantSubscription } from "./useTenantSubscription";

// Pragmatic per-record byte estimates for tables that don't track file_size.
// Keeps the displayed usage realistic without requiring blob inspection.
const AVG_BYTES = {
  waybill: 350 * 1024, // ~350 KB scanned waybill image
  pod: 600 * 1024,     // ~600 KB POD photo
  compliance: 250 * 1024, // ~250 KB compliance doc
};

const GB = 1024 * 1024 * 1024;

export interface StorageUsage {
  usedBytes: number;
  usedGB: number;
  limitGB: number | null;
  percentage: number;
  isLoading: boolean;
}

export function useStorageUsage(): StorageUsage {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId;
  const { currentPlan } = useTenantSubscription();
  const limitGB =
    (currentPlan as unknown as { storage_gb?: number | null } | null)?.storage_gb ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["storage-usage", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      if (!tenantId) return 0;

      const [kyc, waybills, pod, compliance] = await Promise.all([
        supabase
          .from("tenant_kyc_documents")
          .select("file_size")
          .eq("tenant_id", tenantId),
        supabase
          .from("waybill_records")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId),
        supabase
          .from("job_pod_media")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId),
        supabase
          .from("compliance_documents")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId),
      ]);

      const kycBytes = (kyc.data ?? []).reduce(
        (sum, row: { file_size: number | null }) => sum + (row.file_size ?? 0),
        0,
      );
      const waybillBytes = (waybills.count ?? 0) * AVG_BYTES.waybill;
      const podBytes = (pod.count ?? 0) * AVG_BYTES.pod;
      const complianceBytes = (compliance.count ?? 0) * AVG_BYTES.compliance;

      return kycBytes + waybillBytes + podBytes + complianceBytes;
    },
  });

  const usedBytes = data ?? 0;
  const usedGB = usedBytes / GB;
  const percentage = limitGB ? Math.min(100, (usedGB / limitGB) * 100) : 0;

  return { usedBytes, usedGB, limitGB, percentage, isLoading };
}



