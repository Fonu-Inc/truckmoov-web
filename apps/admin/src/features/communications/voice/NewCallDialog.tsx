import type { VoiceLanguage } from "@truckmoov/api/notification";
import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";
import { LANGUAGES } from "./voiceDisplay";
import { useVoiceActions } from "./useVoiceActions";

export function NewCallDialog({ onClose }: { onClose: () => void }) {
  const [to, setTo] = useState("");
  const [name, setName] = useState("");
  const [language, setLanguage] = useState<VoiceLanguage>("en");
  const [message, setMessage] = useState("");
  const [record, setRecord] = useState(true);
  const { call } = useVoiceActions(onClose);
  const validNumber = to.replace(/\D/g, "").length >= 8;

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Place a call</DialogTitle>
          <DialogDescription>The platform calls the number and speaks the message if you write one.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="call-to">Phone number</Label>
            <Input id="call-to" inputMode="tel" placeholder="2348012345678" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="call-name">Name (optional)</Label>
            <Input id="call-name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Language</Label>
            <Select value={language} onValueChange={next => setLanguage(next as VoiceLanguage)}>
              <SelectTrigger aria-label="Language"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(item => <SelectItem key={item.code} value={item.code}>{item.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="call-message">Spoken message (optional)</Label>
            <Textarea id="call-message" rows={3} maxLength={500} value={message} onChange={e => setMessage(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={record} onCheckedChange={checked => setRecord(checked === true)} />
            Record the call
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!validNumber} loading={call.isPending} onClick={() => call.mutate({ to, contact_name: name.trim() || undefined, language, message: message.trim() || undefined, record })}>
            Call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
