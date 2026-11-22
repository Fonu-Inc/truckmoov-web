import type { SupportTicket } from "./AdminTicketSheet";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import { Badge } from "@/components/shadcn/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  TicketMessages,
  TicketReplyComposer,
} from "./ticketConversation";
import {
  priorityStyles,
  statusStyles,
} from "./ticketStyles";
import { useTicketConversation } from "./useTicketConversation";

type TicketConversationDialogProps = {
  ticket: SupportTicket | null;
  open: boolean;
  onClose: () => void;
};

export function TicketConversationDialog({
  ticket,
  open,
  onClose,
}: TicketConversationDialogProps) {
  const conversation = useTicketConversation(open && ticket ? ticket.id : null);

  const statusStyle = ticket ? statusStyles[ticket.status] : undefined;
  const priorityStyle = ticket ? priorityStyles[ticket.priority] : undefined;

  return (
    <Dialog
      open={open}
      onOpenChange={o => !o && onClose()}
    >
      <DialogContent className="max-w-5xl w-[95vw] p-0 gap-0 max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-8 pt-8 pb-5 border-b">
          <div className="flex flex-wrap items-center gap-2 pr-6">
            <DialogTitle className="text-xl leading-tight">Ticket Conversation</DialogTitle>
            {statusStyle && (
              <Badge
                variant="outline"
                className={statusStyle.className}
              >
                {statusStyle.label}
              </Badge>
            )}
            {priorityStyle && (
              <Badge
                variant="outline"
                className={priorityStyle.className}
              >
                {priorityStyle.label}
              </Badge>
            )}
          </div>
          {ticket && (
            <p className="text-sm text-muted-foreground mt-1 truncate">
              <span className="font-mono">
                {ticket.displayId ?? `#${ticket.id.slice(
                  0,
                  8,
                )}`}
              </span>
              {" · "}
              {ticket.subject}
              {" · "}
              Created
              {" "}
              {formatWithPattern(
                ticket.createdAt,
                "PPp",
              )}
            </p>
          )}
        </DialogHeader>

        <div className="h-[58vh] min-h-[360px] overflow-y-auto px-8 py-5">
          <TicketMessages
            messages={conversation.messages}
            isLoading={conversation.isLoading}
            myId={conversation.myId}
          />
        </div>

        <TicketReplyComposer
          checkboxId="conversation-internal-note"
          className="border-t px-8 py-5 space-y-3 bg-muted/20"
          conversation={conversation}
        />
      </DialogContent>
    </Dialog>
  );
}
