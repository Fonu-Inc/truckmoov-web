import { MessageSquare, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { cn } from "@/lib/utils";
import { ConnectionStatus, connectionHint } from "@/features/communications/components/ConnectionStatus";
import { ConversationList } from "@/features/communications/components/ConversationList";
import { StateNotice } from "@/features/communications/components/StateNotice";
import { ThreadPanel } from "@/features/communications/components/ThreadPanel";
import { useMessagingAccess } from "@/features/communications/useMessagingAccess";
import { useMessagingSocket } from "@/features/communications/useMessagingSocket";
import { useOpenConversation } from "@/features/communications/useOpenConversation";

function Header({ hint, status }: { hint: string | null; status: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h1 className="text-lg font-semibold text-foreground">Messaging Center</h1>
      {status}
      {hint && <p className="w-full text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Inbox({ canManage }: { canManage: boolean }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { state, socket } = useMessagingSocket(true, selectedId);
  const open = useOpenConversation(selectedId);

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-3">
      <Header hint={connectionHint(state)} status={<ConnectionStatus state={state} />} />
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-3">
        <Card className={cn("flex min-h-0 flex-col overflow-hidden border-border/50 bg-card/50", selectedId && "hidden lg:flex")}>
          <ConversationList activeId={selectedId} onSelect={setSelectedId} />
        </Card>
        <Card className={cn("flex min-h-0 flex-col overflow-hidden border-border/50 bg-card/50 lg:col-span-2", !selectedId && "hidden lg:flex")}>
          {!selectedId && (
            <StateNotice
              icon={<MessageSquare className="h-10 w-10 text-muted-foreground/50" />}
              title="Select a conversation to read it."
            />
          )}
          {selectedId && open.isLoading && <Skeleton className="m-4 h-12" aria-label="Loading conversation" />}
          {selectedId && open.isError && (
            <StateNotice
              title="Could not open this conversation."
              body="It may have been removed, or the connection dropped."
              actionLabel="Retry"
              onAction={() => void open.refetch()}
            />
          )}
          {open.conversation && (
            <ThreadPanel
              key={open.conversation.id}
              conversation={open.conversation}
              socket={socket}
              connection={state}
              canManage={canManage}
              onBack={() => setSelectedId(null)}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

export default function PlatformInbox() {
  const access = useMessagingAccess();

  if (access.isLoading)
    return <Skeleton className="h-64 w-full" aria-label="Loading" />;
  if (access.isError) {
    return (
      <StateNotice
        title="Could not check your access."
        body="Check your connection and try again."
        actionLabel="Retry"
        onAction={() => void access.refetch()}
      />
    );
  }
  if (!access.canRead) {
    return (
      <StateNotice
        icon={<ShieldAlert className="h-10 w-10 text-muted-foreground/50" />}
        title="You do not have access to the Messaging Center."
        body="Ask an administrator to give you messaging access."
      />
    );
  }
  return <Inbox canManage={access.canManage} />;
}
