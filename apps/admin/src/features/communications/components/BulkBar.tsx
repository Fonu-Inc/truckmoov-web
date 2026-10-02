import { CheckCheck, CircleCheck, Mail, UserRound, X } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { useBulkConversationActions } from "../useConversationActions";
import { useCurrentUserId } from "../useCurrentUserId";

type Props = {
  ids: string[];
  onClear: () => void;
};

export function BulkBar({ ids, onClear }: Props) {
  const bulk = useBulkConversationActions();
  const me = useCurrentUserId();
  const run = (input: Parameters<typeof bulk.mutate>[0]) => bulk.mutate(input, { onSuccess: onClear });

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border/50 bg-primary/5 p-2" role="toolbar" aria-label="Bulk actions">
      <span className="mr-1 text-xs font-medium">{`${ids.length} selected`}</span>
      <Button size="sm" variant="outline" loading={bulk.isPending} onClick={() => run({ ids, action: "read" })}>
        <CheckCheck className="h-3.5 w-3.5" />
        Read
      </Button>
      <Button size="sm" variant="outline" disabled={bulk.isPending} onClick={() => run({ ids, action: "unread" })}>
        <Mail className="h-3.5 w-3.5" />
        Unread
      </Button>
      <Button size="sm" variant="outline" disabled={bulk.isPending} onClick={() => run({ ids, update: { status: "resolved" } })}>
        <CircleCheck className="h-3.5 w-3.5" />
        Resolve
      </Button>
      {me && (
        <Button size="sm" variant="outline" disabled={bulk.isPending} onClick={() => run({ ids, update: { assignee_user_id: me } })}>
          <UserRound className="h-3.5 w-3.5" />
          Assign to me
        </Button>
      )}
      <Button size="icon-sm" variant="ghost" className="ml-auto" aria-label="Clear selection" onClick={onClear}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
