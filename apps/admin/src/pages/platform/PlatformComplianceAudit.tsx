import type { ColumnDef } from "@tanstack/react-table";
import type {
  SystemAuditLogEntry, SystemAuditLogQuery, SystemAuditLogVerification,
} from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  exportSystemAuditLog,
  getSystemAuditLogFiltersQueryOptions,
  getSystemAuditLogQueryOptions,
  getSystemAuditLogVerifyQueryOptions,

} from "@truckmoov/api/auth";
import { debounce } from "@truckmoov/app-core/utils/general-utils";
import {
  endOfDay,
  formatWithPattern,
  startOfDay,
} from "@truckmoov/app-core/utils/time-utils";
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
  useEffect,
  useMemo,
  useState,
} from "react";
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

const AUDIT_LIST_CAP = 500;
const EXPORT_CAP = 5000;

// "system" is the platform's own id; the filters endpoint names it, rows don't.
function tenantLabel(t: {
  tenantId: string; tenantName: string | null;
}) {
  return t.tenantName || (t.tenantId === "system" ? "System / Platform" : t.tenantId);
}

// A failed blob request carries its JSON error as a Blob — read the server's message out of it.
async function blobErrorMessage(err: unknown, fallback: string) {
  const data = (err as { response?: { data?: unknown } })?.response?.data ?? err;
  if (data instanceof Blob) {
    try {
      return (JSON.parse(await data.text()) as { message?: string }).message ?? fallback;
    }
    catch {
      return fallback;
    }
  }
  return (err as { message?: string })?.message ?? fallback;
}

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
  const [
    searchInput,
    setSearchInput,
  ] = useState("");
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    draft,
    setDraft,
  ] = useState<DraftFilters>(emptyDraft);
  const [
    applied,
    setApplied,
  ] = useState<SystemAuditLogQuery["params"]>({});
  const [
    exporting,
    setExporting,
  ] = useState(false);
  const [
    page,
    setPage,
  ] = useState(1);
  const [
    pageSize,
    setPageSize,
  ] = useState(25);

  // One request per settled search, not per keystroke.
  const debouncedSetSearch = useMemo(
    () => debounce(
      (v: string) => setSearch(v.trim()),
      350,
    ),
    [],
  );
  useEffect(
    () => () => debouncedSetSearch.cancel(),
    [debouncedSetSearch],
  );

  const filterParams: SystemAuditLogQuery["params"] = {
    ...applied,
    ...(search ? { search } : {}),
  };

  // ponytail: the endpoint has no offset, so fetch the 500-row cap once and page it here.
  // Narrow with filters to reach older entries; add server paging when the API grows an offset.
  const listQuery = useQuery(getSystemAuditLogQueryOptions({
    params: {
      ...filterParams, limit: AUDIT_LIST_CAP,
    },
  }));
  const allEntries = listQuery.data?.data?.items ?? [];
  const total = listQuery.data?.data?.total ?? 0;
  const listLoading = listQuery.isLoading;
  const listError = listQuery.isError;
  const listErrorObj = listQuery.error;
  const entries = allEntries.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const pagination = {
    page,
    pageSize,
    total: allEntries.length,
    onPageChange: setPage,
    onPageSizeChange: (n: number) => {
      setPageSize(n);
      setPage(1);
    },
  };

  useEffect(
    () => {
      setPage(1);
    },
    [
      applied,
      search,
    ],
  );

  const filtersQuery = useQuery(getSystemAuditLogFiltersQueryOptions());
  const verifyQuery = useQuery(getSystemAuditLogVerifyQueryOptions());

  const availableFilters = filtersQuery.data?.data;
  const verification = verifyQuery.data?.data;

  const applyFilters = () => {
    const next: SystemAuditLogQuery["params"] = {};
    // Local calendar days, inclusive: "T00:00" parses as local time, unlike a bare yyyy-MM-dd.
    if (draft.enableDate && draft.startDate)
      next.from = startOfDay(`${draft.startDate}T00:00`)?.toISOString();
    if (draft.enableDate && draft.endDate)
      next.to = endOfDay(`${draft.endDate}T00:00`)?.toISOString();
    if (draft.enableTenant && draft.tenantId)
      next.tenantId = draft.tenantId;
    if (draft.enableActor && draft.actor)
      next.actor = draft.actor;
    if (draft.enableAction && draft.action)
      next.action = draft.action;
    if (draft.enableResource && draft.resourceType)
      next.resourceType = draft.resourceType;
    if (draft.enableSource && draft.source)
      next.source = draft.source;
    setApplied(next);
  };

  // "Show All" = the list with no query string, search included.
  const clearFilters = () => {
    setDraft(emptyDraft);
    setApplied({});
    setSearchInput("");
    debouncedSetSearch.cancel();
    setSearch("");
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportSystemAuditLog({
        params: {
          ...applied, ...(search ? { search } : {}),
        },
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `platform_audit_log_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    catch (err) {
      toast.error(await blobErrorMessage(
        err,
        "Failed to export audit log",
      ));
    }
    finally {
      setExporting(false);
    }
  };

  const columns = useMemo<ColumnDef<SystemAuditLogEntry>[]>(
    () => [
      {
        id: "timestamp",
        header: "Timestamp",
        cell: ({ row }) => (
          <span className="font-mono text-xs whitespace-nowrap">
            {formatWithPattern(
              row.original.occurredAt,
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
              <div className="text-sm font-medium">{e.actorName || "-"}</div>
              <div
                className="text-xs text-muted-foreground font-mono"
                title={e.actorId ?? undefined}
              >
                {e.actorEmail || e.actorId?.slice(
                  0,
                  8,
                ) || "-"}
              </div>
              {e.actorRole && <div className="text-xs text-muted-foreground">{e.actorRole}</div>}
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
                <div
                  className="text-xs text-muted-foreground font-mono"
                  title={e.resourceId}
                >
                  {e.resourceId.slice(
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
        cell: ({ row }) => (
          <span className="text-sm">
            {tenantLabel(row.original)}
          </span>
        ),
      },
      {
        id: "ip",
        header: "IP Address",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.ipAddress || "-"}</span>
        ),
      },
      {
        id: "summary",
        header: "Summary",
        cell: ({ row }) => (
          <span
            className="block max-w-[16rem] truncate text-xs"
            title={row.original.summary ?? undefined}
          >
            {row.original.summary || "-"}
          </span>
        ),
      },
      {
        id: "source",
        header: "Source",
        cell: ({ row }) => (
          // ponytail: source is which service recorded the entry, not a severity — plain tag.
          <Badge
            variant="outline"
            className="text-xs"
          >
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
              <div className="text-xs text-muted-foreground">Entries loaded</div>
              <div className="text-xl font-bold break-words">
                {allEntries.length.toLocaleString()}
                {total > allEntries.length && (
                  <span className="text-sm font-normal text-muted-foreground">{` of ${total.toLocaleString()}`}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-md bg-primary/10 flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Hash chain</div>
              <div className="text-xl font-bold break-words">
                {verification ? (verification.intact ? "Intact" : "Broken") : verifyQuery.isError ? "Unverified" : "Checking…"}
              </div>
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
                isError={verifyQuery.isError}
                onRefresh={() => verifyQuery.refetch()}
              />
            </CardTitle>
            <CardDescription>
              Immutable cross-tenant audit trail.
              {verification && ` Verified ${verification.entriesChecked.toLocaleString()} entries across ${verification.chainsChecked} chains at ${formatWithPattern(
                verification.verifiedAt,
                "yyyy-MM-dd HH:mm",
              )}.`}
            </CardDescription>
            {verification && !verification.intact && (
              <ul className="text-xs text-destructive space-y-0.5">
                {verification.brokenChains.map(c => (
                  <li
                    key={c.tenantId}
                    className="font-mono"
                  >
                    {`${tenantLabel({
                      tenantId: c.tenantId, tenantName: null,
                    })}: first break at seq ${c.firstBreak.seq} (${c.firstBreak.reason === "hash_mismatch" ? "row edited" : "row removed or inserted"}) · ${c.firstBreak.id}`}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting || listLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Exporting…" : `Export CSV (max ${EXPORT_CAP.toLocaleString()})`}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search any field…"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  debouncedSetSearch(e.target.value);
                }}
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

                <FilterRow
                  id="f-date"
                  label="By date range"
                  checked={draft.enableDate}
                  onCheckedChange={v => setDraft({
                    ...draft, enableDate: v,
                  })}
                >
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      disabled={!draft.enableDate}
                      value={draft.startDate}
                      onChange={e => setDraft({
                        ...draft, startDate: e.target.value,
                      })}
                      className="flex-1 min-w-0"
                    />
                    <Input
                      type="date"
                      disabled={!draft.enableDate}
                      value={draft.endDate}
                      onChange={e => setDraft({
                        ...draft, endDate: e.target.value,
                      })}
                      className="flex-1 min-w-0"
                    />
                  </div>
                </FilterRow>

                <FilterRow
                  id="f-tenant"
                  label="By tenant"
                  checked={draft.enableTenant}
                  onCheckedChange={v => setDraft({
                    ...draft, enableTenant: v,
                  })}
                >
                  <Select
                    disabled={!draft.enableTenant}
                    value={draft.tenantId}
                    onValueChange={v => setDraft({
                      ...draft, tenantId: v,
                    })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                    <SelectContent>
                      {availableFilters?.tenants.map(t => (
                        <SelectItem
                          key={t.tenantId}
                          value={t.tenantId}
                        >
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
                  onCheckedChange={v => setDraft({
                    ...draft, enableActor: v,
                  })}
                >
                  <Input
                    disabled={!draft.enableActor}
                    placeholder="e.g. jane@…"
                    value={draft.actor}
                    onChange={e => setDraft({
                      ...draft, actor: e.target.value,
                    })}
                  />
                </FilterRow>

                <FilterRow
                  id="f-action"
                  label="By action type"
                  checked={draft.enableAction}
                  onCheckedChange={v => setDraft({
                    ...draft, enableAction: v,
                  })}
                >
                  <Select
                    disabled={!draft.enableAction}
                    value={draft.action}
                    onValueChange={v => setDraft({
                      ...draft, action: v,
                    })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select action" /></SelectTrigger>
                    <SelectContent>
                      {availableFilters?.actions.map(a => (
                        <SelectItem
                          key={a}
                          value={a}
                        >
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterRow>

                <FilterRow
                  id="f-resource"
                  label="By resource type"
                  checked={draft.enableResource}
                  onCheckedChange={v => setDraft({
                    ...draft, enableResource: v,
                  })}
                >
                  <Select
                    disabled={!draft.enableResource}
                    value={draft.resourceType}
                    onValueChange={v => setDraft({
                      ...draft, resourceType: v,
                    })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select resource" /></SelectTrigger>
                    <SelectContent>
                      {availableFilters?.resourceTypes.map(r => (
                        <SelectItem
                          key={r}
                          value={r}
                        >
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterRow>

                <FilterRow
                  id="f-source"
                  label="By service (source)"
                  checked={draft.enableSource}
                  onCheckedChange={v => setDraft({
                    ...draft, enableSource: v,
                  })}
                >
                  <Select
                    disabled={!draft.enableSource}
                    value={draft.source}
                    onValueChange={v => setDraft({
                      ...draft, source: v,
                    })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                    <SelectContent>
                      {availableFilters?.services.map(s => (
                        <SelectItem
                          key={s}
                          value={s}
                        >
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterRow>

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

          {listError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              Failed to load audit entries:
              {" "}
              {(listErrorObj as any)?.message ?? "unknown error"}
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
        <Label
          htmlFor={id}
          className="text-xs"
        >
          {label}
        </Label>
      </div>
      {children}
    </div>
  );
}

function VerifyBadge({
  verification,
  isLoading,
  isError,
  onRefresh,
}: {
  verification?: SystemAuditLogVerification;
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => void;
}) {
  if (!verification) {
    return (
      <span className="inline-flex items-center gap-1">
        <Badge
          variant={isError ? "destructive" : "outline"}
          className="text-xs font-normal"
        >
          {isLoading ? "Verifying…" : isError ? "Verification failed" : "Not verified"}
        </Badge>
        {isError && !isLoading && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5"
            onClick={onRefresh}
            title="Retry verification"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </span>
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
