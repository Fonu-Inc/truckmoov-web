import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
export function useTenantKYCCache(tenantIds: string[]) {
  const [cache, setCache] = useState<TenantKYCCache>({});

  useEffect(() => {
    const uniqueIds = [...new Set(tenantIds)];
    if (uniqueIds.length === 0) return;

    const fetchStatuses = async () => {
      try {
        const { data, error } = await supabase
          .from("tenant_business_info")
          .select("tenant_id, verification_status")
          .in("tenant_id", uniqueIds);

        if (error) throw error;

        const result: TenantKYCCache = {};
        uniqueIds.forEach((id) => {
          const info = data?.find((d) => d.tenant_id === id);
          result[id] = {
            status: info?.verification_status || null,
            isVerified: info?.verification_status === "verified",
          };
        });
        setCache(result);
      } catch (err) {
        console.error("Error fetching tenant KYC statuses:", err);
      }
    };

    fetchStatuses();
  }, [tenantIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  return cache;
}
