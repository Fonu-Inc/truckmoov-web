import { getInitials } from "@truckmoov/app-core/utils/general-utils";
import {
  formatRelative, formatWithPattern,
} from "@truckmoov/app-core/utils/time-utils";
import {
  ArrowUpRight,
  FileText,
  Image as ImageIcon,
  Paperclip,
} from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
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

type SupportTicket = any;
type TicketStatus = any;
type TicketPriority = any;

type TicketDetailSheetProps = {
  ticket: SupportTicket | null;
  onClose: () => void;
};

const statusConfig: Record<TicketStatus, {
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
    label: "Resolved", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  closed: {
    label: "Closed", className: "bg-muted text-muted-foreground",
  },
};

const priorityStyles: Record<TicketPriority, {
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

const REPORTER_NAMES: Record<string, string> = {
  "usr-21f4a8c0": "Adaeze Okafor",
  "usr-9a3b1c44": "Tunde Bakare",
  "usr-55cd0091": "Chinedu Eze",
  "usr-ab991122": "Funmi Adeyemi",
  "usr-31aa55b9": "Ibrahim Musa",
  "usr-7711eecc": "Kemi Lawal",
  "usr-cc220011": "Oluwaseun Bello",
  "usr-66aa00ee": "Ngozi Uche",
  "usr-aa11bbcc": "Yusuf Sani",
  "usr-12340987": "Blessing Akpan",
};

type Attachment = {
  name: string;
  size?: number;
  type?: string;
  url?: string;
};

function isImageAttachment(att: Attachment) {
  return (att.type && att.type.startsWith("image/"))
    || /\.(?:png|jpe?g|gif|webp|svg|bmp)$/i.test(att.name || "");
}

export function TicketDetailSheet({
  ticket, onClose,
}: TicketDetailSheetProps) {
  if (!ticket)
    return null;

  const status = statusConfig[ticket.status];
  const priority = priorityStyles[ticket.priority] ?? {
    label: ticket.priority, className: "",
  };
  const ctx = (ticket.contextSnapshot ?? {}) as Record<string, unknown>;
  const realAttachments: Attachment[] = Array.isArray(ctx.attachments)
    ? (ctx.attachments as Attachment[])
    : [];
  const demoAttachments: Attachment[] = [
    {
      name: "screenshot-error.png", type: "image/png", size: 248 * 1024,
    },
    {
      name: "device-log.txt", type: "text/plain", size: 12 * 1024,
    },
  ];
  const display = realAttachments.length > 0 ? realAttachments : demoAttachments;

  const reporterDisplay
    = (ticket as SupportTicket & { reporterName?: string }).reporterName
      || (ticket.createdBy
        ? REPORTER_NAMES[ticket.createdBy] || `User #${ticket.createdBy.slice(
          0,
          8,
        )}`
        : "—");
  const reporterInitials = getInitials(reporterDisplay);

  const channelLabel = (ctx.channel_label as string | undefined) ?? ticket.contextType;

  return (
    <Dialog
      open={!!ticket}
      onOpenChange={open => !open && onClose()}
    >
      <DialogContent className="max-w-xl p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg leading-tight">View Ticket</DialogTitle>
          <DialogDescription className="text-xs mt-1">
            Read-only view of your support ticket. Updates and replies are managed by the platform support team.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Title + Ticket ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Title
              </Label>
              <p className="text-sm font-semibold leading-snug">{ticket.subject}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Ticket ID
              </Label>
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
                  {reporterInitials}
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
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Issue Description
            </Label>
            <p className="text-sm p-3 rounded-lg bg-muted/50 leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <Paperclip className="h-3 w-3" />
              Attachments (
              {display.length}
              )
            </Label>

            {display.some(isImageAttachment) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {display.filter(isImageAttachment).map((att, i) => (
                  <a
                    key={`img-${i}`}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block aspect-video overflow-hidden rounded-md border bg-muted"
                  >
                    {att.url
                      ? (
                          <img
                            src={att.url}
                            alt={att.name}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        )
                      : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                    <div className="absolute inset-x-0 bottom-0 truncate bg-background/80 px-2 py-1 text-[10px]">
                      {att.name}
                    </div>
                  </a>
                ))}
              </div>
            )}

            {display.some(a => !isImageAttachment(a)) && (
              <div className="grid grid-cols-2 gap-2">
                {display
                  .filter(a => !isImageAttachment(a))
                  .map((att, i) => (
                    <div
                      key={`file-${i}`}
                      className="flex items-center gap-2 p-2.5 rounded-lg border bg-card"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{att.name}</p>
                        {att.size != null && (
                          <p className="text-[10px] text-muted-foreground">
                            {(att.size / 1024).toFixed(0)}
                            {" "}
                            KB
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Current Status (read-only — no update control for non-admins) */}
          <div className="flex flex-col gap-2 p-4 rounded-lg border bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Current Status
              </Label>
              <p className="text-xs text-muted-foreground">
                Only the platform support team can change ticket status.
              </p>
            </div>
            <Badge
              variant="outline"
              className={status.className}
            >
              {status.label}
            </Badge>
          </div>

          {/* Escalation */}
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
              {ticket.escalationNotes && (
                <p className="text-xs">{ticket.escalationNotes}</p>
              )}
              {ticket.escalatedAt && (
                <p className="text-xs text-muted-foreground">
                  Escalated
                  {" "}
                  {formatRelative(ticket.escalatedAt)}
                </p>
              )}
            </div>
          )}

          {/* CSAT — only renders when ticket is resolved/closed */}
          <TicketCsatPanel
            ticketId={ticket.id}
            ticketStatus={ticket.status}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
