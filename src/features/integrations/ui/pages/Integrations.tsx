import { useMemo } from "react";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/authStore";
import DeveloperPortalPlaceholders from "@/features/integrations/ui/components/DeveloperPortalPlaceholders";
import ErpTmsSyncSection from "@/features/integrations/ui/components/ErpTmsSyncSection";
import IntegrationHealthSection from "@/features/integrations/ui/components/IntegrationHealthSection";
import WebhookAuthenticitySection from "@/features/integrations/ui/components/WebhookAuthenticitySection";

export default function IntegrationsPage() {
  const { user } = useAuthStore();

  const isPlatformAdmin = useMemo(() => user?.role === "PLATFORM_ADMIN", [user?.role]);
  const isEnterpriseAdmin = useMemo(() => user?.role === "ENTERPRISE_ADMIN", [user?.role]);

  return (
    <section className="space-y-6">
      {isPlatformAdmin && (
        <div className="space-y-6">
          <WebhookAuthenticitySection />
          <IntegrationHealthSection />
        </div>
      )}

      {isEnterpriseAdmin && (
        <div className="space-y-6">
          <ErpTmsSyncSection />
        </div>
      )}

      <Separator />

      <DeveloperPortalPlaceholders />
    </section>
  );
}
