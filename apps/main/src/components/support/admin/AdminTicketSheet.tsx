import {
  formatRelative, formatWithPattern,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle,
  ArrowUpRight,
  FileText,
  ImageIcon,
  Loader2,
  Lock,
  Paperclip,
  Send,
  User,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Separator } from "@/components/shadcn/separator";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";
import { Textarea } from "@/components/shadcn/textarea";
import { useAuthStore } from "@/stores/authStore";

// Local type aliases (hook deleted)
type TicketStatus = "open" | "in_progress" | "waiting_on_tenant" | "escalated" | "resolved" | "closed";
type EscalationType = "fleetpro_internal" | "fonu_connectivity" | "vendor_installer";
type SupportTicket = any;

type AdminTicketSheetProps = {
  ticket: SupportTicket | null;
  onClose: () => void;
};

const statusOptions: {
  value: TicketStatus; label: string;
}[] = [
  {
    value: "open", label: "Open",
  },
  {
    value: "in_progress", label: "In Progress",
  },
  {
    value: "waiting_on_tenant", label: "Waiting on Tenant",
  },
  {
    value: "escalated", label: "Escalated",
  },
  {
    value: "resolved", label: "Resolved",
  },
  {
    value: "closed", label: "Closed",
  },
];

const escalationOptions: {
  value: EscalationType; label: string;
}[] = [
  {
    value: "fleetpro_internal", label: "FleetPro Internal",
  },
  {
    value: "fonu_connectivity", label: "Fonu Connectivity",
  },
  {
    value: "vendor_installer", label: "Vendor / Installer",
  },
];

