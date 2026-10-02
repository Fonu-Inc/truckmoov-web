import { useInfiniteQuery } from "@tanstack/react-query";
import { formatCompactRelative } from "@truckmoov/app-core/utils/time-utils";
import { Mail } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/shadcn/button";
import { Skeleton } from "@/components/shadcn/skeleton";
import { cn } from "@/lib/utils";
import { StateNotice } from "../components/StateNotice";
import { participantsLabel } from "./emailLogic";
import { threadsOptions } from "./emailQueries";

type Props = {
  activeId: string | null;
  ownAddress: string | null;
  onSelect: (id: string) => void;
};

export function EmailThreadList({ activeId, ownAddress, onSelect }: Props) {
  const list = useInfiniteQuery(threadsOptions(true));
  const threads = useMemo(() => list.data?.pages.flatMap(page => page.threads) ?? [], [list.data]);

  if (list.isPending)
    return <Skeleton className="m-3 h-40" aria-label="Loading mail" />;
  if (list.isError && !list.data)
    return <StateNotice title="Could not load mail." body="Check your connection and try again." actionLabel="Retry" onAction={() => void list.refetch()} />;
  if (threads.length === 0)
    return <StateNotice icon={<Mail className="h-8 w-8 text-muted-foreground/50" />} title="No mail yet." body="New messages appear here after the next sync." />;

  return (
    <div className="divide-y divide-border/50 overflow-y-auto">
      {threads.map(thread => (
        <button
          key={thread.id}
          type="button"
          onClick={() => onSelect(thread.id)}
          className={cn("block w-full p-3 text-left transition-colors", thread.id === activeId ? "bg-primary/10" : "hover:bg-muted/50")}
        >
          <div className="flex items-center justify-between gap-2">
            <span className={cn("truncate text-sm", thread.hasUnread ? "font-semibold text-foreground" : "text-foreground")}>{participantsLabel(thread.participants, ownAddress)}</span>
            <span className="shrink-0 text-[10px] text-muted-foreground">{formatCompactRelative(thread.lastMessageAt)}</span>
          </div>
          <p className={cn("truncate text-xs", thread.hasUnread ? "text-foreground" : "text-muted-foreground")}>
            {thread.subject || "(no subject)"}
            {thread.messageCount > 1 ? ` · ${thread.messageCount}` : ""}
          </p>
        </button>
      ))}
      {list.hasNextPage && (
        <div className="p-3">
          <Button variant="ghost" size="sm" className="w-full" disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>
            {list.isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
