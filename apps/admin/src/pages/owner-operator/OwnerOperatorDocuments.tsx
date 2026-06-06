import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ComplianceDocumentsPanel } from "@/components/owner-operator/ComplianceDocumentsPanel";
import { useMemo } from "react";

export default function OwnerOperatorDocuments() {
  const orgCtx = { memberships: [], orgIds: [], isLoading: false, hasOrgRole: () => false, hasOrgType: () => false, getByOrgType: (_type: string) => [] as any[] };
  const ownerOrg = useMemo(
    () => orgCtx.getByOrgType("OWNER_OPERATOR")[0],
    []
  );

  const vehicles: { id: string; tenant_id: string }[] = [];
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



