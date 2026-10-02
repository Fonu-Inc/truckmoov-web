import type { SystemTenant } from "@truckmoov/api/auth";
import { useUpdateTenantStatus } from "@truckmoov/api/auth";
import { useState } from "react";
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
import { Label } from "@/components/shadcn/label";
import { Textarea } from "@/components/shadcn/textarea";
import { invalidateEnforcement } from "./enforcementModel";
import { errorMessage } from "./paymentsAccessModel";

const MAX_NOTE = 500;
const MIN_NOTE = 5;

export function RestoreAccessDialog({
  tenant,
  onClose,
}: {
  tenant: SystemTenant | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!tenant} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        {tenant ? <RestoreForm key={tenant.id} tenant={tenant} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function RestoreForm({ tenant, onClose }: { tenant: SystemTenant; onClose: () => void }) {
  const [note, setNote] = useState("");
  const mutation = useUpdateTenantStatus();
  const trimmed = note.trim();
  const noteValid = trimmed.length === 0 || trimmed.length >= MIN_NOTE;

  const submit = () =>
    mutation.mutate(
      { id: tenant.id, data: { status: "active", ...(trimmed ? { reason: trimmed } : {}) } },
      {
        onSuccess: () => {
          invalidateEnforcement();
          toast.success(`${tenant.name} can use the portal and API again`);
          onClose();
        },
        onError: err => toast.error(errorMessage(err)),
      },
    );

  return (
    <>
      <DialogHeader>
        <DialogTitle>{`Restore access for ${tenant.name}?`}</DialogTitle>
        <DialogDescription>
          Users can sign in again, devices resume sending data, SIMs are marked active in our system, and share links work again. If this was a suspension for an unpaid bill, the unpaid amount is waived from automatic suspension until a new due date.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor="restore-note">Note (optional)</Label>
        <Textarea
          id="restore-note"
          value={note}
          maxLength={MAX_NOTE}
          placeholder="For example: payment received"
          onChange={e => setNote(e.target.value)}
        />
        {!noteValid && <p className="text-xs text-destructive">{`A note needs at least ${MIN_NOTE} characters.`}</p>}
      </div>
      <DialogFooter>
        <Button variant="outline" disabled={mutation.isPending} onClick={onClose}>Cancel</Button>
        <Button disabled={!noteValid || mutation.isPending} onClick={submit}>
          {mutation.isPending ? "Restoring..." : "Restore access"}
        </Button>
      </DialogFooter>
    </>
  );
}
