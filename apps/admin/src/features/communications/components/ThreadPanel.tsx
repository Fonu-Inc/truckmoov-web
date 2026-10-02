import type { MessagingConversation, PlatformMessagingSocket } from "@truckmoov/api/notification";
import { getInitials } from "@truckmoov/app-core/utils/general-utils";
import { ArrowLeft, Clock, Lock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/shadcn/avatar";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { composerDisabledReason } from "../composerState";
import { conversationTitle, windowText } from "../messagingLogic";
import type { MessagingConnection } from "../useMessagingSocket";
import { useMarkRead } from "../useMarkRead";
import { useSendMessage } from "../useSendMessage";
import { useThread } from "../useThread";
import { Composer } from "./Composer";
import { ThreadMessages } from "./ThreadMessages";

type Props = {
  conversation: MessagingConversation;
  socket: PlatformMessagingSocket | null;
  connection: MessagingConnection;
  canManage: boolean;
  onBack: () => void;
};

export function ThreadPanel({ conversation, socket, connection, canManage, onBack }: Props) {
  const thread = useThread(conversation.id);
  const send = useSendMessage(socket);
  useMarkRead(socket, connection === "connected", conversation, canManage);

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border/50 p-3">
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Back to conversations" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
            {getInitials(conversationTitle(conversation))}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{conversationTitle(conversation)}</p>
          <p className="truncate text-xs text-muted-foreground">{conversation.driver_phone}</p>
        </div>
        {windowText(conversation) && (
          <Badge variant="outline" className="text-xs">
            {conversation.is_locked ? <Lock className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
            {windowText(conversation)}
          </Badge>
        )}
      </div>

      <ThreadMessages
        messages={thread.messages}
        isLoading={thread.isLoading}
        isError={thread.isError}
        onRetry={() => void thread.refetch()}
        hasEarlier={thread.hasEarlier}
        isLoadingEarlier={thread.isLoadingEarlier}
        onLoadEarlier={() => void thread.loadEarlier()}
      />

      <Composer
        key={conversation.id}
        disabledReason={composerDisabledReason(conversation, canManage, connection)}
        onSend={text => void send(conversation.id, text)}
      />
    </>
  );
}
