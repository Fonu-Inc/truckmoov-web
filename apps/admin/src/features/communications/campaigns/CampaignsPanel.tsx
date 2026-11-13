import type { ColumnDef } from "@tanstack/react-table";
import type {
  CampaignStatus, PlatformCampaign,
} from "@truckmoov/api/notification";
import { useQuery } from "@tanstack/react-query";
import { formatDateTime } from "@truckmoov/app-core/utils/time-utils";
import { useServerPagination } from "@truckmoov/reusables/hooks/useServerPagination";
import {
  Megaphone, Plus, Search,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { StateNotice } from "../components/StateNotice";
import { useDebouncedValue } from "../useDebouncedValue";
import { CampaignBuilderDialog } from "./CampaignBuilderDialog";
import { CampaignDetailSheet } from "./CampaignDetailSheet";
import {
  deliveryRate, readRate, STATUS_LABEL, statusTone,
} from "./campaignDisplay";
import { campaignListOptions } from "./campaignQueries";

const ANY = "any";

function Kpi({
  label, value, hint,
}: {
  label: string; value: string; hint?: string;
}) {
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

const CAMPAIGN_COLUMNS: ColumnDef<PlatformCampaign>[] = [
  {
    accessorKey: "name",
    header: "Campaign",
    cell: ({ row: { original: campaign } }) => (
      <>
        <p className="font-medium text-foreground">{campaign.name}</p>
        <p className="text-xs capitalize text-muted-foreground">{campaign.channels.join(", ")}</p>
      </>
    ),
  },
  {
    id: "recipients", header: "Recipients", accessorFn: campaign => campaign.progress.recipients,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge variant={statusTone(row.original.status)}>{STATUS_LABEL[row.original.status]}</Badge>,
  },
  {
    id: "performance",
    header: "Performance",
    enableSorting: false,
    meta: { className: "text-xs text-muted-foreground" },
    cell: ({ row: { original: campaign } }) => {
      const { progress } = campaign;
      return (
        <>
          {progress.sent === 0 ? "Not sent yet" : `${deliveryRate(progress)}% delivered`}
          {campaign.channels.includes("whatsapp") && progress.delivered > 0 ? ` · ${readRate(progress)}% read` : ""}
        </>
      );
    },
  },
  {
    id: "date",
    header: "Date",
    accessorFn: campaign => campaign.scheduled_for ?? campaign.created_at,
    meta: { className: "text-xs text-muted-foreground" },
    cell: ({ row }) => formatDateTime(row.original.scheduled_for ?? row.original.created_at),
  },
];

export function CampaignsPanel({ canManage }: { canManage: boolean }) {
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState<CampaignStatus | "">("");
  const [
    building,
    setBuilding,
  ] = useState(false);
  const [
    openId,
    setOpenId,
  ] = useState<string | null>(null);
  const query = useDebouncedValue(
    search.trim(),
    300,
  );
  const {
    page, pageSize, pagination,
  } = useServerPagination([
    query,
    status,
  ]);
  const list = useQuery(campaignListOptions({
    query, status: status || undefined, page, limit: pageSize,
  }));
  const summary = list.data?.summary;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Campaigns"
          value={String(list.data?.total ?? 0)}
        />
        <Kpi
          label="Messages sent"
          value={String(summary?.sent ?? 0)}
        />
        <Kpi
          label="Delivered"
          value={`${summary ? deliveryRate(summary) : 0}%`}
          hint={`${summary?.delivered ?? 0} of ${summary?.sent ?? 0}`}
        />
        <Kpi
          label="Read on WhatsApp"
          value={`${summary ? readRate(summary) : 0}%`}
          hint={`${summary?.read ?? 0} read`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search campaigns"
            className="pl-10"
            placeholder="Search campaigns"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={status || ANY}
          onValueChange={next => setStatus(next === ANY ? "" : next as CampaignStatus)}
        >
          <SelectTrigger
            className="w-40"
            aria-label="Status filter"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any status</SelectItem>
            {(Object.keys(STATUS_LABEL) as CampaignStatus[]).map(key => (
              <SelectItem
                key={key}
                value={key}
              >
                {STATUS_LABEL[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canManage && (
          <Button onClick={() => setBuilding(true)}>
            <Plus className="h-4 w-4" />
            New campaign
          </Button>
        )}
      </div>

      <Card className="border-border/50 bg-card/50">
        <DataTable
          columns={CAMPAIGN_COLUMNS}
          data={list.data?.items ?? []}
          isLoading={list.isPending}
          isError={list.isError && !list.data}
          errorMessage="Could not load campaigns. Check your connection and try again."
          onRetry={() => void list.refetch()}
          hasActiveFilters={Boolean(query || status)}
          pagination={pagination(list.data?.total ?? 0)}
          emptyState={(
            <StateNotice
              icon={<Megaphone className="h-8 w-8 text-muted-foreground/50" />}
              title="No campaigns yet."
              body="Broadcast a notice to your tenants over WhatsApp, SMS or email."
            />
          )}
          filteredEmptyState={(
            <StateNotice
              icon={<Megaphone className="h-8 w-8 text-muted-foreground/50" />}
              title="No campaigns match."
            />
          )}
          onRowClick={campaign => setOpenId(campaign.id)}
        />
      </Card>

      <CampaignBuilderDialog
        open={building}
        onOpenChange={setBuilding}
      />
      <CampaignDetailSheet
        campaignId={openId}
        canManage={canManage}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}
