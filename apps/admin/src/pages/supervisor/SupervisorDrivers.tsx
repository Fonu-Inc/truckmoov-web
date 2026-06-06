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
  Search,
  SlidersHorizontal as Filter,
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
  Inbox,
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
import { useDrivers, DriverData } from "@/hooks/useDrivers";
import { toast } from "sonner";
import { useDriverCommunications } from "@/hooks/useDriverCommunications";
import { format } from "date-fns";
import { useFonuCall } from "@/contexts/FonuCallContext";

const statusColors: Record<string, string> = {
  available: "bg-success/20 text-success border-success/30",
  active: "bg-primary/20 text-primary border-primary/30",
  offline: "bg-muted text-muted-foreground border-muted",
  suspended: "bg-destructive/20 text-destructive border-destructive/30",
};

const statusIcons: Record<string, React.ElementType> = {
  available: Sparkles,
  active: Clock,
  offline: UserX,
  suspended: XCircle,
};

export default function SupervisorDrivers() {
  const { drivers } = useDrivers();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<DriverData | null>(null);
  const [activeTab, setActiveTab] = useState("drivers");
  
  // Communication state
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isFallbackDialogOpen, setIsFallbackDialogOpen] = useState(false);
  const [callStatus, setCallStatus] = useState<"idle" | "ringing" | "connected" | "ended">("idle");
  const [messageType, setMessageType] = useState<"sms" | "whatsapp">("whatsapp");
  const [messageContent, setMessageContent] = useState("");
  const [pendingMessage, setPendingMessage] = useState<string>("");

  // Use real Fonu integration
  const { 
    messages,
    callLogs,
    sendSMS, 
    sendWhatsApp,
    openWhatsAppWeb,
    isSending, 
    isLoading,
    refetch,
    getStats,
  } = useDriverCommunications();

  const { startCall, endCall: sipEndCall, status: sipStatus, durationSeconds } = useFonuCall();

  const stats = getStats();

  const filteredDrivers = drivers.filter((driver) => {
    const matchesStatus = statusFilter === "all" || driver.status === statusFilter;
    const matchesSearch =
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const driverStats = {
    total: drivers.length,
    available: drivers.filter((d) => d.status === "available").length,
    onJob: drivers.filter((d) => d.status === "on_trip").length,
    offline: drivers.filter((d) => d.status === "offline").length,
  };

  // Communication handlers
  const handleCallDriver = async (driver: DriverData) => {
    setSelectedDriver(driver);
    setIsCallDialogOpen(true);
    setCallStatus("ringing");
    try {
      await startCall(driver.name, driver.phone, [
        `X-Driver-ID: ${driver.id}`,
        `X-Driver-Name: ${driver.name}`,
      ]);
    } catch (err) {
      setCallStatus("ended");
      setTimeout(() => {
        setIsCallDialogOpen(false);
        setCallStatus("idle");
      }, 1000);
    }
  };

  const handleEndCall = async () => {
    setCallStatus("ended");
    sipEndCall();
    setTimeout(() => {
      setIsCallDialogOpen(false);
      setCallStatus("idle");
    }, 500);
  };

  const openMessageDialog = (driver: DriverData, type: "sms" | "whatsapp") => {
    setSelectedDriver(driver);
    setMessageType(type);
    setMessageContent("");
    setIsMessageDialogOpen(true);
  };

  const handleSendMessage = async () => {
    if (!selectedDriver || !messageContent.trim()) return;
    
    if (messageType === "whatsapp") {
      const result = await sendWhatsApp(
        selectedDriver.id,
        selectedDriver.name,
        selectedDriver.phone,
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
          selectedDriver.id,
          selectedDriver.name,
          selectedDriver.phone,
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
    if (selectedDriver && pendingMessage) {
      openWhatsAppWeb(selectedDriver.phone, selectedDriver.name, pendingMessage);
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

  const handleQuickWhatsApp = (driver: DriverData) => {
    const phone = driver.phone.replace(/\s+/g, "").replace(/^\+/, "");
    const message = encodeURIComponent(`Hello ${driver.name}, this is a message from Fleet Supervisor.`);
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    toast.success(`Opening WhatsApp for ${driver.name}`);
  };

  // Manual retry functionality
  const [isRetrying, setIsRetrying] = useState(false);
  
  const handleManualRetry = async () => {
    toast.info("Coming soon");
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
        {/* Stats Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Drivers</p>
                  <p className="text-3xl font-bold">{driverStats.total}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available</p>
                  <p className="text-3xl font-bold text-success">{driverStats.available}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                  <Sparkles className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">On Job</p>
                  <p className="text-3xl font-bold text-accent">{driverStats.onJob}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-transparent" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Offline</p>
                  <p className="text-3xl font-bold text-muted-foreground">{driverStats.offline}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <UserX className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="drivers" className="gap-2">
                  <Users className="h-4 w-4" />
                  Drivers
                </TabsTrigger>
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

              {/* Drivers Tab */}
              <TabsContent value="drivers" className="space-y-6">
                {/* Filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Drivers Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDrivers.map((driver) => {
                    const StatusIcon = statusIcons[driver.status] || UserX;
                    return (
                      <Card 
                        key={driver.id} 
                        className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/30"
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              "relative flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white",
                              "bg-gradient-to-br from-primary to-accent shadow-lg transition-transform group-hover:scale-105"
                            )}>
                              {driver.name.split(" ").map(n => n[0]).join("")}
                              <div className={cn(
                                "absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background",
                                driver.status === 'available' && "bg-success",
                                driver.status === 'on_trip' && "bg-accent",
                                driver.status === 'offline' && "bg-muted-foreground",
                                driver.status === 'on_break' && "bg-destructive",
                              )}>
                                <StatusIcon className="h-3 w-3 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold truncate text-base">{driver.name}</p>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {driver.phone}
                              </p>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                                <span className="flex items-center gap-1">
                                  <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                                  <span className="font-medium">{driver.rating.toFixed(1)}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="h-3.5 w-3.5" />
                                  {driver.totalTrips} trips
                                </span>
                              </div>
                              <Badge className={cn("mb-3", statusColors[driver.status])}>
                                {driver.status.replace("_", " ")}
                              </Badge>
                              <div className="flex gap-2 pt-2 border-t border-border/50">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="flex-1 gap-1.5 h-9 text-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/10 hover:border-[#25D366]/30"
                                  onClick={() => openMessageDialog(driver, "whatsapp")}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                  WhatsApp
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="flex-1 gap-1.5 h-9 text-primary hover:text-primary hover:bg-primary/10 hover:border-primary/30"
                                  onClick={() => openMessageDialog(driver, "sms")}
                                >
                                  <Mail className="h-4 w-4" />
                                  SMS
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="gap-1.5 h-9 text-accent hover:text-accent hover:bg-accent/10 hover:border-accent/30 px-3"
                                  onClick={() => handleCallDriver(driver)}
                                >
                                  <Phone className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {filteredDrivers.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium">No drivers found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filter</p>
                    </div>
                  )}
                </div>
              </TabsContent>

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
                                  {msg.driver_name?.split(" ").map(n => n[0]).join("") || "?"}
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
              {selectedDriver?.name.split(" ").map(n => n[0]).join("")}
            </div>
            <p className="text-xl font-semibold">{selectedDriver?.name}</p>
            <p className="text-muted-foreground">{selectedDriver?.phone}</p>
            
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
                {selectedDriver?.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <p className="font-semibold">{selectedDriver?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedDriver?.phone}</p>
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
                {selectedDriver?.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <p className="font-medium">{selectedDriver?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedDriver?.phone}</p>
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



