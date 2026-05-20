import { useState, useEffect, useRef } from "react";
import { WhatsAppIcon, SMSIcon, VoiceCallIcon } from "./ChannelIcons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageSquare,
  Phone,
  Mail,
  Search,
  Send,
  Paperclip,
  MoreVertical,
  ArrowLeft,
  Clock,
  CheckCheck,
  Check,
  XCircle,
  RefreshCw,
  PhoneCall,
  Video,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useDriverCommunications, DriverMessage } from "@/hooks/useDriverCommunications";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";
import { useAuthStore } from "@/stores/authStore";
import { MessageActions } from "./MessageActions";
import { CallRecordingPlayer } from "./CallRecordingPlayer";

interface Conversation {
  driverId: string;
  driverName: string;
  driverPhone: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  status: "online" | "offline" | "away";
}

export function ConversationInbox() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || '';
  
  const { messages, isLoading, sendSMS, sendWhatsApp, initiateCall, isSending, isCalling, refetch } = useDriverCommunications(tenantId);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [messageType, setMessageType] = useState<"whatsapp" | "sms">("whatsapp");
  const [channelFilter, setChannelFilter] = useState<"all" | "whatsapp" | "sms" | "voice">("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Group messages by driver to create conversations
  const conversations: Conversation[] = messages.reduce((acc, msg) => {
    const existing = acc.find(c => c.driverId === msg.driver_id);
    if (existing) {
      if (new Date(msg.created_at) > existing.lastMessageTime) {
        existing.lastMessage = msg.content;
        existing.lastMessageTime = new Date(msg.created_at);
      }
      if (msg.direction === "inbound" && msg.status !== "read") {
        existing.unreadCount++;
      }
    } else {
      acc.push({
        driverId: msg.driver_id,
        driverName: msg.driver_name || "Unknown Driver",
        driverPhone: msg.driver_phone,
        lastMessage: msg.content,
        lastMessageTime: new Date(msg.created_at),
        unreadCount: msg.direction === "inbound" && msg.status !== "read" ? 1 : 0,
        status: "online", // Would be determined by actual driver status
      });
    }
    return acc;
  }, [] as Conversation[]);

  // Sort by most recent
  conversations.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());

  // Filter conversations
  const filteredConversations = conversations.filter(c =>
    c.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.driverPhone.includes(searchQuery)
  );

  // Get messages for selected conversation, filtered by channel
  const conversationMessages = selectedConversation
    ? messages
        .filter(m => m.driver_id === selectedConversation.driverId)
        .filter(m => {
          if (channelFilter === "all") return true;
          if (channelFilter === "voice") return m.message_type === "call" || m.message_type === "voice";
          return m.message_type === channelFilter;
        })
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      if (messageType === "whatsapp") {
        await sendWhatsApp(
          selectedConversation.driverId,
          selectedConversation.driverName,
          selectedConversation.driverPhone,
          newMessage,
          "Fleet Manager"
        );
      } else {
        await sendSMS(
          selectedConversation.driverId,
          selectedConversation.driverName,
          selectedConversation.driverPhone,
          newMessage,
          "Fleet Manager"
        );
      }
      setNewMessage("");
    } catch (error) {
      // Error already handled by hook
    }
  };

  const handleCall = async () => {
    if (!selectedConversation) return;
    try {
      await initiateCall(
        selectedConversation.driverId,
        selectedConversation.driverName,
        selectedConversation.driverPhone,
        "Fleet Manager"
      );
    } catch (error) {
      // Error handled by hook
    }
  };

  const getStatusIcon = (status: string, direction: string) => {
    if (direction === "inbound") return null;
    
    switch (status) {
      case "pending":
      case "queued":
        return (
          <TooltipWrapper content="Sending...">
            <Clock className="h-3 w-3 text-muted-foreground" />
          </TooltipWrapper>
        );
      case "sent":
        return (
          <TooltipWrapper content="Sent">
            <Check className="h-3 w-3 text-muted-foreground" />
          </TooltipWrapper>
        );
      case "delivered":
        return (
          <TooltipWrapper content="Delivered">
            <CheckCheck className="h-3 w-3 text-muted-foreground" />
          </TooltipWrapper>
        );
      case "read":
        return (
          <TooltipWrapper content="Read">
            <CheckCheck className="h-3 w-3 text-primary" />
          </TooltipWrapper>
        );
      case "failed":
        return (
          <TooltipWrapper content="Failed to send">
            <XCircle className="h-3 w-3 text-destructive" />
          </TooltipWrapper>
        );
      default:
        return (
          <TooltipWrapper content="Pending">
            <Clock className="h-3 w-3 text-muted-foreground" />
          </TooltipWrapper>
        );
    }
  };

  if (isLoading) {
    return (
      <Card className="h-[600px]">
        <CardContent className="p-6">
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
    <Card className="h-[600px] flex overflow-hidden border-border/50">
      {/* Conversation List */}
      <div className={cn(
        "w-full md:w-80 border-r border-border/50 flex flex-col",
        selectedConversation && "hidden md:flex"
      )}>
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Messages</h3>
            <TooltipWrapper content="Refresh messages">
              <Button variant="ghost" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipWrapper>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="divide-y divide-border/30">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.driverId}
                  onClick={() => setSelectedConversation(conv)}
                  className={cn(
                    "p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                    selectedConversation?.driverId === conv.driverId && "bg-muted/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm">
                          {conv.driverName.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                        conv.status === "online" ? "bg-success" :
                        conv.status === "away" ? "bg-warning" : "bg-muted-foreground"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-medium text-sm truncate">{conv.driverName}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(conv.lastMessageTime, { addSuffix: false })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground truncate flex-1">
                          {conv.lastMessage}
                        </p>
                        {conv.unreadCount > 0 && (
                          <Badge variant="default" className="h-5 px-1.5 text-[10px] bg-primary">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Message Thread */}
      <div className={cn(
        "flex-1 flex flex-col",
        !selectedConversation && "hidden md:flex"
      )}>
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TooltipWrapper content="Back to conversations">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </TooltipWrapper>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                    {selectedConversation.driverName.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedConversation.driverName}</p>
                  <p className="text-xs text-muted-foreground">{selectedConversation.driverPhone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TooltipWrapper content="Call driver">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleCall}
                    disabled={isCalling}
                  >
                    <PhoneCall className="h-4 w-4" />
                  </Button>
                </TooltipWrapper>
                <DropdownMenu>
                  <TooltipWrapper content="More options">
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipWrapper>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Driver Profile</DropdownMenuItem>
                    <DropdownMenuItem>View Trip History</DropdownMenuItem>
                    <DropdownMenuItem>Clear Conversation</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Channel filter tabs */}
            <div className="px-4 py-2 border-b border-border/50 flex items-center gap-1">
              {([
                { key: "all", label: "All", icon: null },
                { key: "whatsapp", label: "WhatsApp", icon: <WhatsAppIcon size={12} className="text-emerald-500" /> },
                { key: "sms", label: "SMS", icon: <SMSIcon size={12} className="text-blue-500" /> },
                { key: "voice", label: "Voice", icon: <VoiceCallIcon size={12} className="text-orange-500" /> },
              ] as const).map((tab) => (
                <Button
                  key={tab.key}
                  variant={channelFilter === tab.key ? "secondary" : "ghost"}
                  size="sm"
                  className={cn("h-7 gap-1 text-xs", channelFilter === tab.key && "font-semibold")}
                  onClick={() => setChannelFilter(tab.key)}
                >
                  {tab.icon}
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {conversationMessages.map((msg) => {
                  const isOutbound = msg.direction === "outbound";
                  const isWhatsApp = msg.message_type === "whatsapp";
                  const isCall = msg.message_type === "call" || msg.message_type === "voice";

                  // Channel-specific colors for outbound bubbles
                  const bubbleClass = isOutbound
                    ? isCall
                      ? "bg-orange-600 text-white rounded-br-md"
                      : isWhatsApp
                        ? "bg-emerald-600 text-white rounded-br-md"
                        : "bg-blue-600 text-white rounded-br-md"
                    : "bg-muted rounded-bl-md";

                  const metaClass = isOutbound ? "text-white/70" : "text-muted-foreground";

                  const channelIcon = isCall
                    ? <VoiceCallIcon size={12} />
                    : isWhatsApp
                      ? <WhatsAppIcon size={12} />
                      : <SMSIcon size={12} />;

                  const channelLabel = isCall ? "Voice" : isWhatsApp ? "WhatsApp" : "SMS";

                  const channelBadgeClass = isCall
                    ? "bg-orange-500/20 text-orange-200 border-orange-400/30"
                    : isWhatsApp
                      ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
                      : "bg-blue-500/20 text-blue-200 border-blue-400/30";

                  const inboundBadgeClass = isCall
                    ? "bg-orange-500/10 text-orange-600 border-orange-500/30"
                    : isWhatsApp
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                      : "bg-blue-500/10 text-blue-600 border-blue-500/30";

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        isOutbound ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn("max-w-[70%] rounded-2xl px-4 py-2", bubbleClass)}>
                        {isCall && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <VoiceCallIcon size={14} />
                            <span className="text-xs font-medium">
                              {isOutbound ? "Outgoing Call" : "Incoming Call"}
                            </span>
                          </div>
                        )}
                        <p className="text-sm">{msg.content}</p>
                        <div className={cn("flex items-center justify-end gap-1 mt-1", metaClass)}>
                          <span className="text-[10px]">
                            {format(new Date(msg.created_at), "HH:mm")}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "h-4 px-1.5 text-[9px] font-medium gap-0.5",
                              isOutbound ? channelBadgeClass : inboundBadgeClass
                            )}
                          >
                            {channelIcon}
                            {channelLabel}
                          </Badge>
                          {getStatusIcon(msg.status, msg.direction)}
                          {isOutbound && msg.status === "failed" && !isCall && (
                            <TooltipWrapper content="Resend message">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 ml-1"
                                onClick={() => {
                                  if (isWhatsApp) {
                                    sendWhatsApp(msg.driver_id, msg.driver_name || '', msg.driver_phone, msg.content);
                                  } else {
                                    sendSMS(msg.driver_id, msg.driver_name || '', msg.driver_phone, msg.content);
                                  }
                                }}
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            </TooltipWrapper>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant={messageType === "whatsapp" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMessageType("whatsapp")}
                  className="gap-1 h-7"
                >
                  <WhatsAppIcon size={12} />
                  WhatsApp
                </Button>
                <Button
                  variant={messageType === "sms" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMessageType("sms")}
                  className="gap-1 h-7"
                >
                  <SMSIcon size={12} />
                  SMS
                </Button>
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder={`Type a ${messageType === "whatsapp" ? "WhatsApp" : "SMS"} message...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="min-h-[44px] max-h-24 resize-none"
                  rows={1}
                />
                <TooltipWrapper content="Send message">
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending}
                    size="icon"
                    className="shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </TooltipWrapper>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-medium text-lg mb-1">Select a conversation</h3>
              <p className="text-sm text-muted-foreground">
                Choose a driver from the list to view messages
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
