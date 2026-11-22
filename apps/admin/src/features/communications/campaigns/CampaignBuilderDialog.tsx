import type { CampaignChannel } from "@truckmoov/api/notification";
import type { BuilderDraft } from "./builderState";
import {
  useMemo, useState,
} from "react";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
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
import { buildRecipients } from "./audience";
import { BuilderAudienceStep } from "./BuilderAudienceStep";
import { BuilderMessageStep } from "./BuilderMessageStep";
import { BuilderReviewStep } from "./BuilderReviewStep";
import {
  EMPTY_DRAFT, stepProblem, STEPS, toInput,
} from "./builderState";
import { useAudienceTenants } from "./useAudienceTenants";
import { useCampaignActions } from "./useCampaignActions";

const CHANNELS: {
  id: CampaignChannel; label: string; hint: string;
}[] = [
  {
    id: "whatsapp", label: "WhatsApp", hint: "Sent as an approved template from the platform number.",
  },
  {
    id: "sms", label: "SMS", hint: "Plain text to the tenant's phone.",
  },
  {
    id: "email", label: "Email", hint: "To the tenant's contact email.",
  },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function DetailsStep({
  draft, onChange,
}: {
  draft: BuilderDraft; onChange: (change: Partial<BuilderDraft>) => void;
}) {
  const toggle = (channel: CampaignChannel) => onChange({
    channels: draft.channels.includes(channel) ? draft.channels.filter(c => c !== channel) : [
      ...draft.channels,
      channel,
    ],
  });
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="campaign-name">Name</Label>
        <Input
          id="campaign-name"
          maxLength={120}
          placeholder="Planned maintenance, Friday"
          value={draft.name}
          onChange={e => onChange({ name: e.target.value })}
        />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Channels</legend>
        {CHANNELS.map(channel => (
          <label
            key={channel.id}
            className="flex items-start gap-3 rounded-lg border border-border/60 p-3"
          >
            <Checkbox
              className="mt-0.5"
              checked={draft.channels.includes(channel.id)}
              onCheckedChange={() => toggle(channel.id)}
            />
            <span>
              <span className="block text-sm font-medium">{channel.label}</span>
              <span className="block text-xs text-muted-foreground">{channel.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}

export function CampaignBuilderDialog({
  open, onOpenChange,
}: Props) {
  const [
    step,
    setStep,
  ] = useState(0);
  const [
    draft,
    setDraft,
  ] = useState<BuilderDraft>(EMPTY_DRAFT);
  // Set once created, so a retry after a failed send only sends.
  const [
    createdId,
    setCreatedId,
  ] = useState<string | null>(null);
  const {
    create, send,
  } = useCampaignActions();
  const audience = useAudienceTenants(open && step >= 2);
  const chosen = useMemo(
    () => audience.tenants.filter(t => draft.audienceIds.includes(t.id)),
    [
      audience.tenants,
      draft.audienceIds,
    ],
  );
  const reach = useMemo(
    () => buildRecipients(
      chosen,
      draft.channels,
    ),
    [
      chosen,
      draft.channels,
    ],
  );
  const problem = stepProblem(
    step,
    draft,
    reach,
  );
  const change = (next: Partial<BuilderDraft>) => setDraft(current => ({
    ...current, ...next,
  }));

  const close = (next: boolean) => {
    if (!next) {
      setStep(0);
      setDraft(EMPTY_DRAFT);
      setCreatedId(null);
    }
    onOpenChange(next);
  };

  const submit = async () => {
    try {
      let id = createdId;
      if (!id) {
        id = (await create.mutateAsync(toInput(
          draft,
          reach,
        ))).id;
        setCreatedId(id);
      }
      if (!draft.sendLater)
        await send.mutateAsync({ id });
      close(false);
    }
    catch {
      // Both mutations report their own error.
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New campaign</DialogTitle>
          <DialogDescription>{`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}</DialogDescription>
        </DialogHeader>
        {step === 0 && (
          <DetailsStep
            draft={draft}
            onChange={change}
          />
        )}
        {step === 1 && (
          <BuilderMessageStep
            draft={draft}
            onChange={change}
          />
        )}
        {step === 2 && (
          <BuilderAudienceStep
            draft={draft}
            reach={reach}
            tenants={audience.tenants}
            isLoading={audience.isLoading}
            isError={audience.isError}
            onChange={change}
          />
        )}
        {step === 3 && (
          <BuilderReviewStep
            draft={draft}
            reach={reach}
            onChange={change}
          />
        )}
        {problem && step > 0 && <p className="text-xs text-muted-foreground">{problem}</p>}
        <DialogFooter>
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
          )}
          {step < STEPS.length - 1
            ? (
                <Button
                  disabled={Boolean(problem)}
                  onClick={() => setStep(step + 1)}
                >
                  Next
                </Button>
              )
            : (
                <Button
                  disabled={Boolean(problem) || create.isPending || send.isPending}
                  loading={create.isPending || send.isPending}
                  onClick={() => void submit()}
                >
                  {draft.sendLater ? "Schedule campaign" : "Create and send"}
                </Button>
              )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
