import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { Button } from "@/components/shadcn/button";
import { Ticket } from "lucide-react";
import { useSupportPermissions } from "@/hooks/useSupportPermissions";
import { useAuthStore } from "@/stores/authStore";
import { ReportIssue } from "@/components/support/ReportIssue";
import { MyTickets } from "@/components/support/MyTickets";
import { LogTicketDialog } from "@/components/support/LogTicketDialog";

export default function HelpSupport() {
  const [activeTab, setActiveTab] = useState("tickets");
  const [logTicketOpen, setLogTicketOpen] = useState(false);
  const { hasNoAccess, canViewTickets, canCreateTicket } = useSupportPermissions();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || hasNoAccess) {
      navigate("/auth", { replace: true });
    }
  }, [user, hasNoAccess, navigate]);

  if (!user || hasNoAccess) {
    return null;
  }

  return (
    <DashboardLayout title="Ticketing & Support" subtitle="View tickets and report issues to the platform">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-center">
            <TabsList>
              {canViewTickets && (
                <TabsTrigger value="tickets">Tickets</TabsTrigger>
              )}
              {canCreateTicket && (
                <TabsTrigger value="report">Report Issue</TabsTrigger>
              )}
            </TabsList>
          </div>

          {canViewTickets && (
            <TabsContent value="tickets" className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Tickets</h2>
                  <p className="text-sm text-muted-foreground">
                    View, search, and track the status of all support tickets logged on the platform.
                  </p>
                </div>
                {canCreateTicket && (
                  <Button size="sm" onClick={() => setLogTicketOpen(true)} className="shrink-0">
                    <Ticket className="h-4 w-4 mr-2" />
                    Log Ticket
                  </Button>
                )}
              </div>
              <MyTickets />
            </TabsContent>
          )}

          {canCreateTicket && (
            <TabsContent value="report" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Report an Issue</h2>
                <p className="text-sm text-muted-foreground">
                  Submit a new ticket to the platform support team with relevant context and details.
                </p>
              </div>
              <ReportIssue onSuccess={() => setActiveTab("tickets")} />
            </TabsContent>
          )}
        </Tabs>
      </div>
      <LogTicketDialog open={logTicketOpen} onOpenChange={setLogTicketOpen} />
    </DashboardLayout>
  );
}




