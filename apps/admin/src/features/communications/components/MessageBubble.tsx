import type { MessagingMessage } from "@truckmoov/api/notification";
import { formatTime } from "@truckmoov/app-core/utils/time-utils";
import { cn } from "@/lib/utils";
import { errorText, tickState } from "../messagingLogic";
import { DeliveryTicks } from "./DeliveryTicks";

const UNSUPPORTED = "This message type is not supported here yet.";

export function MessageBubble({ message }: { message: MessagingMessage }) {
  const outbound = message.direction === "outbound";
  const failed = message.status === "failed";
  const isText = message.message_type === "text" && message.text !== null;
  return (
    <div className={cn("flex", outbound ? "justify-end" : "justify-start")}>
      <div className="flex max-w-[75%] flex-col gap-1">
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            outbound ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
            failed && "opacity-70",
          )}
        >
          {isText
            ? <p className="whitespace-pre-wrap break-words">{message.text}</p>
            : <p className="italic opacity-80">{UNSUPPORTED}</p>}
          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-80">
            {formatTime(message.created_at)}
            {outbound && <DeliveryTicks state={tickState(message)} />}
          </div>
        </div>
        {failed && (
          <p className="text-right text-xs text-destructive">
            Not sent.
            {" "}
            {errorText(message.error?.code)}
          </p>
        )}
      </div>
    </div>
  );
}
