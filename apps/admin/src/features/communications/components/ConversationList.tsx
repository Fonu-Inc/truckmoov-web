import { useInfiniteQuery } from "@tanstack/react-query";
import { ListChecks, MessageSquare, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Skeleton } from "@/components/shadcn/skeleton";
import { NO_FILTERS, conversationsOptions } from "../messagingQueries";
import type { ConversationFilters as Filters } from "../messagingQueries";
import { useDebouncedValue } from "../useDebouncedValue";
import { useStaffDirectory } from "../useStaffDirectory";
import { BulkBar } from "./BulkBar";
import { ConversationFilters, activeFilterCount } from "./ConversationFilters";
import { ConversationRow } from "./ConversationRow";
import { StateNotice } from "./StateNotice";
import { StartConversationDialog } from "./whatsapp/StartConversationDialog";

type Props = {
  activeId: string | null;
  canManage: boolean;
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

export function ConversationList({ activeId, canManage, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [selecting, setSelecting] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const { nameOf } = useStaffDirectory();
  const query = useDebouncedValue(search.trim(), 300);
  const applied = useMemo(() => ({ ...filters, query }), [filters, query]);
  const list = useInfiniteQuery(conversationsOptions(applied));
  const items = useMemo(() => list.data?.pages.flatMap(p => p.items) ?? [], [list.data]);
  const filtered = Boolean(query) || filters.state === "unread" || activeFilterCount(filters) > 0;

  const toggle = (id: string) => setChosen(current => (current.includes(id) ? current.filter(x => x !== id) : [...current, id]));
  const stopSelecting = () => {
    setSelecting(false);
    setChosen([]);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-2 border-b border-border/50 p-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search conversations"
              placeholder="Search by name or number"
              className="pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {canManage && (
            <Button size="icon" aria-label="Start a conversation" onClick={() => setNewChatOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant={filters.state === "all" ? "default" : "outline"} onClick={() => setFilters(f => ({ ...f, state: "all" }))}>
            All
          </Button>
          <Button size="sm" variant={filters.state === "unread" ? "default" : "outline"} onClick={() => setFilters(f => ({ ...f, state: "unread" }))}>
            Unread
          </Button>
          <ConversationFilters value={filters} onChange={next => setFilters(f => ({ ...f, ...next }))} />
          {canManage && (
            <Button size="icon-sm" variant={selecting ? "secondary" : "ghost"} className="ml-auto" aria-label="Select conversations" aria-pressed={selecting} onClick={() => (selecting ? stopSelecting() : setSelecting(true))}>
              <ListChecks className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      {selecting && chosen.length > 0 && <BulkBar ids={chosen} onClear={stopSelecting} />}

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
              <ConversationRow
                key={c.id}
                conversation={c}
                active={c.id === activeId}
                selecting={selecting}
                selected={chosen.includes(c.id)}
                assigneeName={c.assignee_user_id ? nameOf(c.assignee_user_id) : null}
                onSelect={onSelect}
                onToggle={toggle}
              />
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
      <StartConversationDialog
        open={newChatOpen}
        onOpenChange={setNewChatOpen}
        onSent={result => result.conversation && onSelect(result.conversation.id)}
      />
    </div>
  );
}
