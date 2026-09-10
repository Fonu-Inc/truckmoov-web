import type { ColumnDef } from "@tanstack/react-table";
import {
  exportSystemAuditLog,
  getSystemAuditLogFiltersQueryOptions,
  getSystemAuditLogQueryOptions,
  getSystemAuditLogVerifyQueryOptions,
  type SystemAuditLogEntry,
  type SystemAuditLogQuery,
} from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  Download,
  Lock,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useBatchedQuery } from "@truckmoov/reusables/hooks/useBatchedQuery";
import { toast } from "sonner";
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

type DraftFilters = {
  enableDate: boolean;
  startDate: string;
  endDate: string;
  enableTenant: boolean;
  tenantId: string;
  enableActor: boolean;
  actor: string;
  enableAction: boolean;
  action: string;
  enableResource: boolean;
  resourceType: string;
  enableSource: boolean;
  source: string;
};

const emptyDraft: DraftFilters = {
  enableDate: false,
  startDate: "",
  endDate: "",
  enableTenant: false,
  tenantId: "",
  enableActor: false,
  actor: "",
  enableAction: false,
  action: "",
  enableResource: false,
  resourceType: "",
  enableSource: false,
  source: "",
};

export default function PlatformComplianceAudit() {
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<DraftFilters>(emptyDraft);
  const [applied, setApplied] = useState<SystemAuditLogQuery["params"]>({});
  const [exporting, setExporting] = useState(false);

  const filterParams: SystemAuditLogQuery["params"] = {
    ...applied,
    ...(search ? { search } : {}),
  };

  const listQueryOptions = useCallback(
    ({ offset, limit }: { offset: number; limit: number }) =>
      getSystemAuditLogQueryOptions({ params: { ...filterParams, offset, limit } }),
    // filterParams is a fresh object each render; depend on its stable inputs instead.
    [applied, search],
  );

  const {
    items: entries,
    total,
    isLoading: listLoading,
    isError: listError,
    error: listErrorObj,
    pagination,
    setPage,
  } = useBatchedQuery<SystemAuditLogEntry>({ queryOptions: listQueryOptions });

  useEffect(() => {
    setPage(1);
  }, [applied, search, setPage]);

  const filtersQuery = useQuery(getSystemAuditLogFiltersQueryOptions());
  const verifyQuery = useQuery(getSystemAuditLogVerifyQueryOptions());

  const availableFilters = filtersQuery.data?.data;
  const verification = verifyQuery.data?.data;

  const applyFilters = () => {
    const next: SystemAuditLogQuery["params"] = {};
    if (draft.enableDate && draft.startDate) next.from = new Date(draft.startDate).toISOString();
    if (draft.enableDate && draft.endDate) next.to = new Date(draft.endDate).toISOString();
    if (draft.enableTenant && draft.tenantId) next.tenantId = draft.tenantId;
    if (draft.enableActor && draft.actor) next.actor = draft.actor;
    if (draft.enableAction && draft.action) next.action = draft.action;
    if (draft.enableResource && draft.resourceType) next.resourceType = draft.resourceType;
    if (draft.enableSource && draft.source) next.source = draft.source;
    setApplied(next);
  };

  const clearFilters = () => {
    setDraft(emptyDraft);
    setApplied({});
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportSystemAuditLog({ params: { ...applied, ...(search ? { search } : {}) } });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `platform_audit_log_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err?.message || "Failed to export audit log");
    } finally {
      setExporting(false);
    }
  };

  const tenantLabel = (t: { tenantId: string; tenantName: string | null }) =>
    t.tenantName || t.tenantId;

  const columns = useMemo<ColumnDef<SystemAuditLogEntry>[]>(
    () => [
      {
        id: "timestamp",
        header: "Timestamp",
        cell: ({ row }) => (
          <span className="font-mono text-xs whitespace-nowrap">
            {formatWithPattern(row.original.occurredAt, "yyyy-MM-dd HH:mm:ss")}
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
              <div className="text-sm font-medium">{e.actorName || "—"}</div>
              <div className="text-xs text-muted-foreground font-mono">
                {e.actorEmail || e.actorId?.slice(0, 8) || "—"}
              </div>
            </>
          );
        },
      },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs">
            {row.original.action}
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
              <div className="text-sm">{e.resourceType}</div>
              {e.resourceId && (
                <div className="text-xs text-muted-foreground font-mono">
                  {e.resourceId.slice(0, 8)}
                </div>
              )}
            </>
          );
        },
      },
      {
        id: "tenant",
        header: "Tenant",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.tenantName || row.original.tenantId || "—"}
          </span>
        ),
      },
      {
        id: "ip",
        header: "IP Address",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.ipAddress || "—"}</span>
        ),
      },
      {
        id: "source",
        header: "Source",
        cell: ({ row }) => (
          // ponytail: source is which service recorded the entry, not a severity — plain tag.
          <Badge variant="outline" className="text-xs">
            {row.original.source}
          </Badge>
        ),
      },
    ],
    [],
  );

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
              <div className="text-xl font-bold break-words">{total.toLocaleString()}</div>
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
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              Audit Log Entries
              <VerifyBadge
                verification={verification}
                isLoading={verifyQuery.isFetching}
                onRefresh={() => verifyQuery.refetch()}
              />
            </CardTitle>
            <CardDescription>Immutable cross-tenant audit trail.</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting || listLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
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
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 space-y-4" align="end">
                <div className="font-medium text-sm">Show Audit Entries</div>

                <FilterRow
                  id="f-date"
                  label="By date range"
                  checked={draft.enableDate}
                  onCheckedChange={v => setDraft({ ...draft, enableDate: v })}
                >
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      disabled={!draft.enableDate}
                      value={draft.startDate}
                      onChange={e => setDraft({ ...draft, startDate: e.target.value })}
                      className="flex-1 min-w-0"
                    />
                    <Input
                      type="date"
                      disabled={!draft.enableDate}
                      value={draft.endDate}
                      onChange={e => setDraft({ ...draft, endDate: e.target.value })}
                      className="flex-1 min-w-0"
                    />
                  </div>
                </FilterRow>

                <FilterRow
                  id="f-tenant"
                  label="By tenant"
                  checked={draft.enableTenant}
                  onCheckedChange={v => setDraft({ ...draft, enableTenant: v })}
                >
                  <Select
                    disabled={!draft.enableTenant}
                    value={draft.tenantId}
                    onValueChange={v => setDraft({ ...draft, tenantId: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                    <SelectContent>
                      {availableFilters?.tenants.map(t => (
                        <SelectItem key={t.tenantId} value={t.tenantId}>
                          {tenantLabel(t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterRow>

                <FilterRow
                  id="f-actor"
                  label="By actor (name / email / ID)"
                  checked={draft.enableActor}
                  onCheckedChange={v => setDraft({ ...draft, enableActor: v })}
                >
                  <Input
                    disabled={!draft.enableActor}
                    placeholder="e.g. jane@…"
                    value={draft.actor}
                    onChange={e => setDraft({ ...draft, actor: e.target.value })}
                  />
                </FilterRow>

                <FilterRow
                  id="f-action"
                  label="By action type"
                  checked={draft.enableAction}
                  onCheckedChange={v => setDraft({ ...draft, enableAction: v })}
                >
                  <Select
                    disabled={!draft.enableAction}
                    value={draft.action}
                    onValueChange={v => setDraft({ ...draft, action: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select action" /></SelectTrigger>
                    <SelectContent>
                      {availableFilters?.actions.map(a => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterRow>

                <FilterRow
                  id="f-resource"
                  label="By resource type"
                  checked={draft.enableResource}
                  onCheckedChange={v => setDraft({ ...draft, enableResource: v })}
                >
                  <Select
                    disabled={!draft.enableResource}
                    value={draft.resourceType}
                    onValueChange={v => setDraft({ ...draft, resourceType: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select resource" /></SelectTrigger>
                    <SelectContent>
                      {availableFilters?.resourceTypes.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterRow>

                <FilterRow
                  id="f-source"
                  label="By service (source)"
                  checked={draft.enableSource}
                  onCheckedChange={v => setDraft({ ...draft, enableSource: v })}
                >
                  <Select
                    disabled={!draft.enableSource}
                    value={draft.source}
                    onValueChange={v => setDraft({ ...draft, source: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                    <SelectContent>
                      {availableFilters?.services.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterRow>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1" onClick={applyFilters}>
                    Apply
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={clearFilters}>
                    Show All
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {listError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              Failed to load audit entries: {(listErrorObj as any)?.message ?? "unknown error"}
            </div>
          )}

          <div className="border rounded-md overflow-x-auto">
            <DataTable
              columns={columns}
              data={entries}
              isLoading={listLoading}
              hasActiveFilters={Object.keys(applied).length > 0 || !!search}
              emptyState="No audit entries found"
              filteredEmptyState="No audit entries match your filters."
              pagination={pagination}
            />
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            Entries are immutable.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function FilterRow({
  id,
  label,
  checked,
  onCheckedChange,
  children,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={v => onCheckedChange(!!v)}
        />
        <Label htmlFor={id} className="text-xs">{label}</Label>
      </div>
      {children}
    </div>
  );
}

function VerifyBadge({
  verification,
  isLoading,
  onRefresh,
}: {
  verification?: {
    intact: boolean;
    chainsChecked: number;
    brokenChains: { tenantId: string; firstBreak: { seq: number; reason: string } }[];
  };
  isLoading: boolean;
  onRefresh: () => void;
}) {
  if (!verification) {
    return (
      <Badge variant="outline" className="text-xs font-normal">
        {isLoading ? "Verifying…" : "Not verified"}
      </Badge>
    );
  }
  const label = verification.intact
    ? `Chain intact · ${verification.chainsChecked} chains`
    : `Chain broken · ${verification.brokenChains.length} chain(s)`;
  return (
    <span className="inline-flex items-center gap-1">
      <Badge
        variant={verification.intact ? "outline" : "destructive"}
        className="text-xs font-normal"
        title={
          verification.intact
            ? undefined
            : verification.brokenChains
                .map(c => `${c.tenantId}: seq ${c.firstBreak.seq} (${c.firstBreak.reason})`)
                .join(", ")
        }
      >
        {verification.intact ? (
          <ShieldCheck className="h-3 w-3 mr-1" />
        ) : (
          <ShieldAlert className="h-3 w-3 mr-1" />
        )}
        {label}
      </Badge>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-1.5"
        onClick={onRefresh}
        disabled={isLoading}
        title="Re-verify chain"
      >
        <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
      </Button>
    </span>
  );
}
