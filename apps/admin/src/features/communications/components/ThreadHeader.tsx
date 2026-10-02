import type { MessagingConversation, MessagingConversationUpdate } from "@truckmoov/api/notification";
import { getInitials } from "@truckmoov/app-core/utils/general-utils";
import { ArrowLeft, Clock, Info, Lock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/shadcn/avatar";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { PRIORITY_LABEL, conversationTitle, windowLabel } from "../messagingLogic";
import { AssigneeMenu } from "./AssigneeMenu";
import { StatusSelect } from "./StatusSelect";

type Props = {
  conversation: MessagingConversation;
  canManage: boolean;
  locked: boolean;
  secondsLeft: number;
  onBack: () => void;
  onOpenContact: () => void;
  onUpdate: (change: MessagingConversationUpdate) => void;
};

export function ThreadHeader({ conversation, canManage, locked, secondsLeft, onBack, onOpenContact, onUpdate }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border/50 p-3">
      <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Back to conversations" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={onOpenContact} aria-label="Open contact details">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
            {getInitials(conversationTitle(conversation))}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-foreground">{conversationTitle(conversation)}</span>
          <span className="block truncate text-xs text-muted-foreground">{conversation.driver_phone}</span>
        </span>
      </button>
      <div className="flex flex-wrap items-center gap-2">
        {conversation.priority !== "normal" && (
          <Badge variant={conversation.priority === "urgent" ? "destructive" : "secondary"} className="text-xs">
            {PRIORITY_LABEL[conversation.priority]}
          </Badge>
        )}
        <Badge variant="outline" className="text-xs">
          {locked ? <Lock className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
          {windowLabel(locked, secondsLeft)}
        </Badge>
        <StatusSelect value={conversation.status} disabled={!canManage} onChange={status => onUpdate({ status })} />
        <AssigneeMenu conversation={conversation} disabled={!canManage} onAssign={userId => onUpdate({ assignee_user_id: userId })} />
        <Button variant="ghost" size="icon-sm" aria-label="Contact details" onClick={onOpenContact}>
          <Info className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
