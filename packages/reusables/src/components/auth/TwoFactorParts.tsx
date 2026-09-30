import type { TwoFactorEnrolment } from "@truckmoov/api/auth";
import { Copy, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { copyText, downloadText } from "./twoFactorUtils";

function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input readOnly value={value} className="font-mono text-xs" />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Copy ${label.toLowerCase()}`}
          onClick={() => copyText(value, label)}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/** The QR to scan, with the secret and link for apps that can't. Shown once, from enrol. */
export function EnrolmentDetails({ enrolment }: { enrolment: TwoFactorEnrolment }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      {/* White quiet zone so scanners read it in dark mode too. */}
      <div className="self-center rounded-xl bg-white p-3 sm:self-start">
        <QRCodeSVG value={enrolment.otpauthUri} size={160} aria-label="Two-factor setup QR code" />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <p className="text-sm text-muted-foreground">
          Scan the code with an authenticator app (Google Authenticator, 1Password, Authy), or enter the secret by hand.
        </p>
        <CopyField label="Secret" value={enrolment.secret} />
        <CopyField label="Setup link" value={enrolment.otpauthUri} />
      </div>
    </div>
  );
}

/**
 * Recovery codes are shown once. "Done" stays off until they were copied or downloaded,
 * so nobody leaves the screen without a way back in.
 */
export function RecoveryCodes({ codes, onDone, doneLabel = "Done" }: {
  codes: string[];
  onDone: () => void;
  doneLabel?: string;
}) {
  const [saved, setSaved] = useState(false);
  const text = codes.join("\n");

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Save these recovery codes — you won&apos;t see them again.</p>
      <p className="text-xs text-muted-foreground">
        Each one signs you in once if you lose your authenticator.
      </p>
      <div className="grid grid-cols-2 gap-2 rounded-xl border p-3 font-mono text-xs sm:grid-cols-4">
        {codes.map(c => <span key={c}>{c}</span>)}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={async () => setSaved(await copyText(text, "Recovery codes") || saved)}
        >
          <Copy className="h-4 w-4" />
          Copy all
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => {
            downloadText("truckmoov-recovery-codes.txt", text);
            setSaved(true);
          }}
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
        <Button type="button" disabled={!saved} onClick={onDone}>
          {doneLabel}
        </Button>
      </div>
      {saved ? null : <p className="text-xs text-muted-foreground">Copy or download them to continue.</p>}
    </div>
  );
}
