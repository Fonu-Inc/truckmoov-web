import type {
  SupportTicketAttachment,
  SupportTicketDetail,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import { getSupportTicketQueryOptions } from "@truckmoov/api/auth";
import { getInitials } from "@truckmoov/app-core/utils/general-utils";
import {
  formatRelative, formatWithPattern,
} from "@truckmoov/app-core/utils/time-utils";
import {
  ArrowUpRight,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Paperclip,
} from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Label } from "@/components/shadcn/label";
import { Separator } from "@/components/shadcn/separator";
import { TicketCsatPanel } from "./TicketCsatPanel";

type TicketDetailSheetProps = {
  ticketId: string | null;
  onClose: () => void;
};

const statusConfig: Record<SupportTicketStatus, {
  label: string; className: string;
}> = {
  open: {
    label: "Open", className: "bg-primary/10 text-primary",
  },
  in_progress: {
    label: "In Progress", className: "bg-chart-5/10 text-chart-5",
  },
  waiting_on_tenant: {
    label: "Awaiting Response", className: "bg-muted text-muted-foreground",
  },
  escalated: {
    label: "Escalated", className: "bg-destructive/10 text-destructive",
  },
  resolved: {
    label: "Resolved", className: "bg-success/10 text-success",
  },
  closed: {
    label: "Closed", className: "bg-muted text-muted-foreground",
  },
};

const priorityStyles: Record<SupportTicketPriority, {
  label: string; className: string;
}> = {
  low: {
    label: "Low", className: "bg-muted text-muted-foreground",
  },
  medium: {
    label: "Medium", className: "bg-primary/10 text-primary",
  },
  high: {
    label: "High", className: "bg-chart-5/10 text-chart-5",
  },
  critical: {
    label: "Critical", className: "bg-destructive/10 text-destructive",
  },
};

function isImageAttachment(attachment: SupportTicketAttachment) {
  return attachment.contentType.startsWith("image/")
    || /\.(?:png|jpe?g|gif|webp|svg|bmp)$/i.test(attachment.filename);
}

function formatBytes(bytes: number) {
  if (bytes < 1024)
    return `${bytes} B`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function TicketDetails({ detail }: { detail: SupportTicketDetail }) {
  const {
    attachments, messages, ticket,
  } = detail;
  const status = statusConfig[ticket.status];
  const priority = priorityStyles[ticket.priority];
  const reporterDisplay = ticket.createdBy
    ? `User #${ticket.createdBy.slice(
      0,
      8,
    )}`
    : "—";
  const channelLabel = ticket.otherChannel ?? ticket.channel ?? ticket.contextType;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Title</Label>
          <p className="text-sm font-semibold leading-snug">{ticket.subject}</p>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Ticket ID</Label>
          <p className="text-sm font-medium font-mono">
            #
            {ticket.id.slice(
              0,
              8,
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <div className="space-y-1">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Category</Label>
          <p className="text-sm font-medium capitalize">
            {ticket.category.replace(
              /_/g,
              " ",
            )}
          </p>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Priority</Label>
          <div>
            <Badge
              variant="outline"
              className={priority.className}
            >
              {priority.label}
            </Badge>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Channel</Label>
          <p className="text-sm font-medium capitalize">
            {String(channelLabel || "—").replace(
              /_/g,
              " ",
            )}
          </p>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Reporter</Label>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
              {getInitials(reporterDisplay)}
            </div>
            <p className="text-sm font-medium truncate">{reporterDisplay}</p>
          </div>
        </div>
        <div className="space-y-1 col-span-2">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Created</Label>
          <p className="text-sm">
            {formatWithPattern(
              ticket.createdAt,
              "PPp",
            )}
            {" "}
            <span className="text-muted-foreground">
              (
              {formatRelative(ticket.createdAt)}
              )
            </span>
          </p>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Issue Description</Label>
        <p className="text-sm p-3 rounded-lg bg-muted/50 leading-relaxed whitespace-pre-wrap">
          {ticket.description}
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <Paperclip className="h-3 w-3" />
          Attachments (
          {attachments.length}
          )
        </Label>
        {attachments.length === 0
          ? <p className="text-sm text-muted-foreground">No attachments.</p>
          : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {attachments.map(attachment => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-2 rounded-lg border bg-card p-2.5"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                      {isImageAttachment(attachment)
                        ? <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        : <FileText className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{attachment.filename}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {attachment.contentType}
                        {" · "}
                        {formatBytes(attachment.sizeBytes)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <MessageSquare className="h-3 w-3" />
          Conversation (
          {messages.length}
          )
        </Label>
        {messages.length === 0
          ? <p className="text-sm text-muted-foreground">No replies yet.</p>
          : (
              <div className="space-y-2">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className="rounded-lg border bg-muted/30 p-3"
                  >
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="text-xs font-medium">
                        {message.senderName || `User #${message.senderId.slice(
                          0,
                          8,
                        )}`}
                      </p>
                      <p className="shrink-0 text-[10px] text-muted-foreground">
                        {formatRelative(message.createdAt)}
                      </p>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{message.message}</p>
                  </div>
                ))}
              </div>
            )}
      </div>

      <div className="flex flex-col gap-2 p-4 rounded-lg border bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Current Status</Label>
          <p className="text-xs text-muted-foreground">Only the platform support team can change ticket status.</p>
        </div>
        <Badge
          variant="outline"
          className={status.className}
        >
          {status.label}
        </Badge>
      </div>

      {ticket.escalatedTo && (
        <div className="p-3 rounded-lg border border-destructive/50 bg-destructive/5 space-y-2">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <ArrowUpRight className="h-4 w-4" />
            <span className="font-medium">
              Escalated to
              {ticket.escalatedTo.replace(
                /_/g,
                " ",
              )}
            </span>
          </div>
          {ticket.escalatedReferenceId && (
            <p className="text-xs">
              <span className="text-muted-foreground">Reference ID: </span>
              {ticket.escalatedReferenceId}
            </p>
          )}
          {ticket.escalationNotes && <p className="text-xs">{ticket.escalationNotes}</p>}
          {ticket.escalatedAt && (
            <p className="text-xs text-muted-foreground">
              Escalated
              {formatRelative(ticket.escalatedAt)}
            </p>
          )}
        </div>
      )}

      <TicketCsatPanel
        ticketId={ticket.id}
        ticketStatus={ticket.status}
      />
    </div>
  );
}

export function TicketDetailSheet({
  ticketId, onClose,
}: TicketDetailSheetProps) {
  const {
    data, error, isLoading, refetch,
  } = useQuery(getSupportTicketQueryOptions(ticketId ?? ""));

  if (!ticketId)
    return null;

  return (
    <Dialog
      open
      onOpenChange={open => !open && onClose()}
    >
      <DialogContent className="max-w-xl p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg leading-tight">View Ticket</DialogTitle>
          <DialogDescription className="text-xs mt-1">
            Read-only view of your support ticket. Updates and replies are managed by the platform support team.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">Unable to load this ticket.</p>
              <Button
                variant="link"
                onClick={() => refetch()}
              >
                Try again
              </Button>
            </div>
          )}
          {data?.data && <TicketDetails detail={data.data} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
