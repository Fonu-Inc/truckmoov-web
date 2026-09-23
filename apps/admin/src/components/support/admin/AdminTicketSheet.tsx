import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getSupportTicketMessagesQueryOptions,
  useAssignSystemSupportTicket,
  useCreateSupportTicketMessage,
  useEscalateSupportTicket,
  useUpdateSupportTicketStatus,
} from "@truckmoov/api/auth";
import { useAuthStore } from "@truckmoov/api/lib/auth-store";
import { getInitials } from "@truckmoov/app-core/utils/general-utils";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  ArrowUpRight,
  Loader2,
  Lock,
  Send,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Separator } from "@/components/shadcn/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { Textarea } from "@/components/shadcn/textarea";

export type TicketStatus = "open" | "in_progress" | "waiting_on_tenant" | "escalated" | "resolved" | "closed";
type EscalationType = "fleetpro_internal" | "fonu_connectivity" | "vendor_installer";
type TicketMessage = {
  id: string;
  message: string;
  isInternal: boolean;
  createdAt?: string;
  senderName?: string;
};

export type SupportTicket = {
  id: string;
  tenantId: string;
  category: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: string;
  contextType: string;
  channel?: string;
  escalatedTo?: EscalationType | string;
  escalatedReferenceId?: string;
  escalationNotes?: string;
  escalatedAt?: string;
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  contextSnapshot?: Record<string, unknown>;
  reporterName?: string;
  tenantName?: string;
};

type AdminTicketSheetProps = {
  ticket: SupportTicket | null;
  onClose: () => void;
};

const escalationOptions: {
  value: EscalationType;
  label: string;
}[] = [
  {
    value: "fleetpro_internal",
    label: "FleetPro Internal",
  },
  {
    value: "fonu_connectivity",
    label: "Fonu Connectivity",
  },
  {
    value: "vendor_installer",
    label: "Vendor / Installer",
  },
];

const priorityStyles: Record<string, {
  label: string;
  className: string;
}> = {
  low: {
    label: "Low",
    className: "border-border bg-secondary/50 text-muted-foreground",
  },
  medium: {
    label: "Medium",
    className: "border-transparent bg-primary/10 text-primary",
  },
  high: {
    label: "High",
    className: "border-transparent bg-destructive/10 text-destructive",
  },
  critical: {
    label: "Critical",
    className: "border-destructive/20 bg-destructive/10 text-destructive",
  },
};

const statusOptions: {
  value: TicketStatus;
  label: string;
}[] = [
  {
    value: "open",
    label: "Open",
  },
  {
    value: "in_progress",
    label: "In Progress",
  },
  {
    value: "waiting_on_tenant",
    label: "Awaiting Response",
  },
  {
    value: "escalated",
    label: "Escalated",
  },
  {
    value: "resolved",
    label: "Resolved",
  },
  {
    value: "closed",
    label: "Closed",
  },
];

