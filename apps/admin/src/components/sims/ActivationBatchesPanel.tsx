import type { ColumnDef } from "@tanstack/react-table";

import type {
  SystemSimBatch,
  SystemSimBatchesQuery,
} from "@truckmoov/api/auth";
import type { FilterDraft } from "@/components/shadcn/platform-filter-popover";
import {
  useQuery,
  useQueryClient,

} from "@tanstack/react-query";
import {
  getSystemSimBatchQueryOptions,
  getSystemSimsBatchesExportQueryOptions,
  getSystemSimsBatchesQueryOptions,
  getSystemSimsBatchesSummaryQueryOptions,

  useRetrySimBatch,
} from "@truckmoov/api/auth";
import { formatDayMonthTime } from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Info,
  Loader2,
  RotateCcw,
  Search,
  Zap,
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
import { DataTable } from "@/components/shadcn/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { PlatformFilterPopover } from "@/components/shadcn/platform-filter-popover";
import { Progress } from "@/components/shadcn/progress";

const emptyValue = "-";

const statusOptions = [
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "activation_in_progress",
    label: "In Progress",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "partially_completed",
    label: "Partial",
  },
  {
    value: "failed",
    label: "Failed",
  },
];

function titleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDataLimit(valueGb: number) {
  if (!Number.isFinite(valueGb) || valueGb <= 0)
    return emptyValue;
  return `${Number.isInteger(valueGb) ? valueGb : valueGb.toFixed(1)} GB`;
}

function getProgressPercentage(batch: SystemSimBatch) {
  if (batch.quantity <= 0)
    return 0;
  return Math.min(
    ((batch.simsActivated + batch.simsFailed) / batch.quantity) * 100,
    100,
  );
}

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return (
        <Badge className="border-muted bg-muted text-muted-foreground">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      );
    case "activation_in_progress":
      return (
        <Badge className="border-primary/30 bg-primary/10 text-primary">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          In Progress
        </Badge>
      );
    case "completed":
      return (
        <Badge className="border-success/30 bg-success/10 text-success">
          <CheckCircle className="mr-1 h-3 w-3" />
          Completed
        </Badge>
      );
    case "partially_completed":
      return (
        <Badge className="border-warning/30 bg-warning/10 text-warning">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Partial
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Failed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status || emptyValue}</Badge>;
  }
}

function canRetryBatch(status: string) {
  return status === "pending" || status === "failed" || status === "partially_completed";
}

