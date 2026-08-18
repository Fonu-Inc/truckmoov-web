import { useSearchParams } from "react-router-dom";
import { DeveloperPortal } from "@/components/integrations/DeveloperPortal";
import { ERPWMSIntegrationPanel } from "@/components/integrations/ERPWMSIntegrationPanel";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";
import { useAuthStore } from "@/stores/authStore";

export default function IntegrationsPage() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();
  const activeTab = searchParams.get("tab") || "developer-portal";
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || "";

  return (
    <DashboardLayout title="Integrations">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">
            Manage API keys, webhooks, ERP/WMS connections, and external integrations
          </p>
        </div>
        <Tabs
          value={activeTab}
          onValueChange={v => setSearchParams({ tab: v })}
        >
          <div className="flex justify-center">
            <TabsList>
              <TabsTrigger value="developer-portal">Developer Portal</TabsTrigger>
              <TabsTrigger value="erp-wms">ERP & WMS</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="developer-portal">
            <DeveloperPortal />
          </TabsContent>
          <TabsContent value="erp-wms">
            <ERPWMSIntegrationPanel tenantId={tenantId} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
