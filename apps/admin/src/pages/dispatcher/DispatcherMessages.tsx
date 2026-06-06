import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ConversationInbox } from "@/components/communications/ConversationInbox";
import { BroadcastTracker } from "@/components/communications/BroadcastTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Badge } from "@/components/shadcn/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import {
  MessageSquare,
  Users,
  Phone,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

export default function DispatcherMessages() {
  const [activeTab, setActiveTab] = useState("inbox");
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || '';

  // Get real stats from the communications hook
  const messages: any[] = [];
  const stats = { todayMessages: 0, todayCalls: 0 };
  
  // Count active conversations (unique drivers with messages in last 24 hours)
  const activeConversations = new Set(
    messages
      .filter(m => {
        const msgDate = new Date(m.created_at);
        const now = new Date();
        return (now.getTime() - msgDate.getTime()) < 24 * 60 * 60 * 1000;
      })
      .map(m => m.driver_id)
  ).size;

  return (
    <DashboardLayout
      title="Messages"
      subtitle="Communicate with drivers via WhatsApp, SMS, and Voice"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="inbox">Conversations</TabsTrigger>
          <TabsTrigger value="broadcast">Broadcasts</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Conversation Inbox */}
            <div className="lg:col-span-2">
              <ConversationInbox />
            </div>

            {/* Quick Stats Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Communication Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <span className="text-sm">Messages Today</span>
                    </div>
                    <Badge variant="secondary">{stats.todayMessages}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-success" />
                      <span className="text-sm">Calls Today</span>
                    </div>
                    <Badge variant="secondary">{stats.todayCalls}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-warning" />
                      <span className="text-sm">Active Chats</span>
                    </div>
                    <Badge variant="secondary">{activeConversations}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity - Show real recent messages */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {messages.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No recent activity
                      </p>
                    ) : (
                      messages.slice(0, 3).map((msg) => (
                        <div key={msg.id} className="flex items-start gap-3 text-sm">
                          <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="line-clamp-1">
                              {msg.direction === 'outbound' ? 'Sent to' : 'Received from'} {msg.driver_name || 'Driver'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(msg.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="broadcast">
          <BroadcastTracker />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}



