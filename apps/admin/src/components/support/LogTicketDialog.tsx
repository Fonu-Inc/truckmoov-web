import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Textarea } from "@/components/shadcn/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  useSupportTickets,
  TicketCategory,
  ContextType,
  TicketPriority,
} from "@/hooks/useSupportTickets";
import { useAuthStore } from "@/stores/authStore";
import { Loader2, Ticket, UploadCloud, X, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface LogTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CHANNELS: { value: ContextType; label: string }[] = [
  { value: "device", label: "Device & Tracking" },
  { value: "sim", label: "SIM & Connectivity" },
  { value: "vehicle", label: "Vehicle" },
  { value: "whatsapp", label: "Messaging (WhatsApp / SMS)" },
  { value: "billing", label: "Billing & Wallet" },
  { value: "none", label: "Other" },
];

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "device_tracking", label: "Device & Tracking" },
  { value: "sim_connectivity", label: "SIM & Connectivity" },
  { value: "messaging", label: "Messaging" },
  { value: "billing", label: "Billing" },
  { value: "account_access", label: "Account / Access" },
  { value: "other", label: "Other" },
];

const ACCEPTED_TYPES = "image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls";
const MAX_FILE_MB = 10;

export function LogTicketDialog({ open, onOpenChange, onSuccess }: LogTicketDialogProps) {
  const { user } = useAuthStore();
  const { createTicket } = useSupportTickets();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<ContextType>("device");
  const [otherChannel, setOtherChannel] = useState("");
  const [category, setCategory] = useState<TicketCategory>("device_tracking");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const reporterName =
    user?.name || user?.email || "Current user";

  const reset = () => {
    setTitle("");
    setMessage("");
    setChannel("device");
    setOtherChannel("");
    setCategory("device_tracking");
    setPriority("medium");
    setAttachments([]);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const valid: File[] = [];
    Array.from(files).forEach((f) => {
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        toast.error(`${f.name} exceeds ${MAX_FILE_MB}MB`);
        return;
      }
      valid.push(f);
    });
    setAttachments((prev) => [...prev, ...valid].slice(0, 8));
  };

  const removeFile = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (channel === "none" && !otherChannel.trim()) {
      toast.error("Please specify the other channel");
      return;
    }

    setIsSubmitting(true);
    try {
      const ticket = await createTicket({
        category,
        subject: title.trim(),
        description: message.trim(),
        priority,
        contextType: channel,
        contextSnapshot: {
          channel_label:
            channel === "none"
              ? otherChannel.trim()
              : CHANNELS.find((c) => c.value === channel)?.label,
          attachments: attachments.map((f) => ({
            name: f.name,
            size: f.size,
            type: f.type,
          })),
        },
      });

      if (ticket) {
        toast.success("Ticket logged successfully");
        reset();
        onOpenChange(false);
        onSuccess?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Log a Ticket</DialogTitle>
          <DialogDescription className="text-xs">
            Submit a new support ticket with details about your issue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="ticket-title" className="text-xs">Ticket title *</Label>
            <Input
              id="ticket-title"
              placeholder="Short summary of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              className="h-9"
            />
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label htmlFor="ticket-message" className="text-xs">Message *</Label>
            <Textarea
              id="ticket-message"
              placeholder="Describe what happened, when it started, and any steps to reproduce."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={2000}
              className="text-sm"
            />
          </div>

          {/* Reporter */}
          <div className="space-y-1.5">
            <Label className="text-xs">Reporter</Label>
            <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                {reporterName.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm">{reporterName}</span>
            </div>
          </div>

          {/* Channel + Category */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ticket-channel">Channel *</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as ContextType)}>
                <SelectTrigger id="ticket-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {channel === "none" && (
                <Input
                  placeholder="Specify other channel..."
                  value={otherChannel}
                  onChange={(e) => setOtherChannel(e.target.value)}
                  maxLength={60}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-category">Category *</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as TicketCategory)}
              >
                <SelectTrigger id="ticket-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="ticket-priority">Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
              <SelectTrigger id="ticket-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-6 cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <UploadCloud className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Drag & drop files here, or{" "}
                <span className="text-primary font-medium">browse</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Images and documents up to {MAX_FILE_MB}MB each (max 8 files)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {attachments.length > 0 && (
              <ul className="space-y-1.5">
                {attachments.map((file, idx) => {
                  const isImage = file.type.startsWith("image/");
                  return (
                    <li
                      key={`${file.name}-${idx}`}
                      className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
                    >
                      {isImage ? (
                        <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="truncate flex-1">{file.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {(file.size / 1024).toFixed(0)} KB
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(idx);
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} size="sm">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Ticket className="h-4 w-4 mr-2" />
            )}
            Submit Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



