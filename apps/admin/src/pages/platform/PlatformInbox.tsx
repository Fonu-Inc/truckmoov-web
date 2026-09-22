import type {
  DemoConversation, DemoMessage,
} from "@/features/communications/demoData";
import { getInitials } from "@truckmoov/app-core/utils/general-utils";
import {
  formatDayMonthTime, formatRelative,
} from "@truckmoov/app-core/utils/time-utils";
import {
  Check,
  CheckCheck,
  Clock,
  Lock,
  MessageSquare,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import {
  useEffect, useMemo, useRef, useState,
} from "react";
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
import {
  DEMO_CONVERSATIONS, DEMO_MESSAGES,
} from "@/features/communications/demoData";
import { cn } from "@/lib/utils";

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

function conversationName(c: DemoConversation) {
  return c.driver_name || c.driver_phone || "Unknown";
}

export default function PlatformInbox() {
  const [
    search,
    setSearch,
  ] = useState("");
  // Open the first thread on arrival rather than the "select a conversation"
  // prompt — with demo data there is always something to show.
  const [
    selectedId,
    setSelectedId,
  ] = useState<string | null>(DEMO_CONVERSATIONS[0]?.id ?? null);
  const [
    draft,
    setDraft,
  ] = useState("");

  // Demo data — see features/communications/demoData.ts for why there is no
  // request here. Threads are state because the composer appends to them.
  const [
    threads,
    setThreads,
  ] = useState<Record<string, DemoMessage[]>>(DEMO_MESSAGES);

  const scrollRef = useRef<HTMLDivElement>(null);

  const conversations = DEMO_CONVERSATIONS;

  const filtered = useMemo(
    () => {
      const q = search.trim().toLowerCase();
      if (!q)
        return conversations;
      return conversations.filter(c =>
        conversationName(c).toLowerCase().includes(q)
        || c.driver_phone.toLowerCase().includes(q));
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

  const messages = selectedId ? threads[selectedId] ?? [] : [];

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

  /** Appends locally. Nothing is sent — there is no endpoint this app may call. */
  const handleSend = () => {
    const text = draft.trim();
    if (!text || !selectedId)
      return;

    setThreads(prev => ({
      ...prev,
      [selectedId]: [
        ...prev[selectedId] ?? [],
        {
          id: `local-${Date.now()}`,
          direction: "outbound",
          status: "sent",
          text,
          created_at: new Date().toISOString(),
        },
      ],
    }));
    setDraft("");
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
          {filtered.length === 0
            ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No conversations match your search.
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
                  <Badge
                    variant="outline"
                    className="text-[10px]"
                  >
                    Demo data
                  </Badge>
                </div>

                <div
                  ref={scrollRef}
                  className="flex-1 space-y-3 overflow-y-auto p-4"
                >
                  {messages.length === 0
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
                                {m.text}
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
                            disabled={!draft.trim()}
                          >
                            <Send className="h-4 w-4" />
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
