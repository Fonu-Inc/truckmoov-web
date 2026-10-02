import {
  useRefreshSystemWhatsAppAccount,
  useRegisterSystemWhatsAppNumber,
  useResubscribeSystemWhatsAppAccount,
} from "@truckmoov/api/notification";
import type { WhatsAppAccount } from "@truckmoov/api/notification";
import { formatDateTime } from "@truckmoov/app-core/utils/time-utils";
import { AlertTriangle, CheckCircle2, Link2Off, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Alert, AlertDescription } from "@/components/shadcn/alert";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  attentionNotices,
  humanize,
  nameStatusTone,
  needsReconnect,
  numberStatusTone,
  qualityTone,
  TONE_CLASS,
  tierLabel,
} from "./accountHealth";
import type { Tone } from "./accountHealth";
import { ConnectionSteps } from "./ConnectionSteps";

function ConnectionDetail({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

function ToneDetail({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {value
        ? (
            <Badge
              variant="outline"
              className={TONE_CLASS[tone]}
            >
              {value}
            </Badge>
          )
        : <p className="text-sm font-medium text-foreground">—</p>}
    </div>
  );
}

function tokenSummary(account: WhatsAppAccount) {
  if (account.token_never_expires)
    return "Does not expire";
  return account.token_expires_at ? `Expires ${formatDateTime(account.token_expires_at)}` : undefined;
}

type ConnectionCardProps = {
  account: WhatsAppAccount;
  connecting: boolean;
  onReconnect: () => void;
  onDisconnect: () => void;
};

export function ConnectionCard({ account, connecting, onReconnect, onDisconnect }: ConnectionCardProps) {
  const refresh = useRefreshSystemWhatsAppAccount();
  const resubscribe = useResubscribeSystemWhatsAppAccount();
  const register = useRegisterSystemWhatsAppNumber();
  const notices = attentionNotices(account);
  const reconnectNeeded = needsReconnect(account);

  const run = (action: typeof refresh | typeof resubscribe | typeof register, done: string) => {
    action.mutate(undefined, {
      onSuccess: () => toast.success(done),
      onError: error => toast.error(error.message),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {reconnectNeeded
          ? (
              <Badge className={TONE_CLASS.bad}>
                <AlertTriangle className="mr-1 h-3 w-3" />
                Reconnect required
              </Badge>
            )
          : (
              <Badge className={TONE_CLASS.good}>
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Connected
              </Badge>
            )}
        {account.coexistence && (
          <Badge
            variant="outline"
            className="text-xs"
          >
            Also on the WhatsApp Business app
          </Badge>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {account.last_checked_at ? `Checked ${formatDateTime(account.last_checked_at)}` : "Not checked yet"}
        </span>
        <Button
          size="sm"
          variant="outline"
          loading={refresh.isPending}
          onClick={() => run(refresh, "Status refreshed.")}
        >
          <RefreshCw className="mr-2 h-3 w-3" />
          Refresh status
        </Button>
      </div>

      {notices.map(notice => (
        <Alert
          key={notice.text}
          variant={notice.tone === "bad" ? "destructive" : "warning"}
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{notice.text}</AlertDescription>
        </Alert>
      ))}

      {account.status_error && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Couldn&apos;t read the number&apos;s status from Meta:
            {" "}
            {account.status_error}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <ConnectionDetail
          label="Display number"
          value={account.display_phone_number}
        />
        <ConnectionDetail
          label="Verified name"
          value={account.verified_name}
        />
        <ConnectionDetail
          label="Business name"
          value={account.business_name}
        />
        <ToneDetail
          label="Quality rating"
          value={humanize(account.quality_rating)}
          tone={qualityTone(account.quality_rating)}
        />
        <ToneDetail
          label="Number status"
          value={humanize(account.number_status)}
          tone={numberStatusTone(account.number_status)}
        />
        <ToneDetail
          label="Display name review"
          value={humanize(account.name_status)}
          tone={nameStatusTone(account.name_status)}
        />
        <ConnectionDetail
          label="Messaging limit"
          value={tierLabel(account.messaging_limit_tier)}
        />
        <ConnectionDetail
          label="Access token"
          value={tokenSummary(account)}
        />
        <ConnectionDetail
          label="Connected"
          value={account.connected_at ? formatDateTime(account.connected_at) : undefined}
        />
        <ConnectionDetail
          label="Phone number ID"
          value={account.phone_number_id}
        />
        <ConnectionDetail
          label="Business account ID"
          value={account.business_account_id}
        />
      </div>

      <div className="space-y-3 border-t border-border/50 pt-4">
        <p className="text-sm font-semibold text-foreground">Setup checklist</p>
        <ConnectionSteps
          steps={account.steps}
          pending={connecting}
          retry={{
            subscribed: {
              label: "Retry",
              loading: resubscribe.isPending,
              onClick: () => run(resubscribe, "Webhooks subscribed."),
            },
            registered: {
              label: "Register",
              loading: register.isPending,
              onClick: () => run(register, "Number registered."),
            },
          }}
        />
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-border/50 pt-4">
        <Button
          variant={reconnectNeeded ? "default" : "outline"}
          onClick={onReconnect}
          loading={connecting}
        >
          <WhatsAppIcon className="mr-2 h-4 w-4" />
          {reconnectNeeded ? "Reconnect" : "Reconnect or change number"}
        </Button>
        <Button
          variant="outline"
          className="border-destructive/40 text-destructive hover:bg-destructive/10"
          onClick={onDisconnect}
        >
          <Link2Off className="mr-2 h-4 w-4" />
          Disconnect
        </Button>
      </div>
    </div>
  );
}
