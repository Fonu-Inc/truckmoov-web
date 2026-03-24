import { cn } from "@/lib/utils";
import StatusBadge from "@/shared/components/StatusBadge";
import { timeAgo } from "@/shared/utils/time-functions";
import { ArrowDownLeft, ArrowUpRight, CheckCircle, Clock, Phone, XCircle } from "lucide-react";

type CallItemProps = {
 call: any
}

export default function CallItem({ call }: CallItemProps) {
  const isOutbound = call.call_type === "outbound";
  const statusIcon = call.status === "completed" ? (
    <CheckCircle className="h-4 w-4 text-success" />
  ) : call.status === "failed" || call.status === "no_answer" ? (
    <XCircle className="h-4 w-4 text-destructive" />
  ) : (
    <Phone className="h-4 w-4 text-primary" />
  );

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white",
        call.status === "completed" ? "bg-success" :
        call.status === "failed" || call.status === "no_answer" ? "bg-destructive" :
        "bg-primary"
      )}>
        {statusIcon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{call.driver_name || call.driver_phone}</p>
            {isOutbound ? (
              <ArrowUpRight className="h-3 w-3 text-primary" />
            ) : (
              <ArrowDownLeft className="h-3 w-3 text-success" />
            )}
          </div>
          <StatusBadge status={call.status} />
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{call.driver_phone}</span>
          {call.duration_seconds !== null && call.duration_seconds > 0 && (
            <span>{Math.floor(call.duration_seconds / 60)}:{(call.duration_seconds % 60).toString().padStart(2, '0')}</span>
          )}
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(call.started_at)}
          </span>
          {call.caller_name && (
            <span>by {call.caller_name}</span>
          )}
        </div>
      </div>
    </div>
  );
}
