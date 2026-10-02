import type { MessagingMessage } from "@truckmoov/api/notification";
import { MessageSquare } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/shadcn/button";
import { Skeleton } from "@/components/shadcn/skeleton";
import { groupByDay } from "../messagingLogic";
import { MessageBubble } from "./MessageBubble";
import { StateNotice } from "./StateNotice";

type Props = {
  messages: MessagingMessage[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  hasEarlier: boolean;
  isLoadingEarlier: boolean;
  onLoadEarlier: () => void;
};

function ThreadSkeleton() {
  return (
    <div className="flex-1 space-y-3 p-4" aria-label="Loading messages">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="ml-auto h-10 w-1/2" />
      <Skeleton className="h-10 w-3/5" />
    </div>
  );
}

export function ThreadMessages(props: Props) {
  const { messages, isLoading, isError, onRetry, hasEarlier, isLoadingEarlier, onLoadEarlier } = props;
  const scrollRef = useRef<HTMLDivElement>(null);
  const newest = messages[messages.length - 1]?.id;
  const groups = useMemo(() => groupByDay(messages), [messages]);

  useEffect(
    () => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    },
    [newest],
  );

  if (isLoading)
    return <ThreadSkeleton />;
  if (isError && messages.length === 0) {
    return (
      <StateNotice
        title="Could not load this conversation."
        body="Check your connection and try again."
        actionLabel="Retry"
        onAction={onRetry}
      />
    );
  }
  if (messages.length === 0) {
    return (
      <StateNotice
        icon={<MessageSquare className="h-8 w-8 text-muted-foreground/50" />}
        title="No messages in this conversation yet."
      />
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
      {hasEarlier && (
        <div className="text-center">
          <Button variant="ghost" size="sm" disabled={isLoadingEarlier} onClick={onLoadEarlier}>
            {isLoadingEarlier ? "Loading..." : "Load earlier messages"}
          </Button>
        </div>
      )}
      {groups.map(group => (
        <div key={group.key} className="space-y-3">
          <p className="text-center text-[11px] text-muted-foreground">{group.label}</p>
          {group.messages.map(m => <MessageBubble key={m.client_message_id ?? m.id} message={m} />)}
        </div>
      ))}
    </div>
  );
}
