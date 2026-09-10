import type { TwoFactorEnrolment, TwoFactorState } from "@truckmoov/api/auth";
import {
  useConfirmTwoFactor,
  useDisableTwoFactor,
  useEnrolTwoFactor,
  useTwoFactor,
} from "@truckmoov/api/auth";
import {
  AlertTriangle, CheckCircle2, Copy, KeyRound, Loader2, RotateCcw, ShieldCheck, ShieldOff,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/shadcn/alert";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Skeleton } from "@/components/shadcn/skeleton";

/**
 * TRU-FE-7 § D — per-account TOTP two-factor.
 *
 * ponytail: three states off the /auth/two-factor GET.
 *   - not enrolled  → "Set up 2FA" CTA → enrol returns secret+uri+recoveryCodes ONCE
 *   - pending       → "Enter 6-digit code"; calling enrol again issues a fresh secret (spec recovery)
 *   - enrolled      → "2FA is on" + Turn off (needs current code; 403 while requireTwoFactor)
 *
 * No QR lib in the tree — spec's fallback is copyable otpauthUri + secret. Add a
 * QR image when scanner-only support becomes worth a dep.
 */

const CODE_RE = /^\d{6}$/;

function useCopy() {
  return async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    }
    catch {
      toast.error("Copy failed — clipboard not available");
    }
  };
}

function NotEnrolledCard({
  requiredByPlatform,
  onEnrolled,
}: {
  requiredByPlatform: boolean;
  onEnrolled: (result: TwoFactorEnrolment) => void;
}) {
  const enrol = useEnrolTwoFactor();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Two-factor authentication
        </CardTitle>
        <CardDescription>
          Add a second step to your sign-in with an authenticator app (Google Authenticator, 1Password, Authy).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {requiredByPlatform && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Required by your organization</AlertTitle>
            <AlertDescription>Set up 2FA now to keep using the platform.</AlertDescription>
          </Alert>
        )}
        <Button
          disabled={enrol.isPending}
          onClick={() => enrol.mutate(undefined, {
            onSuccess: (res) => {
              onEnrolled(res.data);
              toast.success("Scan the QR or copy the setup URL");
            },
            onError: err => toast.error(err.message),
          })}
        >
          {enrol.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
          Set up two-factor authentication
        </Button>
      </CardContent>
    </Card>
  );
}

