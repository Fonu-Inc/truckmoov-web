import {
  CheckCircle, Clock, Copy, MoreVertical, RefreshCw, XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { TooltipWrapper } from "@/components/shadcn/tooltip-wrapper";

type MessageActionsProps = {
  messageId: string;
  messageType: string;
  status: string;
  content: string;
  driverPhone: string;
  driverId: string;
  driverName: string;
  onResend?: () => void;
};

export function MessageActions({
  messageId: _messageId,
  messageType: _messageType,
  status,
  content,
  driverPhone: _driverPhone,
  driverId: _driverId,
  driverName: _driverName,
  onResend: _onResend,
}: MessageActionsProps) {
  const [isResending] = useState(false);

  const canResend = status === "failed" || status === "pending";

  const handleResend = async () => {
    toast.info("Coming soon");
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(content);
    toast.success("Message copied to clipboard");
  };

  const getStatusBadge = () => {
    switch (status) {
      case "sent":
        return (
          <Badge
            variant="secondary"
            className="gap-1"
          >
            <CheckCircle className="h-3 w-3" />
            {" "}
            Sent
          </Badge>
        );
      case "delivered":
        return (
          <Badge
            variant="default"
            className="gap-1 bg-success"
          >
            <CheckCircle className="h-3 w-3" />
            {" "}
            Delivered
          </Badge>
        );
      case "read":
        return (
          <Badge
            variant="default"
            className="gap-1 bg-primary"
          >
            <CheckCircle className="h-3 w-3" />
            {" "}
            Read
          </Badge>
        );
      case "failed":
        return (
          <Badge
            variant="destructive"
            className="gap-1"
          >
            <XCircle className="h-3 w-3" />
            {" "}
            Failed
          </Badge>
        );
      case "resent":
        return (
          <Badge
            variant="outline"
            className="gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            {" "}
            Resent
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="gap-1"
          >
            <Clock className="h-3 w-3" />
            {" "}
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="flex items-center gap-2">
      {getStatusBadge()}

      {canResend && (
        <TooltipWrapper content="Resend message">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleResend}
            disabled={isResending}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isResending ? "animate-spin" : ""}`} />
          </Button>
        </TooltipWrapper>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleCopyContent}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Message
          </DropdownMenuItem>
          {canResend && (
            <DropdownMenuItem
              onClick={handleResend}
              disabled={isResending}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Resend Message
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
