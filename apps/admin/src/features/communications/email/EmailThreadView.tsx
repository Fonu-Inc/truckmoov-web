import { useQuery } from "@tanstack/react-query";
import type { PlatformMailMessage } from "@truckmoov/api/auth";
import { formatDateTime } from "@truckmoov/app-core/utils/time-utils";
import { ArrowLeft, Download, Reply, Star } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import { Skeleton } from "@/components/shadcn/skeleton";
import { cn } from "@/lib/utils";
import { StateNotice } from "../components/StateNotice";
import { EmailComposeDialog } from "./EmailComposeDialog";
import { formatBytes, personLabel, replySubject } from "./emailLogic";
import { threadOptions } from "./emailQueries";
import { useEmailActions } from "./useEmailActions";

type Props = {
  threadId: string;
  ownAddress: string | null;
  canManage: boolean;
  onBack: () => void;
};

function MessageBody({ message }: { message: PlatformMailMessage }) {
  if (message.bodyText)
    return <p className="whitespace-pre-wrap break-words text-sm text-foreground">{message.bodyText}</p>;
  if (message.bodyHtml) {
    // Untrusted markup: no scripts, no same-origin access, no navigation.
    return <iframe title={`Message from ${personLabel(message.from)}`} sandbox="" srcDoc={message.bodyHtml} className="h-72 w-full rounded-md border border-border/60 bg-white" />;
  }
  return <p className="text-sm italic text-muted-foreground">This message has no text.</p>;
}

function MessageCard({ message, canManage }: { message: PlatformMailMessage; canManage: boolean }) {
  const { star, openAttachment } = useEmailActions();
  return (
    <article className={cn("space-y-3 rounded-lg border border-border/60 p-4", !message.seen && "border-primary/40")}>
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{personLabel(message.from)}</p>
          <p className="truncate text-xs text-muted-foreground">{`To ${message.to.map(personLabel).join(", ") || "undisclosed recipients"}`}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-xs text-muted-foreground">{formatDateTime(message.sentAt)}</span>
          {canManage && (
            <Button variant="ghost" size="icon-sm" aria-label={message.starred ? "Remove star" : "Star message"} aria-pressed={message.starred} onClick={() => star.mutate({ id: message.id, starred: !message.starred })}>
              <Star className={cn("h-4 w-4", message.starred && "fill-warning text-warning")} />
            </Button>
          )}
        </div>
      </header>
      {message.deliveryStatus === "bounced" && (
        <p role="alert" className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">{`This message bounced.${message.deliveryDetail ? ` ${message.deliveryDetail}` : ""}`}</p>
      )}
      <MessageBody message={message} />
      {message.attachments.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {message.attachments.map((attachment, index) => (
            <li key={attachment.id}>
              <Button variant="outline" size="sm" loading={openAttachment.isPending && openAttachment.variables?.index === index && openAttachment.variables.messageId === message.messageId} onClick={() => openAttachment.mutate({ messageId: message.messageId, index })}>
                <Download className="h-3.5 w-3.5" />
                {`${attachment.filename} (${formatBytes(attachment.sizeBytes)})`}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function EmailThreadView({ threadId, ownAddress, canManage, onBack }: Props) {
  const thread = useQuery(threadOptions(threadId));
  const [replying, setReplying] = useState(false);
  const messages = thread.data ?? [];
  const last = messages[messages.length - 1];

  if (thread.isLoading)
    return <Skeleton className="m-4 h-40" aria-label="Loading thread" />;
  if (thread.isError || !last) {
    return <StateNotice title="Could not open this thread." body="It may have been removed, or the connection dropped." actionLabel="Retry" onAction={() => void thread.refetch()} />;
  }

  const replyTo = last.from.address.toLowerCase() === ownAddress?.toLowerCase() ? last.to : [last.from];
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border/50 p-3">
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Back to threads" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{last.subject || "(no subject)"}</h2>
        {canManage && <Button size="sm" onClick={() => setReplying(true)}><Reply className="h-3.5 w-3.5" />Reply</Button>}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map(message => <MessageCard key={message.id} message={message} canManage={canManage} />)}
      </div>
      {replying && <EmailComposeDialog to={replyTo} subject={replySubject(last.subject)} replyToThreadId={threadId} onClose={() => setReplying(false)} />}
    </div>
  );
}