export function AdminTicketSheet({
  ticket, onClose,
}: AdminTicketSheetProps) {
  const { user } = useAuthStore();
  const updateTicketStatus = async (..._args: any[]) => {};
  const escalateTicket = async (..._args: any[]) => {};
  const refetch = async () => {};
  const messages: any[] = [];
  const isLoading = false;
  const sendMessage = async (..._args: any[]): Promise<boolean> => false;

  const [
    newMessage,
    setNewMessage,
  ] = useState("");
  const [
    isInternal,
    setIsInternal,
  ] = useState(false);
  const [
    isSending,
    setIsSending,
  ] = useState(false);
  const [
    isUpdating,
    setIsUpdating,
  ] = useState(false);

  // Escalation form
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

  const handleSendMessage = async () => {
    if (!newMessage.trim())
      return;
    setIsSending(true);
    const success = await sendMessage(
      newMessage.trim(),
      isInternal,
    );
    if (success) {
      setNewMessage("");
      setIsInternal(false);
    }
    setIsSending(false);
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket)
      return;
    setIsUpdating(true);
    await updateTicketStatus(
      ticket.id,
      newStatus,
    );
    await refetch();
    setIsUpdating(false);
  };

  const handleEscalate = async () => {
    if (!ticket || !escalateTo)
      return;
    setIsUpdating(true);
    await escalateTicket(
      ticket.id,
      escalateTo,
      referenceId || undefined,
      escalationNotes || undefined,
    );
    await refetch();
    setEscalateTo("");
    setReferenceId("");
    setEscalationNotes("");
    setIsUpdating(false);
  };

  if (!ticket)
    return null;

  // Demo attachments — wire to real ticket attachments when storage backend is connected
  const demoAttachments = [
    {
      name: "screenshot-error.png", type: "image" as const, size: "248 KB",
    },
    {
      name: "device-log.txt", type: "document" as const, size: "12 KB",
    },
  ];

  // Demo reporter directory — mirrors AllTickets so the modal shows a human name
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
  const reporterDisplay = ticket.createdBy
    ? REPORTER_NAMES[ticket.createdBy] || `User #${ticket.createdBy.slice(
      0,
      8,
    )}`
    : "—";
  const reporterInitials = reporterDisplay
    .split(" ")
    .filter(Boolean)
    .slice(
      0,
      2,
    )
    .map(p => p[0]?.toUpperCase() || "")
    .join("") || "?";

  const priorityStyles: Record<string, {
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
  const priorityLabel = priorityStyles[ticket.priority]?.label ?? ticket.priority;
  const priorityBadgeClass = priorityStyles[ticket.priority]?.className ?? "";

  return (
    <Dialog
      open={!!ticket}
      onOpenChange={open => !open && onClose()}
    >
      <DialogContent className="max-w-xl p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg leading-tight">Manage Ticket</DialogTitle>
          <DialogDescription className="text-xs mt-1">
            Review the ticket details, respond to the reporter, and update the status or escalate as needed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="escalate">Escalate</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent
              value="details"
              className="space-y-5 mt-5"
            >
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
                      className={priorityBadgeClass}
                    >
                      {priorityLabel}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Channel</Label>
                  <p className="text-sm font-medium capitalize">{ticket.contextType}</p>
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
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Issue Description
                </Label>
                <p className="text-sm p-3 rounded-lg bg-muted/50 leading-relaxed">{ticket.description}</p>
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <Paperclip className="h-3 w-3" />
                  Attachments (
                  {demoAttachments.length}
                  )
                </Label>
                {demoAttachments.length === 0
                  ? (
                      <div className="text-xs text-muted-foreground p-3 rounded-lg border border-dashed text-center">
                        No images or documents attached to this ticket.
                      </div>
                    )
                  : (
                      <>
                        {demoAttachments.some(a => a.type === "image") && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {demoAttachments
                              .filter(a => a.type === "image")
                              .map(att => (
                                <a
                                  key={att.name}
                                  href="#"
                                  onClick={e => e.preventDefault()}
                                  className="group relative block aspect-video overflow-hidden rounded-md border bg-muted"
                                >
                                  <div className="flex h-full w-full items-center justify-center">
                                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                  <div className="absolute inset-x-0 bottom-0 truncate bg-background/80 px-2 py-1 text-[10px]">
                                    {att.name}
                                  </div>
                                </a>
                              ))}
                          </div>
                        )}
                        {demoAttachments.some(a => a.type !== "image") && (
                          <div className="grid grid-cols-2 gap-2">
                            {demoAttachments
                              .filter(a => a.type !== "image")
                              .map(att => (
                                <div
                                  key={att.name}
                                  className="flex items-center gap-2 p-2.5 rounded-lg border bg-card"
                                >
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium truncate">{att.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{att.size}</p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </>
                    )}
              </div>

              {/* Status action bar — placed after attachments per design */}
              <div className="flex flex-col gap-2 p-4 rounded-lg border bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Update Ticket Status
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Change the workflow stage of this ticket.
                  </p>
                </div>
                <Select
                  value={ticket.status}
                  onValueChange={v => handleStatusChange(v as TicketStatus)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-full sm:w-52 h-9 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(opt => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Context Snapshot */}
              {ticket.contextSnapshot && Object.keys(ticket.contextSnapshot).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Context Snapshot
                  </Label>
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(ticket.contextSnapshot).map(([
                        key,
                        value,
                      ]) => (
                        <div key={key}>
                          <span className="text-muted-foreground capitalize">
                            {key.replace(
                              /_/g,
                              " ",
                            )}
                            :
                            {" "}
                          </span>
                          <span className="text-foreground font-medium">{String(value) || "N/A"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Escalation Info */}
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
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent
              value="messages"
              className="mt-5 space-y-4"
            >
              <div>
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Conversation
                </Label>
                <ScrollArea className="h-72 mt-2 pr-4 rounded-lg border bg-muted/20 p-3">
                  {isLoading
                    ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      )
                    : messages.length === 0
                      ? (
                          <div className="text-center py-8 text-sm text-muted-foreground">
                            No messages yet.
                          </div>
                        )
                      : (
                          <div className="space-y-3">
                            {messages.map((msg) => {
                              const isOwn = msg.senderId === user?.id;
                              return (
                                <div
                                  key={msg.id}
                                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                                >
                                  <div
                                    className={`max-w-[80%] p-3 rounded-lg ${
                                      msg.isInternal
                                        ? "bg-chart-5/10 border border-chart-5/20"
                                        : isOwn
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-card border"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <User className="h-3 w-3" />
                                      <span className="text-xs font-medium">
                                        {msg.senderName || "Unknown"}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] py-0"
                                      >
                                        {msg.senderRole}
                                      </Badge>
                                      {msg.isInternal && (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] py-0 border-chart-5 text-chart-5"
                                        >
                                          <Lock className="h-2 w-2 mr-1" />
                                          Internal
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm">{msg.message}</p>
                                    <p className="text-[10px] opacity-70 mt-1">
                                      {formatWithPattern(
                                        msg.createdAt,
                                        "MMM d, h:mm a",
                                      )}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                </ScrollArea>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Reply to Tenant
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="internal"
                    checked={isInternal}
                    onChange={e => setIsInternal(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label
                    htmlFor="internal"
                    className="text-sm flex items-center gap-1 font-normal"
                  >
                    <Lock className="h-3 w-3" />
                    Mark as internal note (not visible to tenant)
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="self-end"
                  >
                    {isSending
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

            {/* Escalate Tab */}
            <TabsContent
              value="escalate"
              className="space-y-4 mt-5"
            >
              {ticket.escalatedTo
                ? (
                    <div className="p-4 rounded-lg border border-chart-5/50 bg-chart-5/5 text-center">
                      <AlertTriangle className="h-8 w-8 mx-auto text-chart-5 mb-2" />
                      <p className="font-medium">Already Escalated</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        This ticket was escalated to
                        {" "}
                        {ticket.escalatedTo.replace(
                          /_/g,
                          " ",
                        )}
                        {ticket.escalatedAt && (
                          <>
                            {" "}
                            {formatRelative(ticket.escalatedAt)}
                          </>
                        )}
                      </p>
                    </div>
                  )
                : (
                    <>
                      <div className="p-3 rounded-lg bg-muted/50 text-sm">
                        Escalate this ticket when it requires action from an external party.
                        The tenant will see the escalation status but cannot escalate directly.
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="escalate-target">
                          Escalate To
                          <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={escalateTo}
                          onValueChange={v => setEscalateTo(v as EscalationType)}
                        >
                          <SelectTrigger id="escalate-target">
                            <SelectValue placeholder="Select escalation target" />
                          </SelectTrigger>
                          <SelectContent>
                            {escalationOptions.map(opt => (
                              <SelectItem
                                key={opt.value}
                                value={opt.value}
                              >
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="escalate-ref">
                          External Reference ID
                          <span className="text-muted-foreground font-normal">(optional)</span>
                        </Label>
                        <Input
                          id="escalate-ref"
                          placeholder="e.g., Fonu ticket #12345"
                          value={referenceId}
                          onChange={e => setReferenceId(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="escalate-notes">
                          Escalation Notes
                          <span className="text-muted-foreground font-normal">(optional)</span>
                        </Label>
                        <Textarea
                          id="escalate-notes"
                          placeholder="Internal notes about the escalation..."
                          value={escalationNotes}
                          onChange={e => setEscalationNotes(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <Button
                        className="w-full"
                        variant="destructive"
                        onClick={handleEscalate}
                        disabled={!escalateTo || isUpdating}
                      >
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Escalate Ticket
                      </Button>
                    </>
                  )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
