import { useEffect, useRef, useState } from "react";
import { Headphones, Loader2, Send, X, UserRound } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { useLiveAgentSession } from "@/hooks/useLiveAgentSession";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

/**
 * Compact live-agent chat panel for the support chat widget.
 * Shows queue position while waiting, then a real-time chat once an agent claims.
 */
export function LiveAgentPanel({ onLeave }: { onLeave?: () => void }) {
  const { session, messages, queuePosition, sendMessage, endSession } = useLiveAgentSession();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  if (!session) return null;

  const isQueued = session.status === "queued";
  const isActive = session.status === "active" || session.status === "assigned";
  const ended = session.status === "ended" || session.status === "abandoned";

  const handleEnd = async () => {
    await endSession();
    onLeave?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border/60 bg-primary/5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
            <Headphones className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold truncate">
              {isActive ? session.agent_name || "Live agent" : "Live support"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {isQueued && (
                <>Waiting in queue · started {formatDistanceToNow(new Date(session.queued_at), { addSuffix: true })}</>
              )}
              {isActive && session.started_at && (
                <>Connected · {formatDistanceToNow(new Date(session.started_at), { addSuffix: true })}</>
              )}
              {ended && <>Session ended</>}
            </p>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleEnd}
          className="h-7 w-7 shrink-0"
          aria-label="End live session"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Body */}
      {isQueued ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">You're in the queue</p>
          {queuePosition !== null && (
            <p className="text-xs text-muted-foreground">
              Position <span className="font-semibold text-foreground">#{queuePosition}</span> · estimated wait{" "}
              {queuePosition <= 1 ? "< 1 min" : `${queuePosition * 2}–${queuePosition * 4} min`}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground max-w-[260px]">
            Keep this chat open — an agent will join automatically. You can keep typing and they'll see your messages
            once connected.
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef as any}>
          <div className="space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-[12px] text-muted-foreground py-6">
                Say hi 👋 — your agent will reply here.
              </p>
            )}
            {messages.map((m) => {
              if (m.sender_role === "system") {
                return (
                  <div key={m.id} className="text-center">
                    <span className="inline-block text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
                      {m.message}
                    </span>
                  </div>
                );
              }
              const isUser = m.sender_role === "user";
              return (
                <div key={m.id} className={cn("flex gap-2", isUser && "flex-row-reverse")}>
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full shrink-0 mt-0.5 ring-1",
                      isUser
                        ? "bg-muted ring-border text-foreground"
                        : "bg-primary text-primary-foreground ring-primary/30"
                    )}
                  >
                    {isUser ? <UserRound className="h-3.5 w-3.5" /> : <Headphones className="h-3.5 w-3.5" />}
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2 text-sm max-w-[80%] leading-relaxed shadow-sm whitespace-pre-wrap",
                      isUser
                        ? "bg-foreground text-background rounded-tr-sm"
                        : "bg-card text-foreground rounded-tl-sm border border-border/60"
                    )}
                  >
                    {m.message}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Input — disabled while queued */}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!text.trim() || isQueued || ended) return;
          await sendMessage(text);
          setText("");
        }}
        className="flex items-center gap-2 p-3 border-t border-border/60 bg-background shrink-0"
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isQueued ? "Waiting for an agent…" : "Type a message…"}
          disabled={ended}
          className="flex-1 rounded-full border-border/80 focus-visible:ring-primary/40 focus-visible:border-primary/60"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!text.trim() || ended}
          className="shrink-0 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-md"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}



