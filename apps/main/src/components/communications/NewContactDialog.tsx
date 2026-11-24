import {
  Loader2, MessageSquare, Phone,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";

const contactSchema = z.object({
  name: z.string().trim().min(
    1,
    "Name required",
  ).max(100),
  phone: z
    .string()
    .trim()
    .regex(
      /^\+?[0-9\s-]{7,20}$/,
      "Invalid phone number",
    ),
});

export type Channel = "whatsapp" | "sms" | "voice";

type NewContactDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    name: string;
    phone: string;
    channels: Channel[];
  }) => Promise<void> | void;
};

export function NewContactDialog({
  open, onOpenChange, onSubmit,
}: NewContactDialogProps) {
  const [
    name,
    setName,
  ] = useState("");
  const [
    phone,
    setPhone,
  ] = useState("");
  const [
    channels,
    setChannels,
  ] = useState<Record<Channel, boolean>>({
    whatsapp: true,
    sms: false,
    voice: false,
  });
  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const reset = () => {
    setName("");
    setPhone("");
    setChannels({
      whatsapp: true, sms: false, voice: false,
    });
  };

  const toggleChannel = (c: Channel) =>
    setChannels(prev => ({
      ...prev, [c]: !prev[c],
    }));

  const handleSubmit = async () => {
    const parsed = contactSchema.safeParse({
      name, phone,
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Invalid input");
      return;
    }
    const selected = (Object.keys(channels) as Channel[]).filter(c => channels[c]);
    if (selected.length === 0) {
      toast.error("Select at least one channel");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name: parsed.data.name,
        phone: parsed.data.phone,
        channels: selected,
      });
      reset();
      onOpenChange(false);
    }
    catch {
      // toast handled by caller
    }
    finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!submitting)
          onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Contact</DialogTitle>
          <DialogDescription>
            Start a new conversation. WhatsApp uses the recipient's WhatsApp number.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="contact-name"
              required
            >
              Full name
            </Label>
            <Input
              id="contact-name"
              placeholder="e.g. Adaeze Okonkwo"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="contact-phone"
              required
            >
              Phone number
            </Label>
            <Input
              id="contact-phone"
              placeholder="+234 801 234 5678"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground">
              Include country code. WhatsApp uses this same number.
            </p>
          </div>

          <div className="space-y-2">
            <Label required>Channels</Label>
            <div className="space-y-2 rounded-md border border-border p-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={channels.whatsapp}
                  onCheckedChange={() => toggleChannel("whatsapp")}
                />
                <WhatsAppIcon className="h-4 w-4 text-success" />
                <span className="text-sm">WhatsApp</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={channels.sms}
                  onCheckedChange={() => toggleChannel("sms")}
                />
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-sm">SMS</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={channels.voice}
                  onCheckedChange={() => toggleChannel("voice")}
                />
                <Phone className="h-4 w-4 text-warning" />
                <span className="text-sm">Voice call</span>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Contact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
