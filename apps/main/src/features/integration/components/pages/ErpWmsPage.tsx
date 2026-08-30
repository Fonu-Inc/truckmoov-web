import { ERPWMSIntegrationPanel } from "@/components/integrations/ERPWMSIntegrationPanel";
import { useAuthStore } from "@/features/auth/stores/authStore";

export default function ErpWmsPage() {
  const user = useAuthStore(s => s.user);
  return <ERPWMSIntegrationPanel tenantId={user?.tenantId || ""} />;
}