function getBatchReference(batch: SystemSimBatch) {
  return (batch as SystemSimBatch & { fonuBatchId?: string }).fonuBatchId ?? batch.requestId ?? emptyValue;
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [
    debounced,
    setDebounced,
  ] = useState(value);
  useEffect(
    () => {
      const t = window.setTimeout(
        setDebounced,
        delayMs,
        value,
      );
      return () => window.clearTimeout(t);
    },
    [
      value,
      delayMs,
    ],
  );
  return debounced;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ActivationBatchesPanel() {
  const queryClient = useQueryClient();
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const debouncedSearch = useDebouncedValue(
    searchQuery.trim(),
    400,
  );
  const [
    filterDraft,
    setFilterDraft,
  ] = useState<FilterDraft>({
    operator: { enabled: false },
    mode: { enabled: false },
    status: { enabled: false },
  });
  const [
    detailBatchId,
    setDetailBatchId,
  ] = useState<string | null>(null);
  const [
    isExporting,
    setIsExporting,
  ] = useState(false);

  const queryPayload = useMemo<SystemSimBatchesQuery | undefined>(
    () => {
      const params: SystemSimBatchesQuery["params"] = {};
      if (debouncedSearch)
        params.search = debouncedSearch;
      const status = filterDraft.status;
      if (status?.enabled && status.value)
        params.status = status.value;
      return Object.keys(params).length ? { params } : undefined;
    },
    [
      debouncedSearch,
      filterDraft,
    ],
  );

  const batchesQuery = useQuery(getSystemSimsBatchesQueryOptions(queryPayload));
  const summaryQuery = useQuery(getSystemSimsBatchesSummaryQueryOptions());
  const batchDetailQuery = useQuery({
    ...getSystemSimBatchQueryOptions({ id: detailBatchId! }),
    enabled: !!detailBatchId,
  });
  const retryBatch = useRetrySimBatch();

  const batches = batchesQuery.data?.data.batches ?? [];
  const summary = summaryQuery.data?.data;
  const selectedBatch = batchDetailQuery.data?.data ?? null;

  const operatorOptions = useMemo(
    () => {
      return Array.from(new Set(batches.map(batch => batch.operator).filter(Boolean)))
        .map(operator => ({
          value: operator,
          label: operator,
        }));
    },
    [batches],
  );

  const modeOptions = useMemo(
    () => {
      return Array.from(new Set(batches.map(batch => batch.activationMode).filter(Boolean)))
        .map(mode => ({
          value: mode,
          label: titleCase(mode),
        }));
    },
    [batches],
  );

  const filteredBatches = useMemo(
    () => {
      return batches.filter((batch) => {
        const operatorFilter = filterDraft.operator;
        if (operatorFilter?.enabled && operatorFilter.value && batch.operator !== operatorFilter.value) {
          return false;
        }
        const modeFilter = filterDraft.mode;
        if (modeFilter?.enabled && modeFilter.value && batch.activationMode !== modeFilter.value) {
          return false;
        }
        return true;
      });
    },
    [
      batches,
      filterDraft,
    ],
  );

  const handleRetry = (batch: SystemSimBatch) => {
    retryBatch.mutate(
      { id: batch.id },
      {
        onSuccess: () => toast.success("Activation retry started"),
        onError: error => toast.error(error.message),
      },
    );
  };

  const batchColumns: ColumnDef<SystemSimBatch>[] = useMemo(
    () => [
      {
        id: "tenant",
        header: "Tenant",
        meta: { className: "min-w-[220px]" },
        cell: ({ row }) => <span className="font-semibold">{row.original.tenantName || row.original.tenantId}</span>,
      },
      {
        id: "mode",
        header: "Mode",
        meta: { className: "min-w-[100px]" },
        cell: ({ row }) => <Badge variant="outline">{titleCase(row.original.activationMode)}</Badge>,
      },
      {
        id: "quantity",
        header: "Quantity",
        meta: { className: "min-w-[100px]" },
        cell: ({ row }) => <span className="font-semibold">{row.original.quantity}</span>,
      },
      {
        id: "operator",
        header: "Operator",
        meta: { className: "min-w-[170px]" },
        cell: ({ row }) => <span className="font-medium">{row.original.operator || emptyValue}</span>,
      },
      {
        id: "progress",
        header: "Progress",
        meta: { className: "min-w-[170px]" },
        cell: ({ row }) => {
          const batch = row.original;
          return (
            <div className="w-28 space-y-1">
              <Progress
                value={getProgressPercentage(batch)}
                variant="warning"
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {batch.simsActivated}
                {" "}
                /
                {batch.quantity}
                {batch.simsFailed > 0 && (
                  <span className="ml-1 text-destructive">
                    (
                    {batch.simsFailed}
                    {" "}
                    failed)
                  </span>
                )}
              </p>
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        meta: { className: "min-w-[150px]" },
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        id: "created",
        header: "Created",
        meta: { className: "min-w-[150px]" },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDayMonthTime(
              row.original.createdAt,
              emptyValue,
            )}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        meta: { className: "min-w-[160px] text-right" },
        cell: ({ row }) => {
          const batch = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              {canRetryBatch(batch.status) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRetry(batch);
                  }}
                  disabled={retryBatch.isPending}
                >
                  <RotateCcw className="mr-1 h-4 w-4" />
                  Retry
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailBatchId(batch.id);
                }}
              >
                Details
              </Button>
            </div>
          );
        },
      },
    ],
    [retryBatch.isPending],
  );

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await queryClient.fetchQuery(getSystemSimsBatchesExportQueryOptions(queryPayload));
      downloadBlob(
        blob as Blob,
        "activation-batches.csv",
      );
      toast.success("Activation batches exported");
    }
    catch {
      toast.error("Export failed");
    }
    finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Activation</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.pendingActivation ?? "—"}</div>
            <p className="text-xs text-muted-foreground">Awaiting auto-activation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Loader2 className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{summary?.inProgress ?? "—"}</div>
            <p className="text-xs text-muted-foreground">Currently activating</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SIMs Queued</CardTitle>
            <Zap className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{summary?.totalSimsQueued ?? "—"}</div>
            <p className="text-xs text-muted-foreground">Awaiting activation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.needsAttention ?? "—"}</div>
            <p className="text-xs text-muted-foreground">No device linking issues</p>
          </CardContent>
        </Card>
      </div>

      {/* Batches table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Activation Batches
              </CardTitle>
              <CardDescription>Bulk SIM activation jobs grouped by tenant, operator and plan</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={batchesQuery.isLoading || isExporting}
              className="bg-transparent border-input"
            >
              {isExporting
                ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )
                : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
              Export Data
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[260px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search batches..."
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                className="h-9 pl-9"
              />
            </div>
            <PlatformFilterPopover
              entity="batches"
              fields={[
                {
                  key: "status",
                  label: "Status",
                  type: "select",
                  options: statusOptions,
                },
                {
                  key: "operator",
                  label: "Operator",
                  type: "select",
                  options: operatorOptions,
                },
                {
                  key: "mode",
                  label: "Mode",
                  type: "select",
                  options: modeOptions,
                },
              ]}
              value={filterDraft}
              onApply={setFilterDraft}
              onReset={() =>
                setFilterDraft({
                  operator: { enabled: false },
                  mode: { enabled: false },
                  status: { enabled: false },
                })}
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <DataTable
              columns={batchColumns}
              data={filteredBatches}
              isLoading={batchesQuery.isLoading}
              hasActiveFilters={!!searchQuery || Object.values(filterDraft).some(f => f?.enabled)}
              emptyState={(
                <>
                  <Zap className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>No activation batches yet</p>
                  <p className="text-sm">Batches will appear here once tenants request SIM activation</p>
                </>
              )}
              filteredEmptyState={(
                <>
                  <Zap className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>No activation batches match your filters</p>
                  <p className="text-sm">Adjust the search, status, or filter options above</p>
                </>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Batch detail dialog */}
      <Dialog
        open={!!detailBatchId}
        onOpenChange={open => !open && setDetailBatchId(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Activation Batch Details</DialogTitle>
            <DialogDescription>
              {selectedBatch
                ? `Batch #${getBatchReference(selectedBatch)} • ${selectedBatch.tenantName}`
                : "Loading batch details..."}
            </DialogDescription>
          </DialogHeader>

          {batchDetailQuery.isLoading
            ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )
            : selectedBatch
              ? (
                  <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <div className="mt-1">{getStatusBadge(selectedBatch.status)}</div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Mode</p>
                        <p className="font-semibold">{titleCase(selectedBatch.activationMode)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Quantity</p>
                        <p className="font-semibold">
                          {selectedBatch.quantity}
                          {" "}
                          SIM(s)
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Operator</p>
                        <p className="font-semibold">{selectedBatch.operator || emptyValue}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Plan</p>
                        <p className="font-semibold">{selectedBatch.requestedPlan || emptyValue}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Data Limit</p>
                        <p className="font-semibold">{formatDataLimit(selectedBatch.dataLimitGb)}</p>
                      </div>
                    </div>

                    <div className="rounded-md bg-muted/50 p-3">
                      <p className="mb-1 text-xs text-muted-foreground">Batch Reference</p>
                      <p className="font-mono text-xs">{getBatchReference(selectedBatch)}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Progress</span>
                        <span>
                          {selectedBatch.simsActivated}
                          {" "}
                          activated,
                          {selectedBatch.simsFailed}
                          {" "}
                          failed
                        </span>
                      </div>
                      <Progress
                        value={getProgressPercentage(selectedBatch)}
                        variant="warning"
                      />
                    </div>

                    {selectedBatch.errorMessage && (
                      <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                        {selectedBatch.errorMessage}
                      </div>
                    )}

                    <div className="grid gap-4 text-sm sm:grid-cols-3">
                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p className="font-medium">
                          {formatDayMonthTime(
                            selectedBatch.createdAt,
                            emptyValue,
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Started</p>
                        <p className="font-medium">
                          {formatDayMonthTime(
                            selectedBatch.startedAt,
                            emptyValue,
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Completed</p>
                        <p className="font-medium">
                          {formatDayMonthTime(
                            selectedBatch.completedAt,
                            emptyValue,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailBatchId(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
