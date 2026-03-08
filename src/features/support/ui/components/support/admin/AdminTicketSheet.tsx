import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  SupportTicket, 
  useSupportMessages, 
  useSupportTickets,
  TicketStatus, 
  EscalationType 
} from "@/hooks/useSupportTickets";
import { useAuthStore } from "@/stores/authStore";
import { formatDistanceToNow, format } from "date-fns";
import { 
  Send, 
  Loader2, 
  User, 
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Lock
} from "lucide-react";

interface AdminTicketSheetProps {
  ticket: SupportTicket | null;
  onClose: () => void;
}

const statusOptions: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_on_tenant", label: "Waiting on Tenant" },
  { value: "escalated", label: "Escalated" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const escalationOptions: { value: EscalationType; label: string }[] = [
  { value: "truckmoov_internal", label: "Truckmoov Internal" },
  { value: "fonu_connectivity", label: "Fonu Connectivity" },
  { value: "vendor_installer", label: "Vendor / Installer" },
];

export function AdminTicketSheet({ ticket, onClose }: AdminTicketSheetProps) {
  const { user } = useAuthStore();
  const { updateTicketStatus, escalateTicket, refetch } = useSupportTickets();
  const { messages, isLoading, sendMessage } = useSupportMessages(ticket?.id || null);
  
  const [newMessage, setNewMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Escalation form
  const [escalateTo, setEscalateTo] = useState<EscalationType | "">("");
  const [referenceId, setReferenceId] = useState("");
  const [escalationNotes, setEscalationNotes] = useState("");

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setIsSending(true);
    const success = await sendMessage(newMessage.trim(), isInternal);
    if (success) {
      setNewMessage("");
      setIsInternal(false);
    }
    setIsSending(false);
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    setIsUpdating(true);
    await updateTicketStatus(ticket.id, newStatus);
    await refetch();
    setIsUpdating(false);
  };

  const handleEscalate = async () => {
    if (!ticket || !escalateTo) return;
    setIsUpdating(true);
    await escalateTicket(ticket.id, escalateTo, referenceId || undefined, escalationNotes || undefined);
    await refetch();
    setEscalateTo("");
    setReferenceId("");
    setEscalationNotes("");
    setIsUpdating(false);
  };

  if (!ticket) return null;

  return (
    <Sheet open={!!ticket} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-lg">{ticket.subject}</SheetTitle>
              <SheetDescription className="text-xs">
                #{ticket.id.slice(0, 8)} • Tenant: {ticket.tenantId.slice(0, 8)}...
              </SheetDescription>
            </div>
            <Select
              value={ticket.status}
              onValueChange={(v) => handleStatusChange(v as TicketStatus)}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SheetHeader>

        <Tabs defaultValue="details" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="escalate">Escalate</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <p className="text-sm font-medium capitalize">{ticket.category.replace(/_/g, " ")}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Priority</Label>
                <p className="text-sm font-medium capitalize">{ticket.priority}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="text-sm">{format(new Date(ticket.createdAt), "PPp")}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Context Type</Label>
                <p className="text-sm font-medium capitalize">{ticket.contextType}</p>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <p className="text-sm mt-1 p-3 rounded-lg bg-muted/50">{ticket.description}</p>
            </div>

            {/* Context Snapshot */}
            {ticket.contextSnapshot && Object.keys(ticket.contextSnapshot).length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Context Snapshot</Label>
                <div className="mt-1 p-3 rounded-lg border bg-card">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(ticket.contextSnapshot).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}: </span>
                        <span className="text-foreground">{String(value) || "N/A"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Escalation Info */}
            {ticket.escalatedTo && (
              <div className="p-3 rounded-lg border border-destructive/50 bg-destructive/5">
                <div className="flex items-center gap-2 text-sm text-destructive mb-2">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="font-medium">
                    Escalated to {ticket.escalatedTo.replace(/_/g, " ")}
                  </span>
                </div>
                {ticket.escalatedReferenceId && (
                  <p className="text-xs">Reference ID: {ticket.escalatedReferenceId}</p>
                )}
                {ticket.escalationNotes && (
                  <p className="text-xs mt-1">{ticket.escalationNotes}</p>
                )}
                {ticket.escalatedAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Escalated {formatDistanceToNow(new Date(ticket.escalatedAt), { addSuffix: true })}
                  </p>
                )}
              </div>
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="mt-4">
            <ScrollArea className="h-80 pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No messages yet.
                </div>
              ) : (
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
                              : "bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-3 w-3" />
                            <span className="text-xs font-medium">
                              {msg.senderName || "Unknown"}
                            </span>
                            <Badge variant="outline" className="text-[10px] py-0">
                              {msg.senderRole}
                            </Badge>
                            {msg.isInternal && (
                              <Badge variant="outline" className="text-[10px] py-0 border-chart-5 text-chart-5">
                                <Lock className="h-2 w-2 mr-1" />
                                Internal
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-[10px] opacity-70 mt-1">
                            {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="internal"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="internal" className="text-sm flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Internal note (not visible to tenant)
                </Label>
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Escalate Tab */}
          <TabsContent value="escalate" className="space-y-4 mt-4">
            {ticket.escalatedTo ? (
              <div className="p-4 rounded-lg border border-chart-5/50 bg-chart-5/5 text-center">
                <AlertTriangle className="h-8 w-8 mx-auto text-chart-5 mb-2" />
                <p className="font-medium">Already Escalated</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This ticket was escalated to {ticket.escalatedTo.replace(/_/g, " ")}
                  {ticket.escalatedAt && (
                    <> {formatDistanceToNow(new Date(ticket.escalatedAt), { addSuffix: true })}</>
                  )}
                </p>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm">
                    Escalate this ticket when it requires action from an external party.
                    The tenant will see the escalation status but cannot escalate directly.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Escalate To *</Label>
                    <Select value={escalateTo} onValueChange={(v) => setEscalateTo(v as EscalationType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select escalation target" />
                      </SelectTrigger>
                      <SelectContent>
                        {escalationOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>External Reference ID (optional)</Label>
                    <Input
                      placeholder="e.g., Fonu ticket #12345"
                      value={referenceId}
                      onChange={(e) => setReferenceId(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Escalation Notes (optional)</Label>
                    <Textarea
                      placeholder="Internal notes about the escalation..."
                      value={escalationNotes}
                      onChange={(e) => setEscalationNotes(e.target.value)}
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
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
