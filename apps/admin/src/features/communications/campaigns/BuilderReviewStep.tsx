import type { Reach } from "./audience";
import type { BuilderDraft } from "./builderState";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";

type Props = {
  draft: BuilderDraft;
  reach: Reach;
  onChange: (change: Partial<BuilderDraft>) => void;
};

function earliest() {
  const date = new Date(Date.now() + 2 * 60_000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(
    0,
    16,
  );
}

export function BuilderReviewStep({
  draft, reach, onChange,
}: Props) {
  return (
    <div className="space-y-4">
      <dl className="space-y-2 rounded-lg border border-border/60 p-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Name</dt>
          <dd className="font-medium">{draft.name}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Channels</dt>
          <dd className="font-medium capitalize">{draft.channels.join(", ")}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Messages to send</dt>
          <dd className="font-medium">{reach.recipients.length}</dd>
        </div>
        {draft.channels.map(channel => (
          <div
            key={channel}
            className="flex justify-between gap-4 text-xs"
          >
            <dt className="capitalize text-muted-foreground">{channel}</dt>
            <dd>{`${reach.reachable[channel]} tenants${reach.missing[channel] ? `, ${reach.missing[channel]} skipped (no address)` : ""}`}</dd>
          </div>
        ))}
      </dl>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">When</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="when"
            checked={!draft.sendLater}
            onChange={() => onChange({ sendLater: false })}
          />
          Send as soon as it is created
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="when"
            checked={draft.sendLater}
            onChange={() => onChange({ sendLater: true })}
          />
          Send later
        </label>
        {draft.sendLater && (
          <div className="space-y-1 pl-6">
            <Label
              required
              htmlFor="campaign-send-at"
              className="text-xs text-muted-foreground"
            >
              Send at
            </Label>
            <Input
              id="campaign-send-at"
              type="datetime-local"
              min={earliest()}
              value={draft.sendAt}
              onChange={e => onChange({ sendAt: e.target.value })}
            />
          </div>
        )}
      </fieldset>
      <p className="text-xs text-muted-foreground">Anyone who opted out of messages from the platform is skipped when it sends.</p>
    </div>
  );
}
