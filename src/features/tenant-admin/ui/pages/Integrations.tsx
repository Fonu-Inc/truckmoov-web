import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DeveloperPortal } from '@/components/integrations/DeveloperPortal';

export default function IntegrationsPage() {
  return (
    <DashboardLayout title="Developer Portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Developer Portal</h1>
          <p className="text-muted-foreground">
            Manage API keys, webhooks, and external integrations
          </p>
        </div>
        <DeveloperPortal />
      </div>
    </DashboardLayout>
  );
}
