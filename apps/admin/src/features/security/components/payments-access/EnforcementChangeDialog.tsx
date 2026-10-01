import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Label } from "@/components/shadcn/label";
import { Textarea } from "@/components/shadcn/textarea";

const MIN_REASON = 5;
const MAX_REASON = 500;

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  pending: boolean;
  blocked?: boolean;
  children?: ReactNode;
  onConfirm: (reason: string) => void;
  onClose: () => void;
};

function ChangeForm(props: Props) {
  const [reason, setReason] = useState("");
  const trimmed = reason.trim();
  const valid = trimmed.length >= MIN_REASON && trimmed.length <= MAX_REASON;
  return (
    <>
      <DialogHeader>
        <DialogTitle>{props.title}</DialogTitle>
        <DialogDescription>{props.description}</DialogDescription>
      </DialogHeader>
      {props.children}
      <div className="space-y-2">
        <Label htmlFor="enforcement-reason">Reason (kept in the audit log)</Label>
        <Textarea
          id="enforcement-reason"
          value={reason}
          maxLength={MAX_REASON}
          placeholder="For example: owner approved go-live"
          onChange={e => setReason(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">{`At least ${MIN_REASON} characters.`}</p>
      </div>
      <DialogFooter>
        <Button variant="outline" disabled={props.pending} onClick={props.onClose}>Cancel</Button>
        <Button
          variant={props.destructive ? "destructive" : "default"}
          disabled={!valid || props.pending || props.blocked}
          onClick={() => props.onConfirm(trimmed)}
        >
          {props.pending ? "Saving..." : props.confirmLabel}
        </Button>
      </DialogFooter>
    </>
  );
}

export function EnforcementChangeDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={open => !open && props.onClose()}>
      <DialogContent>{props.open ? <ChangeForm {...props} /> : null}</DialogContent>
    </Dialog>
  );
}
