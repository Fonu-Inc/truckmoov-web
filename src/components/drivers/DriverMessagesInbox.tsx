import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useDriverCommunications, DriverMessage, DriverCallLog } from "@/hooks/useDriverCommunications";
import { cn } from "@/lib/utils";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";

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

export function DriverMessagesInbox() {
  const { messages, callLogs, isLoading, getStats, refetch } = useDriverCommunications();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("messages");

  const stats = getStats();

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
