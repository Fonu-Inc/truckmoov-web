import type { TwoFactorEnrolment } from "@truckmoov/api/auth";
import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import {
  useConfirmTwoFactor,
  useDisableTwoFactor,
  useEnrolTwoFactor,
  useTwoFactor,
} from "@truckmoov/api/auth";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/shadcn/alert";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { Skeleton } from "@/components/shadcn/skeleton";
import { EnrolmentDetails, RecoveryCodes } from "./TwoFactorParts";
import { cooldownSeconds, useCooldown } from "./twoFactorUtils";

const SIX_DIGITS = /^\d{6}$/;

/**
 * TRU-FE-23 — the two-factor section of every portal's settings. Off until the user turns it on:
 * enrol shows the QR and secret once, confirm returns the recovery codes once, and disable needs a
 * current code. Enrol and recovery codes live only in this component's state.
 */
export function TwoFactorSetupCard({ enrolRequired = false, className }: {
  /** The platform requires two-factor and this account has none yet. */
  enrolRequired?: boolean;
  className?: string;
}) {
  const status = useTwoFactor();
  const enrol = useEnrolTwoFactor();
  const confirm = useConfirmTwoFactor();
  const disable = useDisableTwoFactor();
  const cooldown = useCooldown();
  const [enrolment, setEnrolment] = useState<TwoFactorEnrolment | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [disabling, setDisabling] = useState(false);
  const state = status.data?.data;
  const waiting = cooldown.secondsLeft > 0;
  const canSubmit = SIX_DIGITS.test(code) && !waiting;

  function onCodeError(error: ServerErrorResponse) {
    const wait = cooldownSeconds(error);
    if (wait !== null) {
      cooldown.start(wait);
      setCodeError(null);
      return;
    }
    setCodeError(error.message);
  }

  function reset() {
    setCode("");
    setCodeError(null);
  }

  function start() {
    enrol.mutate(undefined, {
      onSuccess: (res) => {
        setEnrolment(res.data);
        reset();
      },
      onError: error => toast.error(error.message),
    });
  }

  function turnOn() {
    confirm.mutate({ data: { code } }, {
      onSuccess: (res) => {
        setEnrolment(null);
        setRecoveryCodes(res.data.recoveryCodes);
        reset();
        toast.success("Two-factor authentication is on.");
      },
      onError: onCodeError,
    });
  }

  function turnOff() {
    disable.mutate({ data: { code } }, {
      onSuccess: () => {
        setDisabling(false);
        reset();
        toast.success("Two-factor authentication is off.");
      },
      onError: onCodeError,
    });
  }

  const codeRow = (label: string, onSubmit: () => void, pending: boolean, variant: "default" | "destructive", onCancel: () => void) => (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
            setCodeError(null);
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="6-digit code"
          aria-label="Authenticator code"
          disabled={waiting}
          className="max-w-40 font-mono tracking-widest"
        />
        <Button variant={variant} disabled={!canSubmit} loading={pending} onClick={onSubmit}>
          {label}
        </Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
      {codeError ? <p className="text-sm text-destructive">{codeError}</p> : null}
      {waiting
        ? <p role="status" className="text-sm text-destructive">{`Too many wrong codes. Try again in ${cooldown.secondsLeft}s.`}</p>
        : null}
    </div>
  );

  let body;
  if (status.isLoading) {
    body = <Skeleton className="h-10 w-48" />;
  }
  else if (status.isError || !state) {
    body = <p className="text-sm text-destructive">{status.error?.message ?? "Could not load two-factor status."}</p>;
  }
  else if (recoveryCodes) {
    body = <RecoveryCodes codes={recoveryCodes} onDone={() => setRecoveryCodes(null)} />;
  }
  else if (enrolment) {
    body = (
      <div className="space-y-4">
        <EnrolmentDetails enrolment={enrolment} />
        <p className="text-sm text-muted-foreground">Then enter the 6-digit code the app shows.</p>
        {codeRow("Turn on", turnOn, confirm.isPending, "default", () => {
          setEnrolment(null);
          reset();
        })}
      </div>
    );
  }
  else if (state.enrolled) {
    body = (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{`${state.recoveryCodesRemaining} recovery codes left.`}</p>
        {state.requiredByPlatform
          ? <p className="text-xs text-muted-foreground">The platform requires two-factor, so it can&apos;t be turned off.</p>
          : disabling
            ? codeRow("Turn off", turnOff, disable.isPending, "destructive", () => {
                setDisabling(false);
                reset();
              })
            : <Button variant="outline" onClick={() => setDisabling(true)}>Turn off two-factor</Button>}
      </div>
    );
  }
  else {
    body = (
      <div className="space-y-3">
        {enrolRequired || state.requiredByPlatform
          ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Two-factor is required</AlertTitle>
                <AlertDescription>Set it up now to keep using the platform.</AlertDescription>
              </Alert>
            )
          : null}
        {state.pendingConfirmation
          ? <p className="text-xs text-muted-foreground">Setup was started but never confirmed. Start again for a new secret.</p>
          : null}
        <Button loading={enrol.isPending} onClick={start} className="gap-2">
          <ShieldCheck className="h-4 w-4" />
          Set up two-factor
        </Button>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Two-factor authentication
          {state?.enrolled
            ? <Badge variant="outline" className="rounded-full border-transparent bg-success/10 text-success">On</Badge>
            : null}
        </CardTitle>
        <CardDescription>A code from an authenticator app is asked for at every sign-in.</CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
