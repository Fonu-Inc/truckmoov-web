import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SupportTicket, useSupportMessages, TicketStatus } from "@/hooks/useSupportTickets";
import { useSupportPermissions } from "@/hooks/useSupportPermissions";
import { useAuthStore } from "@/stores/authStore";
import { formatDistanceToNow, format } from "date-fns";
import { 
  Send, 
  Loader2, 
  User, 
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  MessageSquare
} from "lucide-react";

interface TicketDetailSheetProps {
  ticket: SupportTicket | null;
  onClose: () => void;
}

const statusConfig: Record<TicketStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline-solid" }> = {
  open: { label: "Open", variant: "default" },
  in_progress: { label: "In Progress", variant: "secondary" },
  waiting_on_tenant: { label: "Awaiting Response", variant: "outline" },
  escalated: { label: "Escalated", variant: "destructive" },
  resolved: { label: "Resolved", variant: "secondary" },
  closed: { label: "Closed", variant: "outline" },
};

export function TicketDetailSheet({ ticket, onClose }: TicketDetailSheetProps) {
  const { user } = useAuthStore();
  const { canCommentOnTickets } = useSupportPermissions();
  const { messages, isLoading, sendMessage } = useSupportMessages(ticket?.id || null);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setIsSending(true);
    const success = await sendMessage(newMessage.trim());
    if (success) {
      setNewMessage("");
    }
    setIsSending(false);
  };

  if (!ticket) return null;

  const status = statusConfig[ticket.status];

  return (
    <Sheet open={!!ticket} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-lg">{ticket.subject}</SheetTitle>
              <SheetDescription className="text-xs">
                #{ticket.id.slice(0, 8)} • Created {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
              </SheetDescription>
            </div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Ticket Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="capitalize">
                {ticket.category.replace(/_/g, " ")}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {ticket.priority} priority
              </Badge>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              {ticket.description}
            </div>

            {/* Context Snapshot */}
            {ticket.contextSnapshot && Object.keys(ticket.contextSnapshot).length > 0 && (
              <div className="p-3 rounded-lg border bg-card">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  Attached {ticket.contextType} Info
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(ticket.contextSnapshot).slice(0, 8).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}: </span>
                      <span className="text-foreground">{String(value) || "N/A"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Escalation Info */}
            {ticket.escalatedTo && (
              <div className="p-3 rounded-lg border border-destructive/50 bg-destructive/5">
                <div className="flex items-center gap-2 text-sm text-destructive mb-1">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="font-medium">Escalated to {ticket.escalatedTo.replace(/_/g, " ")}</span>
                </div>
                {ticket.escalatedReferenceId && (
                  <p className="text-xs text-muted-foreground">
                    Reference: {ticket.escalatedReferenceId}
                  </p>
                )}
                {ticket.escalationNotes && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {ticket.escalationNotes}
                  </p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Messages */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Conversation
            </h4>

            <ScrollArea className="h-64 pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No messages yet. Start the conversation below.
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isOwn = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-3 w-3" />
                            <span className="text-xs font-medium">
                              {msg.senderName || "Support"}
                            </span>
                            {msg.isInternal && (
                              <Badge variant="outline" className="text-[10px] py-0">
                                Internal
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-[10px] opacity-70 mt-1">
                            {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Reply Input */}
            {canCommentOnTickets && !["closed", "resolved"].includes(ticket.status) && (
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={2}
                  className="resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}

            {["closed", "resolved"].includes(ticket.status) && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 mx-auto mb-2 text-chart-2" />
                This ticket has been {ticket.status}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
