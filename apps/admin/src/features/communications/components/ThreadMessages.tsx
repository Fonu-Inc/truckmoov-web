import type { MessagingMessage } from "@truckmoov/api/notification";
import {
  ArrowDown, MessageSquare,
} from "lucide-react";
import {
  useEffect, useMemo, useRef, useState,
} from "react";
import { Button } from "@/components/shadcn/button";
import { Skeleton } from "@/components/shadcn/skeleton";
import { groupByDay } from "../messagingLogic";
import { MessageBubble } from "./MessageBubble";
import { StateNotice } from "./StateNotice";

const NEAR_BOTTOM_PX = 120;

type Props = {
  messages: MessagingMessage[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  hasEarlier: boolean;
  isLoadingEarlier: boolean;
  onLoadEarlier: () => void;
  canManage: boolean;
  authorName: (userId: string | null) => string;
  onRetryMessage: (message: MessagingMessage) => void;
  onCancelScheduled: (message: MessagingMessage) => void;
};

function ThreadSkeleton() {
  return (
    <div
      className="flex-1 space-y-3 p-4"
      aria-label="Loading messages"
    >
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="ml-auto h-10 w-1/2" />
      <Skeleton className="h-10 w-3/5" />
    </div>
  );
}

/** Keeps the thread pinned to the newest message only while the reader is already there. */
function useStickToBottom(newest: MessagingMessage | undefined) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const seen = useRef<string | undefined>(undefined);
  const [
    unseen,
    setUnseen,
  ] = useState(false);

  const jump = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    setUnseen(false);
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el)
      return;
    nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    if (nearBottom.current)
      setUnseen(false);
  };

  useEffect(
    () => {
      if (!newest || seen.current === newest.id)
        return;
      const first = seen.current === undefined;
      seen.current = newest.id;
      const mine = newest.direction === "outbound";
      if (first || mine || nearBottom.current)
        jump();
      else
        setUnseen(true);
    },
    [newest],
  );

  return {
    scrollRef, onScroll, unseen, jump,
  };
}

export function ThreadMessages(props: Props) {
  const {
    messages, isLoading, isError, onRetry, hasEarlier, isLoadingEarlier, onLoadEarlier,
  } = props;
  const groups = useMemo(
    () => groupByDay(messages),
    [messages],
  );
  const {
    scrollRef, onScroll, unseen, jump,
  } = useStickToBottom(messages[messages.length - 1]);

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
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 space-y-3 overflow-y-auto p-4"
      >
        {hasEarlier && (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              disabled={isLoadingEarlier}
              onClick={onLoadEarlier}
            >
              {isLoadingEarlier ? "Loading..." : "Load earlier messages"}
            </Button>
          </div>
        )}
        {groups.map(group => (
          <div
            key={group.key}
            className="space-y-3"
          >
            <p className="text-center text-[11px] text-muted-foreground">{group.label}</p>
            {group.messages.map(m => (
              <MessageBubble
                key={m.client_message_id ?? m.id}
                message={m}
                canManage={props.canManage}
                authorName={props.authorName}
                onRetry={props.onRetryMessage}
                onCancelScheduled={props.onCancelScheduled}
              />
            ))}
          </div>
        ))}
      </div>
      {unseen && (
        <Button
          size="sm"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 shadow-md"
          onClick={jump}
        >
          <ArrowDown className="h-3.5 w-3.5" />
          New messages
        </Button>
      )}
    </div>
  );
}
