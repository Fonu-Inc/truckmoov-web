import type { MailAddress } from "@truckmoov/api/auth";
import { Paperclip, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
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
import { Textarea } from "@/components/shadcn/textarea";
import { MAX_ATTACHMENT_BYTES, formatBytes, parseAddresses } from "./emailLogic";
import { useEmailActions } from "./useEmailActions";

type Props = {
  to?: MailAddress[];
  subject?: string;
  replyToThreadId?: string;
  onClose: () => void;
};

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function EmailComposeDialog({ to = [], subject = "", replyToThreadId, onClose }: Props) {
  const [recipients, setRecipients] = useState(to.map(a => a.address).join(", "));
  const [cc, setCc] = useState("");
  const [title, setTitle] = useState(subject);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const picker = useRef<HTMLInputElement>(null);
  const { send } = useEmailActions(onClose);
  const toList = parseAddresses(recipients);
  const ccList = parseAddresses(cc);
  const invalid = [...toList.invalid, ...ccList.invalid];
  const ready = toList.valid.length > 0 && invalid.length === 0 && title.trim() && body.trim();

  const attach = (picked: FileList | null) => {
    const next = [...files, ...Array.from(picked ?? [])];
    if (next.reduce((total, file) => total + file.size, 0) > MAX_ATTACHMENT_BYTES)
      toast.error(`Attachments can total at most ${formatBytes(MAX_ATTACHMENT_BYTES)}.`);
    else
      setFiles(next);
  };

  const submit = async () => {
    const attachments = await Promise.all(files.map(async file => ({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      content: await toBase64(file),
    }))).catch(() => null);
    if (!attachments) {
      toast.error("An attachment could not be read.");
      return;
    }
    send.mutate({
      to: toList.valid,
      cc: ccList.valid.length > 0 ? ccList.valid : undefined,
      subject: title.trim(),
      bodyText: body,
      replyToThreadId,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
  };

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{replyToThreadId ? "Reply" : "New email"}</DialogTitle>
          <DialogDescription>Sent from the platform mailbox and filed to its Sent folder.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="mail-to">To</Label>
            <Input id="mail-to" placeholder="name@example.com, other@example.com" value={recipients} onChange={e => setRecipients(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="mail-cc">Cc</Label>
            <Input id="mail-cc" value={cc} onChange={e => setCc(e.target.value)} />
          </div>
          {invalid.length > 0 && <p className="text-xs text-destructive">{`Not an email address: ${invalid.join(", ")}`}</p>}
          <div className="space-y-1">
            <Label htmlFor="mail-subject">Subject</Label>
            <Input id="mail-subject" maxLength={998} value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="mail-body">Message</Label>
            <Textarea id="mail-body" rows={10} value={body} onChange={e => setBody(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => picker.current?.click()}>
              <Paperclip className="h-3.5 w-3.5" />
              Attach
            </Button>
            <input ref={picker} type="file" multiple hidden onChange={(e) => { attach(e.target.files); e.target.value = ""; }} />
            {files.map(file => (
              <span key={`${file.name}:${file.size}`} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs">
                {`${file.name} (${formatBytes(file.size)})`}
                <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles(files.filter(f => f !== file))}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!ready} loading={send.isPending} onClick={() => void submit()}>Send</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
