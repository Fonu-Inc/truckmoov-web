import {
  Loader2, Mail, Paperclip,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Textarea } from "@/components/shadcn/textarea";

type SendInvoiceEmailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string | null;
  totalAmount: string;
  hasPdf: boolean;
  onSend: (data: {
    recipientEmail: string; recipientName: string; subject: string; message: string;
  }) => Promise<boolean>;
};

export function SendInvoiceEmailDialog({
  open,
  onOpenChange,
  invoiceNumber,
  customerName,
  customerEmail,
  totalAmount,
  hasPdf,
  onSend,
}: SendInvoiceEmailDialogProps) {
  const [
    recipientEmail,
    setRecipientEmail,
  ] = useState(customerEmail || "");
  const [
    recipientName,
    setRecipientName,
  ] = useState(customerName || "");
  const [
    subject,
    setSubject,
  ] = useState("");
  const [
    message,
    setMessage,
  ] = useState("");
  const [
    sending,
    setSending,
  ] = useState(false);

  const handleSend = async () => {
    if (!recipientEmail)
      return;
    setSending(true);
    const success = await onSend({
      recipientEmail, recipientName, subject, message,
    });
    setSending(false);
    if (success) {
      onOpenChange(false);
      // Reset form
      setSubject("");
      setMessage("");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Invoice via Email
          </DialogTitle>
          <DialogDescription>
            Send invoice
            {" "}
            <strong>{invoiceNumber}</strong>
            {" "}
            (
            {totalAmount}
            ) to the recipient.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Recipient Email *</Label>
            <Input
              type="email"
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              placeholder="customer@example.com"
            />
          </div>
          <div>
            <Label>Recipient Name</Label>
            <Input
              value={recipientName}
              onChange={e => setRecipientName(e.target.value)}
              placeholder="Customer name"
            />
          </div>
          <div>
            <Label>Subject (optional)</Label>
            <Input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder={`Invoice ${invoiceNumber}`}
            />
          </div>
          <div>
            <Label>Custom Message (optional)</Label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Add a personal message..."
              rows={3}
            />
          </div>
          {hasPdf && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Paperclip className="h-3.5 w-3.5" />
              <span>PDF invoice will be attached</span>
              <Badge
                variant="outline"
                className="text-xs"
              >
                PDF
              </Badge>
            </div>
          )}
          {!hasPdf && (
            <p className="text-xs text-muted-foreground">
              No PDF generated yet. The email will include invoice details inline. Generate a PDF first for a better experience.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || !recipientEmail}
          >
            {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
            {sending ? "Sending…" : "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
