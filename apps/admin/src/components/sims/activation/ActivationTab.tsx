import type { SystemSimBatch, SystemSimBatchesQuery } from "@truckmoov/api/auth";
import type { FilterDraft } from "@/components/shadcn/platform-filter-popover";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSystemSimBatchQueryOptions,
  getSystemSimsBatchesExportQueryOptions,
  getSystemSimsBatchesQueryOptions,
  getSystemSimsBatchesSummaryQueryOptions,
  useRetrySimBatch,
} from "@truckmoov/api/auth";
import {
  Download,
  Loader2,
  Search,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import { Input } from "@/components/shadcn/input";
import { PlatformFilterPopover } from "@/components/shadcn/platform-filter-popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { useConfirmAction } from "@/shared/hooks/useConfirmAction";
import { useAuthStore } from "@/stores/authStore";
import { ActivationBatchDetailDialog } from "./ActivationBatchDetailDialog";
import { getActivationColumns } from "./activationColumns";
import {
  ACTING_ROLES,
  downloadBlob,
  statusOptions,
  useDebouncedValue,
} from "./activationShared";
import { ActivationSummaryCards } from "./ActivationSummaryCards";

const emptyDraft: FilterDraft = {
  operator: { enabled: false },
};

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).map(value => ({
    value,
    label: value,
  }));
}

function buildQuery(search: string, status: string, draft: FilterDraft): SystemSimBatchesQuery | undefined {
  const params: NonNullable<SystemSimBatchesQuery["params"]> = {};
  if (search)
    params.search = search;
  if (status !== "all")
    params.status = status;
  if (draft.operator?.enabled && draft.operator.value)
    params.operator = draft.operator.value;
  return Object.keys(params).length ? { params } : undefined;
}

export function ActivationTab() {
  const queryClient = useQueryClient();
  const role = useAuthStore(state => state.user?.role);
  const canRetry = !!role && ACTING_ROLES.includes(role);
  const {
    confirm,
    confirmDialog,
  } = useConfirmAction();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterDraft, setFilterDraft] = useState<FilterDraft>(emptyDraft);
  const [detailBatchId, setDetailBatchId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const debouncedSearch = useDebouncedValue(searchQuery.trim(), 400);

  const queryPayload = useMemo(
    () => buildQuery(debouncedSearch, statusFilter, filterDraft),
    [debouncedSearch, statusFilter, filterDraft],
  );

  const allQuery = useQuery(getSystemSimsBatchesQueryOptions());
  const batchesQuery = useQuery(getSystemSimsBatchesQueryOptions(queryPayload));
  const summaryQuery = useQuery(getSystemSimsBatchesSummaryQueryOptions());
  const detailQuery = useQuery({
    ...getSystemSimBatchQueryOptions({ id: detailBatchId! }),
    enabled: !!detailBatchId,
  });
  const retryBatch = useRetrySimBatch();

  const allBatches = allQuery.data?.data.batches;
  const batches = batchesQuery.data?.data.batches ?? [];
  const operatorOptions = useMemo(
    () => uniqueOptions((allBatches ?? []).map(batch => batch.operator)),
    [allBatches],
  );

  const runRetry = (batch: SystemSimBatch) =>
    retryBatch.mutate(
      { id: batch.id },
      {
        onSuccess: () => toast.success("Activation retry started"),
        onError: error => toast.error(error.message),
      },
    );

  const requestRetry = (batch: SystemSimBatch) =>
    confirm({
      title: "Retry activation?",
      description: `${batch.tenantName} batch of ${batch.quantity} SIM(s) will be re-queued and its progress reset.`,
      confirmLabel: "Retry",
      destructive: false,
      onConfirm: () => runRetry(batch),
    });

  const columns = useMemo(
    () => getActivationColumns({
      canRetry,
      retryPending: retryBatch.isPending,
      onRetry: requestRetry,
      onDetails: batch => setDetailBatchId(batch.id),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canRetry, retryBatch.isPending],
  );

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await queryClient.fetchQuery(getSystemSimsBatchesExportQueryOptions(queryPayload));
      downloadBlob(blob as Blob, "sim-activations.csv");
      toast.success("Activations exported");
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
      <ActivationSummaryCards
        summary={summaryQuery.data?.data}
        isLoading={summaryQuery.isLoading}
      />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                SIM Activations
              </CardTitle>
              <CardDescription>
                SIM activations for the devices each tenant has requested — every requested device ships with its SIM
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={batchesQuery.isLoading || isExporting}
              className="border-input bg-transparent"
            >
              {isExporting
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <Download className="mr-2 h-4 w-4" />}
              Export Data
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search batches..."
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                className="h-9 pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[170px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <PlatformFilterPopover
              entity="activations"
              fields={[
                {
                  key: "operator",
                  label: "Operator",
                  type: "select",
                  options: operatorOptions,
                },
              ]}
              value={filterDraft}
              onApply={setFilterDraft}
              onReset={() => setFilterDraft(emptyDraft)}
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <DataTable
              columns={columns}
              data={batches}
              isLoading={batchesQuery.isLoading}
              isError={batchesQuery.isError}
              errorMessage="Unable to load activation batches."
              onRetry={() => batchesQuery.refetch()}
              hasActiveFilters={!!searchQuery || statusFilter !== "all" || Object.values(filterDraft).some(f => f?.enabled)}
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

      <ActivationBatchDetailDialog
        open={!!detailBatchId}
        batch={detailQuery.data?.data ?? null}
        isLoading={detailQuery.isLoading}
        isError={detailQuery.isError}
        onRetryLoad={() => detailQuery.refetch()}
        onClose={() => setDetailBatchId(null)}
      />
      {confirmDialog}
    </div>
  );
}
