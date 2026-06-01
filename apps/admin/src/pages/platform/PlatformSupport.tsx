import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { useSupportPermissions } from "@/hooks/useSupportPermissions";
import { SupportDashboard } from "@/components/support/admin/SupportDashboard";
import { AllTickets } from "@/components/support/admin/AllTickets";
import { EscalatedTickets } from "@/components/support/admin/EscalatedTickets";
import { DeviceSetupRequestsQueue } from "@/components/devices/DeviceSetupRequestsQueue";
import { useDeviceSetupRequests } from "@/hooks/useDeviceSetupRequests";
import { ShieldAlert } from "lucide-react";

export default function PlatformSupport() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { canManageAllTickets } = useSupportPermissions();
  const {
    requests: deviceRequests,
    loading: deviceRequestsLoading,
    refetch: refetchDeviceRequests,
    updateRequestStatus,
  } = useDeviceSetupRequests();

  if (!canManageAllTickets) {
    return (
      <DashboardLayout title="Access Restricted">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <ShieldAlert className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Restricted</h1>
          <p className="text-muted-foreground max-w-md">
            You don't have permission to access the Support & Incidents management section.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Support & Incidents" subtitle="Manage support tickets, escalations, and incident responses across all tenants">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-center">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="all-tickets">All Tickets</TabsTrigger>
              <TabsTrigger value="escalated">Escalated</TabsTrigger>
              <TabsTrigger value="device-setup">Device Setup</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-6">
            <SupportDashboard />
          </TabsContent>

          <TabsContent value="all-tickets" className="space-y-6">
            <AllTickets />
          </TabsContent>

          <TabsContent value="escalated" className="space-y-6">
            <EscalatedTickets />
          </TabsContent>

          <TabsContent value="device-setup" className="space-y-6">
            <DeviceSetupRequestsQueue
              requests={deviceRequests}
              loading={deviceRequestsLoading}
              onRefresh={refetchDeviceRequests}
              onUpdateStatus={updateRequestStatus}
              isConfigurator={true}
              isSupportMode={true}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}



