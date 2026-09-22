import type { WhatsAppConversation } from "@truckmoov/api/notification";
import {
  useSendWhatsAppTextMessage,
  useWhatsAppConversationMessages,
  useWhatsAppConversations,
} from "@truckmoov/api/notification";
import { getInitials } from "@truckmoov/app-core/utils/general-utils";
import {
  formatDayMonthTime, formatRelative,
} from "@truckmoov/app-core/utils/time-utils";
import {
  Check,
  CheckCheck,
  Clock,
  Loader2,
  Lock,
  MessageSquare,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import {
  useEffect, useMemo, useRef, useState,
} from "react";
import { toast } from "sonner";
import {
  Avatar, AvatarFallback,
} from "@/components/shadcn/avatar";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Skeleton } from "@/components/shadcn/skeleton";
import { cn } from "@/lib/utils";

/** Poll cadence. The notify API is request/response — there is no socket here. */
const REFETCH_MS = 30_000;

function statusIcon(status: string | undefined) {
  switch (status) {
    case "read":
      return <CheckCheck className="h-3 w-3 text-info" />;
    case "delivered":
      return <CheckCheck className="h-3 w-3 opacity-70" />;
    case "sent":
      return <Check className="h-3 w-3 opacity-70" />;
    case "failed":
      return <XCircle className="h-3 w-3 text-destructive" />;
    default:
      return <Clock className="h-3 w-3 opacity-70" />;
  }
}

function conversationName(c: WhatsAppConversation) {
  return c.driver_name || c.driver_phone || "Unknown";
}

