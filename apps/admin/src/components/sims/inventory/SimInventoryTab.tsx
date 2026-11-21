import type { SystemSimsQuery } from "@truckmoov/api/auth";
import type { SimRow } from "./simInventoryShared";
import type { FilterDraft } from "@/components/shadcn/platform-filter-popover";
import { useQueryClient } from "@tanstack/react-query";
import { getSystemSimsExportQueryOptions } from "@truckmoov/api/auth";
import { downloadBlob } from "@truckmoov/app-core/utils/general-utils";
import {
  Download,
  Plus,
  Upload,
  Wifi,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
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
import { PageActions } from "@/shared/components/layout/PageTitle";
import { SimAddDialog } from "./dialogs/SimAddDialog";
import { SimBulkImportDialog } from "./dialogs/SimBulkImportDialog";
import { SimDeleteDialog } from "./dialogs/SimDeleteDialog";
import { SimAssignDialog } from "./SimAssignDialog";
import { SimBulkBar } from "./SimBulkBar";
import { SimDetailsSheet } from "./SimDetailsSheet";
import { SimEditDialog } from "./SimEditDialog";
import { getSimColumns } from "./simInventoryColumns";
import {
  EMPTY_SIM_FILTERS,
  SimInventoryFilters,
} from "./SimInventoryFilters";
import {
  canActivate,
  canReinstate,
  canSuspend,
  getCarrierOptions,
} from "./simInventoryShared";
import { SimInventoryStats } from "./SimInventoryStats";
import { useSimInventoryData } from "./useSimInventoryData";
import { useSimSuspension } from "./useSimSuspension";

const SEARCH_DEBOUNCE_MS = 400;
const DEFAULT_PAGE_SIZE = 25;

function buildQuery(search: string, status: string, filters: FilterDraft): SystemSimsQuery {
  const carrier = filters.carrier;
  const tenant = filters.tenant;
  return {
    params: {
      ...(search ? { search } : {}),
      ...(status !== "all" ? { status } : {}),
      ...(carrier?.enabled && carrier.value ? { carrier: carrier.value } : {}),
      ...(tenant?.enabled && tenant.value ? { tenantId: tenant.value } : {}),
    },
  };
}

export function SimInventoryTab() {
  const queryClient = useQueryClient();
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState("all");
  const [
    filters,
    setFilters,
  ] = useState<FilterDraft>(EMPTY_SIM_FILTERS);
  const [
    selectedIds,
    setSelectedIds,
  ] = useState<Set<string>>(new Set());
  const [
    detailsSim,
    setDetailsSim,
  ] = useState<SimRow | null>(null);
  const [
    editSim,
    setEditSim,
  ] = useState<SimRow | null>(null);
  const [
    assignSim,
    setAssignSim,
  ] = useState<SimRow | null>(null);
  const [
    deleteSim,
    setDeleteSim,
  ] = useState<SimRow | null>(null);
  const [
    isExporting,
    setIsExporting,
  ] = useState(false);
  const [
    createOpen,
    setCreateOpen,
  ] = useState(false);
  const [
    importOpen,
    setImportOpen,
  ] = useState(false);
  const [
    page,
    setPage,
  ] = useState(1);
  const [
    pageSize,
    setPageSize,
  ] = useState(DEFAULT_PAGE_SIZE);

  useEffect(
    () => {
      const timer = window.setTimeout(
        () => setDebouncedSearch(search.trim()),
        SEARCH_DEBOUNCE_MS,
      );
      return () => window.clearTimeout(timer);
    },
    [search],
  );

  const filterQuery = useMemo(
    () => buildQuery(
      debouncedSearch,
      status,
      filters,
    ),
    [
      debouncedSearch,
      status,
      filters,
    ],
  );
  const query = useMemo<SystemSimsQuery>(
    () => ({
      params: {
        ...filterQuery.params,
        page,
        limit: pageSize,
      },
    }),
    [
      filterQuery,
      page,
      pageSize,
    ],
  );

  useEffect(
    () => {
      setPage(1);
      setSelectedIds(new Set());
    },
    [filterQuery],
  );
  const {
    simsQuery,
    summaryQuery,
    tenantsQuery,
    devicesQuery,
    tenants,
    devices,
    lookups,
    sims,
  } = useSimInventoryData(query);
  const suspension = useSimSuspension(() => setSelectedIds(new Set()));
  const carriers = useMemo(
    () => getCarrierOptions(summaryQuery.data?.data.byCarrier),
    [summaryQuery.data],
  );
  const total = simsQuery.data?.data.total ?? 0;

  const selectedSims = useMemo(
    () => sims.filter(sim => selectedIds.has(sim.id)),
    [
      sims,
      selectedIds,
    ],
  );
  const allSelected = sims.length > 0 && selectedSims.length === sims.length;
  const activeTenants = useMemo(
    () => tenants.filter(tenant => tenant.status === "active"),
    [tenants],
  );
  const hasActiveFilters = Boolean(debouncedSearch)
    || status !== "all"
    || Boolean(filters.carrier?.enabled)
    || Boolean(filters.tenant?.enabled);

  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(sims.map(sim => sim.id)));
  const toggleOne = (id: string) => setSelectedIds((prev) => {
    const next = new Set(prev);
    if (!next.delete(id))
      next.add(id);
    return next;
  });

  const openEdit = (sim: SimRow) => {
    setDetailsSim(null);
    setEditSim(sim);
  };
  const openAssign = (sim: SimRow) => {
    setDetailsSim(null);
    setAssignSim(sim);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await queryClient.fetchQuery({
        ...getSystemSimsExportQueryOptions(filterQuery),
        staleTime: 0,
      });
      downloadBlob(
        blob as Blob,
        `sim-inventory-${new Date().toISOString().slice(
          0,
          10,
        )}.csv`,
      );
    }
    catch {
      toast.error("Export failed");
    }
    finally {
      setIsExporting(false);
    }
  };

  const columns = getSimColumns({
    selectedIds,
    allSelected,
    suspensionPending: suspension.isPending,
    onToggleAll: toggleAll,
    onToggleOne: toggleOne,
    onView: setDetailsSim,
    onEdit: openEdit,
    onAssign: openAssign,
    onSuspend: suspension.suspendOne,
    onReinstate: suspension.reinstateOne,
    onDelete: setDeleteSim,
  });

  return (
    <div className="space-y-6">
      <PageActions>
        <Button
          variant="outline"
          onClick={() => setImportOpen(true)}
        >
          <Upload className="h-4 w-4 mr-2" />
          Import SIM
        </Button>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Register New SIM
        </Button>
      </PageActions>

      <SimInventoryStats
        summary={summaryQuery.data?.data}
        loading={summaryQuery.isLoading}
      />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-primary" />
                SIM Inventory
              </CardTitle>
              <CardDescription>All provisioned SIMs across tenants — search, filter, assign and export</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Export Data"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <SimInventoryFilters
            search={search}
            onSearchChange={setSearch}
            status={status}
            onStatusChange={setStatus}
            filters={filters}
            onFiltersChange={setFilters}
            carriers={carriers}
            tenants={tenants}
          />

          {selectedSims.length > 0 && (
            <SimBulkBar
              selectedCount={selectedSims.length}
              activatableCount={selectedSims.filter(canActivate).length}
              suspendableCount={selectedSims.filter(canSuspend).length}
              reinstatableCount={selectedSims.filter(canReinstate).length}
              busy={suspension.isPending}
              onActivate={() => suspension.activateMany(selectedSims.filter(canActivate))}
              onSuspend={() => suspension.suspendMany(selectedSims.filter(canSuspend))}
              onReinstate={() => suspension.reinstateMany(selectedSims.filter(canReinstate))}
              onClear={() => setSelectedIds(new Set())}
            />
          )}

          <div className="overflow-x-auto rounded-lg border">
            <DataTable<SimRow>
              columns={columns}
              data={sims}
              isLoading={simsQuery.isLoading}
              isError={simsQuery.isError}
              onRetry={() => simsQuery.refetch()}
              hasActiveFilters={hasActiveFilters}
              emptyState="No SIMs yet."
              filteredEmptyState="No SIMs match your filters."
              rowClassName={sim => selectedIds.has(sim.id) ? "bg-primary/5" : ""}
              pagination={{
                page,
                pageSize,
                total,
                onPageChange: setPage,
                onPageSizeChange: (size: number) => {
                  setPageSize(size);
                  setPage(1);
                },
              }}
            />
          </div>
        </CardContent>
      </Card>

      <SimDetailsSheet
        sim={detailsSim}
        lookups={lookups}
        onOpenChange={open => !open && setDetailsSim(null)}
        onEdit={openEdit}
        onAssign={openAssign}
      />
      <SimEditDialog
        sim={editSim}
        carrierOptions={carriers}
        onOpenChange={open => !open && setEditSim(null)}
      />
      <SimAssignDialog
        sim={assignSim}
        tenants={activeTenants}
        devices={devices}
        loadingOptions={tenantsQuery.isLoading || devicesQuery.isLoading}
        onOpenChange={open => !open && setAssignSim(null)}
      />
      <SimAddDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        carrierOptions={carriers}
      />
      <SimDeleteDialog
        sim={deleteSim}
        onOpenChange={open => !open && setDeleteSim(null)}
      />
      <SimBulkImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
      />
      {suspension.confirmDialog}
    </div>
  );
}
