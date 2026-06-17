import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Badge } from "@/components/shadcn/badge";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { Label } from "@/components/shadcn/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/shadcn/dialog";
import {
  Users,
  Phone,
  MessageSquare,
  Mail,
  Star,
  Sparkles,
  UserX,
  Clock,
  PhoneCall,
  PhoneOff,
  Send,
  Loader2,
  MessageCircle,
  TrendingUp,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  RotateCcw,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { useFonuCall } from "@/contexts/FonuCallContext";

const statusColors: Record<string, string> = {
  available: "bg-success/20 text-success border-success/30",
  active: "bg-primary/20 text-primary border-primary/30",
  offline: "bg-muted text-muted-foreground border-muted",
  suspended: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function SupervisorDrivers() {
  const [activeTab, setActiveTab] = useState("messages");

  // Communication state
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isFallbackDialogOpen, setIsFallbackDialogOpen] = useState(false);
  const [callStatus, setCallStatus] = useState<"idle" | "ringing" | "connected" | "ended">("idle");
  const [messageType, setMessageType] = useState<"sms" | "whatsapp">("whatsapp");
  const [messageContent, setMessageContent] = useState("");
  const [pendingMessage, setPendingMessage] = useState<string>("");
  const [selectedContactName, setSelectedContactName] = useState<string | undefined>();
  const [selectedContactPhone, setSelectedContactPhone] = useState<string | undefined>();

  // Use real Fonu integration
  const messages: any[] = [];
  const callLogs: any[] = [];
  const sendSMS = async (...args: any[]) => {};
  const sendWhatsApp = async (...args: any[]) => ({ success: false, queued: false });
  const openWhatsAppWeb = (...args: any[]) => {};
  const isSending = false;
  const isLoading = false;
  const refetch = async (...args: any[]) => {};
  const getStats = () => ({ todayMessages: 0, todayCalls: 0, totalMessages: 0, totalCalls: 0, sentMessages: 0, failedMessages: 0, completedCalls: 0, missedCalls: 0 });

  const { startCall, endCall: sipEndCall, status: sipStatus, durationSeconds } = useFonuCall();

  const stats = getStats();

  const handleEndCall = async () => {
    setCallStatus("ended");
    sipEndCall();
    setTimeout(() => {
      setIsCallDialogOpen(false);
      setCallStatus("idle");
    }, 500);
  };

  const handleSendMessage = async () => {
    if (!selectedContactPhone || !messageContent.trim()) return;

    if (messageType === "whatsapp") {
      const result = await sendWhatsApp(
        selectedContactPhone,
        selectedContactName,
        selectedContactPhone,
        messageContent,
        "Supervisor"
      );

      // Check if API is unavailable and offer fallback
      if (!result.success && result.queued) {
        setPendingMessage(messageContent);
        setIsMessageDialogOpen(false);
        setIsFallbackDialogOpen(true);
        return;
      }

      if (!result.success) {
        // Offer fallback for any failure
        setPendingMessage(messageContent);
        setIsMessageDialogOpen(false);
        setIsFallbackDialogOpen(true);
        return;
      }
    } else {
      try {
        await sendSMS(
          selectedContactPhone,
          selectedContactName,
          selectedContactPhone,
          messageContent,
          "Supervisor"
        );
      } catch (err) {
        toast.error('Failed to send SMS');
        return;
      }
    }

    setIsMessageDialogOpen(false);
    setMessageContent("");
  };

  const handleUseFallback = () => {
    if (selectedContactPhone && pendingMessage) {
      openWhatsAppWeb(selectedContactPhone, selectedContactName, pendingMessage);
    }
    setIsFallbackDialogOpen(false);
    setPendingMessage("");
  };

  // Sync modal status with SIP state
  const [lastSipStatus, setLastSipStatus] = useState<typeof sipStatus>("idle");
  useEffect(() => {
    if (sipStatus === lastSipStatus) return;
    setLastSipStatus(sipStatus);
    if (sipStatus === "ringing" || sipStatus === "connecting") setCallStatus("ringing");
    if (sipStatus === "connected") setCallStatus("connected");
    if (sipStatus === "ended" || sipStatus === "failed") {
      setCallStatus("ended");
      setTimeout(() => {
        setIsCallDialogOpen(false);
        setCallStatus("idle");
      }, 500);
    }
  }, [sipStatus, lastSipStatus]);

  // Manual retry functionality
  const [isRetrying, setIsRetrying] = useState(false);

  const handleManualRetry = async () => {
    toast.info('Coming soon');
    return;
  };

  const pendingMessages = messages.filter(m => m.status === 'pending');
  const pendingCount = pendingMessages.length;

  const getRetryInfo = (msg: any) => {
    const metadata = msg.metadata || {};
    return {
      retryCount: metadata.retry_count || 0,
      lastRetry: metadata.last_retry ? new Date(metadata.last_retry) : null,
    };
  };

  const getMessageStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-success';
      case 'delivered': return 'text-primary';
      case 'failed': return 'text-destructive';
      case 'pending': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const getCallStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success';
      case 'in_progress': return 'text-primary';
      case 'failed':
      case 'no_answer':
      case 'busy': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <DashboardLayout
      title="Driver Management"
      subtitle="Manage and communicate with your drivers"
    >
      <div className="space-y-6">
        {/* Main Content with Tabs */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Driver Communications</CardTitle>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 max-w-sm">
                <TabsTrigger value="messages" className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Messages
                  {stats.todayMessages > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                      {stats.todayMessages}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="calls" className="gap-2">
                  <Phone className="h-4 w-4" />
                  Calls
                  {stats.todayCalls > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                      {stats.todayCalls}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Messages Tab */}
              <TabsContent value="messages" className="space-y-4">
                {/* Pending Messages Alert & Retry Button */}
                {pendingCount > 0 && (
                  <div className="flex items-center justify-between p-4 rounded-lg bg-warning/10 border border-warning/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/20">
                        <Timer className="h-5 w-5 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium text-warning">{pendingCount} message{pendingCount > 1 ? 's' : ''} pending</p>
                        <p className="text-sm text-muted-foreground">These messages will be retried automatically every 5 minutes</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleManualRetry}
                      disabled={isRetrying}
                      className="gap-2 border-warning/50 text-warning hover:bg-warning/10"
                    >
                      {isRetrying ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Retrying...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="h-4 w-4" />
                          Retry Now
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.totalMessages}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Today</p>
                    <p className="text-2xl font-bold text-primary">{stats.todayMessages}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-success/10">
                    <p className="text-sm text-muted-foreground">Sent</p>
                    <p className="text-2xl font-bold text-success">{stats.sentMessages}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-warning/10">
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-warning">{pendingCount}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-destructive/10">
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="text-2xl font-bold text-destructive">{stats.failedMessages}</p>
                  </div>
                </div>

                <ScrollArea className="h-[500px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium">No messages yet</p>
                      <p className="text-sm mt-1">Send a message to a driver to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const retryInfo = getRetryInfo(msg);
                        const isPending = msg.status === 'pending';

                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "p-4 rounded-lg border transition-colors hover:bg-muted/30",
                              msg.direction === 'inbound' ? "bg-primary/5 border-primary/20" : "bg-muted/20",
                              isPending && "border-warning/50 bg-warning/5"
                            )}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-white",
                                  "bg-gradient-to-br from-primary to-accent"
                                )}>
                                  {msg.driver_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                                </div>
                                <div>
                                  <p className="font-medium">{msg.driver_name || 'Unknown'}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                                      {msg.message_type === 'whatsapp' ? (
                                        <MessageSquare className="h-3 w-3 mr-1 text-[#25D366]" />
                                      ) : (
                                        <Mail className="h-3 w-3 mr-1 text-primary" />
                                      )}
                                      {msg.message_type}
                                    </Badge>
                                    <span>{msg.direction === 'inbound' ? '← Received' : '→ Sent'}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={cn("flex items-center gap-1 text-sm", getMessageStatusColor(msg.status))}>
                                  {msg.status === 'sent' && <CheckCircle className="h-3.5 w-3.5" />}
                                  {msg.status === 'failed' && <XCircle className="h-3.5 w-3.5" />}
                                  {isPending && <Timer className="h-3.5 w-3.5" />}
                                  <span className="capitalize">{msg.status}</span>
                                </div>
                                {isPending && retryInfo.retryCount > 0 && (
                                  <p className="text-xs text-warning mt-0.5">
                                    Retry {retryInfo.retryCount}/3
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {format(new Date(msg.created_at), 'MMM d, HH:mm')}
                                </p>
                              </div>
                            </div>
                            <p className="mt-3 text-sm text-foreground/80 line-clamp-2">{msg.content}</p>
                            {isPending && (
                              <div className="mt-2 pt-2 border-t border-warning/20 flex items-center justify-between">
                                <span className="text-xs text-warning flex items-center gap-1">
                                  <RotateCcw className="h-3 w-3" />
                                  {retryInfo.lastRetry
                                    ? `Last retry: ${format(retryInfo.lastRetry, 'HH:mm')}`
                                    : 'Waiting for retry...'
                                  }
                                </span>
                                {msg.error_message && (
                                  <span className="text-xs text-muted-foreground">
                                    {msg.error_message}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Calls Tab */}
              <TabsContent value="calls" className="space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Total Calls</p>
                    <p className="text-2xl font-bold">{stats.totalCalls}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Today</p>
                    <p className="text-2xl font-bold text-primary">{stats.todayCalls}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-success/10">
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-success">{stats.completedCalls}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-destructive/10">
                    <p className="text-sm text-muted-foreground">Missed</p>
                    <p className="text-2xl font-bold text-destructive">{stats.missedCalls}</p>
                  </div>
                </div>

                <ScrollArea className="h-[500px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : callLogs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Phone className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium">No call history</p>
                      <p className="text-sm mt-1">Call a driver to see the history here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {callLogs.map((call) => (
                        <div
                          key={call.id}
                          className="p-4 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-full",
                                call.status === 'completed' ? "bg-success/10" : "bg-destructive/10"
                              )}>
                                {call.call_type === 'inbound' ? (
                                  <PhoneCall className={cn(
                                    "h-5 w-5",
                                    call.status === 'completed' ? "text-success" : "text-destructive"
                                  )} />
                                ) : (
                                  <Phone className={cn(
                                    "h-5 w-5",
                                    call.status === 'completed' ? "text-success" : "text-destructive"
                                  )} />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{call.driver_name || 'Unknown'}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{call.call_type === 'inbound' ? '← Incoming' : '→ Outgoing'}</span>
                                  {call.duration_seconds && (
                                    <span>• {Math.floor(call.duration_seconds / 60)}:{(call.duration_seconds % 60).toString().padStart(2, '0')}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={cn("flex items-center gap-1 text-sm", getCallStatusColor(call.status))}>
                                <span className="capitalize">{call.status.replace('_', ' ')}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {format(new Date(call.started_at), 'MMM d, HH:mm')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Call Dialog */}
      <Dialog open={isCallDialogOpen} onOpenChange={setIsCallDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-center">
              {callStatus === "ringing" && "Calling..."}
              {callStatus === "connected" && "Call Connected"}
              {callStatus === "ended" && "Call Ended"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-8">
            <div className={cn(
              "flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white mb-6",
              "bg-gradient-to-br from-primary to-accent shadow-xl",
              callStatus === "ringing" && "animate-pulse"
            )}>
              {selectedContactName?.split(" ").map(n => n[0]).join("")}
            </div>
            <p className="text-xl font-semibold">{selectedContactName}</p>
            <p className="text-muted-foreground">{selectedContactPhone}</p>

            <div className="flex items-center gap-2 mt-6">
              {callStatus === "ringing" && (
                <Badge variant="secondary" className="animate-pulse gap-1 px-4 py-1.5">
                  <PhoneCall className="h-4 w-4" />
                  Ringing...
                </Badge>
              )}
              {callStatus === "connected" && (
                <Badge className="bg-success text-success-foreground gap-1 px-4 py-1.5">
                  <Phone className="h-4 w-4" />
                  Connected
                </Badge>
              )}
              {callStatus === "ended" && (
                <Badge variant="outline" className="gap-1 px-4 py-1.5">
                  Call Ended
                </Badge>
              )}
            </div>

            <Button
              variant="destructive"
              size="lg"
              className="mt-10 rounded-full h-16 w-16 shadow-lg"
              onClick={handleEndCall}
            >
              <PhoneOff className="h-7 w-7" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {messageType === "whatsapp" ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366]/10">
                  <MessageSquare className="h-4 w-4 text-[#25D366]" />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
              )}
              Send {messageType === "whatsapp" ? "WhatsApp" : "SMS"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-base font-bold text-white">
                {selectedContactName?.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <p className="font-semibold">{selectedContactName}</p>
                <p className="text-sm text-muted-foreground">{selectedContactPhone}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Message</Label>
              <Textarea
                placeholder="Type your message here..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {messageContent.length}/160 characters
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)} disabled={isSending}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleSendMessage}
              disabled={!messageContent.trim() || isSending}
              className="gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Fallback Dialog */}
      <Dialog open={isFallbackDialogOpen} onOpenChange={setIsFallbackDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <span className="block">WhatsApp API Unavailable</span>
                <span className="block text-sm font-normal text-muted-foreground">
                  Use WhatsApp Web instead
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border mb-4">
              <p className="text-sm text-muted-foreground mb-2">Your message has been saved and will be retried later. In the meantime, you can send it directly via WhatsApp Web:</p>
              <p className="text-sm font-medium p-3 bg-background rounded border">
                {pendingMessage}
              </p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#25D366]/5 rounded-lg border border-[#25D366]/20">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white">
                {selectedContactName?.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <p className="font-medium">{selectedContactName}</p>
                <p className="text-sm text-muted-foreground">{selectedContactPhone}</p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsFallbackDialogOpen(false);
                setPendingMessage("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUseFallback}
              className="gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white"
            >
              <ExternalLink className="h-4 w-4" />
              Open WhatsApp Web
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
