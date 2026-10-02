import type { MessagingMessage } from "@truckmoov/api/notification";
import { formatTime } from "@truckmoov/app-core/utils/time-utils";
import { CalendarClock, Copy, FileText, RotateCw, StickyNote, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import { cn } from "@/lib/utils";
import { errorText, tickState } from "../messagingLogic";
import { DeliveryTicks } from "./DeliveryTicks";
import { MediaContent } from "./MediaContent";

const UNSUPPORTED = "This message type is not supported here yet.";

type Props = {
  message: MessagingMessage;
  canManage: boolean;
  authorName: (userId: string | null) => string;
  onRetry: (message: MessagingMessage) => void;
  onCancelScheduled: (message: MessagingMessage) => void;
};

function copyText(text: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success("Copied."),
    () => toast.error("Could not copy."),
  );
}

function Body({ message }: { message: MessagingMessage }) {
  if (message.media) {
    return (
      <div className="space-y-2">
        <MediaContent media={message.media} />
        {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
      </div>
    );
  }
  if (message.text !== null)
    return <p className="whitespace-pre-wrap break-words">{message.text}</p>;
  return <p className="italic opacity-80">{UNSUPPORTED}</p>;
}

function NoteBubble({ message, authorName }: Pick<Props, "message" | "authorName">) {
  return (
    <div className="flex justify-center">
      <div className="max-w-[85%] rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-foreground">
        <p className="mb-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
          <StickyNote className="h-3 w-3" />
          Private note by
          {" "}
          {authorName(message.author_id ?? null)}
          {" · "}
          {formatTime(message.created_at)}
        </p>
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
      </div>
    </div>
  );
}

export function MessageBubble(props: Props) {
  const { message, canManage, onRetry, onCancelScheduled } = props;
  if (message.message_type === "note")
    return <NoteBubble message={message} authorName={props.authorName} />;

  const outbound = message.direction === "outbound";
  const failed = message.status === "failed";
  const scheduled = message.status === "scheduled";
  return (
    <div className={cn("group flex", outbound ? "justify-end" : "justify-start")}>
      <div className="flex max-w-[75%] flex-col gap-1">
        <div className={cn("flex items-start gap-1", outbound && "flex-row-reverse")}>
          <div
            className={cn(
              "rounded-lg px-3 py-2 text-sm",
              outbound ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
              (failed || scheduled) && "opacity-70",
              scheduled && "border border-dashed border-primary-foreground/60",
            )}
          >
            {message.template_name && (
              <p className="mb-1 flex items-center gap-1 text-[11px] opacity-80">
                <FileText className="h-3 w-3" />
                Template:
                {" "}
                {message.template_name}
              </p>
            )}
            <Body message={message} />
            <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-80">
              {formatTime(message.created_at)}
              {outbound && <DeliveryTicks state={tickState(message)} />}
            </div>
          </div>
          {message.text && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              aria-label="Copy message"
              onClick={() => copyText(message.text ?? "")}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        {scheduled && (
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            {`Goes out ${new Date(message.scheduled_for ?? message.created_at).toLocaleString()}`}
            {canManage && (
              <Button variant="ghost" size="sm" onClick={() => onCancelScheduled(message)}>
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
            )}
          </div>
        )}
        {failed && (
          <div className="flex items-center justify-end gap-2 text-xs text-destructive">
            <span>
              Not sent.
              {" "}
              {message.error?.message || errorText(message.error?.code)}
            </span>
            {canManage && (
              <Button variant="ghost" size="sm" onClick={() => onRetry(message)}>
                <RotateCw className="h-3.5 w-3.5" />
                Retry
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
