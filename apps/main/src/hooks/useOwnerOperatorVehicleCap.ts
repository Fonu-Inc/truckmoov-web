import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isValidUuid } from "@/lib/uuidUtils";

interface VehicleCapInfo {
  currentCount: number;
  maxVehicles: number;
  isAtCap: boolean;
  remaining: number;
  upgradeMessage: string | null;
}

/**
 * Checks the vehicle cap for an Owner-Operator organization.
 * Returns cap info and an upgrade prompt when at/near the limit.
 */
export function useOwnerOperatorVehicleCap(orgId: string | null | undefined) {
  return useQuery<VehicleCapInfo>({
    queryKey: ["oo-vehicle-cap", orgId],
    queryFn: async () => {
      if (!orgId) throw new Error("No org ID");

      // Demo stakeholder placeholders aren't real UUIDs — return a static cap.
      if (!isValidUuid(orgId)) {
        return {
          currentCount: 3,
          maxVehicles: 7,
          isAtCap: false,
          remaining: 4,
          upgradeMessage: null,
        };
      }

      // Fetch org details and vehicle count in parallel
      const [orgRes, vehicleRes] = await Promise.all([
        supabase
          .from("organizations")
          .select("organization_type, max_vehicles")
          .eq("id", orgId)
          .single(),
        supabase
          .from("vehicles")
          .select("id", { count: "exact", head: true })
          .eq("owning_org_id", orgId),
      ]);

      if (orgRes.error) throw orgRes.error;

      const org = orgRes.data;
      const currentCount = vehicleRes.count ?? 0;

      // Non-OO orgs have no cap
      if (org.organization_type !== "OWNER_OPERATOR") {
        return {
          currentCount,
          maxVehicles: Infinity,
          isAtCap: false,
          remaining: Infinity,
          upgradeMessage: null,
        };
      }

      const maxVehicles = (org as any).max_vehicles ?? 7;
      const remaining = Math.max(0, maxVehicles - currentCount);
      const isAtCap = currentCount >= maxVehicles;

      return {
        currentCount,
        maxVehicles,
        isAtCap,
        remaining,
        upgradeMessage: isAtCap
          ? "Upgrade to Fleet Provider to manage more vehicles."
          : null,
      };
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });
}
