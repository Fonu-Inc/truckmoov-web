import type { MessagingConversation } from "@truckmoov/api/notification";
import { getInitials } from "@truckmoov/app-core/utils/general-utils";
import { formatCompactRelative } from "@truckmoov/app-core/utils/time-utils";
import { Lock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/shadcn/avatar";
import { Badge } from "@/components/shadcn/badge";
import { Checkbox } from "@/components/shadcn/checkbox";
import { cn } from "@/lib/utils";
import { PRIORITY_LABEL, STATUS_LABEL, conversationTitle } from "../messagingLogic";

type Props = {
  conversation: MessagingConversation;
  active: boolean;
  selecting: boolean;
  selected: boolean;
  assigneeName: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
};

export function ConversationRow({ conversation: c, active, selecting, selected, assigneeName, onSelect, onToggle }: Props) {
  const unread = c.unread_count > 0;
  return (
    <div className={cn("flex items-start gap-2 p-3 transition-colors", active ? "bg-primary/10" : "hover:bg-muted/50")}>
      {selecting && (
        <Checkbox className="mt-3" checked={selected} aria-label={`Select ${conversationTitle(c)}`} onCheckedChange={() => onToggle(c.id)} />
      )}
      <button type="button" onClick={() => (selecting ? onToggle(c.id) : onSelect(c.id))} className="flex min-w-0 flex-1 items-start gap-3 text-left">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
            {getInitials(conversationTitle(c))}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className={cn("truncate text-sm text-foreground", unread ? "font-semibold" : "font-medium")}>
              {conversationTitle(c)}
            </span>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {formatCompactRelative(c.last_message_at)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className={cn("truncate text-xs", unread ? "text-foreground" : "text-muted-foreground")}>
              {c.last_message_preview || "No messages"}
            </p>
            {unread && (
              <Badge className="h-5 min-w-5 shrink-0 justify-center px-1.5 text-[10px]">
                {c.unread_count}
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {c.is_locked && (
              <Badge variant="outline" className="text-[10px]">
                <Lock className="mr-1 h-2.5 w-2.5" />
                Window closed
              </Badge>
            )}
            {c.status !== "open" && <Badge variant="secondary" className="text-[10px]">{STATUS_LABEL[c.status]}</Badge>}
            {(c.priority === "high" || c.priority === "urgent") && (
              <Badge variant={c.priority === "urgent" ? "destructive" : "secondary"} className="text-[10px]">{PRIORITY_LABEL[c.priority]}</Badge>
            )}
            {assigneeName && <Badge variant="outline" className="text-[10px]">{assigneeName}</Badge>}
            {c.tags.slice(0, 3).map(tag => <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>)}
          </div>
        </div>
      </button>
    </div>
  );
}
