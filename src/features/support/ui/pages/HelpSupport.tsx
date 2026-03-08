import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupportPermissions } from "@/hooks/useSupportPermissions";
import { HelpHome } from "@/features/support/ui/components/support/HelpHome";
import { QuickHelp } from "@/features/support/ui/components/support/QuickHelp";
import { ReportIssue } from "@/features/support/ui/components/support/ReportIssue";
import { MyTickets } from "@/features/support/ui/components/support/MyTickets";
import { SystemStatus } from "@/features/support/ui/components/support/SystemStatus";
import { ShieldAlert } from "lucide-react";

export default function HelpSupport() {
  const [activeTab, setActiveTab] = useState("home");
  const { hasNoAccess, canViewTickets, canCreateTicket } = useSupportPermissions();

  if (hasNoAccess) {
    return (
      <DashboardLayout title="Access Restricted">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <ShieldAlert className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Restricted</h1>
          <p className="text-muted-foreground max-w-md">
            You don't have permission to access the Help & Support section. 
            Please contact your administrator if you need assistance.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Help & Support" subtitle="Get help, report issues, and track your support requests">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="home">Overview</TabsTrigger>
            <TabsTrigger value="quick-help">Quick Help</TabsTrigger>
            {canCreateTicket && (
              <TabsTrigger value="report">Report Issue</TabsTrigger>
            )}
            {canViewTickets && (
              <TabsTrigger value="tickets">My Tickets</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            <HelpHome onNavigate={setActiveTab} />
          </TabsContent>

          <TabsContent value="quick-help" className="space-y-6">
            <QuickHelp />
          </TabsContent>

          {canCreateTicket && (
            <TabsContent value="report" className="space-y-6">
              <ReportIssue onSuccess={() => setActiveTab("tickets")} />
            </TabsContent>
          )}

          {canViewTickets && (
            <TabsContent value="tickets" className="space-y-6">
              <MyTickets />
            </TabsContent>
          )}
        </Tabs>

        <SystemStatus />
      </div>
    </DashboardLayout>
  );
}
