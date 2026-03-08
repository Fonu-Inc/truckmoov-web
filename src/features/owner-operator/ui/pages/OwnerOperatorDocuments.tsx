import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ComplianceDocumentsPanel } from "@/components/owner-operator/ComplianceDocumentsPanel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/hooks/useOrgContext";
import { useMemo } from "react";

export default function OwnerOperatorDocuments() {
  const orgCtx = useOrgContext();
  const ownerOrg = useMemo(
    () => orgCtx.getByOrgType("OWNER_OPERATOR")[0],
    [orgCtx]
  );

  // Fetch vehicles to get their IDs for compliance docs
  const { data: vehicles = [] } = useQuery({
    queryKey: ["oo-vehicles-docs", ownerOrg?.orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, tenant_id")
        .eq("owning_org_id", ownerOrg!.orgId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!ownerOrg?.orgId,
  });

  const tenantId = vehicles[0]?.tenant_id;

  return (
    <DashboardLayout title="Documents" subtitle="Manage compliance and vehicle documents">
      <ComplianceDocumentsPanel
        orgId={ownerOrg?.orgId}
        tenantId={tenantId}
        vehicleIds={vehicles.map(v => v.id)}
      />
    </DashboardLayout>
  );
}
