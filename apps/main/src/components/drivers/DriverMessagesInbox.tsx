import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Badge } from "@/components/shadcn/badge";
import { Input } from "@/components/shadcn/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  MessageSquare,
  Phone,
  Mail,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
type DriverMessage = any;
type DriverCallLog = any;
import { cn } from "@/lib/utils";
import { TooltipWrapper } from "@/components/shadcn/tooltip-wrapper";

const statusColors: Record<string, string> = {
  sent: "bg-success/20 text-success",
  delivered: "bg-success/20 text-success",
  pending: "bg-warning/20 text-warning",
  failed: "bg-destructive/20 text-destructive",
  read: "bg-primary/20 text-primary",
  completed: "bg-success/20 text-success",
  initiated: "bg-primary/20 text-primary",
  ringing: "bg-warning/20 text-warning",
  connected: "bg-success/20 text-success",
  no_answer: "bg-muted text-muted-foreground",
};

const DEMO_MESSAGES: DriverMessage[] = [
  { id: "dm1", tenant_id: "demo", driver_id: "d1", driver_name: "Adewale Johnson", driver_phone: "+2348012345678", message_type: "whatsapp", direction: "outbound", content: "Hi Adewale, please confirm pickup at Apapa terminal by 9am.", status: "delivered", external_id: null, sender_id: null, sender_name: "Dispatcher", error_message: null, created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(), updated_at: new Date().toISOString() },
  { id: "dm2", tenant_id: "demo", driver_id: "d1", driver_name: "Adewale Johnson", driver_phone: "+2348012345678", message_type: "whatsapp", direction: "inbound", content: "Confirmed. On my way now.", status: "read", external_id: null, sender_id: null, sender_name: null, error_message: null, created_at: new Date(Date.now() - 1000 * 60 * 9).toISOString(), updated_at: new Date().toISOString() },
  { id: "dm3", tenant_id: "demo", driver_id: "d2", driver_name: "Chinedu Okafor", driver_phone: "+2348023456789", message_type: "sms", direction: "outbound", content: "Reminder: Vehicle inspection due tomorrow at HQ workshop.", status: "sent", external_id: null, sender_id: null, sender_name: "Fleet Manager", error_message: null, created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), updated_at: new Date().toISOString() },
  { id: "dm4", tenant_id: "demo", driver_id: "d3", driver_name: "Funmi Adebayo", driver_phone: "+2348034567890", message_type: "whatsapp", direction: "inbound", content: "Traffic at Third Mainland Bridge. ETA delayed by 30 min.", status: "read", external_id: null, sender_id: null, sender_name: null, error_message: null, created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(), updated_at: new Date().toISOString() },
  { id: "dm5", tenant_id: "demo", driver_id: "d4", driver_name: "Ibrahim Musa", driver_phone: "+2348045678901", message_type: "sms", direction: "outbound", content: "New job offer: Lagos → Ibadan, ₦85,000. Reply YES to accept.", status: "delivered", external_id: null, sender_id: null, sender_name: "Dispatcher", error_message: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), updated_at: new Date().toISOString() },
  { id: "dm6", tenant_id: "demo", driver_id: "d4", driver_name: "Ibrahim Musa", driver_phone: "+2348045678901", message_type: "sms", direction: "inbound", content: "YES", status: "read", external_id: null, sender_id: null, sender_name: null, error_message: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 3 + 60000).toISOString(), updated_at: new Date().toISOString() },
  { id: "dm7", tenant_id: "demo", driver_id: "d5", driver_name: "Blessing Eze", driver_phone: "+2348056789012", message_type: "whatsapp", direction: "outbound", content: "Please share POD photo once delivery is complete.", status: "delivered", external_id: null, sender_id: null, sender_name: "Dispatcher", error_message: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), updated_at: new Date().toISOString() },
  { id: "dm8", tenant_id: "demo", driver_id: "d2", driver_name: "Chinedu Okafor", driver_phone: "+2348023456789", message_type: "whatsapp", direction: "outbound", content: "Harsh braking detected. Please drive safely.", status: "failed", external_id: null, sender_id: null, sender_name: "Safety Bot", error_message: "Recipient outside session window", created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), updated_at: new Date().toISOString() },
];

