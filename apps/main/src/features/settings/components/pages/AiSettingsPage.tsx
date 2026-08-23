import { TenantAIConfigPanel } from "@/features/settings/components/ui/TenantAIConfigPanel";
import { useAuthStore } from "@/stores/authStore";

/** `/settings/ai` — the panel needs the tenant, so this route keeps a page. */
export default function AiSettingsPage() {
  const tenantId = useAuthStore(s => s.user?.tenantId);

  return <TenantAIConfigPanel tenantId={tenantId || ""} />;
}
