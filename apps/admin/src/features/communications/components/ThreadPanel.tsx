import type {
  MessagingConversation, MessagingMessage, PlatformMessagingSocket,
} from "@truckmoov/api/notification";
import type { MessagingConnection } from "../useMessagingSocket";
import { useState } from "react";
import { isLocalMessage } from "../messagingLogic";
import { useConversationActions } from "../useConversationActions";
import { useMarkRead } from "../useMarkRead";
import { useSendMessage } from "../useSendMessage";
import { useStaffDirectory } from "../useStaffDirectory";
import { useThread } from "../useThread";
import { useWindowLock } from "../useWindowLock";
import { CannedRepliesDialog } from "./CannedRepliesDialog";
import { Composer } from "./Composer";
import { ContactPanel } from "./ContactPanel";
import { ThreadHeader } from "./ThreadHeader";
import { ThreadMessages } from "./ThreadMessages";
import { StartConversationDialog } from "./whatsapp/StartConversationDialog";

type Props = {
  conversation: MessagingConversation;
  socket: PlatformMessagingSocket | null;
  connection: MessagingConnection;
  canManage: boolean;
  onBack: () => void;
};

/** Runs a mutation and reports whether it worked, so the composer only clears what was sent. */
async function succeeded(run: () => Promise<unknown>) {
  try {
    await run();
    return true;
  }
  catch {
    return false;
  }
}

export function ThreadPanel({
  conversation, socket, connection, canManage, onBack,
}: Props) {
  const thread = useThread(conversation.id);
  const {
    send, retry,
  } = useSendMessage(socket);
  const actions = useConversationActions(conversation.id);
  const {
    locked, secondsLeft,
  } = useWindowLock(conversation);
  const { nameOf } = useStaffDirectory();
  const [
    contactOpen,
    setContactOpen,
  ] = useState(false);
  const [
    templatesOpen,
    setTemplatesOpen,
  ] = useState(false);
  const [
    repliesOpen,
    setRepliesOpen,
  ] = useState(false);
  useMarkRead(
    socket,
    connection === "connected",
    conversation,
    canManage,
  );

  const retryMessage = (message: MessagingMessage) => {
    if (isLocalMessage(message)) {
      void retry(
        conversation.id,
        message,
      );
    }
    else {
      actions.retry.mutate(message.id);
    }
  };

  return (
    <>
      <ThreadHeader
        conversation={conversation}
        canManage={canManage}
        locked={locked}
        secondsLeft={secondsLeft}
        onBack={onBack}
        onOpenContact={() => setContactOpen(true)}
        onUpdate={change => actions.update.mutate(change)}
      />

      <ThreadMessages
        messages={thread.messages}
        isLoading={thread.isLoading}
        isError={thread.isError}
        onRetry={() => void thread.refetch()}
        hasEarlier={thread.hasEarlier}
        isLoadingEarlier={thread.isLoadingEarlier}
        onLoadEarlier={() => void thread.loadEarlier()}
        canManage={canManage}
        authorName={nameOf}
        onRetryMessage={retryMessage}
        onCancelScheduled={message => actions.cancelScheduled.mutate(message.id)}
      />

      <Composer
        key={conversation.id}
        conversationId={conversation.id}
        locked={locked}
        canManage={canManage}
        connection={connection}
        busy={{
          media: actions.media.isPending, schedule: actions.schedule.isPending, note: actions.note.isPending,
        }}
        onSend={text => void send(
          conversation.id,
          text,
        )}
        onNote={text => succeeded(() => actions.note.mutateAsync(text))}
        onMedia={(file, caption) => succeeded(() => actions.media.mutateAsync({
          file, caption: caption || undefined,
        }))}
        onSchedule={(text, sendAt) => succeeded(() => actions.schedule.mutateAsync({
          text, sendAt,
        }))}
        onOpenTemplates={() => setTemplatesOpen(true)}
        onManageReplies={() => setRepliesOpen(true)}
      />

      <ContactPanel
        conversation={conversation}
        open={contactOpen}
        canManage={canManage}
        locked={locked}
        secondsLeft={secondsLeft}
        saving={actions.update.isPending}
        onOpenChange={setContactOpen}
        onUpdate={change => actions.update.mutate(change)}
      />
      <StartConversationDialog
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
        conversationId={conversation.id}
      />
      <CannedRepliesDialog
        open={repliesOpen}
        canManage={canManage}
        onOpenChange={setRepliesOpen}
      />
    </>
  );
}
