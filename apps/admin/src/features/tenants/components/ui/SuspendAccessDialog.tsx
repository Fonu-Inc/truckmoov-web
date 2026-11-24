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
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Textarea } from "@/components/shadcn/textarea";
import {
  errorMessage, invalidateEnforcement, plural,
} from "@/features/tenants/utils/suspendAccess";

const MIN_REASON = 5;
const MAX_REASON = 500;

function ImpactPreview({ tenant }: { tenant: SystemTenant }) {
  return (
    <ul className="list-disc space-y-1 rounded-lg bg-muted/40 py-3 pl-8 pr-4 text-sm text-muted-foreground">
      <li>Everyone is signed out. The portal and API are blocked.</li>
      <li>
        {`Their ${plural(
          tenant.deviceCount,
          "device",
        )} stop sending data to the platform. Devices stay on their vehicles.`}
      </li>
      <li>
        {`Their ${plural(
          tenant.simCount,
          "SIM",
        )} are marked suspended in our system. The mobile network is not told, so the SIMs themselves are not cut off.`}
      </li>
      <li>Share links and API keys stop working.</li>
      <li>Staff must restore this suspension. Paying alone will not lift it. Only suspensions for unpaid bills are restored automatically on payment.</li>
    </ul>
  );
}

export function SuspendAccessDialog({
  tenant,
  onClose,
}: {
  tenant: SystemTenant | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!tenant}
      onOpenChange={open => !open && onClose()}
    >
      <DialogContent>
        {tenant ? (
          <SuspendForm
            key={tenant.id}
            tenant={tenant}
            onClose={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SuspendForm({
  tenant, onClose,
}: {
  tenant: SystemTenant; onClose: () => void;
}) {
  const [
    reason,
    setReason,
  ] = useState("");
  const [
    typedName,
    setTypedName,
  ] = useState("");
  const mutation = useUpdateTenantStatus();
  const trimmed = reason.trim();
  const reasonValid = trimmed.length >= MIN_REASON && trimmed.length <= MAX_REASON;
  const nameMatches = typedName.trim().toLowerCase() === tenant.name.trim().toLowerCase();

  const submit = () =>
    mutation.mutate(
      {
        id: tenant.id, data: {
          status: "suspended", reason: trimmed,
        },
      },
      {
        onSuccess: () => {
          invalidateEnforcement();
          toast.success(`${tenant.name} is suspended`);
          onClose();
        },
        onError: err => toast.error(errorMessage(err)),
      },
    );

  return (
    <>
      <DialogHeader>
        <DialogTitle>{`Suspend access for ${tenant.name}?`}</DialogTitle>
        <DialogDescription>This is what will happen.</DialogDescription>
      </DialogHeader>
      <ImpactPreview tenant={tenant} />
      <div className="space-y-2">
        <Label
          htmlFor="suspend-reason"
          required
        >
          Reason (shown to your team)
        </Label>
        <Textarea
          id="suspend-reason"
          value={reason}
          maxLength={MAX_REASON}
          placeholder="For example: invoice unpaid for 30 days"
          onChange={e => setReason(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">{`At least ${MIN_REASON} characters.`}</p>
      </div>
      <div className="space-y-2">
        <Label
          htmlFor="suspend-name"
          required
        >
          {`Type "${tenant.name}" to confirm`}
        </Label>
        <Input
          id="suspend-name"
          value={typedName}
          autoComplete="off"
          onChange={e => setTypedName(e.target.value)}
        />
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          disabled={mutation.isPending}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          disabled={!reasonValid || !nameMatches || mutation.isPending}
          onClick={submit}
        >
          {mutation.isPending ? "Suspending..." : "Suspend access"}
        </Button>
      </DialogFooter>
    </>
  );
}