const DEMO_CALLS: DriverCallLog[] = [
  { id: "dc1", tenant_id: "demo", driver_id: "d1", driver_name: "Adewale Johnson", driver_phone: "+2348012345678", caller_id: null, caller_name: "Dispatcher", call_type: "outbound", status: "completed", external_call_id: null, duration_seconds: 184, recording_url: null, notes: "Confirmed pickup details", started_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(), ended_at: new Date(Date.now() - 1000 * 60 * 22).toISOString(), created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString() },
  { id: "dc2", tenant_id: "demo", driver_id: "d3", driver_name: "Funmi Adebayo", driver_phone: "+2348034567890", caller_id: null, caller_name: "Fleet Manager", call_type: "outbound", status: "no_answer", external_call_id: null, duration_seconds: 0, recording_url: null, notes: null, started_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), ended_at: null, created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
  { id: "dc3", tenant_id: "demo", driver_id: "d2", driver_name: "Chinedu Okafor", driver_phone: "+2348023456789", caller_id: null, caller_name: null, call_type: "inbound", status: "completed", external_call_id: null, duration_seconds: 67, recording_url: null, notes: "Reported flat tyre near Berger", started_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), ended_at: new Date(Date.now() - 1000 * 60 * 60 * 2 + 67000).toISOString(), created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: "dc4", tenant_id: "demo", driver_id: "d4", driver_name: "Ibrahim Musa", driver_phone: "+2348045678901", caller_id: null, caller_name: "Dispatcher", call_type: "outbound", status: "completed", external_call_id: null, duration_seconds: 312, recording_url: null, notes: "Briefed on Ibadan delivery", started_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), ended_at: new Date(Date.now() - 1000 * 60 * 60 * 4 + 312000).toISOString(), created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() },
  { id: "dc5", tenant_id: "demo", driver_id: "d5", driver_name: "Blessing Eze", driver_phone: "+2348056789012", caller_id: null, caller_name: "Dispatcher", call_type: "outbound", status: "failed", external_call_id: null, duration_seconds: 0, recording_url: null, notes: null, started_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), ended_at: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() },
  { id: "dc6", tenant_id: "demo", driver_id: "d1", driver_name: "Adewale Johnson", driver_phone: "+2348012345678", caller_id: null, caller_name: null, call_type: "inbound", status: "completed", external_call_id: null, duration_seconds: 95, recording_url: null, notes: "Asked for fuel card top-up", started_at: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(), ended_at: new Date(Date.now() - 1000 * 60 * 60 * 9 + 95000).toISOString(), created_at: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString() },
];

