import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { AllTickets } from "@/components/support/admin/AllTickets";
import { EscalatedTickets } from "@/components/support/admin/EscalatedTickets";
import { SupportDashboard } from "@/components/support/admin/SupportDashboard";

export default function PlatformSupport() {
  const [
    activeTab,
    setActiveTab,
  ] = useState("dashboard");

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="all-tickets">All Tickets</TabsTrigger>
            <TabsTrigger value="escalated">Escalated</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="dashboard"
          className="space-y-6"
        >
          <SupportDashboard />
        </TabsContent>

        <TabsContent
          value="all-tickets"
          className="space-y-6"
        >
          <AllTickets />
        </TabsContent>

        <TabsContent
          value="escalated"
          className="space-y-6"
        >
          <EscalatedTickets />
        </TabsContent>
      </Tabs>
    </div>
  );
}
