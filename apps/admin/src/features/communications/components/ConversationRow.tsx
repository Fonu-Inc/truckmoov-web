import type { MessagingConversation } from "@truckmoov/api/notification";
import { getInitials } from "@truckmoov/app-core/utils/general-utils";
import { formatCompactRelative } from "@truckmoov/app-core/utils/time-utils";
import { Lock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/shadcn/avatar";
import { Badge } from "@/components/shadcn/badge";
import { cn } from "@/lib/utils";
import { conversationTitle } from "../messagingLogic";

type Props = {
  conversation: MessagingConversation;
  active: boolean;
  onSelect: (id: string) => void;
};

export function ConversationRow({ conversation: c, active, onSelect }: Props) {
  const unread = c.unread_count > 0;
  return (
    <button
      type="button"
      onClick={() => onSelect(c.id)}
      className={cn(
        "flex w-full items-start gap-3 p-3 text-left transition-colors",
        active ? "bg-primary/10" : "hover:bg-muted/50",
      )}
    >
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
        {c.is_locked && (
          <Badge variant="outline" className="mt-1 text-[10px]">
            <Lock className="mr-1 h-2.5 w-2.5" />
            Window closed
          </Badge>
        )}
      </div>
    </button>
  );
}
