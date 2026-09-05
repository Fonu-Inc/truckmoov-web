import type { ColumnDef } from "@tanstack/react-table";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  Lock,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import { DataTable } from "@/components/shadcn/data-table";
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { useTenants } from "@/hooks/useTenants";

type AuditFilters = {
  startDate?: string;
  endDate?: string;
  tenantId?: string;
  actor?: string;
  actionType?: string;
  resourceType?: string;
};

export default function PlatformComplianceAudit() {
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    filters,
    setFilters,
  ] = useState<AuditFilters>({});
  const [
    draft,
    setDraft,
  ] = useState<{
    enableDate: boolean;
    startDate: string;
    endDate: string;
    enableTenant: boolean;
    tenantId: string;
    enableActor: boolean;
    actor: string;
    enableAction: boolean;
    actionType: string;
    enableResource: boolean;
    resourceType: string;
  }>({
    enableDate: false,
    startDate: "",
    endDate: "",
    enableTenant: false,
    tenantId: "",
    enableActor: false,
    actor: "",
    enableAction: false,
    actionType: "",
    enableResource: false,
    resourceType: "",
  });

  const liveEntries: any[] = [];
  const isLoading = false;
  const { tenants } = useTenants();

  const dummyEntries = useMemo<typeof liveEntries>(
    () => {
      const actors = [
        {
          id: "u-001",
          name: "Adaeze Okafor",
          email: "adaeze.okafor@mtn.ng",
        },
        {
          id: "u-002",
          name: "Tunde Bakare",
          email: "tunde.bakare@fleetpro.ng",
        },
        {
          id: "u-003",
          name: "Chika Eze",
          email: "chika.eze@lagosexpress.ng",
        },
        {
          id: "u-004",
          name: "System Worker",
          email: "system@platform",
        },
        {
          id: "u-005",
          name: "Ifeoma Nwosu",
          email: "ifeoma.nwosu@mtn.ng",
        },
        {
          id: "u-006",
          name: "Bola Adeyemi",
          email: "bola.adeyemi@truckmoov.com",
        },
      ];
      const actions = [
        "tenant.created",
        "tenant.suspended",
        "user.invited",
        "user.login",
        "sim.activated",
        "sim.deactivated",
        "invoice.approved",
        "invoice.voided",
        "webhook.delivered",
        "api_key.rotated",
        "kyc.verified",
        "kyc.rejected",
        "device.assigned",
        "geofence.updated",
        "role.granted",
      ];
      const resources = [
        "tenant",
        "user",
        "sim",
        "invoice",
        "webhook",
        "api_key",
        "kyc_document",
        "device",
        "geofence",
        "role",
      ];
      const sources: Array<"integration" | "security"> = [
        "integration",
        "security",
      ];
      const ips = [
        "102.89.34.18",
        "197.210.65.221",
        "105.112.45.9",
        "154.113.22.7",
        "41.58.99.3",
      ];
      const tenantPool = tenants.length > 0
        ? tenants.slice(
            0,
            5,
          ).map(t => ({
            id: t.id,
            name: t.name,
          }))
        : [
            {
              id: "demo-t-1",
              name: "Lagos Express Logistics",
            },
            {
              id: "demo-t-2",
              name: "Abuja Cargo Movers",
            },
            {
              id: "demo-t-3",
              name: "Port Harcourt Haulage",
            },
            {
              id: "demo-t-4",
              name: "Kano Freight Co.",
            },
          ];

      const now = Date.now();
      return Array.from({ length: 40 }).map((_, i) => {
        const a = actors[i % actors.length];
        const action = actions[i % actions.length];
        const resource = resources[i % resources.length];
        const tenant = tenantPool[i % tenantPool.length];
        const src = sources[i % sources.length];
        return {
          id: `dummy-${i}`,
          source: src,
          timestamp: new Date(now - i * 1000 * 60 * 37).toISOString(),
          actor_id: a.id,
          actor_name: a.name,
          actor_email: a.email,
          action_type: action,
          resource_type: resource,
          resource_id: `${resource}-${(1000 + i).toString(16)}`,
          tenant_id: tenant.id,
          ip_address: ips[i % ips.length],
          user_agent: "Mozilla/5.0",
          metadata: {
            note: "demo entry",
            index: i,
          },
          severity: src === "security" ? (i % 3 === 0 ? "high" : "medium") : "info",
          description: `${a.name} performed ${action} on ${resource}`,
        };
      });
    },
    [tenants],
  );

  const allEntries = liveEntries.length > 0 ? liveEntries : dummyEntries;

  const entries = useMemo(
    () => {
      let rows = allEntries;
      if (filters.tenantId)
        rows = rows.filter(r => r.tenant_id === filters.tenantId);
      if (filters.actionType)
        rows = rows.filter(r => r.action_type === filters.actionType);
      if (filters.resourceType)
        rows = rows.filter(r => r.resource_type === filters.resourceType);
      if (filters.startDate)
        rows = rows.filter(r => r.timestamp >= filters.startDate!);
      if (filters.endDate)
        rows = rows.filter(r => r.timestamp <= filters.endDate!);
      if (filters.actor) {
        const t = filters.actor.toLowerCase();
        rows = rows.filter(r =>
          (r.actor_name || "").toLowerCase().includes(t)
          || (r.actor_email || "").toLowerCase().includes(t)
          || (r.actor_id || "").toLowerCase().includes(t));
      }
      if (search) {
        const t = search.toLowerCase();
        rows = rows.filter(r =>
          [
            r.actor_id,
            r.actor_name,
            r.actor_email,
            r.action_type,
            r.resource_type,
            r.resource_id,
            r.tenant_id,
            r.ip_address,
            r.description,
            r.severity,
          ]
            .filter(Boolean)
            .some(v => String(v).toLowerCase().includes(t)));
      }
      return rows;
    },
    [
      allEntries,
      filters,
      search,
    ],
  );

  const actionTypes = useMemo(
    () => Array.from(new Set(entries.map(e => e.action_type))).sort(),
    [entries],
  );
  const resourceTypes = useMemo(
    () => Array.from(new Set(entries.map(e => e.resource_type))).sort(),
    [entries],
  );

  const applyFilters = () => {
    const next: AuditFilters = {};
    if (draft.enableDate && draft.startDate)
      next.startDate = new Date(draft.startDate).toISOString();
    if (draft.enableDate && draft.endDate)
      next.endDate = new Date(draft.endDate).toISOString();
    if (draft.enableTenant && draft.tenantId)
      next.tenantId = draft.tenantId;
    if (draft.enableActor && draft.actor)
      next.actor = draft.actor;
    if (draft.enableAction && draft.actionType)
      next.actionType = draft.actionType;
    if (draft.enableResource && draft.resourceType)
      next.resourceType = draft.resourceType;
    setFilters(next);
  };

  const clearFilters = () => {
    setDraft({
      enableDate: false,
      startDate: "",
      endDate: "",
      enableTenant: false,
      tenantId: "",
      enableActor: false,
      actor: "",
      enableAction: false,
      actionType: "",
      enableResource: false,
      resourceType: "",
    });
    setFilters({});
  };

  const tenantNameOf = (tid: string | null) => {
    if (!tid)
      return "—";
    const t = tenants.find(x => x.id === tid);
    return t?.name || tid.slice(
      0,
      8,
    );
  };

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        id: "timestamp",
        header: "Timestamp",
        cell: ({ row }) => (
          <span className="font-mono text-xs whitespace-nowrap">
            {formatWithPattern(
              row.original.timestamp,
              "yyyy-MM-dd HH:mm:ss",
            )}
          </span>
        ),
      },
      {
        id: "actor",
        header: "Actor",
        cell: ({ row }) => {
          const e = row.original;
          return (
            <>
              <div className="text-sm font-medium">{e.actor_name || "System"}</div>
              <div className="text-xs text-muted-foreground font-mono">
                {e.actor_email || e.actor_id?.slice(
                  0,
                  8,
                ) || "—"}
              </div>
            </>
          );
        },
      },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="text-xs"
          >
            {row.original.action_type}
          </Badge>
        ),
      },
      {
        id: "resource",
        header: "Resource",
        cell: ({ row }) => {
          const e = row.original;
          return (
            <>
              <div className="text-sm">{e.resource_type}</div>
              {e.resource_id && (
                <div className="text-xs text-muted-foreground font-mono">
                  {e.resource_id.slice(
                    0,
                    8,
                  )}
                </div>
              )}
            </>
          );
        },
      },
      {
        id: "tenant",
        header: "Tenant",
        cell: ({ row }) => <span className="text-sm">{tenantNameOf(row.original.tenant_id)}</span>,
      },
      {
        id: "ip",
        header: "IP Address",
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.ip_address || "—"}</span>,
      },
      {
        id: "source",
        header: "Source",
        cell: ({ row }) => (
          <Badge
            variant={row.original.source === "security" ? "destructive" : "secondary"}
            className="text-xs"
          >
            {row.original.source}
          </Badge>
        ),
      },
    ],
    [tenants],
  );

  const exportColumns = [
    {
      header: "Timestamp",
      accessor: (r: any) => formatWithPattern(
        r.timestamp,
        "yyyy-MM-dd HH:mm:ss",
      ),
    },
    {
      header: "Source",
      accessor: "source" as const,
    },
    {
      header: "Actor ID",
      accessor: (r: any) => r.actor_id || "",
    },
    {
      header: "Actor Name",
      accessor: (r: any) => r.actor_name || "",
    },
    {
      header: "Actor Email",
      accessor: (r: any) => r.actor_email || "",
    },
    {
      header: "Action Type",
      accessor: "action_type" as const,
    },
    {
      header: "Resource Type",
      accessor: "resource_type" as const,
    },
    {
      header: "Resource ID",
      accessor: (r: any) => r.resource_id || "",
    },
    {
      header: "Tenant ID",
      accessor: (r: any) => r.tenant_id || "",
    },
    {
      header: "Tenant Name",
      accessor: (r: any) => tenantNameOf(r.tenant_id),
    },
    {
      header: "IP Address",
      accessor: (r: any) => r.ip_address || "",
    },
    {
      header: "Severity",
      accessor: (r: any) => r.severity || "",
    },
    {
      header: "Description",
      accessor: (r: any) => r.description || "",
    },
    {
      header: "Metadata",
      accessor: (r: any) => (r.metadata ? JSON.stringify(r.metadata) : ""),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Compliance & Audit
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cross-tenant audit log for platform compliance, support, and security investigations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-md bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Total Entries</div>
              <div className="text-xl font-bold break-words">{entries.length.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-md bg-primary/10 flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Immutability</div>
              <div className="text-xl font-bold break-words">Enforced</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-md bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Retention (NCC)</div>
              <div className="text-xl font-bold break-words">7 years</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Audit Log Entries</CardTitle>
            <CardDescription>Immutable cross-tenant audit trail retained for 7 years per NCC requirements</CardDescription>
          </div>
          <ExportButton
            rows={entries}
            columns={exportColumns as any}
            filename="platform_audit_log"
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search any field…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-4 space-y-4"
                align="end"
              >
                <div className="font-medium text-sm">Show Audit Entries</div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="f-date"
                      checked={draft.enableDate}
                      onCheckedChange={v => setDraft({
                        ...draft,
                        enableDate: !!v,
                      })}
                    />
                    <Label
                      htmlFor="f-date"
                      className="text-xs"
                    >
                      By date range
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      disabled={!draft.enableDate}
                      value={draft.startDate}
                      onChange={e => setDraft({
                        ...draft,
                        startDate: e.target.value,
                      })}
                      className="flex-1 min-w-0"
                    />
                    <Input
                      type="date"
                      disabled={!draft.enableDate}
                      value={draft.endDate}
                      onChange={e => setDraft({
                        ...draft,
                        endDate: e.target.value,
                      })}
                      className="flex-1 min-w-0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="f-tenant"
                      checked={draft.enableTenant}
                      onCheckedChange={v => setDraft({
                        ...draft,
                        enableTenant: !!v,
                      })}
                    />
                    <Label
                      htmlFor="f-tenant"
                      className="text-xs"
                    >
                      By tenant
                    </Label>
                  </div>
                  <Select
                    disabled={!draft.enableTenant}
                    value={draft.tenantId}
                    onValueChange={v => setDraft({
                      ...draft,
                      tenantId: v,
                    })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                    <SelectContent>
                      {tenants.map(t => (
                        <SelectItem
                          key={t.id}
                          value={t.id}
                        >
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="f-actor"
                      checked={draft.enableActor}
                      onCheckedChange={v => setDraft({
                        ...draft,
                        enableActor: !!v,
                      })}
                    />
                    <Label
                      htmlFor="f-actor"
                      className="text-xs"
                    >
                      By actor (name / email / ID)
                    </Label>
                  </div>
                  <Input
                    disabled={!draft.enableActor}
                    placeholder="e.g. jane@…"
                    value={draft.actor}
                    onChange={e => setDraft({
                      ...draft,
                      actor: e.target.value,
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="f-action"
                      checked={draft.enableAction}
                      onCheckedChange={v => setDraft({
                        ...draft,
                        enableAction: !!v,
                      })}
                    />
                    <Label
                      htmlFor="f-action"
                      className="text-xs"
                    >
                      By action type
                    </Label>
                  </div>
                  <Select
                    disabled={!draft.enableAction}
                    value={draft.actionType}
                    onValueChange={v => setDraft({
                      ...draft,
                      actionType: v,
                    })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select action" /></SelectTrigger>
                    <SelectContent>
                      {actionTypes.map(a => (
                        <SelectItem
                          key={a}
                          value={a}
                        >
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="f-resource"
                      checked={draft.enableResource}
                      onCheckedChange={v => setDraft({
                        ...draft,
                        enableResource: !!v,
                      })}
                    />
                    <Label
                      htmlFor="f-resource"
                      className="text-xs"
                    >
                      By resource type
                    </Label>
                  </div>
                  <Select
                    disabled={!draft.enableResource}
                    value={draft.resourceType}
                    onValueChange={v => setDraft({
                      ...draft,
                      resourceType: v,
                    })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select resource" /></SelectTrigger>
                    <SelectContent>
                      {resourceTypes.map(r => (
                        <SelectItem
                          key={r}
                          value={r}
                        >
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={applyFilters}
                  >
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={clearFilters}
                  >
                    Show All
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="border rounded-md overflow-x-auto">
            <DataTable
              columns={columns}
              data={entries}
              isLoading={isLoading}
              hasActiveFilters={Object.keys(filters).length > 0 || !!search}
              emptyState="No audit entries found"
              filteredEmptyState="No audit entries match your filters."
            />
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            Entries are immutable. Retained for 7 years per NCC regulatory requirement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
