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
import { PageTitle } from "@/shared/components/layout/PageTitle";

const TAB_HEADINGS: Record<string, {
  title: string; description: string;
}> = {
  "dashboard": {
    title: "Support Dashboard",
    description: "Get an overview of support activities, ticket statistics, resolution progress, and ongoing support operations across the platform.",
  },
  "all-tickets": {
    title: "All Tickets",
    description: "View and manage all support tickets submitted across the platform, including their statuses, priorities, and assigned support agents.",
  },
  "escalated": {
    title: "Escalated Tickets",
    description: "Monitor and manage escalated support tickets that require additional attention or intervention.",
  },
};

/** `/support` — off-nav, so no automatic heading: the per-tab heading renders under the bar. */
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
          <TabsList className="h-auto max-w-full flex-wrap gap-1">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="all-tickets">All Tickets</TabsTrigger>
            <TabsTrigger value="escalated">Escalated</TabsTrigger>
          </TabsList>
        </div>

        <PageTitle {...TAB_HEADINGS[activeTab]} />

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