export function DriverMessagesInbox() {
  const liveMessages: any[] = [];
  const liveCalls: any[] = [];
  const isLoading = false;
  const getStats = () => ({ todayMessages: 0, todayCalls: 0, sentMessages: 0, failedMessages: 0, totalMessages: 0, totalCalls: 0, completedCalls: 0, missedCalls: 0 });
  const refetch = async (...args: any[]) => {};
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("messages");

  const messages = liveMessages.length === 0 ? DEMO_MESSAGES : liveMessages;
  const callLogs = liveCalls.length === 0 ? DEMO_CALLS : liveCalls;

  const stats = liveMessages.length === 0 && liveCalls.length === 0
    ? {
        todayMessages: messages.filter(m => Date.now() - new Date(m.created_at).getTime() < 86400000).length,
        todayCalls: callLogs.filter(c => Date.now() - new Date(c.created_at).getTime() < 86400000).length,
        sentMessages: messages.filter(m => m.status === "sent" || m.status === "delivered").length,
        failedMessages: messages.filter(m => m.status === "failed").length,
        totalMessages: messages.length, totalCalls: callLogs.length,
        completedCalls: callLogs.filter(c => c.status === "completed").length,
        missedCalls: callLogs.filter(c => c.status === "no_answer" || c.status === "failed").length,
      }
    : getStats();

  const filteredMessages = messages.filter(
    (m) =>
      m.driver_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.driver_phone.includes(searchQuery) ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCalls = callLogs.filter(
    (c) =>
      c.driver_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.driver_phone.includes(searchQuery)
  );

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Communications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Driver Communications
          </CardTitle>
          <TooltipWrapper content="Refresh communications">
            <Button variant="ghost" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </TooltipWrapper>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold">{stats.todayMessages}</p>
            <p className="text-xs text-muted-foreground">Today's Messages</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold">{stats.todayCalls}</p>
            <p className="text-xs text-muted-foreground">Today's Calls</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-success">{stats.sentMessages}</p>
            <p className="text-xs text-muted-foreground">Sent</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-destructive">{stats.failedMessages}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by driver name, phone, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="messages" className="flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages ({filteredMessages.length})
            </TabsTrigger>
            <TabsTrigger value="calls" className="flex-1">
              <Phone className="h-4 w-4 mr-2" />
              Calls ({filteredCalls.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredMessages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No messages found</p>
                  </div>
                ) : (
                  filteredMessages.map((message) => (
                    <MessageItem key={message.id} message={message} />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="calls" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredCalls.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No call logs found</p>
                  </div>
                ) : (
                  filteredCalls.map((call) => (
                    <CallItem key={call.id} call={call} />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function MessageItem({ message }: { message: DriverMessage }) {
  const isOutbound = message.direction === "outbound";

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white",
        "bg-gradient-to-br from-primary to-accent"
      )}>
        {message.driver_name?.split(" ").map(n => n[0]).join("") || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{message.driver_name || message.driver_phone}</p>
            {isOutbound ? (
              <ArrowUpRight className="h-3 w-3 text-primary" />
            ) : (
              <ArrowDownLeft className="h-3 w-3 text-success" />
            )}
            {message.message_type === "whatsapp" ? (
              <MessageSquare className="h-3 w-3 text-success" />
            ) : (
              <Mail className="h-3 w-3 text-primary" />
            )}
          </div>
          <Badge className={statusColors[message.status] || "bg-muted"}>
            {message.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{message.content}</p>
        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
          {message.sender_name && (
            <span>by {message.sender_name}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function CallItem({ call }: { call: DriverCallLog }) {
  const isOutbound = call.call_type === "outbound";
  const statusIcon = call.status === "completed" ? (
    <CheckCircle className="h-4 w-4 text-success" />
  ) : call.status === "failed" || call.status === "no_answer" ? (
    <XCircle className="h-4 w-4 text-destructive" />
  ) : (
    <Phone className="h-4 w-4 text-primary" />
  );

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white",
        call.status === "completed" ? "bg-success" :
        call.status === "failed" || call.status === "no_answer" ? "bg-destructive" :
        "bg-primary"
      )}>
        {statusIcon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{call.driver_name || call.driver_phone}</p>
            {isOutbound ? (
              <ArrowUpRight className="h-3 w-3 text-primary" />
            ) : (
              <ArrowDownLeft className="h-3 w-3 text-success" />
            )}
          </div>
          <Badge className={statusColors[call.status] || "bg-muted"}>
            {call.status.replace("_", " ")}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{call.driver_phone}</span>
          {call.duration_seconds !== null && call.duration_seconds > 0 && (
            <span>{Math.floor(call.duration_seconds / 60)}:{(call.duration_seconds % 60).toString().padStart(2, '0')}</span>
          )}
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(call.started_at), { addSuffix: true })}
          </span>
          {call.caller_name && (
            <span>by {call.caller_name}</span>
          )}
        </div>
      </div>
    </div>
  );
}
