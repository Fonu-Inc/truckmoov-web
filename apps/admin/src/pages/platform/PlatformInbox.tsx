import { Bell, BellOff, MessageSquare } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { cn } from "@/lib/utils";
import { ConnectionStatus, connectionHint } from "@/features/communications/components/ConnectionStatus";
import { MessagingAccessGate } from "@/features/communications/components/MessagingAccessGate";
import { ConversationList } from "@/features/communications/components/ConversationList";
import { StateNotice } from "@/features/communications/components/StateNotice";
import { ThreadPanel } from "@/features/communications/components/ThreadPanel";
import { useInboxAlerts } from "@/features/communications/useInboxAlerts";
import { useMessagingSocket } from "@/features/communications/useMessagingSocket";
import { useOpenConversation } from "@/features/communications/useOpenConversation";

type HeaderProps = {
  hint: string | null;
  status: React.ReactNode;
  sound: boolean;
  canRetry: boolean;
  onToggleSound: () => void;
  onReconnect: () => void;
};

function Header({ hint, status, sound, canRetry, onToggleSound, onReconnect }: HeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h1 className="text-lg font-semibold text-foreground">Messaging Center</h1>
      <div className="flex items-center gap-2">
        {status}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={sound ? "Turn message sound off" : "Turn message sound on"}
          aria-pressed={sound}
          onClick={onToggleSound}
        >
          {sound ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        </Button>
      </div>
      {hint && (
        <p className="flex w-full items-center gap-2 text-xs text-muted-foreground">
          {hint}
          {canRetry && <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onReconnect}>Reconnect</Button>}
        </p>
      )}
    </div>
  );
}

function Inbox({ canManage }: { canManage: boolean }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { state, socket, reconnect } = useMessagingSocket(true, selectedId);
  const open = useOpenConversation(selectedId);
  const alerts = useInboxAlerts(socket, selectedId);

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-3">
      <Header
        hint={connectionHint(state)}
        status={<ConnectionStatus state={state} />}
        sound={alerts.sound}
        canRetry={state === "unauthenticated" || state === "offline"}
        onToggleSound={alerts.toggleSound}
        onReconnect={reconnect}
      />
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-3">
        <Card className={cn("flex min-h-0 flex-col overflow-hidden border-border/50 bg-card/50", selectedId && "hidden lg:flex")}>
          <ConversationList activeId={selectedId} canManage={canManage} onSelect={setSelectedId} />
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
  return (
    <MessagingAccessGate what="the Messaging Center">
      {({ canManage }) => <Inbox canManage={canManage} />}
    </MessagingAccessGate>
  );
}
