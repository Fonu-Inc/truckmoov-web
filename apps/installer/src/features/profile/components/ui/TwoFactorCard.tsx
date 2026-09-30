import type { TwoFactorEnrolment } from "@truckmoov/api/auth";
import {
  useConfirmTwoFactor,
  useDisableTwoFactor,
  useEnrolTwoFactor,
  useTwoFactor,
} from "@truckmoov/api/auth";
import {
  Copy,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { Label } from "@/components/shadcn/label";
import { Skeleton } from "@/components/shadcn/skeleton";

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied.`);
  }
  catch {
    toast.error("Could not copy — the clipboard is not available.");
  }
}

function CopyField({
  label, value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          readOnly
          value={value}
          className="font-mono text-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Copy ${label.toLowerCase()}`}
          onClick={() => copy(
            value,
            label,
          )}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function CodeInput({
  value, onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Input
      value={value}
      onChange={e => onChange(e.target.value.replace(
        /\D/g,
        "",
      ).slice(
        0,
        6,
      ))}
      inputMode="numeric"
      autoComplete="one-time-code"
      placeholder="6-digit code"
      aria-label="Authenticator code"
      className="max-w-40 font-mono tracking-widest"
    />
  );
}

/**
 * TOTP two-factor, off until the installer turns it on. Enrol shows the secret once and confirm
 * shows the recovery codes once, so both live only in this component's state.
 * ponytail: no QR library in the tree — the otpauth URI and secret are copyable instead.
 */
export function TwoFactorCard() {
  const status = useTwoFactor();
  const enrol = useEnrolTwoFactor();
  const confirm = useConfirmTwoFactor();
  const disable = useDisableTwoFactor();
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
    disabling,
    setDisabling,
  ] = useState(false);
  const state = status.data?.data;
  const codeReady = /^\d{6}$/.test(code);

  function start() {
    enrol.mutate(
      undefined,
      {
        onSuccess: (res) => {
          setEnrolment(res.data);
          setCode("");
        },
        onError: error => toast.error(error.message),
      },
    );
  }

  function turnOn() {
    confirm.mutate(
      { data: { code } },
      {
        onSuccess: (res) => {
          setEnrolment(null);
          setRecoveryCodes(res.data.recoveryCodes);
          setCode("");
          toast.success("Two-factor authentication is on.");
        },
        onError: error => toast.error(error.message),
      },
    );
  }

  function turnOff() {
    disable.mutate(
      { data: { code } },
      {
        onSuccess: () => {
          setDisabling(false);
          setCode("");
          toast.success("Two-factor authentication is off.");
        },
        onError: error => toast.error(error.message),
      },
    );
  }

  let body;
  if (status.isLoading) {
    body = <Skeleton className="h-10 w-48" />;
  }
  else if (status.isError || !state) {
    body = <p className="text-sm text-destructive">{status.error?.message ?? "Could not load two-factor status."}</p>;
  }
  else if (recoveryCodes) {
    body = (
      <div className="space-y-3">
        <p className="text-sm font-medium">Save these recovery codes — you won&apos;t see them again.</p>
        <p className="text-xs text-muted-foreground">Each one signs you in once if you lose your authenticator.</p>
        <div className="grid grid-cols-2 gap-2 rounded-xl border p-3 font-mono text-xs sm:grid-cols-4">
          {recoveryCodes.map(c => <span key={c}>{c}</span>)}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => copy(
              recoveryCodes.join("\n"),
              "Recovery codes",
            )}
          >
            <Copy className="h-4 w-4" />
            Copy all
          </Button>
          <Button onClick={() => setRecoveryCodes(null)}>I&apos;ve saved them</Button>
        </div>
      </div>
    );
  }
  else if (enrolment) {
    body = (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Add this account to your authenticator app with the setup link or the secret, then enter the code it shows.
        </p>
        <CopyField
          label="Setup link"
          value={enrolment.otpauthUri}
        />
        <CopyField
          label="Secret"
          value={enrolment.secret}
        />
        <div className="flex flex-wrap items-center gap-2">
          <CodeInput
            value={code}
            onChange={setCode}
          />
          <Button
            disabled={!codeReady}
            loading={confirm.isPending}
            onClick={turnOn}
          >
            Turn on
          </Button>
          <Button
            variant="ghost"
            onClick={() => setEnrolment(null)}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }
  else if (state.enrolled) {
    body = (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {`${state.recoveryCodesRemaining} recovery codes left.`}
        </p>
        {state.requiredByPlatform
          ? <p className="text-xs text-muted-foreground">The platform requires two-factor, so it can&apos;t be turned off.</p>
          : disabling
            ? (
                <div className="flex flex-wrap items-center gap-2">
                  <CodeInput
                    value={code}
                    onChange={setCode}
                  />
                  <Button
                    variant="destructive"
                    disabled={!codeReady}
                    loading={disable.isPending}
                    onClick={turnOff}
                  >
                    Turn off
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setDisabling(false);
                      setCode("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )
            : (
                <Button
                  variant="outline"
                  onClick={() => setDisabling(true)}
                >
                  Turn off two-factor
                </Button>
              )}
      </div>
    );
  }
  else {
    body = (
      <div className="space-y-2">
        {state.pendingConfirmation
          ? <p className="text-xs text-muted-foreground">Setup was started but never confirmed. Start again for a new secret.</p>
          : null}
        <Button
          loading={enrol.isPending}
          onClick={start}
          className="gap-2"
        >
          <ShieldCheck className="h-4 w-4" />
          Set up two-factor
        </Button>
      </div>
    );
  }

  return (
    <Card className="surface-sleek rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Two-factor authentication
          {state?.enrolled
            ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-transparent bg-success/10 text-success"
                >
                  On
                </Badge>
              )
            : null}
        </CardTitle>
        <CardDescription>A code from an authenticator app is asked for at every sign-in.</CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
