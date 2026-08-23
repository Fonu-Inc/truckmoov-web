import { TenantKYCVerification } from "@/features/settings/components/ui/TenantKYCVerification";
import { useAuthStore } from "@/stores/authStore";

/** `/settings/kyc` — the panel needs the tenant, so this route keeps a page. */
export default function KycSettingsPage() {
  const tenantId = useAuthStore(s => s.user?.tenantId);

  return <TenantKYCVerification tenantId={tenantId || ""} />;
}
