import { useQuery } from "@tanstack/react-query";
import type { CampaignStatus, PlatformCampaign } from "@truckmoov/api/notification";
import { formatDateTime } from "@truckmoov/app-core/utils/time-utils";
import { Megaphone, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { StateNotice } from "../components/StateNotice";
import { useDebouncedValue } from "../useDebouncedValue";
import { STATUS_LABEL, deliveryRate, readRate, statusTone } from "./campaignDisplay";
import { campaignListOptions } from "./campaignQueries";
import { CampaignBuilderDialog } from "./CampaignBuilderDialog";
import { CampaignDetailSheet } from "./CampaignDetailSheet";

const ANY = "any";

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function CampaignRow({ campaign, onOpen }: { campaign: PlatformCampaign; onOpen: (id: string) => void }) {
  const { progress } = campaign;
  return (
    <TableRow className="cursor-pointer" onClick={() => onOpen(campaign.id)}>
      <TableCell>
        <p className="font-medium text-foreground">{campaign.name}</p>
        <p className="text-xs capitalize text-muted-foreground">{campaign.channels.join(", ")}</p>
      </TableCell>
      <TableCell>{progress.recipients}</TableCell>
      <TableCell><Badge variant={statusTone(campaign.status)}>{STATUS_LABEL[campaign.status]}</Badge></TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {progress.sent === 0 ? "Not sent yet" : `${deliveryRate(progress)}% delivered`}
        {campaign.channels.includes("whatsapp") && progress.delivered > 0 ? ` · ${readRate(progress)}% read` : ""}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">{formatDateTime(campaign.scheduled_for ?? campaign.created_at)}</TableCell>
    </TableRow>
  );
}

export function CampaignsPanel({ canManage }: { canManage: boolean }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CampaignStatus | "">("");
  const [building, setBuilding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const query = useDebouncedValue(search.trim(), 300);
  const list = useQuery(campaignListOptions({ query, status: status || undefined, limit: 50 }));
  const summary = list.data?.summary;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Campaigns" value={String(list.data?.total ?? 0)} />
        <Kpi label="Messages sent" value={String(summary?.sent ?? 0)} />
        <Kpi label="Delivered" value={`${summary ? deliveryRate(summary) : 0}%`} hint={`${summary?.delivered ?? 0} of ${summary?.sent ?? 0}`} />
        <Kpi label="Read on WhatsApp" value={`${summary ? readRate(summary) : 0}%`} hint={`${summary?.read ?? 0} read`} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search campaigns" className="pl-10" placeholder="Search campaigns" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={status || ANY} onValueChange={next => setStatus(next === ANY ? "" : next as CampaignStatus)}>
          <SelectTrigger className="w-40" aria-label="Status filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any status</SelectItem>
            {(Object.keys(STATUS_LABEL) as CampaignStatus[]).map(key => <SelectItem key={key} value={key}>{STATUS_LABEL[key]}</SelectItem>)}
          </SelectContent>
        </Select>
        {canManage && (
          <Button onClick={() => setBuilding(true)}>
            <Plus className="h-4 w-4" />
            New campaign
          </Button>
        )}
      </div>

      {list.isPending && <Skeleton className="h-48 w-full" />}
      {list.isError && !list.data && (
        <StateNotice title="Could not load campaigns." body="Check your connection and try again." actionLabel="Retry" onAction={() => void list.refetch()} />
      )}
      {list.data && list.data.items.length === 0 && (
        <StateNotice
          icon={<Megaphone className="h-8 w-8 text-muted-foreground/50" />}
          title={query || status ? "No campaigns match." : "No campaigns yet."}
          body={query || status ? undefined : "Broadcast a notice to your tenants over WhatsApp, SMS or email."}
        />
      )}
      {list.data && list.data.items.length > 0 && (
        <Card className="border-border/50 bg-card/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.data.items.map(campaign => <CampaignRow key={campaign.id} campaign={campaign} onOpen={setOpenId} />)}
            </TableBody>
          </Table>
        </Card>
      )}

      <CampaignBuilderDialog open={building} onOpenChange={setBuilding} />
      <CampaignDetailSheet campaignId={openId} canManage={canManage} onClose={() => setOpenId(null)} />
    </div>
  );
}
