import { useQuery } from "@tanstack/react-query";
import { getSystemTenantsQueryOptions } from "@truckmoov/api/auth";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { Skeleton } from "@/components/shadcn/skeleton";
import type { AudienceTenant, Reach } from "./audience";
import { isMessageable } from "./audience";
import type { BuilderDraft } from "./builderState";

type Props = {
  draft: BuilderDraft;
  reach: Reach;
  tenants: AudienceTenant[];
  isLoading: boolean;
  isError: boolean;
  onChange: (change: Partial<BuilderDraft>) => void;
};

export function useAudienceTenants(enabled: boolean) {
  const query = useQuery({ ...getSystemTenantsQueryOptions(), enabled });
  const tenants = useMemo<AudienceTenant[]>(
    () => (query.data?.data.tenants ?? [])
      .map(t => ({ id: t.id, name: t.name, email: t.email, phone: t.phone, status: t.status }))
      .filter(isMessageable),
    [query.data],
  );
  return { tenants, isLoading: query.isLoading, isError: query.isError };
}

export function BuilderAudienceStep({ draft, reach, tenants, isLoading, isError, onChange }: Props) {
  const [search, setSearch] = useState("");
  const shown = tenants.filter(t => t.name.toLowerCase().includes(search.trim().toLowerCase()));
  const chosen = new Set(draft.audienceIds);
  const toggle = (id: string) => onChange({ audienceIds: chosen.has(id) ? draft.audienceIds.filter(x => x !== id) : [...draft.audienceIds, id] });

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search tenants" className="pl-10" placeholder="Search tenants" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" onClick={() => onChange({ audienceIds: tenants.map(t => t.id) })}>All</Button>
        <Button variant="ghost" size="sm" onClick={() => onChange({ audienceIds: [] })}>None</Button>
      </div>
      {isLoading && <Skeleton className="h-40 w-full" />}
      {isError && <p className="text-sm text-destructive">Could not load tenants.</p>}
      <ul className="max-h-64 divide-y divide-border/50 overflow-y-auto rounded-lg border border-border/60">
        {shown.map(tenant => (
          <li key={tenant.id} className="flex items-center gap-3 p-2">
            <Checkbox checked={chosen.has(tenant.id)} aria-label={`Include ${tenant.name}`} onCheckedChange={() => toggle(tenant.id)} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{tenant.name}</p>
              <p className="truncate text-xs text-muted-foreground">{[tenant.phone, tenant.email].filter(Boolean).join(" · ")}</p>
            </div>
          </li>
        ))}
        {!isLoading && shown.length === 0 && <li className="p-3 text-sm text-muted-foreground">No tenants match.</li>}
      </ul>
      <p className="text-xs text-muted-foreground">
        {`${draft.audienceIds.length} selected. `}
        {draft.channels.map(channel => `${reach.reachable[channel]} reachable on ${channel}${reach.missing[channel] ? ` (${reach.missing[channel]} without an address)` : ""}`).join(" · ")}
      </p>
    </div>
  );
}
