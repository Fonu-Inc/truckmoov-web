import {
  formatRelative, formatWithPattern,
} from "@truckmoov/app-core/utils/time-utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Camera,
  CheckCheck,
  CheckCircle,
  Clock,
  FileText,
  Image as ImageIcon,
  Loader2,
  Mail,
  MessageSquare,
  Pause,
  Phone,
  PhoneCall,
  PhoneMissed,
  PhoneOutgoing,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  X,
  XCircle,
} from "lucide-react";
import {
  useEffect, useMemo, useRef, useState,
} from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmojiPicker } from "@/components/messaging/EmojiPicker";
import {
  Avatar, AvatarFallback,
} from "@/components/shadcn/avatar";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Tabs, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";
import { Textarea } from "@/components/shadcn/textarea";
import { TooltipWrapper } from "@/components/shadcn/tooltip-wrapper";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

type DriverMessage = any;
type DriverCallLog = any;

// Unified communication item
type CommunicationItem = {
  id: string;
  type: "message" | "call";
  driverId: string;
  driverName: string | null;
  driverPhone: string;
  direction: "inbound" | "outbound";
  timestamp: string;
  // Message specific
  content?: string;
  messageType?: string;
  status?: string;
  // Call specific
  callStatus?: string;
  duration?: number | null;
  recordingUrl?: string | null;
};

// Group communications by driver
type DriverConversation = {
  driverId: string;
  driverName: string | null;
  driverPhone: string;
  lastActivity: string;
  unreadCount: number;
  items: CommunicationItem[];
};

const statusColors: Record<string, string> = {
  sent: "bg-success/20 text-success",
  delivered: "bg-success/20 text-success",
  pending: "bg-warning/20 text-warning",
  queued: "bg-warning/20 text-warning",
  failed: "bg-destructive/20 text-destructive",
  read: "bg-primary/20 text-primary",
  completed: "bg-success/20 text-success",
  initiated: "bg-primary/20 text-primary",
  ringing: "bg-warning/20 text-warning",
  connected: "bg-success/20 text-success",
  no_answer: "bg-muted text-muted-foreground",
};

