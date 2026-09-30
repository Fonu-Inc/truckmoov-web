import type { TwoFactorEnrolment } from "@truckmoov/api/auth";
import { useState } from "react";
import { TwoFactorCodeForm } from "./TwoFactorCodeForm";
import { EnrolmentDetails, RecoveryCodes } from "./TwoFactorParts";

/**
 * TRU-FE-23 — admin sign-in when the platform requires two-factor and this admin has none:
 * scan, send the first code (it both finishes setup and signs in), save the recovery codes.
 * ponytail: untested live — it only appears once the platform-wide requirement is switched on.
 */
export function TwoFactorEnrolmentStep({ enrolment, verify, onSignedIn, onRestart }: {
  enrolment: TwoFactorEnrolment;
  /** Sends the first code; resolves with any recovery codes the server returned. */
  verify: (code: string) => Promise<string[] | undefined>;
  /** Called once the codes are saved (or right away when none came back). */
  onSignedIn: () => void;
  onRestart: () => void;
}) {
  const [codes, setCodes] = useState<string[] | null>(null);

  if (codes)
    return <RecoveryCodes codes={codes} onDone={onSignedIn} doneLabel="Continue" />;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Your platform requires two-factor for admin accounts. Set it up to finish signing in.
      </p>
      <EnrolmentDetails enrolment={enrolment} />
      <TwoFactorCodeForm
        allowRecovery={false}
        submitLabel="Turn on and sign in"
        onRestart={onRestart}
        verify={async (code) => {
          const recovery = await verify(code);
          if (recovery?.length)
            setCodes(recovery);
          else
            onSignedIn();
        }}
      />
    </div>
  );
}