export default function PlatformInbox() {
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    selectedId,
    setSelectedId,
  ] = useState<string | null>(null);
  const [
    draft,
    setDraft,
  ] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  const conversationsQuery = useWhatsAppConversations();
  const messagesQuery = useWhatsAppConversationMessages(selectedId ?? "");
  const sendMessage = useSendWhatsAppTextMessage();

  const conversations = useMemo(
    () => conversationsQuery.data?.data ?? [],
    [conversationsQuery.data],
  );

  // Search is client-side over the loaded list. The endpoint takes a `query`
  // param, but filtering here keeps typing instant and the list is small.
  const filtered = useMemo(
    () => {
      const q = search.trim().toLowerCase();
      if (!q)
        return conversations;
      return conversations.filter(c =>
        conversationName(c).toLowerCase().includes(q)
        || (c.driver_phone ?? "").toLowerCase().includes(q));
    },
    [
      conversations,
      search,
    ],
  );

  const selected = useMemo(
    () => conversations.find(c => c.id === selectedId),
    [
      conversations,
      selectedId,
    ],
  );

  const messages = messagesQuery.data?.data?.messages ?? [];

  // Poll both the list and the open thread; neither endpoint pushes.
  useEffect(
    () => {
      const id = setInterval(
        () => {
          void conversationsQuery.refetch();
          if (selectedId)
            void messagesQuery.refetch();
        },
        REFETCH_MS,
      );
      return () => clearInterval(id);
    },
    [
      conversationsQuery,
      messagesQuery,
      selectedId,
    ],
  );

  // Pin to the newest message whenever the open thread changes.
  useEffect(
    () => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    },
    [messages.length],
  );

  /**
   * Meta only allows free-text inside the 24h window a driver's own message
   * opens. Outside it the conversation is locked and a template is the only
   * way back in — which this page cannot send, so the composer closes.
   */
  const isLocked = Boolean(selected?.is_locked);

  const handleSend = () => {
    const text = draft.trim();
    if (!text || !selected?.driver_phone)
      return;

    sendMessage.mutate(
      {
        data: {
          to: selected.driver_phone, message: text,
        },
      },
      {
        onSuccess: () => {
          setDraft("");
          void messagesQuery.refetch();
          void conversationsQuery.refetch();
        },
        onError: () => toast.error("Message not sent. Try again."),
      },
    );
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3 h-[calc(100vh-9rem)]">
      {/* ── Conversation list ─────────────────────────────────────────── */}
      <Card className="flex flex-col overflow-hidden bg-card/50 border-border/50">
        <div className="border-b border-border/50 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or number..."
              className="pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {conversationsQuery.isLoading
            ? (
                <div className="space-y-3 p-3">
                  {[
                    1,
                    2,
                    3,
                    4,
                  ].map(i => (
                    <div
                      key={i}
                      className="flex items-center gap-3"
                    >
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-44" />
                      </div>
                    </div>
                  ))}
                </div>
              )
            : conversationsQuery.isError
              ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Could not load conversations.
                    <Button
                      variant="link"
                      onClick={() => conversationsQuery.refetch()}
                    >
                      Retry
                    </Button>
                  </div>
                )
              : filtered.length === 0
                ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      {conversations.length === 0
                        ? "No conversations yet. They appear here once a driver messages the connected WhatsApp number."
                        : "No conversations match your search."}
                    </div>
                  )
                : (
                    <div className="divide-y divide-border/50">
                      {filtered.map((c) => {
                        const active = c.id === selectedId;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedId(c.id ?? null)}
                            className={cn(
                              "flex w-full items-start gap-3 p-3 text-left transition-colors",
                              active ? "bg-primary/10" : "hover:bg-muted/50",
                            )}
                          >
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                {getInitials(conversationName(c))}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-sm font-medium text-foreground">
                                  {conversationName(c)}
                                </span>
                                <span className="shrink-0 text-[10px] text-muted-foreground">
                                  {c.last_message_at ? formatRelative(c.last_message_at) : ""}
                                </span>
                              </div>
                              <p className="truncate text-xs text-muted-foreground">
                                {c.last_message_preview || "—"}
                              </p>
                              {c.is_locked && (
                                <Badge
                                  variant="outline"
                                  className="mt-1 text-[10px]"
                                >
                                  <Lock className="mr-1 h-2.5 w-2.5" />
                                  Window closed
                                </Badge>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
        </ScrollArea>
      </Card>

      {/* ── Thread ────────────────────────────────────────────────────── */}
      <Card className="flex flex-col overflow-hidden bg-card/50 border-border/50 lg:col-span-2">
        {!selected
          ? (
              <CardContent className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Select a conversation to read it.
                </p>
              </CardContent>
            )
          : (
              <>
                <div className="flex items-center gap-3 border-b border-border/50 p-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {getInitials(conversationName(selected))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {conversationName(selected)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {selected.driver_phone}
                    </p>
                  </div>
                  {!isLocked && selected.window_remaining_hours !== undefined && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      <Clock className="mr-1 h-3 w-3" />
                      {selected.window_remaining_hours}
                      h left
                    </Badge>
                  )}
                </div>

                <div
                  ref={scrollRef}
                  className="flex-1 space-y-3 overflow-y-auto p-4"
                >
                  {messagesQuery.isLoading
                    ? (
                        <div className="space-y-3">
                          <Skeleton className="h-12 w-2/3" />
                          <Skeleton className="ml-auto h-12 w-2/3" />
                          <Skeleton className="h-12 w-1/2" />
                        </div>
                      )
                    : messagesQuery.isError
                      ? (
                          <div className="py-8 text-center text-sm text-muted-foreground">
                            Could not load messages.
                            <Button
                              variant="link"
                              onClick={() => messagesQuery.refetch()}
                            >
                              Retry
                            </Button>
                          </div>
                        )
                      : messages.length === 0
                        ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                              No messages in this conversation yet.
                            </p>
                          )
                        : messages.map((m) => {
                            const outbound = m.direction === "outbound";
                            return (
                              <div
                                key={m.id}
                                className={cn(
                                  "flex",
                                  outbound ? "justify-end" : "justify-start",
                                )}
                              >
                                <div
                                  className={cn(
                                    "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                                    outbound
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted text-foreground",
                                  )}
                                >
                                  <p className="whitespace-pre-wrap break-words">
                                    {m.text || m.caption || `[${m.message_type || "media"}]`}
                                  </p>
                                  <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-80">
                                    {m.created_at ? formatDayMonthTime(m.created_at) : ""}
                                    {outbound && statusIcon(m.status)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                </div>

                <div className="border-t border-border/50 p-3">
                  {isLocked
                    ? (
                        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
                          <Lock className="h-3.5 w-3.5 shrink-0" />
                          The 24-hour reply window has closed. Only an approved
                          template can reopen this conversation.
                        </div>
                      )
                    : (
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Type a message..."
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                              }
                            }}
                          />
                          <Button
                            size="icon"
                            onClick={handleSend}
                            disabled={!draft.trim() || sendMessage.isPending}
                          >
                            {sendMessage.isPending
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Send className="h-4 w-4" />}
                          </Button>
                        </div>
                      )}
                </div>
              </>
            )}
      </Card>
    </div>
  );
}
