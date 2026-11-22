import type {
  LiveMessage, LiveSession,
} from "@/hooks/useLiveAgentSession";
import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  Clock, Headphones, Paperclip, UserRound, X,
} from "lucide-react";
import {
  useEffect, useRef,
} from "react";
import { Button } from "@/components/shadcn/button";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { cn } from "@/lib/utils";

type LiveAgentPanelProps = {
  session: LiveSession;
  messages: LiveMessage[];
  onEnd: () => void;
};

/** Header and thread of the ticket-backed live chat; the widget owns the composer. */
export function LiveAgentPanel({
  session, messages, onEnd,
}: LiveAgentPanelProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(
    () => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight, behavior: "smooth",
      });
    },
    [messages.length],
  );

  const isWaiting = session.status === "waiting";
  const isConnected = session.status === "connected";
  const ended = session.status === "ended";

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border/60 bg-primary/5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
            <Headphones className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold truncate">
              {isConnected ? session.agentName || "Support agent" : "Support chat"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {isWaiting && `Waiting for an agent · started ${formatRelative(session.startedAt)}`}
              {isConnected && (session.connectedAt ? `Connected · ${formatRelative(session.connectedAt)}` : "Connected")}
              {ended && "Chat ended"}
            </p>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={onEnd}
          className="h-7 w-7 shrink-0"
          aria-label={ended ? "Start a new chat" : "End chat"}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {isWaiting && (
        <div className="flex items-start gap-2 px-4 py-2 border-b border-border/60 bg-muted/40 text-[11px] text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>Your message is with our support team. You can close this window; replies will appear here.</span>
        </div>
      )}

      <ScrollArea
        className="flex-1 px-4 py-3"
        ref={scrollRef as any}
      >
        <div className="space-y-3">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={cn(
                  "flex gap-2",
                  isUser && "flex-row-reverse",
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full shrink-0 mt-0.5 ring-1",
                    isUser
                      ? "bg-muted ring-border text-foreground"
                      : "bg-primary text-primary-foreground ring-primary/30",
                  )}
                >
                  {isUser ? <UserRound className="h-3.5 w-3.5" /> : <Headphones className="h-3.5 w-3.5" />}
                </div>
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2 text-sm max-w-[80%] leading-relaxed shadow-sm whitespace-pre-wrap",
                    isUser
                      ? "bg-foreground text-background rounded-tr-sm"
                      : "bg-card text-foreground rounded-tl-sm border border-border/60",
                  )}
                >
                  {m.message}
                  {m.attachments.map(name => (
                    <span
                      key={name}
                      className="mt-1 flex items-center gap-1 text-[11px] opacity-80"
                    >
                      <Paperclip className="h-3 w-3 shrink-0" />
                      <span className="truncate">{name}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          {ended && (
            <div className="text-center pt-2">
              <span className="inline-block text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
                This chat has ended. Send a message to start a new one.
              </span>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
