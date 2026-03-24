import { cn } from "@/lib/utils";
import StatusBadge from "@/shared/components/StatusBadge";
import { timeAgo } from "@/shared/utils/time-functions";
import { ArrowDownLeft, ArrowUpRight, Clock, Mail, MessageSquare } from "lucide-react";

type MessageItemProps = {
 message: any
}

export default function MessageItem({ message }: MessageItemProps) {
  const isOutbound = message.direction === "outbound";

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white",
        "bg-linear-to-br from-primary to-accent"
      )}>
        {message.driver_name?.split(" ").map(n => n[0]).join("") || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{message.driver_name || message.driver_phone}</p>
            {isOutbound ? (
              <ArrowUpRight className="h-3 w-3 text-primary" />
            ) : (
              <ArrowDownLeft className="h-3 w-3 text-success" />
            )}
            {message.message_type === "whatsapp" ? (
              <MessageSquare className="h-3 w-3 text-success" />
            ) : (
              <Mail className="h-3 w-3 text-primary" />
            )}
          </div>
          <StatusBadge status={message.status}/>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{message.content}</p>
        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(message.created_at)}
          </span>
          {message.sender_name && (
            <span>by {message.sender_name}</span>
          )}
        </div>
      </div>
    </div>
  );
}