function titleCase(value: string) {
  return value
    .replace(
      /_/g,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim()
    .replace(
      /\b\w/g,
      letter => letter.toUpperCase(),
    );
}

function shortId(id: string) {
  return id.slice(
    0,
    8,
  );
}

function channelFromContext(value: string) {
  switch (value) {
    case "device":
      return "Device";
    case "sim":
      return "SIM";
    case "vehicle":
      return "Vehicle";
    case "whatsapp":
      return "WhatsApp";
    case "billing":
      return "Billing";
    default:
      return "Web";
  }
}

function formatCreatedAt(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? date
    : formatWithPattern(
        parsed,
        "PPP, p",
      );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function readString(source: Record<string, unknown> | null, key: string): string | undefined {
  const value = source?.[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readBoolean(source: Record<string, unknown> | null, key: string): boolean {
  const value = source?.[key];
  return typeof value === "boolean" ? value : false;
}

function extractMessages(response: unknown): TicketMessage[] {
  const root = asRecord(response);
  const data = root?.data;
  const dataRecord = asRecord(data);
  const candidates = Array.isArray(data)
    ? data
    : dataRecord
      ? [
          dataRecord.messages,
          dataRecord.items,
          dataRecord.rows,
          dataRecord.data,
        ].find(Array.isArray)
      : [];

  return (Array.isArray(candidates) ? candidates : [])
    .map(asRecord)
    .filter(Boolean)
    .map(raw => ({
      id: readString(
        raw,
        "id",
      ) ?? readString(
        raw,
        "messageId",
      ) ?? crypto.randomUUID(),
      message: readString(
        raw,
        "message",
      ) ?? readString(
        raw,
        "content",
      ) ?? "",
      isInternal: readBoolean(
        raw,
        "isInternal",
      ),
      createdAt: readString(
        raw,
        "createdAt",
      ),
      senderName: readString(
        raw,
        "senderName",
      ) ?? readString(
        raw,
        "createdByName",
      ),
    }))
    .filter(message => message.message);
}

export function AdminTicketSheet({
  ticket,
  onClose,
}: AdminTicketSheetProps) {
  const [
    internalNote,
    setInternalNote,
  ] = useState(false);
  const [
    message,
    setMessage,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState<TicketStatus>("open");
  const [
    escalateTo,
    setEscalateTo,
  ] = useState<EscalationType | "">("");
  const [
    referenceId,
    setReferenceId,
  ] = useState("");
  const [
    escalationNotes,
    setEscalationNotes,
  ] = useState("");
  const messagesQuery = useQuery({
    ...getSupportTicketMessagesQueryOptions(ticket?.id ?? ""),
    enabled: !!ticket,
  });
  const statusMutation = useUpdateSupportTicketStatus();
  const messageMutation = useCreateSupportTicketMessage();
  const escalateMutation = useEscalateSupportTicket();
  const assignMutation = useAssignSystemSupportTicket();
  const myId = useAuthStore(state => state.user?.id);

  useEffect(
    () => {
      if (!ticket)
        return;
      setStatus(ticket.status);
      setMessage("");
      setInternalNote(false);
      setEscalateTo((ticket.escalatedTo as EscalationType | undefined) ?? "");
      setReferenceId(ticket.escalatedReferenceId ?? "");
      setEscalationNotes(ticket.escalationNotes ?? "");
    },
    [ticket],
  );

  const messages = useMemo(
    () => extractMessages(messagesQuery.data),
    [messagesQuery.data],
  );

  function handleStatusChange(value: TicketStatus) {
    if (!ticket)
      return;
    setStatus(value);
    statusMutation.mutate(
      {
        id: ticket.id,
        data: { status: value },
      },
      {
        onSuccess: () => toast.success("Ticket status updated"),
        onError: (error) => {
          setStatus(ticket.status);
          toast.error(error.message);
        },
      },
    );
  }

  function handleSendMessage() {
    if (!ticket || !message.trim())
      return;
    messageMutation.mutate(
      {
        id: ticket.id,
        data: {
          message: message.trim(),
          isInternal: internalNote,
        },
      },
      {
        onSuccess: () => {
          setMessage("");
          setInternalNote(false);
          toast.success(internalNote ? "Internal note added" : "Message sent");
        },
        onError: error => toast.error(error.message),
      },
    );
  }

  function handleAssignToMe() {
    if (!ticket || !myId)
      return;
    assignMutation.mutate(
      {
        id: ticket.id,
        data: { assigneeId: myId },
      },
      {
        onSuccess: () => toast.success("Ticket assigned to you"),
        onError: error => toast.error(error.message),
      },
    );
  }

  function handleEscalate() {
    if (!ticket || !escalateTo)
      return;
    escalateMutation.mutate(
      {
        id: ticket.id,
        data: {
          escalatedTo: escalateTo,
          referenceId: referenceId.trim() || undefined,
          notes: escalationNotes.trim() || undefined,
        },
      },
      {
        onSuccess: () => toast.success("Ticket escalated"),
        onError: error => toast.error(error.message),
      },
    );
  }

  if (!ticket)
    return null;

  const reporterName = ticket.reporterName || `User ${shortId(ticket.createdBy || ticket.id)}`;
  const priority = priorityStyles[ticket.priority] ?? priorityStyles.medium;

  return (
    <Dialog
      open={!!ticket}
      onOpenChange={open => !open && onClose()}
    >
      <DialogContent className="max-h-[92vh] max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-7 py-7">
          <DialogTitle className="text-xl">Manage Ticket</DialogTitle>
          <DialogDescription className="max-w-xl text-sm">
            Review the ticket details, respond to the reporter, and update the status or escalate as needed.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(92vh-113px)] overflow-y-auto px-7 py-5">
          <Tabs
            defaultValue="details"
            className="space-y-6"
          >
            <TabsList className="grid h-11 w-full grid-cols-3 p-1">
              <TabsTrigger
                value="details"
                className="h-9 text-base font-semibold"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="messages"
                className="h-9 text-base font-semibold"
              >
                Messages
              </TabsTrigger>
              <TabsTrigger
                value="escalate"
                className="h-9 text-base font-semibold"
              >
                Escalate
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="details"
              className="mt-0 space-y-6"
            >
              <div className="space-y-2">
                <FieldLabel>Title</FieldLabel>
                <p className="font-semibold">{ticket.subject}</p>
              </div>

              <div className="space-y-2">
                <FieldLabel>Ticket ID</FieldLabel>
                <p className="font-mono font-semibold">
                  #
                  {shortId(ticket.id)}
                </p>
              </div>

              <div className="grid gap-x-12 gap-y-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel>Category</FieldLabel>
                  <p className="font-semibold">{titleCase(ticket.category)}</p>
                </div>
                <div className="space-y-2">
                  <FieldLabel>Priority</FieldLabel>
                  <Badge
                    variant="outline"
                    className={priority.className}
                  >
                    {priority.label}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <FieldLabel>Channel</FieldLabel>
                  <p className="font-semibold">{channelFromContext(ticket.contextType)}</p>
                </div>
                <div className="space-y-2">
                  <FieldLabel>Reporter</FieldLabel>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {getInitials(reporterName)}
                    </div>
                    <p className="font-semibold">{reporterName}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel>Created</FieldLabel>
                <p className="font-semibold">{formatCreatedAt(ticket.createdAt)}</p>
              </div>

              <Separator />

              <div className="space-y-3">
                <FieldLabel>Issue Description</FieldLabel>
                <div className="rounded-md bg-secondary/60 p-4 font-semibold leading-relaxed">
                  {ticket.description || "No description provided."}
                </div>
              </div>

              {ticket.contextSnapshot && Object.keys(ticket.contextSnapshot).length > 0 && (
                <div className="space-y-2">
                  <FieldLabel>
                    {`${ticket.contextType} snapshot (read server-side at creation)`}
                  </FieldLabel>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-md border bg-secondary/40 p-3 text-xs">
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

              <div className="flex items-center justify-between rounded-md border bg-background/40 p-4">
                <div>
                  <FieldLabel>Assignee</FieldLabel>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {ticket.assignedTo ? (ticket.assignedTo === myId ? "You" : shortId(ticket.assignedTo)) : "Unassigned"}
                  </p>
                </div>
                {ticket.assignedTo !== myId && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={assignMutation.isPending || !myId}
                    onClick={handleAssignToMe}
                  >
                    Assign to me
                  </Button>
                )}
              </div>

              <div className="rounded-md border bg-background/40 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <FieldLabel>Update Ticket Status</FieldLabel>
                    <p className="mt-1 text-sm text-muted-foreground">Change the workflow stage of this ticket. To escalate, use the Escalate tab.</p>
                  </div>
                  <Select
                    value={status}
                    onValueChange={value => handleStatusChange(value as TicketStatus)}
                  >
                    <SelectTrigger
                      className="h-11 sm:w-56"
                      disabled={statusMutation.isPending}
                    >
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.filter(option => option.value !== "escalated" || status === "escalated").map(option => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="messages"
              className="mt-0 space-y-6"
            >
              <div className="space-y-3">
                <FieldLabel>Conversation</FieldLabel>
                <div className="h-80 space-y-3 overflow-y-auto rounded-md border bg-background/40 p-4">
                  {messagesQuery.isLoading
                    ? (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      )
                    : messages.length === 0
                      ? (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            No messages yet.
                          </div>
                        )
                      : (
                          messages.map(item => (
                            <div
                              key={item.id}
                              className="rounded-md border bg-secondary/50 p-3"
                            >
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold">{item.senderName || "Support"}</p>
                                <div className="flex items-center gap-2">
                                  {item.isInternal && (
                                    <Badge
                                      variant="outline"
                                      className="border-primary/20 bg-primary/10 text-primary"
                                    >
                                      Internal
                                    </Badge>
                                  )}
                                  {item.createdAt && (
                                    <span className="text-xs text-muted-foreground">{formatCreatedAt(item.createdAt)}</span>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm leading-relaxed">{item.message}</p>
                            </div>
                          ))
                        )}
                </div>
              </div>

              <div className="space-y-3">
                <FieldLabel>Reply to Tenant</FieldLabel>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="internal-note"
                    checked={internalNote}
                    onCheckedChange={checked => setInternalNote(checked === true)}
                  />
                  <Label
                    htmlFor="internal-note"
                    className="flex items-center gap-1.5 font-semibold"
                  >
                    <Lock className="h-4 w-4" />
                    Mark as internal note (not visible to tenant)
                  </Label>
                </div>
                <div className="flex items-end gap-2">
                  <Textarea
                    value={message}
                    onChange={event => setMessage(event.target.value)}
                    placeholder="Type your message..."
                    rows={4}
                    className="resize-none"
                  />
                  <Button
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    disabled={!message.trim() || messageMutation.isPending}
                    onClick={handleSendMessage}
                  >
                    {messageMutation.isPending
                      ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )
                      : (
                          <Send className="h-4 w-4" />
                        )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="escalate"
              className="mt-0 space-y-6"
            >
              <div className="rounded-md bg-secondary/60 p-4 font-semibold leading-relaxed">
                Escalate this ticket when it requires action from an external party. The tenant will see the escalation
                status but cannot escalate directly.
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="escalate-target"
                  className="font-semibold"
                >
                  Escalate To
                  {" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={escalateTo}
                  onValueChange={value => setEscalateTo(value as EscalationType)}
                >
                  <SelectTrigger
                    id="escalate-target"
                    className="h-11"
                  >
                    <SelectValue placeholder="Select escalation target" />
                  </SelectTrigger>
                  <SelectContent>
                    {escalationOptions.map(option => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="escalate-reference"
                  className="font-semibold"
                >
                  External Reference ID
                  {" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="escalate-reference"
                  value={referenceId}
                  onChange={event => setReferenceId(event.target.value)}
                  placeholder="e.g., Fonu ticket #12345"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="escalate-notes"
                  className="font-semibold"
                >
                  Escalation Notes
                  {" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="escalate-notes"
                  value={escalationNotes}
                  onChange={event => setEscalationNotes(event.target.value)}
                  placeholder="Internal notes about the escalation..."
                  rows={4}
                />
              </div>

              <Button
                className="h-10 w-full font-semibold"
                variant="destructive"
                disabled={!escalateTo || escalateMutation.isPending}
                onClick={handleEscalate}
              >
                {escalateMutation.isPending
                  ? (
                      <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                    )
                  : (
                      <ArrowUpRight className="mr-3 h-4 w-4" />
                    )}
                Escalate Ticket
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</p>;
}