export default function DispatcherInbox() {
  const { user } = useAuthStore();
  const messages: any[] = [];
  const callLogs: any[] = [];
  const isLoading = false;
  const isSending = false;
  const isCalling = false;
  const sendSMS = async (...args: any[]) => ({ success: false });
  const sendWhatsApp = async (...args: any[]) => ({ success: false });
  const initiateCall = async (...args: any[]) => {};
  const refetch = async (...args: any[]) => {};

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    selectedDriverId,
    setSelectedDriverId,
  ] = useState<string | null>(null);
  const [
    filterType,
    setFilterType,
  ] = useState<"all" | "whatsapp" | "sms" | "voice">("all");
  const [
    replyMessage,
    setReplyMessage,
  ] = useState("");
  const [
    attachments,
    setAttachments,
  ] = useState<File[]>([]);
  const [
    attachOpen,
    setAttachOpen,
  ] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleAttachFiles = (files: FileList | null) => {
    if (!files || files.length === 0)
      return;
    setAttachments(prev => [
      ...prev,
      ...Array.from(files),
    ]);
    setAttachOpen(false);
  };

  const handleCreatePoll = () => {
    setAttachOpen(false);
    toast.info("Polls coming soon");
  };

  // Auto-scroll to bottom when new items arrive
  useEffect(
    () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    },
    [
      messages,
      callLogs,
      selectedDriverId,
    ],
  );

  // Convert messages and calls to unified items
  const allItems = useMemo(
    () => {
      const items: CommunicationItem[] = [];

      messages.forEach((msg) => {
        items.push({
          id: msg.id,
          type: "message",
          driverId: msg.driver_id,
          driverName: msg.driver_name,
          driverPhone: msg.driver_phone,
          direction: msg.direction as "inbound" | "outbound",
          timestamp: msg.created_at,
          content: msg.content,
          messageType: msg.message_type,
          status: msg.status,
        });
      });

      callLogs.forEach((call) => {
        items.push({
          id: call.id,
          type: "call",
          driverId: call.driver_id || call.driver_phone,
          driverName: call.driver_name,
          driverPhone: call.driver_phone,
          direction: call.call_type as "inbound" | "outbound",
          timestamp: call.started_at,
          callStatus: call.status,
          duration: call.duration_seconds,
          recordingUrl: call.recording_url,
        });
      });

      return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    [
      messages,
      callLogs,
    ],
  );

  // Group by driver
  const conversations = useMemo(
    () => {
      const grouped = new Map<string, DriverConversation>();

      allItems.forEach((item) => {
        const key = item.driverId;
        if (!grouped.has(key)) {
          grouped.set(
            key,
            {
              driverId: item.driverId,
              driverName: item.driverName,
              driverPhone: item.driverPhone,
              lastActivity: item.timestamp,
              unreadCount: 0,
              items: [],
            },
          );
        }
        const conv = grouped.get(key)!;
        conv.items.push(item);
        if (item.direction === "inbound" && item.type === "message") {
          conv.unreadCount++;
        }
        if (new Date(item.timestamp) > new Date(conv.lastActivity)) {
          conv.lastActivity = item.timestamp;
        }
      });

      return Array.from(grouped.values())
        .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
        .filter((conv) => {
          if (!searchQuery)
            return true;
          const query = searchQuery.toLowerCase();
          return (
            conv.driverName?.toLowerCase().includes(query)
            || conv.driverPhone.includes(query)
          );
        });
    },
    [
      allItems,
      searchQuery,
    ],
  );

  const selectedConversation = useMemo(
    () => {
      if (!selectedDriverId)
        return null;
      return conversations.find(c => c.driverId === selectedDriverId) || null;
    },
    [
      selectedDriverId,
      conversations,
    ],
  );

  const filteredItems = useMemo(
    () => {
      if (!selectedConversation)
        return [];
      return selectedConversation.items.filter((item) => {
        if (filterType === "all")
          return true;
        if (filterType === "whatsapp")
          return item.type === "message" && item.messageType === "whatsapp";
        if (filterType === "sms")
          return item.type === "message" && item.messageType === "sms";
        if (filterType === "voice")
          return item.type === "call";
        return true;
      });
    },
    [
      selectedConversation,
      filterType,
    ],
  );

  const handleSendReply = async (channel?: "sms" | "whatsapp") => {
    if (!replyMessage.trim() || !selectedConversation)
      return;

    // Determine channel: explicit param > active filter tab > default sms
    const resolvedChannel = channel || (filterType === "whatsapp" ? "whatsapp" : "sms");

    try {
      if (resolvedChannel === "whatsapp") {
        const result = await sendWhatsApp(
          selectedConversation.driverId,
          selectedConversation.driverName || "Driver",
          selectedConversation.driverPhone,
          replyMessage,
          user?.name,
        );
        if (result.success) {
          setReplyMessage("");
        }
        else {
          toast.error(
            "WhatsApp unavailable",
            { description: "Message queued. Try SMS instead." },
          );
        }
      }
      else {
        await sendSMS(
          selectedConversation.driverId,
          selectedConversation.driverName || "Driver",
          selectedConversation.driverPhone,
          replyMessage,
          user?.name,
        );
        setReplyMessage("");
      }
    }
    catch (err) {
      // Error toast handled in hook
    }
  };

  const handleInitiateCall = async () => {
    if (!selectedConversation)
      return;

    try {
      await initiateCall(
        selectedConversation.driverId,
        selectedConversation.driverName || "Driver",
        selectedConversation.driverPhone,
        user?.name,
      );
    }
    catch (err) {
      // Error toast handled in hook
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout
        title="Omnichannel Inbox"
        subtitle="Unified messaging and calls with drivers"
      >
        <div className="grid gap-6 lg:grid-cols-3 h-[calc(100vh-12rem)]">
          <Card className="lg:col-span-1">
            <CardContent className="p-4 space-y-3">
              {[...Array.from({ length: 6 })].map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-16 w-full"
                />
              ))}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardContent className="p-4">
              <Skeleton className="h-full w-full min-h-[400px]" />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Omnichannel Inbox"
      subtitle="Unified messaging and calls with drivers"
    >
      <div className="grid gap-4 lg:grid-cols-3 h-[calc(100vh-12rem)]">
        {/* Conversation List */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Conversations
              </CardTitle>
              <TooltipWrapper content="Refresh">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => refetch()}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipWrapper>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search drivers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="px-2 pb-2">
                {conversations.length === 0
                  ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No conversations yet</p>
                      </div>
                    )
                  : (
                      conversations.map(conv => (
                        <button
                          key={conv.driverId}
                          onClick={() => setSelectedDriverId(conv.driverId)}
                          className={cn(
                            "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                            selectedDriverId === conv.driverId
                              ? "bg-primary/10 border border-primary/20"
                              : "hover:bg-muted/50",
                          )}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-sm">
                              {conv.driverName?.split(" ").map(n => n[0]).join("") || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-sm truncate">
                                {conv.driverName || conv.driverPhone}
                              </p>
                              {conv.unreadCount > 0 && (
                                <Badge
                                  variant="default"
                                  className="h-5 min-w-5 text-xs"
                                >
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {conv.items[0]?.type === "message"
                                ? (
                                    conv.items[0]?.messageType === "whatsapp"
                                      ? (
                                          <Badge
                                            variant="outline"
                                            className="h-4 px-1.5 text-[9px] font-medium bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30 gap-0.5"
                                          >
                                            <WhatsAppLogo className="h-2.5 w-2.5" />
                                            WhatsApp
                                          </Badge>
                                        )
                                      : (
                                          <Badge
                                            variant="outline"
                                            className="h-4 px-1.5 text-[9px] font-medium bg-primary/10 text-primary border-primary/30 gap-0.5"
                                          >
                                            <SMSLogo className="h-2.5 w-2.5" />
                                            SMS
                                          </Badge>
                                        )
                                  )
                                : (
                                    <Badge
                                      variant="outline"
                                      className="h-4 px-1.5 text-[9px] font-medium bg-warning/10 text-warning border-warning/30 gap-0.5"
                                    >
                                      <PhoneLogo className="h-2.5 w-2.5" />
                                      Call
                                    </Badge>
                                  )}
                              <p className="text-xs text-muted-foreground truncate flex-1">
                                {conv.items[0]?.type === "message"
                                  ? conv.items[0].content?.substring(
                                      0,
                                      40,
                                    )
                                  : (conv.items[0]?.callStatus || "Call").replace(
                                      "_",
                                      " ",
                                    )}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatRelative(conv.lastActivity)}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Conversation Detail */}
        <Card className="lg:col-span-2 flex flex-col">
          {!selectedConversation ? (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm">Choose a driver from the list to view their communication history</p>
              </div>
            </CardContent>
          ) : (
            <>
              {/* Header */}
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                        {selectedConversation.driverName?.split(" ").map(n => n[0]).join("") || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{selectedConversation.driverName || "Unknown Driver"}</p>
                      <p className="text-sm text-muted-foreground">{selectedConversation.driverPhone}</p>
                    </div>
                    {/* Call Button */}
                    <TooltipWrapper content="Call driver">
                      <Button
                        variant="outline"
                        size="icon"
                        className="ml-2 text-success hover:text-success hover:bg-success/10"
                        onClick={handleInitiateCall}
                        disabled={isCalling}
                      >
                        {isCalling
                          ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )
                          : (
                              <PhoneOutgoing className="h-4 w-4" />
                            )}
                      </Button>
                    </TooltipWrapper>
                  </div>
                  <Tabs
                    value={filterType}
                    onValueChange={v => setFilterType(v as typeof filterType)}
                  >
                    <TabsList className="h-8">
                      <TabsTrigger
                        value="all"
                        className="text-xs px-3"
                      >
                        All
                      </TabsTrigger>
                      <TabsTrigger
                        value="whatsapp"
                        className="text-xs px-3"
                      >
                        <WhatsAppLogo className="h-3 w-3 mr-1 text-[#25D366]" />
                        WhatsApp
                      </TabsTrigger>
                      <TabsTrigger
                        value="sms"
                        className="text-xs px-3"
                      >
                        <SMSLogo className="h-3 w-3 mr-1 text-blue-500" />
                        SMS
                      </TabsTrigger>
                      <TabsTrigger
                        value="voice"
                        className="text-xs px-3"
                      >
                        <PhoneLogo className="h-3 w-3 mr-1 text-orange-500" />
                        Voice
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>

              {/* Messages/Calls Timeline */}
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea
                  className="h-full p-4"
                  ref={scrollRef}
                >
                  <div className="space-y-3">
                    {filteredItems.length === 0
                      ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <p className="text-sm">
                              No
                              {filterType === "all" ? "activity" : filterType}
                              {" "}
                              found
                            </p>
                          </div>
                        )
                      : (
                          [...filteredItems].reverse().map(item => (
                            <CommunicationBubble
                              key={item.id}
                              item={item}
                            />
                          ))
                        )}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Reply Input */}
              <div className="p-4 border-t">
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-2">
                    {attachments.map((file, idx) => {
                      const isImage = file.type.startsWith("image/");
                      const url = isImage ? URL.createObjectURL(file) : null;
                      return (
                        <div
                          key={`${file.name}-${idx}`}
                          className="relative flex items-center gap-2 pl-1 pr-6 py-1 rounded-md border border-border bg-muted/40 max-w-[180px]"
                        >
                          {isImage && url
                            ? (
                                <img
                                  src={url}
                                  alt={file.name}
                                  className="h-7 w-7 rounded object-cover"
                                />
                              )
                            : (
                                <span className="flex h-7 w-7 items-center justify-center rounded bg-primary/15 text-foreground">
                                  <FileText className="h-4 w-4" />
                                </span>
                              )}
                          <span className="text-xs truncate">{file.name}</span>
                          <button
                            type="button"
                            aria-label="Remove attachment"
                            onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Popover
                    open={attachOpen}
                    onOpenChange={setAttachOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="Add attachment"
                        className="shrink-0 h-10 w-10 rounded-full bg-muted hover:bg-muted/80 text-foreground"
                      >
                        <Plus className={cn(
                          "h-5 w-5 transition-transform",
                          attachOpen && "rotate-45",
                        )}
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="top"
                      align="start"
                      sideOffset={6}
                      className="w-[208px] p-1.5 rounded-xl shadow-xl border-border"
                    >
                      <div className="px-1.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Attach
                      </div>
                      <div className="grid gap-0.5">
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          className="flex items-center gap-2 px-1.5 py-1.5 rounded-md hover:bg-muted text-left transition-colors"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-foreground shrink-0">
                            <ImageIcon className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-[12px] font-medium truncate">Photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="flex items-center gap-2 px-1.5 py-1.5 rounded-md hover:bg-muted text-left transition-colors"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-foreground shrink-0">
                            <Camera className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-[12px] font-medium truncate">Take a photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 px-1.5 py-1.5 rounded-md hover:bg-muted text-left transition-colors"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-foreground shrink-0">
                            <FileText className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-[12px] font-medium truncate">Document</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCreatePoll}
                          className="flex items-center gap-2 px-1.5 py-1.5 rounded-md hover:bg-muted text-left transition-colors"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-foreground shrink-0">
                            <BarChart3 className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-[12px] font-medium truncate">Poll</span>
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <div className="flex-1 relative flex items-center rounded-full border border-border bg-muted/40 px-4 h-10">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={replyMessage}
                      onChange={e => setReplyMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                      className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground"
                    />
                    <EmojiPicker onEmojiSelect={emoji => setReplyMessage(prev => prev + emoji)} />
                  </div>

                  <TooltipWrapper content={filterType === "whatsapp" ? "Send WhatsApp" : "Send SMS"}>
                    <Button
                      size="icon"
                      onClick={() => handleSendReply()}
                      disabled={(!replyMessage.trim() && attachments.length === 0) || isSending}
                      className="shrink-0 h-10 w-10 rounded-full"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </TooltipWrapper>

                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      handleAttachFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      handleAttachFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      handleAttachFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

// Audio player component for call recordings
function CallRecordingPlayer({ url }: { url: string }) {
  const [
    isPlaying,
    setIsPlaying,
  ] = useState(false);
  const [
    progress,
    setProgress,
  ] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (!audioRef.current)
      return;

    if (isPlaying) {
      audioRef.current.pause();
    }
    else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current)
      return;
    const percent = (audioRef.current.currentTime / audioRef.current.duration) * 100;
    setProgress(percent);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
      />
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={togglePlay}
        className="h-6 w-6"
      >
        {isPlaying
          ? (
              <Pause className="h-3 w-3" />
            )
          : (
              <Play className="h-3 w-3" />
            )}
      </Button>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// Channel logo components
function WhatsAppLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function SMSLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 10h.01M12 10h.01M16 10h.01" />
    </svg>
  );
}

function PhoneLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function CommunicationBubble({ item }: { item: CommunicationItem }) {
  const isOutbound = item.direction === "outbound";

  if (item.type === "call") {
    const isFailed = item.callStatus === "no_answer" || item.callStatus === "failed";
    const isCompleted = item.callStatus === "completed";

    const callIcon = isCompleted
      ? (
          <PhoneCall className="h-4 w-4 text-success" />
        )
      : isFailed
        ? (
            <PhoneMissed className="h-4 w-4 text-destructive" />
          )
        : (
            <Phone className="h-4 w-4 text-primary" />
          );

    const containerTone = isCompleted
      ? "bg-success/10 border-success/30"
      : isFailed
        ? "bg-destructive/10 border-destructive/30"
        : "bg-muted/50 border-border/50";

    return (
      <div
        className={cn(
          "flex flex-col gap-1 p-3 rounded-lg max-w-[80%] border",
          isOutbound ? "ml-auto" : "mr-auto",
          containerTone,
        )}
      >
        <div className="flex items-center justify-between mb-1">
          <Badge
            variant="outline"
            className="h-5 text-[10px] font-medium bg-warning/10 text-warning border-warning/30 gap-1"
          >
            <PhoneLogo className="h-3 w-3" />
            Voice Call
          </Badge>
          {isOutbound
            ? (
                <ArrowUpRight className="h-3 w-3 text-warning" />
              )
            : (
                <ArrowDownLeft className="h-3 w-3 text-success" />
              )}
        </div>

        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full shrink-0",
              isCompleted ? "bg-success/20" : isFailed ? "bg-destructive/20" : "bg-primary/20",
            )}
          >
            {callIcon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {isOutbound ? "Outgoing" : "Incoming"}
                {" "}
                call
              </span>
              <Badge className={cn(
                "text-xs",
                statusColors[item.callStatus || ""] || "bg-muted",
              )}
              >
                {item.callStatus?.replace(
                  "_",
                  " ",
                )}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatWithPattern(
                  item.timestamp,
                  "MMM d, h:mm a",
                )}
              </span>
              {item.duration != null && item.duration > 0 && (
                <span className="font-medium">
                  {Math.floor(item.duration / 60)}
                  :
                  {(item.duration % 60).toString().padStart(
                    2,
                    "0",
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {item.recordingUrl && <CallRecordingPlayer url={item.recordingUrl} />}
      </div>
    );
  }

  const isWhatsApp = item.messageType === "whatsapp";

  const statusIcon = item.status === "read"
    ? (
        <CheckCheck className="h-3 w-3 text-primary" />
      )
    : item.status === "delivered"
      ? (
          <CheckCheck className="h-3 w-3 text-muted-foreground" />
        )
      : item.status === "sent"
        ? (
            <CheckCircle className="h-3 w-3 text-muted-foreground" />
          )
        : item.status === "failed"
          ? (
              <XCircle className="h-3 w-3 text-destructive" />
            )
          : (
              <Clock className="h-3 w-3 text-muted-foreground" />
            );

  const channelBadge = isWhatsApp
    ? (
        <Badge
          variant="outline"
          className={cn(
            "h-5 text-[10px] font-medium gap-1",
            isOutbound
              ? "bg-white/20 text-white border-white/30"
              : "bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30",
          )}
        >
          <WhatsAppLogo className="h-3 w-3" />
          WhatsApp
        </Badge>
      )
    : (
        <Badge
          variant="outline"
          className={cn(
            "h-5 text-[10px] font-medium gap-1",
            isOutbound
              ? "bg-white/20 text-white border-white/30"
              : "bg-primary/10 text-primary border-primary/30",
          )}
        >
          <SMSLogo className="h-3 w-3" />
          SMS
        </Badge>
      );

  return (
    <div
      className={cn(
        "max-w-[80%] rounded-xl p-3",
        isOutbound
          ? isWhatsApp
            ? "ml-auto bg-[#25D366] text-white"
            : "ml-auto bg-primary text-primary-foreground"
          : "mr-auto bg-muted",
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        {channelBadge}
        {isOutbound
          ? (
              <ArrowUpRight className={cn(
                "h-3 w-3",
                isOutbound ? "text-white/70" : "text-muted-foreground",
              )}
              />
            )
          : (
              <ArrowDownLeft className="h-3 w-3 text-muted-foreground" />
            )}
      </div>

      <p className="text-sm whitespace-pre-wrap break-words">{item.content}</p>

      <div
        className={cn(
          "flex items-center justify-end gap-2 mt-2 text-xs",
          isOutbound ? "text-white/70" : "text-muted-foreground",
        )}
      >
        <span>
          {formatWithPattern(
            item.timestamp,
            "h:mm a",
          )}
        </span>
        {isOutbound && (
          <TooltipWrapper content={item.status || "pending"}>{statusIcon}</TooltipWrapper>
        )}
      </div>
    </div>
  );
}
