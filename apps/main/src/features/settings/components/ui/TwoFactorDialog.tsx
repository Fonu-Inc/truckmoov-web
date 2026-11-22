import type { TwoFactorEnrolment } from "@truckmoov/api/auth";
import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import {
  useConfirmTwoFactor, useDisableTwoFactor, useEnrolTwoFactor,
} from "@truckmoov/api/auth";
import {
  EnrolmentDetails, RecoveryCodes,
} from "@truckmoov/reusables/components/auth/TwoFactorParts";
import {
  cooldownSeconds, useCooldown,
} from "@truckmoov/reusables/components/auth/twoFactorUtils";
import { Loader2 } from "lucide-react";
import {
  useEffect, useRef, useState,
} from "react";
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

export type TwoFactorDialogMode = "enable" | "disable";

const SIX_DIGITS = /^\d{6}$/;

/**
 * Two-factor setup or removal, opened from the Organization tab's switch.
 *
 * Enable: starts enrolment on open (QR + secret), confirms with a 6-digit code,
 * then shows the recovery codes once. Closing before the code is confirmed
 * leaves two-factor off, so the switch falls back to off.
 * Disable: asks for a current code; cancelling leaves two-factor on.
 *
 * Same API calls as `TwoFactorSetupCard` on /settings/security; each mutation
 * invalidates the two-factor status, which is what the switch reads.
 */
export function TwoFactorDialog({
  mode, onClose,
}: {
  /** `null` = closed. */
  mode: TwoFactorDialogMode | null;
  onClose: () => void;
}) {
  const enrol = useEnrolTwoFactor();
  const confirm = useConfirmTwoFactor();
  const disable = useDisableTwoFactor();
  const cooldown = useCooldown();
  const [
    enrolment,
    setEnrolment,
  ] = useState<TwoFactorEnrolment | null>(null);
  const [
    recoveryCodes,
    setRecoveryCodes,
  ] = useState<string[] | null>(null);
  const [
    code,
    setCode,
  ] = useState("");
  const [
    codeError,
    setCodeError,
  ] = useState<string | null>(null);

  const open = mode !== null;
  const waiting = cooldown.secondsLeft > 0;
  const canSubmit = SIX_DIGITS.test(code) && !waiting;
  const enrolMutate = enrol.mutate;

  // A fresh secret each time the enable dialog opens; state is dropped on close.
  // The ref keeps it to one enrol call per open (StrictMode re-runs effects, and
  // a second secret would no longer match the QR code on screen).
  const enrolStarted = useRef(false);
  useEffect(
    () => {
      if (mode !== "enable" || enrolStarted.current)
        return;
      enrolStarted.current = true;
      enrolMutate(
        undefined,
        {
          onSuccess: res => setEnrolment(res.data),
          onError: (error) => {
            toast.error(error.message);
            onClose();
          },
        },
      );
    },
    [
      mode,
      enrolMutate,
      onClose,
    ],
  );

  const handleClose = () => {
    enrolStarted.current = false;
    setEnrolment(null);
    setRecoveryCodes(null);
    setCode("");
    setCodeError(null);
    onClose();
  };

  const onCodeError = (error: ServerErrorResponse) => {
    const wait = cooldownSeconds(error);
    if (wait !== null) {
      cooldown.start(wait);
      setCodeError(null);
      return;
    }
    setCodeError(error.message);
  };

  const turnOn = () => confirm.mutate(
    { data: { code } },
    {
      onSuccess: (res) => {
        setEnrolment(null);
        setRecoveryCodes(res.data.recoveryCodes);
        setCode("");
        toast.success("Two-factor authentication is on.");
      },
      onError: onCodeError,
    },
  );

  const turnOff = () => disable.mutate(
    { data: { code } },
    {
      onSuccess: () => {
        toast.success("Two-factor authentication is off.");
        handleClose();
      },
      onError: onCodeError,
    },
  );

  const codeField = (
    <div className="space-y-2">
      <Input
        value={code}
        onChange={(e) => {
          setCode(e.target.value.replace(
            /\D/g,
            "",
          ).slice(
            0,
            6,
          ));
          setCodeError(null);
        }}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="6-digit code"
        aria-label="Authenticator code"
        disabled={waiting}
        className="max-w-40 font-mono tracking-widest"
      />
      {codeError && <p className="text-sm text-destructive">{codeError}</p>}
      {waiting && (
        <p
          role="status"
          className="text-sm text-destructive"
        >
          {`Too many wrong codes. Try again in ${cooldown.secondsLeft}s.`}
        </p>
      )}
    </div>
  );

  let body;
  let footer = null;
  if (mode === "disable") {
    body = (
      <>
        <p className="text-sm text-muted-foreground">Enter the 6-digit code from your authenticator app to turn two-factor off.</p>
        {codeField}
      </>
    );
    footer = (
      <>
        <Button
          variant="ghost"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          disabled={!canSubmit}
          loading={disable.isPending}
          onClick={turnOff}
        >
          Turn off
        </Button>
      </>
    );
  }
  else if (recoveryCodes) {
    body = (
      <RecoveryCodes
        codes={recoveryCodes}
        onDone={handleClose}
      />
    );
  }
  else if (enrolment) {
    body = (
      <>
        <EnrolmentDetails enrolment={enrolment} />
        <p className="text-sm text-muted-foreground">Then enter the 6-digit code the app shows.</p>
        {codeField}
      </>
    );
    footer = (
      <>
        <Button
          variant="ghost"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button
          disabled={!canSubmit}
          loading={confirm.isPending}
          onClick={turnOn}
        >
          Turn on
        </Button>
      </>
    );
  }
  else {
    body = (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => !next && handleClose()}
    >
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "disable" ? "Turn off two-factor authentication" : "Set up two-factor authentication"}</DialogTitle>
          <DialogDescription>
            {mode === "disable"
              ? "You'll only need your password to sign in afterwards."
              : "Scan the QR code with an authenticator app, or enter the secret by hand."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">{body}</div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
