import type {
  SupportTicketAttachment,
  SupportTicketDetail,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@truckmoov/api/auth";
import {
  useQuery, useQueryClient,
} from "@tanstack/react-query";
import {
  AUTH_QUERY_KEY,
  getSupportTicketAttachmentLink,
  getSupportTicketQueryOptions,
  useCloseSupportTicket,
  useReopenSupportTicket,
  useReplySupportTicket,
} from "@truckmoov/api/auth";
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
import { useState } from "react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/shadcn/textarea";

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

// Links are signed for five minutes; refetch a little before that.
const LINK_STALE_MS = 4 * 60 * 1000;

function attachmentLinkQuery(attachment: SupportTicketAttachment) {
  return {
    queryKey: [
      ...AUTH_QUERY_KEY.supportTicket(attachment.ticketId),
      "attachment",
      attachment.id,
    ],
    queryFn: () => getSupportTicketAttachmentLink({
      id: attachment.ticketId, attachmentId: attachment.id,
    }),
    staleTime: LINK_STALE_MS,
  };
}

/** Opens the attachment in a new tab; the tab is opened first so the popup blocker allows it. */
function useOpenAttachment() {
  const queryClient = useQueryClient();
  return async (attachment: SupportTicketAttachment) => {
    const tab = window.open(
      "",
      "_blank",
    );
    try {
      const { data } = await queryClient.fetchQuery(attachmentLinkQuery(attachment));
      if (tab) {
        tab.opener = null;
        tab.location.href = data.url;
      }
      else {
        window.location.assign(data.url);
      }
    }
    catch {
      tab?.close();
      toast.error(`Couldn't open ${attachment.filename}`);
    }
  };
}

function ImageThumb({
  attachment, onOpen,
}: {
  attachment: SupportTicketAttachment; onOpen: () => void;
}) {
  const { data } = useQuery(attachmentLinkQuery(attachment));
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block aspect-video overflow-hidden rounded-md border bg-muted"
    >
      {data?.data.url
        ? (
            <img
              src={data.data.url}
              alt={attachment.filename}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          )
        : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
      <div className="absolute inset-x-0 bottom-0 truncate bg-background/80 px-2 py-1 text-left text-[10px]">
        {attachment.filename}
      </div>
    </button>
  );
}

function AttachmentList({ attachments }: { attachments: SupportTicketAttachment[] }) {
  const open = useOpenAttachment();
  const images = attachments.filter(isImageAttachment);
  const files = attachments.filter(a => !isImageAttachment(a));
  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map(attachment => (
            <ImageThumb
              key={attachment.id}
              attachment={attachment}
              onOpen={() => void open(attachment)}
            />
          ))}
        </div>
      )}
      {files.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {files.map(attachment => (
            <button
              key={attachment.id}
              type="button"
              onClick={() => void open(attachment)}
              className="flex items-center gap-2 rounded-lg border bg-card p-2.5 text-left transition-colors hover:border-primary/50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{attachment.filename}</p>
                <p className="text-[10px] text-muted-foreground">{formatBytes(attachment.sizeBytes)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TicketDetails({ detail }: { detail: SupportTicketDetail }) {
  const {
    attachments, messages, ticket,
  } = detail;
  const status = statusConfig[ticket.status];
  const priority = priorityStyles[ticket.priority];
  const reporterDisplay = ticket.reporterName ?? "Former user";
  const ticketAttachments = attachments.filter(a => !a.messageId);
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
          <p className="text-sm font-medium font-mono">{ticket.displayId}</p>
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
            {String(channelLabel || "-").replace(
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
          {ticketAttachments.length}
          )
        </Label>
        {ticketAttachments.length === 0
          ? <p className="text-sm text-muted-foreground">No attachments.</p>
          : <AttachmentList attachments={ticketAttachments} />}
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
                    {attachments.some(a => a.messageId === message.id) && (
                      <div className="mt-2">
                        <AttachmentList attachments={attachments.filter(a => a.messageId === message.id)} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
      </div>

      <div className="flex flex-col gap-2 p-4 rounded-lg border bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Current Status</Label>
          <p className="text-xs text-muted-foreground">Support moves the status; you can close or reopen once it's resolved.</p>
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
              {" "}
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
              {" "}
              {formatRelative(ticket.escalatedAt)}
            </p>
          )}
        </div>
      )}

      {ticket.contextSnapshot && Object.keys(ticket.contextSnapshot).length > 0 && (
        <div className="space-y-2">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {`${ticket.contextType} at the time of reporting`}
          </Label>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-lg border bg-muted/40 p-3 text-xs">
            {Object.entries(ticket.contextSnapshot).map(([
              key,
              value,
            ]) => (
              <div
                key={key}
                className="contents"
              >
                <dt className="text-muted-foreground">{key}</dt>
                <dd className="font-mono">{value == null ? "-" : String(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <TicketActions
        ticketId={ticket.id}
        status={ticket.status}
      />

      <TicketCsatPanel
        ticketId={ticket.id}
        ticketStatus={ticket.status}
      />
    </div>
  );
}

// Reply is open until the ticket is closed; close/reopen are only valid on a resolved ticket (server 400s otherwise).
function TicketActions({
  ticketId, status,
}: {
  ticketId: string; status: string;
}) {
  const [
    message,
    setMessage,
  ] = useState("");
  const [
    reopenReason,
    setReopenReason,
  ] = useState("");
  const reply = useReplySupportTicket();
  const close = useCloseSupportTicket();
  const reopen = useReopenSupportTicket();
  const busy = reply.isPending || close.isPending || reopen.isPending;

  if (status === "closed")
    return null;

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <Label
        htmlFor="ticket-reply"
        className="text-[11px] uppercase tracking-wide text-muted-foreground"
      >
        Reply
      </Label>
      <Textarea
        id="ticket-reply"
        rows={3}
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Add detail or answer the support team"
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={busy || !message.trim()}
          onClick={() => reply.mutate(
            {
              id: ticketId, data: { message: message.trim() },
            },
            {
              onSuccess: () => {
                setMessage("");
                toast.success("Reply sent");
              },
              onError: error => toast.error(error.message),
            },
          )}
        >
          Send reply
        </Button>
      </div>

      {status === "resolved" && (
        <div className="space-y-2 border-t pt-3">
          <Label
            htmlFor="ticket-reopen"
            className="text-[11px] uppercase tracking-wide text-muted-foreground"
          >
            Still not fixed?
          </Label>
          <Textarea
            id="ticket-reopen"
            rows={2}
            value={reopenReason}
            onChange={e => setReopenReason(e.target.value)}
            placeholder="Why are you reopening it? (at least 3 characters)"
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={busy || reopenReason.trim().length < 3}
              onClick={() => reopen.mutate(
                {
                  id: ticketId, data: { reason: reopenReason.trim() },
                },
                {
                  onSuccess: () => {
                    setReopenReason("");
                    toast.success("Ticket reopened");
                  },
                  onError: error => toast.error(error.message),
                },
              )}
            >
              Reopen
            </Button>
            <Button
              size="sm"
              disabled={busy}
              onClick={() => close.mutate(
                { id: ticketId },
                {
                  onSuccess: () => toast.success("Ticket closed"),
                  onError: error => toast.error(error.message),
                },
              )}
            >
              Close ticket
            </Button>
          </div>
        </div>
      )}
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
            Your support ticket, its conversation and attachments.
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
