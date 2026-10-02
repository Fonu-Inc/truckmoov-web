import { useInfiniteQuery } from "@tanstack/react-query";
import { MessageSquare, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Skeleton } from "@/components/shadcn/skeleton";
import { conversationsOptions } from "../messagingQueries";
import type { ConversationFilters } from "../messagingQueries";
import { useDebouncedValue } from "../useDebouncedValue";
import { ConversationRow } from "./ConversationRow";
import { StateNotice } from "./StateNotice";

type Props = {
  activeId: string | null;
  onSelect: (id: string) => void;
};

function ListSkeleton() {
  return (
    <div className="space-y-3 p-3" aria-label="Loading conversations">
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConversationList({ activeId, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [state, setState] = useState<ConversationFilters["state"]>("all");
  const query = useDebouncedValue(search.trim(), 300);
  const filters = useMemo(() => ({ query, state }), [query, state]);
  const list = useInfiniteQuery(conversationsOptions(filters));
  const items = useMemo(() => list.data?.pages.flatMap(p => p.items) ?? [], [list.data]);
  const filtered = Boolean(query) || state === "unread";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-2 border-b border-border/50 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search conversations"
            placeholder="Search by name or number"
            className="pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={state === "all" ? "default" : "outline"} onClick={() => setState("all")}>
            All
          </Button>
          <Button size="sm" variant={state === "unread" ? "default" : "outline"} onClick={() => setState("unread")}>
            Unread
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {list.isPending && <ListSkeleton />}
        {list.isError && !list.data && (
          <StateNotice
            title="Could not load conversations."
            body="Check your connection and try again."
            actionLabel="Retry"
            onAction={() => void list.refetch()}
          />
        )}
        {list.data && items.length === 0 && (
          <StateNotice
            icon={<MessageSquare className="h-8 w-8 text-muted-foreground/50" />}
            title={filtered ? "No conversations match." : "No conversations yet."}
            body={filtered ? undefined : "Messages sent to the platform WhatsApp number appear here."}
          />
        )}
        {items.length > 0 && (
          <div className="divide-y divide-border/50">
            {items.map(c => (
              <ConversationRow key={c.id} conversation={c} active={c.id === activeId} onSelect={onSelect} />
            ))}
            {list.hasNextPage && (
              <div className="p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  disabled={list.isFetchingNextPage}
                  onClick={() => void list.fetchNextPage()}
                >
                  {list.isFetchingNextPage ? "Loading..." : "Load more"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