function EnrolmentPanel({
  enrolment, onDone, onStartOver,
}: {
  enrolment: TwoFactorEnrolment;
  onDone: () => void;
  onStartOver: () => void;
}) {
  const copy = useCopy();
  const confirm = useConfirmTwoFactor();
  const [savedCodes, setSavedCodes] = useState(false);
  const [code, setCode] = useState("");
  const canConfirm = savedCodes && CODE_RE.test(code) && !confirm.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          Finish setup
        </CardTitle>
        <CardDescription>
          Add the account to your authenticator app, save the recovery codes, then enter a code to turn 2FA on.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Setup URL + secret. ponytail: no QR lib; render the otpauthUri as copyable text plus the secret fallback. */}
        <div className="space-y-2">
          <Label>Setup URL</Label>
          <div className="flex items-center gap-2">
            <Input readOnly value={enrolment.otpauthUri} className="font-mono text-xs" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copy(enrolment.otpauthUri, "Setup URL")}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Most apps let you paste this to add the account. If not, use the secret below.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Secret (manual entry)</Label>
          <div className="flex items-center gap-2">
            <Input readOnly value={enrolment.secret} className="font-mono text-sm tracking-wider" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copy(enrolment.secret, "Secret")}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Save your recovery codes — you won&apos;t see them again</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>Store these somewhere safe. Each is one-time use.</p>
            <div className="grid grid-cols-2 gap-2 rounded border border-destructive/30 bg-background p-2 font-mono text-xs sm:grid-cols-3">
              {enrolment.recoveryCodes.map(c => <div key={c}>{c}</div>)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copy(enrolment.recoveryCodes.join("\n"), "Recovery codes")}
            >
              <Copy className="mr-2 h-3 w-3" />
              Copy all
            </Button>
          </AlertDescription>
        </Alert>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={savedCodes} onCheckedChange={v => setSavedCodes(v === true)} />
          I&apos;ve saved the recovery codes
        </label>

        <div className="space-y-2">
          <Label>Confirmation code</Label>
          <Input
            value={code}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
              setCode(digits);
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6 digits"
            className="font-mono text-lg tracking-widest"
          />
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={onStartOver}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Start over (new secret)
          </Button>
          <Button
            disabled={!canConfirm}
            onClick={() => confirm.mutate(
              { data: { code } },
              {
                onSuccess: () => {
                  toast.success("Two-factor authentication is on");
                  onDone();
                },
                onError: err => toast.error(err.message),
              },
            )}
          >
            {confirm.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Turn on 2FA
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EnrolledCard({ state }: { state: TwoFactorState }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const disable = useDisableTwoFactor();
  const canSubmit = CODE_RE.test(code) && !disable.isPending;
  const platformLocked = state.requiredByPlatform;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-success" />
          Two-factor authentication
          <Badge variant="outline" className="ml-2 border-success/30 bg-success/10 text-success">On</Badge>
        </CardTitle>
        <CardDescription>
          {state.lastConfirmedAt
            ? `Last confirmed ${new Date(state.lastConfirmedAt).toLocaleString()}.`
            : "Your account is protected with a second step at sign-in."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {platformLocked && (
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Enforced by your organization</AlertTitle>
            <AlertDescription>You can&apos;t turn 2FA off while your organization requires it.</AlertDescription>
          </Alert>
        )}
        <Button
          variant="destructive"
          disabled={platformLocked}
          onClick={() => setOpen(true)}
        >
          <ShieldOff className="mr-2 h-4 w-4" />
          Turn off 2FA
        </Button>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Turn off two-factor authentication</DialogTitle>
            <DialogDescription>Enter a current code from your authenticator app to confirm.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Code</Label>
            <Input
              value={code}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(digits);
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              className="font-mono text-lg tracking-widest"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setOpen(false); setCode(""); }}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!canSubmit}
              onClick={() => disable.mutate(
                { data: { code } },
                {
                  onSuccess: () => {
                    toast.success("Two-factor authentication is off");
                    setOpen(false);
                    setCode("");
                  },
                  onError: err => toast.error(err.message),
                },
              )}
            >
              {disable.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Turn off
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function SecuritySettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const enrolRequired = searchParams.get("enrol") === "required";

  const stateQuery = useTwoFactor();
  // Fail-open: on 404 (endpoint not deployed yet) treat as not enrolled + not required.
  const state: TwoFactorState = useMemo(
    () => stateQuery.data?.data ?? {
      enrolled: false,
      pendingConfirmation: false,
      requiredByPlatform: enrolRequired,
      lastConfirmedAt: null,
    },
    [stateQuery.data, enrolRequired],
  );

  const [enrolment, setEnrolment] = useState<TwoFactorEnrolment | null>(null);

  // Clear the ?enrol=required query once the user has finished enrolling.
  useEffect(() => {
    if (state.enrolled && enrolRequired) {
      const next = new URLSearchParams(searchParams);
      next.delete("enrol");
      setSearchParams(next, { replace: true });
    }
  }, [state.enrolled, enrolRequired, searchParams, setSearchParams]);

  if (stateQuery.isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  // Enrolled — locked in.
  if (state.enrolled) {
    return <EnrolledCard state={state} />;
  }

  // Pending confirmation OR fresh enrolment just returned — same screen.
  const showEnrolmentPanel = enrolment || state.pendingConfirmation;
  if (showEnrolmentPanel && enrolment) {
    return (
      <EnrolmentPanel
        enrolment={enrolment}
        onDone={() => setEnrolment(null)}
        onStartOver={() => setEnrolment(null)}
      />
    );
  }

  return (
    <NotEnrolledCard
      requiredByPlatform={state.requiredByPlatform}
      onEnrolled={setEnrolment}
    />
  );
}
