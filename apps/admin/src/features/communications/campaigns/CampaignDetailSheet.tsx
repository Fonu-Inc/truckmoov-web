import { useQuery } from "@tanstack/react-query";
import type { PlatformCampaignRecipient } from "@truckmoov/api/notification";
import { formatDateTime } from "@truckmoov/app-core/utils/time-utils";
import { Ban, RotateCw, Send } from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Progress } from "@/components/shadcn/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/shadcn/sheet";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { STATE_LABEL, STATUS_LABEL, canCancel, canSend, deliveryRate, percent, readRate, statusTone } from "./campaignDisplay";
import { campaignDetailOptions } from "./campaignQueries";
import { useCampaignActions } from "./useCampaignActions";

type Props = {
  campaignId: string | null;
  canManage: boolean;
  onClose: () => void;
};

function Meter({ label, value, caption }: { label: string; value: number; caption: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{caption}</span>
      </div>
      <Progress value={value} />
    </div>
  );
}

function RecipientRow({ recipient }: { recipient: PlatformCampaignRecipient }) {
  return (
    <TableRow>
      <TableCell className="max-w-[10rem] truncate text-xs">{recipient.destination}</TableCell>
      <TableCell className="text-xs capitalize">{recipient.channel}</TableCell>
      <TableCell>
        <Badge variant={recipient.state === "failed" ? "destructive" : "outline"} className="text-[10px]">{STATE_LABEL[recipient.state]}</Badge>
        {recipient.failure_reason && <p className="mt-1 text-[10px] text-destructive">{recipient.failure_reason}</p>}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">{recipient.sent_at ? formatDateTime(recipient.sent_at) : "-"}</TableCell>
    </TableRow>
  );
}

export function CampaignDetailSheet({ campaignId, canManage, onClose }: Props) {
  const detail = useQuery(campaignDetailOptions(campaignId ?? ""));
  const { send, cancel } = useCampaignActions();
  const campaign = detail.data?.campaign;
  const progress = campaign?.progress;

  return (
    <Sheet open={Boolean(campaignId)} onOpenChange={open => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{campaign?.name ?? "Campaign"}</SheetTitle>
          <SheetDescription>{campaign ? `${campaign.channels.join(", ")} · ${progress?.recipients ?? 0} recipients` : "Loading"}</SheetDescription>
        </SheetHeader>
        {detail.isLoading && <Skeleton className="mt-4 h-40 w-full" />}
        {detail.isError && <p className="mt-4 text-sm text-destructive">Could not load this campaign.</p>}
        {campaign && progress && (
          <div className="mt-4 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusTone(campaign.status)}>{STATUS_LABEL[campaign.status]}</Badge>
              {campaign.scheduled_for && <span className="text-xs text-muted-foreground">{`Goes out ${formatDateTime(campaign.scheduled_for)}`}</span>}
              <div className="ml-auto flex gap-2">
                {canManage && canSend(campaign.status) && (
                  <Button size="sm" loading={send.isPending} onClick={() => send.mutate({ id: campaign.id })}>
                    <Send className="h-3.5 w-3.5" />
                    Send now
                  </Button>
                )}
                {canManage && progress.failed > 0 && (
                  <Button size="sm" variant="outline" loading={send.isPending} onClick={() => send.mutate({ id: campaign.id, retryFailedOnly: true })}>
                    <RotateCw className="h-3.5 w-3.5" />
                    Retry failed
                  </Button>
                )}
                {canManage && canCancel(campaign.status) && (
                  <Button size="sm" variant="ghost" loading={cancel.isPending} onClick={() => cancel.mutate(campaign.id)}>
                    <Ban className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-3 rounded-lg border border-border/60 p-3">
              <Meter label="Sent" value={percent(progress.sent, progress.recipients)} caption={`${progress.sent} of ${progress.recipients}`} />
              <Meter label="Delivered" value={deliveryRate(progress)} caption={`${progress.delivered} of ${progress.sent}`} />
              {campaign.channels.includes("whatsapp") && (
                <Meter label="Read (WhatsApp)" value={readRate(progress)} caption={`${progress.read} of ${progress.delivered}`} />
              )}
              <Meter label="Failed or opted out" value={percent(progress.failed, progress.recipients)} caption={String(progress.failed)} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Message</p>
              {campaign.channels.map(channel => (
                <p key={channel} className="rounded-lg bg-muted/50 p-2 text-sm">
                  <span className="mr-2 text-xs font-medium capitalize text-muted-foreground">{channel === "whatsapp" ? `WhatsApp template ${campaign.template_name}` : channel}</span>
                  {channel === "whatsapp" ? "" : campaign.bodies[channel]}
                </p>
              ))}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>To</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.data.recipients.map(recipient => <RecipientRow key={recipient.id} recipient={recipient} />)}
              </TableBody>
            </Table>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
