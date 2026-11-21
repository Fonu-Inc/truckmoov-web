import type { SystemSupportTicketMessage } from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getSupportTicketMessagesQueryOptions,
  useCreateSupportTicketMessage,
} from "@truckmoov/api/auth";
import { useAuthStore } from "@truckmoov/api/lib/auth-store";
import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  Loader2,
  Lock,
  MessageSquare,
  Send,
  User,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Label } from "@/components/shadcn/label";
import { Textarea } from "@/components/shadcn/textarea";

// The thread page and the conversation dialog are the same fleetflow markup
// (PlatformTicketThread / TicketConversationDialog) — shared here.

export const statusStyles: Record<string, { label: string; className: string }> = {
  open: {
    label: "Open", className: "bg-primary/10 text-primary",
  },
  in_progress: {
    label: "In Progress", className: "bg-chart-2/10 text-chart-2",
  },
  waiting_on_tenant: {
    label: "Waiting on Tenant", className: "bg-chart-5/10 text-chart-5",
  },
  escalated: {
    label: "Escalated", className: "bg-destructive/10 text-destructive",
  },
  resolved: {
    label: "Resolved", className: "bg-accent/10 text-accent",
  },
  closed: {
    label: "Closed", className: "bg-muted text-muted-foreground",
  },
};

export const priorityStyles: Record<string, { label: string; className: string }> = {
  low: {
    label: "Low", className: "bg-muted text-muted-foreground",
  },
  medium: {
    label: "Medium", className: "bg-primary/10 text-primary",
  },
  high: {
    label: "High", className: "bg-chart-5/10 text-chart-5",
  },
  critical: {
    label: "Critical", className: "bg-destructive/10 text-destructive",
  },
};

/** Messages + composer state for one ticket (fleetflow's `useSupportMessages`). */
export function useTicketConversation(ticketId: string | null) {
  const myId = useAuthStore(state => state.user?.id);
  const messagesQuery = useQuery({
    ...getSupportTicketMessagesQueryOptions(ticketId ?? ""),
    enabled: !!ticketId,
  });
  const sendMutation = useCreateSupportTicketMessage();
  const [
    newMessage,
    setNewMessage,
  ] = useState("");
  const [
    isInternal,
    setIsInternal,
  ] = useState(false);

  const handleSend = () => {
    if (!ticketId || !newMessage.trim())
      return;
    sendMutation.mutate(
      {
        id: ticketId,
        data: {
          message: newMessage.trim(),
          isInternal,
        },
      },
      {
        onSuccess: () => {
          setNewMessage("");
          setIsInternal(false);
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  return {
    myId,
    messages: messagesQuery.data?.data?.messages ?? [],
    isLoading: messagesQuery.isLoading,
    newMessage,
    setNewMessage,
    isInternal,
    setIsInternal,
    isSending: sendMutation.isPending,
    handleSend,
  };
}

export function TicketMessages({
  messages,
  isLoading,
  myId,
}: {
  messages: SystemSupportTicketMessage[];
  isLoading: boolean;
  myId?: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(
    () => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    },
    [messages.length],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium">No messages yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Start the conversation with the tenant below.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => {
        const isOwn = msg.senderId === myId;
        return (
          <div
            key={msg.id}
            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] p-3.5 rounded-xl ${
                msg.isInternal
                  ? "bg-chart-5/10 border border-chart-5/20"
                  : isOwn
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 border"
              }`}
            >
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <User className="h-3 w-3" />
                <span className="text-xs font-medium">{msg.senderName || "Unknown"}</span>
                <Badge
                  variant="outline"
                  className="text-[10px] py-0"
                >
                  {msg.senderRole}
                </Badge>
                {msg.isInternal && (
                  <Badge
                    variant="outline"
                    className="text-[10px] py-0 border-chart-5 text-chart-5"
                  >
                    <Lock className="h-2 w-2 mr-1" />
                    Internal
                  </Badge>
                )}
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
              <p className="text-[10px] opacity-70 mt-1.5">
                {formatRelative(msg.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

export function TicketReplyComposer({
  checkboxId,
  className,
  conversation,
}: {
  checkboxId: string;
  className: string;
  conversation: ReturnType<typeof useTicketConversation>;
}) {
  const {
    newMessage,
    setNewMessage,
    isInternal,
    setIsInternal,
    isSending,
    handleSend,
  } = conversation;

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={checkboxId}
          checked={isInternal}
          onChange={e => setIsInternal(e.target.checked)}
          className="h-4 w-4"
        />
        <Label
          htmlFor={checkboxId}
          className="text-sm flex items-center gap-1.5 font-normal"
        >
          <Lock className="h-3 w-3" />
          Mark as internal note (not visible to tenant)
        </Label>
      </div>
      <div className="flex gap-2">
        <Textarea
          placeholder={isInternal ? "Add an internal note..." : "Type your reply to the tenant..."}
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          rows={3}
          className="resize-none bg-background"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
              handleSend();
          }}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!newMessage.trim() || isSending}
          className="self-end"
          aria-label="Send message"
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">Press Ctrl+Enter to send</p>
    </div>
  );
}
